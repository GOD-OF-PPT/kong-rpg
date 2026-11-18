# Web Zip 安全扫描报告

扫描路径: `E:\githome\kong-rpg-main-size-20261117`
扫描的 HTML 文件数: 4
问题统计: 0（修复前高风险规则命中 29 项；修复后高风险 0 项、中风险 0 项、需人工复核 0 项）

## 总体结论

通过。本次复扫未命中本技能定义的安全规则。扫描和修复基于 main 提交 `2b9f4702e46a362963d5d7db43cd780935a1c266`，即用户提供的 v4.0 ZIP 已应用的版本。

## 高风险

修复前为 29 处动态 HTML 赋值：`release/index.html` 17 处、`release/legacy-v1.html` 6 处、`evidence/readability/baseline.html` 6 处。逐项文件、原行号、片段、原因和修复建议见 [修复前报告](before.md) 和 [原始扫描数据](before.json)。这些是技能规则命中，不能等同于已证实可利用的 29 个 XSS 漏洞；部分数据已有类型校验或转义。

当前无遗留命中。

## 中风险

无。

## 需人工复核

无未决静态命中。

## 修复记录

- 新增 `src/safe-dom.js`：按受限标签、属性和 CSS 声明构造节点，通过 `createElement`、`createTextNode`、`setAttribute` 和 `replaceChildren` 更新界面。动态字符串不再进入浏览器 HTML 解析器，不使用 `innerHTML`、`outerHTML` 或命名为 sanitizer 的空包装。
- 拒绝脚本、SVG、嵌入文档、事件属性、导航属性、远程/本机图片地址、CSS 资源加载和表达式；界面图标只接受 MIME 与文件头匹配的内嵌 PNG/WebP/JPEG。种子、引号和转义实体仍按文本显示。
- 修改 `src/app.js` 的 18 处写入，包括 17 处动态写入和 1 处清空；重新构建当前离线页。旧入口和历史对比页各替换 7 处，包括各 1 处清空。
- 构建工具同步向旧入口和历史对比页内联同一个安全构造模块，保持它们可直接离线打开，避免引用包外脚本。当前页面的模块也由原构建过程内联。
- 增加可复现的静态扫描器和攻击样本测试；Python 缓存加入忽略规则，不新增运行时依赖。

`release/legacy-v1.html` 和 `evidence/readability/baseline.html` 现在是安全修补副本。旧提交 `2b9f470` 中的原文件完整保留，`before.json` 的 SHA-256 已与该提交逐项核对；没有将修改后的页面冒充历史原始证据，也没有重写旧的浏览器 JSON 或截图验收结论。历史报告中的旧哈希仍属于原版本。

## 验证

- `npm run build`：通过；当前离线入口的大小和 SHA-256 与 `release/manifest.json` 一致。
- `npm run verify`：48 项游戏规则检查通过。
- `node --test tools/verify-safe-dom.test.cjs`：7 项 Node DOM 操作记录测试通过，覆盖恶意种子/历史文字、危险标签与属性、资源协议、伪装图片和 CSS 注入；同时确认三个独立 HTML 页内联同一实现。这些测试没有启动浏览器，不代表视觉或浏览器运行验收。
- `python -B tools/test_web_zip_scan.py`：5 项扫描器边界测试通过，覆盖各规则、嵌套模板表达式、默认排除、不可读文件和不联网的外部脚本来源判断。
- 四个 HTML 中的全部内联脚本通过 Node 语法检查。
- [修复后报告](after.md) / [修复后数据和文件 SHA-256](after.json)：4 个 HTML、0 个 Vite 配置，0 项命中。

## 复现命令

在扫描路径执行：

```powershell
npm run build
npm run verify
node --test tools/verify-safe-dom.test.cjs
python -B tools/test_web_zip_scan.py
python -B tools/scan-web-zip.py . --output docs/security-web-20261118/after
```

## 备注

本次按技能默认排除 `node_modules`、`.git`、`.svn`、`.hg`、`dist`、`build`、`.cache`、`.turbo`、`.next`、`coverage`、`Library`、`Temp`、`Logs`。所有其他路径均参与命名检查；HTML/HTM 参与内容扫描，支持的 Vite 配置参与基路径检查。没有放宽排除范围。

`tools/serve.cjs` 仅提供可选静态文件预览；游戏无需启动包内后端。没有发现中文路径、固定资源路径、危险嵌入标签、不安全外部脚本、Meta Refresh、危险 API 或 Vite 固定 base。

未启动页面、服务或浏览器，未访问外部脚本 URL。本次仅按技能规定的静态规则检查，不能证明交付包不存在所有安全漏洞。
