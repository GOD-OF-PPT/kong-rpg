// A page-only recording path for Edge hosts whose native screencast captures
// browser download surfaces. Every frame comes from the same screenshot seam
// used for visual QA, with real capture timestamps retained beside the video.
const cp=require('node:child_process'),fs=require('node:fs');
module.exports=function recordPage(page,file,fps=5){
  const encoder=cp.spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','mjpeg','-framerate',String(fps),'-i','pipe:0','-vf','scale=960:-2','-c:v','libx264','-preset','veryfast','-crf','25','-pix_fmt','yuv420p','-movflags','+faststart',file],{stdio:['pipe','ignore','pipe'],windowsHide:true});
  let stopped=false,error='',stderr='';const frames=[],start=performance.now();encoder.stderr.on('data',b=>{stderr+=String(b).slice(0,1000);});encoder.stdin.on('error',e=>{error=String(e);stopped=true;});encoder.on('error',e=>{error=String(e);stopped=true;});
  const closed=new Promise(resolve=>encoder.on('close',code=>resolve(code)));
  const loop=(async()=>{while(!stopped){const t=performance.now();try{const jpeg=await page.screenshot({type:'jpeg',quality:65});frames.push({index:frames.length,ms:+(performance.now()-start).toFixed(2)});if(!encoder.stdin.write(jpeg))await new Promise(resolve=>{const done=()=>{encoder.stdin.off('drain',done);encoder.stdin.off('error',done);resolve();};encoder.stdin.once('drain',done);encoder.stdin.once('error',done);});}catch(e){error=String(e);break;}await new Promise(resolve=>setTimeout(resolve,Math.max(1,1000/fps-(performance.now()-t))));}})();
  return{async stop(){stopped=true;await loop;encoder.stdin.end();const code=await closed;const report={file,fps,frames,method:'continuous page screenshots at requested 5Hz; JSON contains actual capture times',error:error||code!==0?error||stderr:''};fs.writeFileSync(file+'.json',JSON.stringify(report,null,2));if(report.error)throw Error(report.error);return report;}};
};
