const fs=require('node:fs');
// Generated catalogues are often open in Chrome or scanned by Windows AV.
// Preserve identical files and replace changed contents without truncating a
// mapped file in place.
module.exports=function writeGenerated(file,value){
  const data=Buffer.isBuffer(value)?value:Buffer.from(value);
  if(fs.existsSync(file)&&fs.readFileSync(file).equals(data))return;
  const temporary=file+'.tmp-'+process.pid;fs.writeFileSync(temporary,data);
  for(let attempt=0;;attempt++){
    try{fs.renameSync(temporary,file);return;}
    catch(error){if(attempt>=30||!['EPERM','EACCES','EBUSY','UNKNOWN'].includes(error.code))throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}
  }
};
