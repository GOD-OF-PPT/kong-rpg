# Web Zip 安全扫描报告

扫描路径: E:\githome\kong-rpg-main-size-20261117
扫描的 HTML 文件数: 3
问题统计: 共 3 项，其中高风险 0 项，中风险 3 项，需人工复核 0 项

## 总体结论

需修复

## 高风险

无。

## 中风险

### M-1 中文路径
- 文件: docs/ranged-v6/research/西遊記-第004回.txt
- 行号: N/A
- 证据: `docs/ranged-v6/research/西遊記-第004回.txt`
- 原因: 路径编码和部署兼容性风险
- 修复: 改为 ASCII 名称并更新引用

### M-2 中文路径
- 文件: docs/ranged-v6/research/西遊記-第006回.txt
- 行号: N/A
- 证据: `docs/ranged-v6/research/西遊記-第006回.txt`
- 原因: 路径编码和部署兼容性风险
- 修复: 改为 ASCII 名称并更新引用

### M-3 活跃源 Data URI
- 文件: release/sound-check.html
- 行号: 1
- 证据: `src="data:audio/wav;base64,UklGRqQ5AABXQVZFZm10IBAAAAABAAEAAH0AAAD6AAACABAAZGF0YYA5AAAAAPX+LP3i/VH+DPwi/l8ByP5o/9j8a/kJ/QD9j/0J/yv9ePv0/ecGvgWd/0YIAw3WBk0JCQngA7kJGArDBJoG1AaJBvgFG/43/EMA5P+CAv4A4fiU+VAAXfq08X/46Pzc/OoAXPxO+rwF/QhSAKv6cAA1B`
- 原因: 内嵌活动资源或不透明资源来源
- 修复: 使用受控本地资源或安全 DOM 构造


## 需人工复核

无。

## 建议修复顺序

1. 先修复高风险问题。
2. 再修复或说明中风险问题。
3. 最后复核无法可靠解析的内容。

## 备注

按技能默认排除目录扫描；未启动服务、页面或浏览器，未访问外部脚本 URL。
tools/serve.cjs 是可选的静态文件预览工具；release/index.html 可直接离线打开，不依赖包内后端。
本次仅对路径、HTML、HTM 和支持的 Vite 配置进行静态扫描，不能证明不存在所有安全漏洞。
