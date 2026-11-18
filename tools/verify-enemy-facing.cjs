const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const {pathToFileURL}=require('node:url'),offline=process.argv.includes('--offline'),baseline=process.argv.includes('--baseline');
const out=path.resolve(process.env.FACING_OUT||'evidence/cloud-facing/'+(baseline?'facing-before.json':offline?'facing-offline.json':'facing.json'));
(async()=>{
  let browser,server;const report={kind:offline?'file':'http',baseline,checks:[],errors:[]};
  try{
    if(!offline)server=await(await import('vite')).preview({preview:{host:'127.0.0.1',port:0,strictPort:true}});browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1366,height:850}});page.on('pageerror',e=>report.errors.push(e.message));
    if(offline){await page.context().setOffline(true);await page.context().route(/^https?:/,route=>route.abort());}
    await page.goto(offline?pathToFileURL(path.resolve('dist-offline/index.html')).href:'http://127.0.0.1:'+server.httpServer.address().port+'/');await page.evaluate(()=>Kong.ImageArt.loadAll());
    report.checks=await page.evaluate(baseline=>{
      const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const r=new Kong.Renderer(canvas),c=r.c,checks=[];
      if(baseline)r.motionActor=function(id,x,feet,face,alpha=1,rim=false,flash=false){const image=this.motionFrame(id,rim,flash),frame=Kong.MotionFrames[id];if(!image)return false;c.save();c.globalAlpha*=alpha;c.translate(Math.round(x),Math.round(feet));c.scale(face,1);c.drawImage(image,-frame.anchor[0],-frame.anchor[1]);c.restore();return true;};
      const standard=[-1,-1,-1,1,-1,-1],nativeFacing={
        cloud:[standard,[1,1,1,1,1,1],[1,1,1,1,1,1],standard,standard],
        underworld:[[-1,1,-1,1,1,1],standard,[-1,1,-1,1,-1,-1],[-1,1,-1,1,-1,-1],standard],
        water:[standard,[-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1],standard,standard],
        dragon:[standard,[-1,-1,1,1,-1,-1],standard,standard,standard],
        heaven:[[-1,-1,-1,1,1,-1],[-1,-1,-1,-1,-1,-1],standard,standard,standard]
      };
      r.ui='playing';r.clock=0;r.shake=false;let current=null,draws=[];
      const frame=r.motionFrame.bind(r),draw=c.drawImage.bind(c);r.motionFrame=(id,...args)=>{current=id;return frame(id,...args);};
      c.drawImage=(...args)=>{if(current)draws.push({id:current,scaleX:c.getTransform().a});return draw(...args);};
      for(const stage of [0,1,3,4,6,7,9,10,12,13]){
        const s=Kong.newRun('FACING-ANIMATION','cloud');Kong.enterRoom(s,stage,true);r.scene=s;
        for(const e of s.room.enemies.filter(e=>e.role!=null&&!e.dormant))for(const face of [-1,1]){
          const target={x:e.x+e.w/2+face*180-12,y:e.y};Kong.beginCampaignMove(s,e,Kong.campaignMoveSet(e)[0],target);
          for(const phase of ['idle','campaign-windup','campaign-active','recover']){
            e.phase=phase;e.recoil=0;e.lastX=e.x;current=null;draws=[];c.setTransform(1,0,0,1,0,0);r.person(e.kind,e.x,e.y,e.face);
            for(const record of draws){
              // Independent visual fixture, checked against the source strips
              // saved beside this report; never assume an entire row is alike.
              const [realm,row,column]=record.id.split('-'),native=nativeFacing[realm][Number(row)][Number(column)];
              checks.push({name:record.id+' '+phase+' towards '+face,pass:Math.sign(record.scaleX)*native===face,...record,face});
            }
          }
        }
      }
      return checks;
    },baseline);
    const captures=await page.evaluate(()=>{
      const results=[];
      for(const stage of [0,6]){
        const s=Kong.newRun('FACING-VISUAL','cloud');Kong.enterRoom(s,stage,true);
        const e=s.room.enemies.find(e=>e.role===1&&!e.chiefId);for(const other of s.room.enemies)if(other!==e)other.hp=0;
        Object.assign(s.player,{x:450,y:396,grounded:true,face:1});Object.assign(e,{x:700,y:(stage===6?400:440)-e.h,baseY:(stage===6?400:440)-e.h,dormant:false});
        Kong.beginCampaignMove(s,e,Kong.campaignMoveSet(e)[0]);
        const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const renderer=new Kong.Renderer(canvas);renderer.shake=false;renderer.camera=0;
        renderer.draw(s,'playing',Kong.DT);results.push({name:e.realm+'-caster-windup',png:canvas.toDataURL(),face:e.face});
      }
      return results;
    });
    fs.mkdirSync(path.dirname(out),{recursive:true});
    for(const capture of captures)fs.writeFileSync(path.join(path.dirname(out),capture.name+'.png'),Buffer.from(capture.png.split(',')[1],'base64'));
    report.captures=captures.map(({png,...capture})=>capture);
    if(!report.checks.length||report.checks.some(check=>!check.pass)||report.errors.length)process.exitCode=1;report.pass=!process.exitCode;
  }catch(error){report.failure=error.stack;process.exitCode=1;}
  finally{await browser?.close();await server?.close();fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,checks:report.checks.length,failures:report.checks.filter(check=>!check.pass).slice(0,10),errors:report.errors,failure:report.failure}));}
})();
