"""Regression examples for the skill's detection and exclusion boundaries."""
from pathlib import Path
import tempfile
import unittest
from importlib.util import module_from_spec, spec_from_file_location

spec = spec_from_file_location('web_zip', Path(__file__).with_name('scan-web-zip.py'))
scanner = module_from_spec(spec)
spec.loader.exec_module(scanner)


class ScanTests(unittest.TestCase):
    def test_rules_and_vite_are_all_checked(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'bad.html').write_text('''<iframe src="/frame.html"></iframe>
<a href="javascript:alert(1)">go</a>
<img src="data:image/svg+xml,x">
<meta http-equiv="refresh" content="0;url=elsewhere">
<script src="HTTPS://127.0.0.1/a.js"></script>
<script>eval(input); document.cookie; box.innerHTML = rows.map(x => `<b>${x}</b>`).join('');</script>
<link href="/assets/main.css" rel="stylesheet">''', encoding='utf8')
            (root / 'vite.config.js').write_text('export default { "base": "/app/" };', encoding='utf8')
            (root / 'server.js').write_text('backend', encoding='utf8')
            (root / '中文.txt').write_text('path only', encoding='utf8')
            rules = {x['rule'] for x in scanner.scan(root)['findings']}
            self.assertTrue({'危险嵌入标签', '固定资源路径', 'JavaScript 协议引用', '活跃源 Data URI',
                             'Meta Refresh', '不安全外部脚本', '高风险 JavaScript API', '动态 HTML 赋值',
                             'Vite 固定 base', '非静态 Web 交付', '中文路径'} <= rules)

    def test_safe_relative_resources_and_sanitized_or_literal_markup(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'index.html').write_text('''<script src="./assets/main.js"></script>
<script src="https://cdn.example.com/main.js"></script>
<link href="../style.css" rel="stylesheet"><script>
box.innerHTML = '<b>static</b>';
box.innerHTML = DOMPurify.sanitize(input);
box.innerHTML = sanitizeHtml(input);
box.innerHTML = filterXSS(input);
</script>''', encoding='utf8')
            (root / 'vite.config.mts').write_text('export default {base:"./"};', encoding='utf8')
            self.assertEqual(scanner.scan(root)['findings'], [])

    def test_excluded_directories_and_explicit_root(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            for name in scanner.EXCLUDE:
                (root / name).mkdir()
                (root / name / '中文.html').write_text('<iframe></iframe>', encoding='utf8')
            self.assertEqual(scanner.scan(root)['htmlFiles'], 0)
            result = scanner.scan(root / 'dist')
            self.assertEqual(result['htmlFiles'], 1)
            self.assertTrue(result['findings'])

    def test_multiline_expression_stays_whole_and_unreadable_file_is_reported(self):
        expression = " rows.map(x => {\nreturn `<b>${x.ok ? `a;${x.name}` : 'b'}</b>`;\n}).join('')"
        self.assertEqual(scanner.expression_end(expression + '; next()', 0), len(expression))
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'bad.html').write_bytes(b'\xff\xfe\x00')
            self.assertEqual(scanner.scan(root)['findings'][0]['rule'], '文件不可读')

    def test_external_script_host_checks_do_not_need_dns(self):
        for url in ['http://example.com/a.js', '//cdn.example.com/a.js', 'https://user@cdn.example.com/a.js',
                    'https://localhost/a.js', 'https://app.local/a.js', 'https://10.2.3.4/a.js',
                    'https://[::1]/a.js', 'https://[fc00::1]/a.js', 'https:///missing-host.js']:
            self.assertTrue(scanner.unsafe_host(url), url)
        self.assertFalse(scanner.unsafe_host('https://cdn.example.com/a.js'))


if __name__ == '__main__':
    unittest.main()
