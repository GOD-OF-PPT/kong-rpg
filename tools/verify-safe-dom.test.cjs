const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');

// Record the exact DOM operations: no HTML parser, browser, network or service.
function setup() {
  class Node {
    constructor(tag, text = '') { this.tag = tag; this.text = text; this.children = []; this.attrs = {}; this.ownerDocument = doc; }
    set innerHTML(_) { throw new Error('HTML sink used'); }
    set outerHTML(_) { throw new Error('HTML sink used'); }
    appendChild(node) { this.children.push(node); return node; }
    setAttribute(key, value) { this.attrs[key] = value; }
    replaceChildren(fragment) { this.children = fragment.children; }
    get textContent() { return this.text + this.children.map(n => n.textContent).join(''); }
  }
  const doc = { createElement: tag => new Node(tag), createTextNode: text => new Node('#text', text), createDocumentFragment: () => new Node('#fragment') };
  const context = vm.createContext({ atob });
  vm.runInContext(fs.readFileSync(path.join(root, 'src/safe-dom.js'), 'utf8'), context);
  const target = new Node('div');
  const render = markup => context.KongSafeDOM.render(target, markup);
  const nodes = () => { const all = []; function visit(n) { all.push(n); n.children.forEach(visit); } visit(target); return all; };
  return { target, render, nodes };
}

test('menu controls retain IDs, data, labels, form values and nested text', () => {
  const { target, render, nodes } = setup();
  render('<section class="panel" aria-label="暂停"><h2>因缘 &lt;灯&gt;</h2><label for="volume">声音</label><input id="volume" type="range" min="0" max="100" value="38"><button id="go" data-relic="cloud" disabled>继续 <small>→</small></button></section>');
  assert.equal(target.children[0].attrs['aria-label'], '暂停');
  assert.equal(nodes().find(n => n.attrs.id === 'volume').attrs.value, '38');
  assert.equal(nodes().find(n => n.attrs.id === 'go').attrs['data-relic'], 'cloud');
  assert.equal(nodes().find(n => n.attrs.id === 'go').attrs.disabled, '');
  assert.ok(target.textContent.includes('因缘 <灯>'));
  assert.ok(target.textContent.includes('继续 →'));
});

test('encoded seed and history payloads remain literal text, including quotes', () => {
  const { target, render, nodes } = setup();
  render('<input value="&quot;&gt;&lt;img src=x onerror=alert(1)&gt;"><p>&lt;svg onload=alert(1)&gt; &#39; &#x1F435; &amp;lt;</p>');
  assert.equal(nodes().find(n => n.tag === 'input').attrs.value, '"><img src=x onerror=alert(1)>');
  assert.ok(!nodes().some(n => n.tag === 'img' || n.tag === 'svg'));
  assert.equal(nodes().find(n => n.tag === 'p').textContent, "<svg onload=alert(1)> ' 🐵 &lt;");
  assert.ok(target.children.length);
});

test('active tags, inline handlers and navigation attributes never reach DOM operations', () => {
  const { render, nodes } = setup();
  render('<script>alert(1)</script><svg onload="alert(2)"></svg><iframe src="https://evil.example"></iframe><object data="x"></object><img src="https://evil.example/a.png" onerror="alert(3)"><button onclick="alert(4)" formaction="javascript:alert(5)">go</button><input type="image" src="data:text/html,x">');
  assert.ok(!nodes().some(n => ['script', 'svg', 'iframe', 'object'].includes(n.tag)));
  for (const n of nodes()) {
    assert.ok(!Object.keys(n.attrs).some(k => /^(?:on|href$|formaction$|srcdoc$|src$)/i.test(k)), JSON.stringify(n.attrs));
  }
});

test('only correctly labelled embedded raster images are accepted', () => {
  const { render, nodes } = setup();
  const png = 'data:image/png;base64,' + Buffer.from('\x89PNG\r\n\x1a\n', 'binary').toString('base64');
  const svg = Buffer.from('<svg onload="alert(1)"></svg>').toString('base64');
  render(`<img src="${png}" alt="法相"><img src="data:image/svg+xml;base64,${svg}"><img src="data:image/png;base64,${svg}"><img src="file:///C:/private.png"><img src="//evil.example/x">`);
  assert.deepEqual(nodes().filter(n => n.attrs.src).map(n => n.attrs.src), [png]);
});

test('UI color and placement survive while CSS loading and expressions are removed', () => {
  const { render, nodes } = setup();
  render('<span style="left:12.5%;top:-2%;color:#ffd878;width:36px;font-size:18px;display:inline;background:url(https://evil.example);behavior:url(x);color:expression(alert(1));top:var(--x);left:1px!important">伤害</span>');
  assert.equal(nodes().find(n => n.tag === 'span').attrs.style, 'left:12.5%;top:-2%;color:#ffd878;width:36px;font-size:18px;display:inline');
});

test('rerender clears old controls and handles malformed tags without an HTML sink', () => {
  const { target, render, nodes } = setup();
  render('<button id="old">old</button>');
  render('<div><span>new</div><input value="x > y"><img/src=x onerror=alert(1)>');
  assert.ok(!nodes().some(n => n.attrs.id === 'old'));
  assert.equal(nodes().find(n => n.tag === 'input').attrs.value, 'x > y');
  assert.ok(!nodes().some(n => 'onerror' in n.attrs));
  render('');
  assert.equal(target.children.length, 0);
});

test('current Vite consumer loads the DOM-only UI and app modules', () => {
  assert.ok(fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('src="./src/main.js"'));
  const entry = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
  assert.ok(entry.includes("import './ui.js'"));
  assert.ok(entry.indexOf("import './ui.js'") < entry.indexOf("import './app.js'"));
  for (const file of ['src/ui.js', 'src/app.js']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(!/\b(?:innerHTML|outerHTML|insertAdjacentHTML|DOMParser)\b/.test(source), file);
  }
});
