"""Static Web Zip skill checks. Never execute pages or resolve remote hosts."""
import argparse
import ast
import bisect
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
from html.parser import HTMLParser
from urllib.parse import urlsplit

EXCLUDE = set('node_modules .git .svn .hg dist build .cache .turbo .next coverage Library Temp Logs'.split())
CONFIGS = {'vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs'}
FIXED = re.compile(r'^(?:[/\\](?!/)|[a-z]:[\\/]|file:)', re.I)


def expression_end(text, start):
    """Balance JS strings, template interpolations, comments and delimiters."""
    stack, quote, i = [], None, start
    while i < len(text):
        c = text[i]
        if quote:
            if c == '\\':
                i += 2
                continue
            if quote == '`' and text.startswith('${', i):
                stack.append(('}', '`'))
                quote = None
                i += 2
                continue
            if c == quote:
                quote = None
        elif c in "'\"`":
            quote = c
        elif text.startswith('//', i):
            end = text.find('\n', i)
            if not stack:
                return i
            i = len(text) if end < 0 else end
            continue
        elif text.startswith('/*', i):
            end = text.find('*/', i + 2)
            i = len(text) if end < 0 else end + 2
            continue
        elif c in '([{':
            stack.append(({'(': ')', '[': ']', '{': '}'}[c], None))
        elif stack and c == stack[-1][0]:
            _, quote = stack.pop()
        elif not stack and c in ';\r\n':
            return i
        i += 1
    return i


def literal_expression(expr):
    # Only quoted literals joined with +, or a template without interpolation.
    if expr.startswith('`') and expr.endswith('`') and '${' not in expr:
        return expr[1:-1]
    pattern = r'''(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')'''
    if not re.fullmatch(r'\s*' + pattern + r'(?:\s*\+\s*' + pattern + r')*\s*', expr, re.S):
        return None
    try:
        return ''.join(ast.literal_eval(m.group()) for m in re.finditer(pattern, expr, re.S))
    except (ValueError, SyntaxError):
        return None


def unsafe_host(url):
    try:
        if url.startswith('//'):
            return True  # Inherits HTTP/file and is not explicitly HTTPS.
        parsed = urlsplit('https:' + url if url.startswith('//') else url)
        host = (parsed.hostname or '').lower().rstrip('.')
        if parsed.scheme != 'https' or not host or parsed.username is not None or parsed.password is not None:
            return True
        if host == 'localhost' or host.endswith(('.localhost', '.local')):
            return True
        try:
            address = ipaddress.ip_address(host)
        except ValueError:
            return False  # No DNS requests or guesses about public hostnames.
        return not address.is_global or address.is_multicast
    except ValueError:
        return True


def scan(root):
    findings, files, html_files, configs, hashes = [], [], [], [], {}

    def add(path, line, rule, level, evidence, reason, fix):
        key = (path, line, rule)
        if any((x['file'], x['line'], x['rule']) == key for x in findings):
            return
        findings.append(dict(file=path, line=line, rule=rule, level=level,
                             evidence=re.sub(r'\s+', ' ', evidence)[:240], reason=reason, fix=fix))

    for directory, dirs, names in os.walk(root):
        dirs[:] = sorted(d for d in dirs if d not in EXCLUDE)
        for name in dirs + sorted(names):
            p = Path(directory) / name
            rel = p.relative_to(root).as_posix()
            if re.search(r'[\u4e00-\u9fff]', name):
                add(rel, 'N/A', '中文路径', 'Medium', rel, '路径编码和部署兼容性风险', '改为 ASCII 名称并更新引用')
        for name in sorted(names):
            if name in EXCLUDE:
                continue
            p = Path(directory) / name
            files.append(p)
            if p.suffix.lower() in {'.html', '.htm'}:
                html_files.append(p)
            if name in CONFIGS:
                configs.append(p)
            if p.suffix.lower() in {'.php', '.jsp', '.aspx', '.ejs', '.pug'} or name in {'server.js', 'app.py', 'main.go'}:
                add(p.relative_to(root).as_posix(), 'N/A', '非静态 Web 交付', 'High', name,
                    '包含后端或服务端模板候选文件', '移除交付包中的后端依赖，或复核该文件是否仅为开发工具')

    for p in html_files + configs:
        rel = p.relative_to(root).as_posix()
        try:
            raw = p.read_bytes()
            text = raw.decode('utf-8-sig')
            hashes[rel] = hashlib.sha256(raw).hexdigest()
        except (OSError, UnicodeError) as error:
            add(rel, 'N/A', '文件不可读', '需人工复核', str(error), '无法完整扫描', '修复编码或文件权限后重扫')
            continue
        starts = [0] + [m.end() for m in re.finditer('\n', text)]
        line_at = lambda pos: bisect.bisect_right(starts, pos)

        def match_rule(pattern, rule, level, reason, fix):
            for m in re.finditer(pattern, text, re.I):
                add(rel, line_at(m.start()), rule, level, m.group(), reason, fix)

        if p.name in CONFIGS:
            match_rule(r'''\bbase["']?\s*:\s*(["'])/[^"']*\1''', 'Vite 固定 base', 'High',
                       '固定站点根路径破坏任意目录部署', '使用 base: "./" 并重新构建')
            continue

        match_rule(r'<(?:iframe|frame|object|embed)\b[^>]*>', '危险嵌入标签', 'High',
                   '可嵌入活动文档或插件', '移除嵌入标签')
        match_rule(r'''\b(?:href|src|action|data)\s*=\s*(["'])\s*javascript:[^"']*\1''',
                   'JavaScript 协议引用', 'High', '可执行脚本协议', '使用相对链接和事件监听器')
        match_rule(r'\beval\s*\(|document\s*\.\s*(?:write(?:ln)?\s*\(|cookie\b)',
                   '高风险 JavaScript API', 'Medium', '动态执行、文档写入或 Cookie 访问', '使用安全 DOM API，避免动态执行')
        match_rule(r'''<meta\b[^>]*http-equiv\s*=\s*(["'])refresh\1[^>]*>''',
                   'Meta Refresh', 'High', '强制页面跳转', '移除自动跳转')
        for m in re.finditer(r'''\b(src|action)\s*=\s*(["'])(data:[^"']*)\2''', text, re.I):
            high = m.group(1).lower() == 'action' or bool(re.match(r'data:(?:text/html|image/svg\+xml|.*script)', m.group(3), re.I))
            add(rel, line_at(m.start()), '活跃源 Data URI', 'High' if high else 'Medium', m.group(),
                '内嵌活动资源或不透明资源来源', '使用受控本地资源或安全 DOM 构造')

        class Tags(HTMLParser):
            def handle_starttag(self, tag, attrs):
                attrs = dict(attrs)
                line = self.getpos()[0]
                snippet = self.get_starttag_text()
                for key in ('src', 'href', 'action', 'poster', 'data'):
                    value = attrs.get(key) or ''
                    if FIXED.match(value):
                        add(rel, line, '固定资源路径', 'High', f'{key}={value}', '依赖固定站点或本机路径', '改用当前包的相对路径')
                for key in ('src', 'action'):
                    value = attrs.get(key) or ''
                    if value.lower().startswith('data:'):
                        high = key == 'action' or bool(re.match(r'data:(?:text/html|image/svg\+xml|.*script)', value, re.I))
                        add(rel, line, '活跃源 Data URI', 'High' if high else 'Medium', f'{key}={value[:160]}',
                            '内嵌活动资源或不透明资源来源', '使用受控本地资源或安全 DOM 构造')
                if tag == 'meta' and (attrs.get('http-equiv') or '').lower() == 'refresh':
                    add(rel, line, 'Meta Refresh', 'High', snippet, '强制页面跳转', '移除自动跳转')
                src = attrs.get('src') or ''
                if tag == 'script' and src.lower().startswith(('http://', 'https://', '//')) and unsafe_host(src):
                    add(rel, line, '不安全外部脚本', 'High', src, '非 HTTPS 或本机、私网等不安全来源', '改用包内相对脚本或可信 HTTPS 公网来源')

        try:
            Tags(convert_charrefs=True).feed(text)
        except Exception as error:
            add(rel, 'N/A', 'HTML 解析失败', '需人工复核', str(error), '标签扫描未能完整完成', '人工检查并修复 HTML')

        # Attributes inside JS HTML strings, CSS url(), and explicit resource loads.
        patterns = [r'''\b(?:src|href|action|poster|data)\s*=\s*(["'])([^"']+)\1''',
                    r'''\burl\(\s*(["']?)([^\s)'"<>]+)\1\s*\)''',
                    r'''(?:\.(?:src|href)\s*=|\b(?:fetch|open)\s*\(|new\s+URL\s*\()\s*(["'])([^"']+)\1''']
        for pattern in patterns:
            for m in re.finditer(pattern, text, re.I):
                if FIXED.match(m.group(2)):
                    add(rel, line_at(m.start()), '固定资源路径', 'High', m.group(), '静态包依赖固定路径', '改用相对路径')

        for m in re.finditer(r'\b(?:innerHTML|outerHTML)\s*=(?!=|>)', text, re.I):
            expr = text[m.end():expression_end(text, m.end())].strip()
            if re.match(r'(?:DOMPurify\.sanitize|sanitizeHtml|filterXSS)\s*\(', expr):
                continue
            static = literal_expression(expr)
            if static is None:
                add(rel, line_at(m.start()), '动态 HTML 赋值', 'High' if expr else '需人工复核',
                    m.group() + ' ' + expr, '动态字符串进入 HTML 解析边界；该命中本身不证明可利用', '使用受限 DOM 构造，按文本写入不可信数据')
            elif re.search(r'<(?:script|iframe|frame|object|embed)\b|\bon\w+\s*=|javascript:|http-equiv\s*=\s*["\']?refresh', static, re.I):
                add(rel, line_at(m.start()), '危险静态 HTML 赋值', 'High', static, '包含活动标签或属性', '使用安全 DOM API')
            elif re.search(r'data:', static, re.I):
                add(rel, line_at(m.start()), 'HTML 赋值中的 Data URI', 'Medium', static, '不透明活动资源', '使用受控本地资源')

    return dict(root=str(root), excluded=sorted(EXCLUDE), files=len(files), htmlFiles=len(html_files),
                configFiles=len(configs), hashes=hashes, findings=findings,
                counts={level: sum(x['level'] == level for x in findings) for level in ['High', 'Medium', '需人工复核']})


def markdown(result):
    items = result['findings']
    lines = ['# Web Zip 安全扫描报告', '', f"扫描路径: {result['root']}",
             f"扫描的 HTML 文件数: {result['htmlFiles']}",
             f"问题统计: 共 {len(items)} 项，其中高风险 {result['counts']['High']} 项，中风险 {result['counts']['Medium']} 项，需人工复核 {result['counts']['需人工复核']} 项",
             '', '## 总体结论', '', '需修复' if items else '通过。本次扫描未命中本技能定义的安全规则。']
    for level, heading, prefix in [('High', '高风险', 'H'), ('Medium', '中风险', 'M'), ('需人工复核', '需人工复核', 'R')]:
        lines += ['', '## ' + heading, '']
        group = [x for x in items if x['level'] == level]
        if not group:
            lines += ['无。']
        for i, x in enumerate(group, 1):
            lines += [f"### {prefix}-{i} {x['rule']}", f"- 文件: {x['file']}", f"- 行号: {x['line']}",
                      f"- 证据: `{x['evidence'].replace('`', '')}`", f"- 原因: {x['reason']}", f"- 修复: {x['fix']}", '']
    lines += ['', '## 建议修复顺序', '', '1. 先修复高风险问题。', '2. 再修复或说明中风险问题。', '3. 最后复核无法可靠解析的内容。',
              '', '## 备注', '', '按技能默认排除目录扫描；未启动服务、页面或浏览器，未访问外部脚本 URL。',
              'tools/serve.cjs 是可选的静态文件预览工具；release/index.html 可直接离线打开，不依赖包内后端。',
              '本次仅对路径、HTML、HTM 和支持的 Vite 配置进行静态扫描，不能证明不存在所有安全漏洞。', '']
    return '\n'.join(lines)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('root', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = scan(args.root.resolve())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.with_suffix('.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    args.output.with_suffix('.md').write_text(markdown(result), encoding='utf8')
    print(json.dumps({k: result[k] for k in ['files', 'htmlFiles', 'configFiles', 'counts']}, ensure_ascii=True))
    raise SystemExit(bool(result['findings']))
