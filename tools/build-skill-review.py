"""Build a local screenshot review book. These are QA boards, not game art."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
import os

root = Path(__file__).resolve().parents[1]
folder = root / os.environ.get('SKILL_REVIEW_DIR', 'evidence/skill-visual-v12/baseline')
report = json.loads((folder / 'capture.json').read_text(encoding='utf8'))
reviews_path = folder.parent / ('reviews-before.json' if folder.name in ('baseline', 'before') else 'reviews.json')
reviews = json.loads(reviews_path.read_text(encoding='utf8')) if reviews_path.exists() else {}
font = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 18)
small = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 14)
(folder / 'sheets').mkdir(exist_ok=True)
for case in report['cases']:
    case['review'] = reviews.get(case['id'], case['review'])
    if os.environ.get('SKIP_SHEETS') == '1':
        continue
    sheet = Image.new('RGB', (1168, 64 + 350 * ((len(case['frames']) + 1) // 2)), '#101922')
    draw = ImageDraw.Draw(sheet)
    draw.text((12, 8), case['title'] + '  /  v' + report['version'], font=font, fill='#eed7a3')
    draw.text((12, 36), '运行截图 · 预览缩至60% · 原始960×540可在截图册打开', font=small, fill='#aebdc5')
    for index, frame in enumerate(case['frames']):
        x, y = index % 2 * 584 + 4, index // 2 * 350 + 64
        draw.text((x + 4, y), frame['label'] + f"  t={frame['time']:.3f}", font=small, fill='#ddcba6')
        image = Image.open(folder / frame['file']).convert('RGB')
        sheet.paste(image.resize((576, 324), Image.Resampling.LANCZOS), (x, y + 21))
    sheet.save(folder / 'sheets' / (case['id'] + '.png'), optimize=True)

data = json.dumps(report, ensure_ascii=False).replace('</', '<\\/')
html = r'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>技能实机截图册</title>
<style>*{box-sizing:border-box}body{margin:0;background:#101922;color:#e1e5e4;font:15px/1.6 system-ui,'Microsoft Yahei',sans-serif}header{padding:18px 24px;border-bottom:1px solid #50616c}header p{margin:4px 0;color:#a9bbc5}header code{font-size:11px;word-break:break-all}main{display:grid;grid-template-columns:240px 1fr;gap:20px;padding:20px}nav{height:calc(100vh - 200px);overflow:hidden;display:flex;flex-direction:column;position:sticky;top:12px}#items{overflow:auto;min-height:0}nav button{display:block;width:100%;text-align:left;border:0;border-left:3px solid transparent;padding:7px 10px;color:#c3d0d4;background:none;cursor:pointer}nav button[aria-current=true]{border-color:#dfbd79;background:#253746;color:#ffe1a8}select,button{font:inherit}select{width:100%;background:#22303c;color:#fff;padding:7px;margin-bottom:10px}h2{margin:0;color:#eed7a3}.note{padding:12px 16px;margin:10px 0 20px;background:#1d2c36;border-left:3px solid #bb9d68}.frames{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}figure{margin:0;background:#080f15}figcaption{padding:7px 10px;color:#d5c5a2}.world{position:relative;cursor:zoom-in}.world img{width:100%;aspect-ratio:16/9;display:block}.world svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.metadata{padding:6px 10px;font:12px/1.5 monospace;color:#a2bdc4}.toolbar{display:flex;gap:20px;align-items:center;margin:14px 0}.toolbar a,a{color:#9bd4e0}dialog{border:1px solid #6d7a7d;padding:12px;background:#101922;color:white;max-width:98vw}dialog::backdrop{background:#000c}dialog img{width:960px;max-width:94vw;display:block}dialog button{float:right;margin-bottom:8px;background:#2a3c49;color:#fff;border:1px solid #859497;padding:4px 16px}@media(max-width:1100px){.frames{grid-template-columns:1fr}main{grid-template-columns:210px 1fr}}</style>
<header><h1 style="margin:0;font-size:24px">角色与怪物 · 技能实机截图册</h1><p id="version"></p><p>固定种子靶场；公开存档导入后按真实键鼠执行。每项单独审看；截图不等于自然通关或真人评价。</p><code id="sha"></code><p><a id="beforeLink">查看修前</a>　<a id="afterLink">查看修后</a></p></header><main><nav><select id="filter"><option value="all">全部</option><option value="wukong">孙悟空</option><option value="nezha">哪吒</option><option value="erlang">杨戬</option><option value="enemy">怪物与Boss</option><option value="issue">需要修改</option><option value="fixed">本轮修复</option><option value="refine">继续打磨</option></select><div id="items"></div></nav><article><h2 id="title"></h2><div id="review" class="note"></div><div class="toolbar"><label><input type="checkbox" id="geometry">叠加实际判定（默认关闭）</label><a id="sheet" target="_blank">打开关键帧对照图</a><span>点击画面查看960×540原图</span></div><div id="frames" class="frames"></div></article></main><dialog id="zoom"><button onclick="this.closest('dialog').close()">关闭</button><img alt="原始游戏截图"></dialog><script>
const DATA=__DATA__;let active=new URLSearchParams(location.search).get('skill')||DATA.cases[0]?.id;document.querySelector('#version').textContent='版本 '+DATA.version+' · '+DATA.cases.length+'项 · '+DATA.cases.reduce((n,c)=>n+c.frames.length,0)+'张截图';document.querySelector('#sha').textContent='入口 SHA256: '+DATA.sha256;
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function overlay(f){return '<svg viewBox="0 0 960 540">'+f.boxes.map(b=>{const color=/danger|projectile$/.test(b.kind)?'#ff6879':b.kind==='warning'?'#e7b4ff':'#8fe2d9';return b.line?'<line x1="'+(b.line.ax-f.camera)+'" y1="'+b.line.ay+'" x2="'+(b.line.bx-f.camera)+'" y2="'+b.line.by+'" stroke="'+color+'" stroke-width="2"/>':'<rect x="'+(b.x-f.camera)+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" fill="none" stroke="'+color+'" stroke-width="1"/>'}).join('')+'</svg>'}
function show(){const c=DATA.cases.find(c=>c.id===active);if(!c)return;document.querySelector('#title').textContent=c.title;document.querySelector('#beforeLink').href='../baseline/review.html?skill='+c.id;document.querySelector('#afterLink').href='../final/review.html?skill='+c.id;document.querySelector('#sheet').href='sheets/'+c.id+'.png';document.querySelector('#review').innerHTML='<strong>'+esc(c.review.status)+'</strong> · '+c.review.notes.map(esc).join('；')+(c.missing.length?'<br>未捕获：'+c.missing.map(esc).join('、'):'');document.querySelector('#frames').innerHTML=c.frames.map(f=>'<figure><figcaption>'+esc(f.label)+'</figcaption><div class="world" data-src="'+esc(f.file)+'"><img src="'+esc(f.file)+'" alt="'+esc(c.title+' '+f.label)+'">'+(document.querySelector('#geometry').checked?overlay(f):'')+'</div><div class="metadata">time '+f.time.toFixed(3)+' · age '+f.age.toFixed(3)+' · player HP '+f.player.hp+' · target HP '+f.enemy.hp+'<br>'+esc(f.enemy.move||'训练目标')+' / '+esc(f.enemy.phase)+'</div></figure>').join('');for(const el of document.querySelectorAll('.world'))el.onclick=()=>{const d=document.querySelector('#zoom');d.querySelector('img').src=el.dataset.src;d.showModal()};for(const b of document.querySelectorAll('nav button'))b.setAttribute('aria-current',b.dataset.id===active)}
function nav(){const f=document.querySelector('#filter').value,cases=DATA.cases.filter(c=>f==='all'||f==='enemy'&&c.kind==='enemy'||f==='issue'&&c.review.status==='需修改'||f==='fixed'&&c.review.status==='已修复'||f==='refine'&&c.review.status==='可优化'||c.kind!=='enemy'&&c.hero===f);document.querySelector('#items').innerHTML=cases.map(c=>'<button data-id="'+c.id+'">'+esc(c.title)+'</button>').join('');for(const b of document.querySelectorAll('nav button'))b.onclick=()=>{active=b.dataset.id;show()};if(!cases.some(c=>c.id===active))active=cases[0]?.id;show()}document.querySelector('#filter').onchange=nav;document.querySelector('#geometry').onchange=show;nav();
</script></html>'''.replace('__DATA__', data)
html = html.replace('../baseline/review.html', os.environ.get('SKILL_BASELINE_URL', '../baseline/review.html')).replace('../final/review.html', os.environ.get('SKILL_FINAL_URL', '../final/review.html'))
(folder / 'review.html').write_text(html, encoding='utf8')
print(json.dumps({'gallery': str(folder / 'review.html'), 'cases': len(report['cases']), 'frames': sum(len(c['frames']) for c in report['cases'])}))
