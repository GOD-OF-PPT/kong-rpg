const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),offline=process.argv.includes('--browser')||process.argv.includes('--offline'),entry=path.join(root,offline?'dist-offline':'dist','index.html'),checks=[];
function check(name,pass){assert.ok(pass,name);checks.push(name);console.log('PASS '+name);}
const html=fs.readFileSync(entry,'utf8'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sinks=/\b(?:innerHTML|outerHTML|insertAdjacentHTML|createContextualFragment|DOMParser)\b|document\s*\.\s*write\s*\(/;
const reviewed=new Set();
function review(file){
  if(reviewed.has(file)||file.includes('/generated-')||!file.endsWith('.js'))return;reviewed.add(file);
  const code=fs.readFileSync(path.join(root,file),'utf8');check(file+' has no HTML parsing sink',!sinks.test(code));
  for(const match of code.matchAll(/\bimport\s+['"]([^'"]+)['"]/g))if(match[1].startsWith('.'))review(path.posix.join(path.posix.dirname(file),match[1]));
}
for(const match of source.matchAll(/<script\b[^>]*\bsrc="\/?(src\/[^\"]+)"/g))review(match[1]);
check('built HTML has no HTML parsing sink',!sinks.test(html));
const manifest=JSON.parse(fs.readFileSync(path.join(path.dirname(entry),'manifest.json'),'utf8'));
check('built HTML hash and byte count match its manifest',manifest.sha256===crypto.createHash('sha256').update(html).digest('hex')&&manifest.bytes===Buffer.byteLength(html));
for(const dir of ['dist',...(offline?['dist-offline']:[])]){
  const m=JSON.parse(fs.readFileSync(path.join(root,dir,'manifest.json'),'utf8'));
  for(const file of Object.keys(m.files).filter(file=>file.endsWith('.js')))check(dir+'/'+file+' has no HTML parsing sink',!sinks.test(fs.readFileSync(path.join(root,dir,file),'utf8')));
}

async function browserCheck(){
  const {chromium}=require('playwright'),browser=await chromium.launch({channel:'msedge',headless:true});
  const context=await browser.newContext({viewport:{width:1366,height:900}}),errors=[],requests=[],dialogs=[];
  try{
    await context.setOffline(true);await context.route(/^https?:/,route=>route.abort());
    await context.addInitScript(()=>{
      localStorage.clear();globalThis.__uiXss=0;
      // Exercise the real entry with string-to-HTML APIs disabled, including empty writes.
      for(const name of ['innerHTML','outerHTML'])Object.defineProperty(Element.prototype,name,{set(){throw Error('Forbidden HTML sink: '+name);},configurable:true});
      Element.prototype.insertAdjacentHTML=()=>{throw Error('Forbidden HTML sink');};
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
    page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
    await page.goto(pathToFileURL(entry).href);
    await page.waitForFunction(()=>globalThis.__KONG__&&Kong.ImageArt.has(Kong.ImageArt.bootIds));
    const screen=async name=>{await page.waitForFunction(value=>__KONG__.snapshot().screen===value,name);check('renders '+name,true);};
    await screen('menu');
    check('challenge starts locked',await page.locator('#mode-challenge').isDisabled());
    await page.evaluate(()=>{
      const ensure=Kong.ensureDialogArt;
      Kong.ensureDialogArt=()=>new Promise(resolve=>{globalThis.__releaseUiLoad=()=>{Kong.ensureDialogArt=ensure;return ensure().then(resolve);};});
    });
    await page.locator('#how').click();await screen('loading');
    check('loading progress retains its accessible range',await page.locator('[role="progressbar"]').getAttribute('aria-valuemax')==='100');
    await page.locator('#asset-cancel').click();await screen('menu');await page.evaluate(()=>__releaseUiLoad());
    await page.locator('#how').click();await screen('help');
    check('help retains nine lessons',await page.locator('.help-grid h3').count()===9);
    check('clean package offers no missing original-game link',await page.locator('#old').count()===0);
    await page.locator('#import-file').setInputFiles({name:'old-save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({game:'black-lotus',schema:11,state:{version:11}}))});await screen('legacy');
    check('old saves can be backed up without a missing HTML dependency',await page.locator('#backup-legacy').count()===1&&await page.locator('#open-legacy').count()===0);
    await page.locator('#back').click();
    await page.locator('#past').click();await screen('history');
    check('empty history renders artwork',await page.locator('.empty-history .relic-art').count()===1);
    await page.locator('#back').click();await page.locator('#begin').click();await screen('prologue');
    check('prologue retains five chapters',await page.locator('.journey-map span').count()===5);
    await page.locator('#begin-relic').click();await screen('heroes');
    check('all three hero choices render',await page.locator('.hero-choice').count()===3);
    await page.locator('#choose-wukong').click();await screen('start');
    check('starter cards retain descriptions',await page.locator('.relic-card .cost').count()===3);
    await page.keyboard.press('Digit1');await screen('playing');await page.keyboard.press('KeyJ');
    await page.waitForFunction(()=>__KONG__.snapshot().state.stats.swings>0);
    check('public menu and real attack input start a run',true);
    await page.keyboard.press('Escape');await screen('paused');
    await page.locator('#build-details').click();await screen('build');
    await page.locator('#close-build').click();await screen('paused');

    const seed='<svg/onload=__uiXss=1>';
    let serial=0;
    const load=async (mode,options={})=>{
      const raw=await page.evaluate(({mode,options,seed,serial})=>{
        const s=Kong.newRun(seed,'cloud'),meta=Kong.cleanMeta({runs:2,history:[{id:'past',seed,seconds:9,relics:['cloud']}]});
        s.runId='UI-'+serial+'-'+mode;s.mode=mode;s.lastDamage='<img src=x onerror="__uiXss=1">';
        if(mode==='reward'){s.rewardKind='mid';s.reward=['mirror','flame','rest'];if(options.replace){s.relics=['cloud','echo','staff'];s.pendingRelic='mirror';}}
        if(mode==='art-choice')s.celestial.pending=Kong.artManuals(s)[0].id;
        if(mode==='dead')s.player.hp=0;
        if(mode==='won'){Kong.enterRoom(s,14,true);s.mode='won';s.campaign.completed=Array.from({length:15},(_,i)=>i);Kong.guardian(s).hp=0;}
        const data=Kong.pack(s,meta);Kong.validSave(JSON.parse(data));return data;
      },{mode,options,seed,serial:++serial});
      await page.locator('#import-file').setInputFiles({name:'ui-security.json',mimeType:'application/json',buffer:Buffer.from(raw)});
      await page.waitForFunction(id=>__KONG__.snapshot().state?.runId===id,JSON.parse(raw).state.runId);
      await screen(options.replace?'replace':mode);
    };
    await load('paused');
    check('imported seed stays literal text',(await page.locator('.pause-place').textContent()).includes(seed));
    await page.locator('#main-menu').click();
    check('seed input preserves literal attribute characters',await page.locator('#seed').inputValue()===seed);
    await page.locator('#past').click();await screen('history');
    check('saved history seed stays literal text',(await page.locator('.history-list').textContent()).includes(seed));
    await load('reward');await page.locator('#build-details').click();await screen('build');await page.locator('#close-build').click();await screen('reward');
    await load('reward',{replace:true});check('replacement retains three choices',await page.locator('.relic-card').count()===3);
    await page.locator('#cancel-replace').click();await screen('reward');
    await load('art-choice');await page.locator('#learn-art').click();await screen('playing');
    await page.waitForFunction(()=>document.querySelectorAll('.world-art-label').length>0);
    check('world labels use actual positioned elements',await page.locator('.world-art-label').first().evaluate(n=>n.style.left.endsWith('%')&&n.style.top.endsWith('%')));
    await page.evaluate(value=>{
      const labels=Kong.artManualLabels,step=Kong.step;
      Kong.artManualLabels=(...args)=>labels(...args).map(q=>({...q,name:value,art:value}));
      Kong.step=(s,a)=>{step(s,a);s.effects.push({kind:'hurt',x:s.player.x,y:s.player.y,life:.42,duration:.42,text:value});};
      globalThis.__restoreUiLabels=()=>{Kong.artManualLabels=labels;Kong.step=step;};
    },seed);
    await page.waitForFunction(value=>document.querySelector('.impact-number')?.textContent===value,seed);
    check('combat and world label text cannot create markup',await page.locator('.world-art-label').first().getAttribute('data-art')===seed&&await page.locator('#combat-labels svg,#world-labels svg').count()===0);
    await page.evaluate(()=>__restoreUiLabels());
    await page.keyboard.press('Escape');await page.locator('#build-details').click();await screen('build');
    check('learned art appears in loadout',await page.locator('[data-art-equip]').count()===1);
    await page.locator('[data-art-equip]').click();await page.locator('#close-build').click();
    await load('dead');check('damage source stays literal text',(await page.locator('.subtitle').textContent()).includes('<img src=x onerror="__uiXss=1">'));
    check('rating renders DOM elements',await page.locator('.campaign-rating .rating-grade').count()===1);
    await load('won');await page.locator('#epilogue').click();await screen('epilogue');
    await page.locator('#main-menu').click();
    const hostile='\"><img src=x onerror="__uiXss=1"><svg onload="__uiXss=1">&\'';
    await page.evaluate(value=>{Kong.Brand.name=value;document.getElementById('brand').click();},hostile);
    check('dynamic title and aria attribute cannot create markup',await page.locator('.brand-title').getAttribute('aria-label')===hostile&&await page.locator('.brand-fallback').textContent()===hostile&&await page.locator('#overlay img,#overlay svg,#overlay script').count()===0);
    const domSafety=await page.evaluate(value=>{
      const n=Kong.UI.el('p',{'data-value':value,style:{left:'12%;color:red'}},value);document.body.append(n);
      const ok=n.textContent===value&&n.getAttribute('data-value')===value&&!n.children.length&&!n.style.color;n.remove();return ok;
    },hostile);
    check('text, attributes and CSS property values stay isolated',domSafety);
    check('no injected handler or dialog executes',await page.evaluate(()=>__uiXss===0)&&dialogs.length===0);
    check('no page or game-loop errors',errors.length===0&&await page.evaluate(()=>__KONG__.metrics().errors.length===0));
    check('standalone UI works without HTTP requests',requests.length===0);
    console.log(JSON.stringify({browser:browser.version(),checks:checks.length,errors,requests}));
  }finally{await context.close();await browser.close();}
}
if(process.argv.includes('--browser'))browserCheck().catch(e=>{console.error(e);process.exitCode=1;});
