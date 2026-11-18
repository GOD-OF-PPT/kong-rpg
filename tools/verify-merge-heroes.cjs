const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const shots = path.join(root, 'evidence/merge-main-20261118');
const reportPath = path.join(root, 'docs/merge-main-20261118/hero-smoke.json');
const report = {method:'Public UI clicks and real keyboard input; snapshots are read-only; offline file entry',heroes:[],pass:false};

(async () => {
  fs.mkdirSync(shots,{recursive:true});
  const browser = await chromium.launch({channel:'msedge',headless:true});
  report.browser = browser.version();
  try {
    for (const hero of ['wukong','nezha','erlang']) {
      const context = await browser.newContext({viewport:{width:1440,height:1000}});
      const result = {hero,errors:[],remoteRequests:[]};
      report.heroes.push(result);
      try {
        await context.setOffline(true);
        await context.route(/^https?:/, route => route.abort());
        const page = await context.newPage();
        page.setDefaultTimeout(60000);
        page.on('pageerror', error => result.errors.push(error.message));
        page.on('request', request => { if (/^https?:/.test(request.url())) result.remoteRequests.push(request.url()); });
        await page.goto(pathToFileURL(path.join(root,'dist-offline/index.html')).href);
        const screen = name => page.waitForFunction(value => globalThis.__KONG__?.snapshot().screen === value,name);
        await screen('menu');
        await page.locator('#begin').click();
        await screen('prologue');
        await page.locator('#begin-relic').click();
        await screen('heroes');
        assert.equal(await page.locator('.hero-choice').count(),3);
        await page.waitForFunction(() => Kong.ImageArt.has(['wukong','v8NezhaPortrait','v8ErlangPortrait']));
        if (hero === 'wukong') {
          await page.waitForTimeout(650); // Let the existing dialogue fade-in settle for visual evidence.
          await page.screenshot({path:path.join(shots,'hero-selection.png')});
        }
        await page.locator('#choose-'+hero).click();
        await screen('start');
        await page.locator('.relic-card').first().click();
        await screen('playing');
        await page.keyboard.down('d');
        await page.waitForTimeout(300);
        await page.keyboard.up('d');
        await page.keyboard.down('j');
        await page.waitForTimeout(500);
        await page.keyboard.up('j');
        await page.waitForFunction(() => __KONG__.snapshot().state.stats.swings > 0);
        const snapshot = await page.evaluate(() => __KONG__.snapshot());
        assert.equal(snapshot.state.hero,hero);
        assert.equal(snapshot.state.stage,0);
        result.swings = snapshot.state.stats.swings;
        result.screenshot = path.relative(root,path.join(shots,hero+'.png')).split(path.sep).join('/');
        await page.screenshot({path:path.join(root,result.screenshot)});
        await page.keyboard.press('Escape');
        await screen('paused');
        assert.equal((await page.evaluate(() => __KONG__.metrics().errors)).length,0);
        assert.deepEqual(result.errors,[]);
        assert.deepEqual(result.remoteRequests,[]);
        result.startedAndAttacked = true;
        result.pauseWorked = true;
      } finally { await context.close(); }
    }
    report.pass = true;
  } finally {
    await browser.close();
    fs.mkdirSync(path.dirname(reportPath),{recursive:true});
    fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
  }
  console.log(JSON.stringify(report,null,2));
})().catch(error => { console.error(error);process.exitCode=1; });
