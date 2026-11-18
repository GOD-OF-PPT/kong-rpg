(function (global) {
  'use strict';
  // A deliberately small UI grammar. Markup never reaches a browser HTML parser.
  const tags = new Set('b br button div em h1 h2 h3 h4 i img input label p section small span'.split(' '));
  const voids = new Set(['br', 'img', 'input']);
  const attributes = new Set('id class title role type value min max step maxlength for tabindex disabled checked hidden alt'.split(' '));
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };
  const numericStyles = new Set('width height max-width font-size flex-shrink margin-right left top'.split(' '));

  function decode(text) {
    return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, entity) => {
      if (entity[0] !== '#') return Object.hasOwn(entities, entity) ? entities[entity] : whole;
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : '\ufffd';
    });
  }

  function safeStyle(value) {
    const declarations = [];
    for (const declaration of value.split(';')) {
      const colon = declaration.indexOf(':');
      if (colon < 0) continue;
      const key = declaration.slice(0, colon).trim().toLowerCase(), val = declaration.slice(colon + 1).trim();
      const color = key === 'color' && /^(?:#[\da-f]{3,8}|[a-z]+|rgba?\([\d.,%\s]+\))$/i.test(val);
      const number = numericStyles.has(key) && /^-?(?:\d+(?:\.\d+)?|\.\d+)(?:px|%|em|rem)?$/i.test(val);
      if (color || number || (key === 'display' && /^(?:inline|block|inline-block|none)$/.test(val))) declarations.push(key + ':' + val);
    }
    return declarations.join(';');
  }

  function safeImage(value) {
    // Only embedded raster images with matching file signatures, never SVG/HTML/URLs.
    const match = /^data:image\/(png|webp|jpeg);base64,([a-z\d+/]+={0,2})$/i.exec(value);
    if (!match) return false;
    try {
      const head = global.atob(match[2].slice(0, 32));
      return match[1].toLowerCase() === 'png' ? head.startsWith('\x89PNG\r\n\x1a\n')
        : match[1].toLowerCase() === 'webp' ? head.startsWith('RIFF') && head.slice(8, 12) === 'WEBP'
        : head.startsWith('\xff\xd8\xff');
    } catch { return false; }
  }

  function render(target, markup) {
    const doc = target.ownerDocument, fragment = doc.createDocumentFragment();
    const stack = [{ tag: '', node: fragment }];
    const appendText = text => { if (text) stack[stack.length - 1].node.appendChild(doc.createTextNode(decode(text))); };
    const source = String(markup ?? '');
    const token = /<!--[\s\S]*?-->|<![^>]*>|<\/?([a-z][\w:-]*)\b((?:[^"'<>]|"[^"]*"|'[^']*')*)>/gi;
    let cursor = 0, match;
    while ((match = token.exec(source))) {
      appendText(source.slice(cursor, match.index));
      cursor = token.lastIndex;
      if (!match[1]) continue;
      const tag = match[1].toLowerCase();
      if (!tags.has(tag)) { appendText(match[0]); continue; }
      if (match[0][1] === '/') {
        for (let i = stack.length - 1; i > 0; i--) {
          if (stack[i].tag === tag) { stack.length = i; break; }
        }
        continue;
      }
      const node = doc.createElement(tag);
      const attr = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
      let item;
      while ((item = attr.exec(match[2]))) {
        const key = item[1].toLowerCase(), value = decode(item[2] ?? item[3] ?? item[4] ?? '');
        if (key === 'style') {
          const style = safeStyle(value);
          if (style) node.setAttribute('style', style);
        } else if (key === 'src') {
          if (tag === 'img' && safeImage(value)) node.setAttribute('src', value);
        } else if (attributes.has(key) || /^(?:aria|data)-[a-z][\w-]*$/.test(key)) {
          if (key === 'type' && !['button', 'text', 'range', 'checkbox'].includes(value)) continue;
          if (key === 'id' && /^(?:__proto__|prototype|constructor|document|location|Kong|KongSafeDOM)$/i.test(value)) continue;
          node.setAttribute(key, value);
        }
      }
      stack[stack.length - 1].node.appendChild(node);
      if (!voids.has(tag) && !/\/\s*>$/.test(match[0])) stack.push({ tag, node });
    }
    appendText(source.slice(cursor));
    target.replaceChildren(fragment);
  }

  global.KongSafeDOM = Object.freeze({ render });
})(globalThis);
