const fs=require('fs'),path=require('path'),zlib=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),file=path.join(root,'artifacts/kong-rpg-offline-v'+JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version+'.zip'),data=fs.readFileSync(file),manifest=JSON.parse(fs.readFileSync(path.join(root,'release/manifest.json')));
const table=Array.from({length:256},(_,i)=>{for(let n=0;n<8;n++)i=i&1?0xedb88320^(i>>>1):i>>>1;return i>>>0;});
function crc(buffer){let n=0xffffffff;for(const b of buffer)n=table[(n^b)&255]^(n>>>8);return(n^0xffffffff)>>>0;}
let end=data.length-22;while(end>=0&&data.readUInt32LE(end)!==0x06054b50)end--;assert.ok(end>=0,'ZIP end directory');
const count=data.readUInt16LE(end+10),entries=[];let offset=data.readUInt32LE(end+16),entryHash=null;
for(let i=0;i<count;i++){
  assert.equal(data.readUInt32LE(offset),0x02014b50);const method=data.readUInt16LE(offset+10),expected=data.readUInt32LE(offset+16),size=data.readUInt32LE(offset+20),plainSize=data.readUInt32LE(offset+24),nameLen=data.readUInt16LE(offset+28),extraLen=data.readUInt16LE(offset+30),commentLen=data.readUInt16LE(offset+32),local=data.readUInt32LE(offset+42),name=data.subarray(offset+46,offset+46+nameLen).toString('utf8').replace(/\\/g,'/');
  assert.equal(data.readUInt32LE(local),0x04034b50);const start=local+30+data.readUInt16LE(local+26)+data.readUInt16LE(local+28),packed=data.subarray(start,start+size),plain=method===8?zlib.inflateRawSync(packed):packed;
  assert.ok(method===0||method===8);assert.equal(plain.length,plainSize,name);assert.equal(crc(plain),expected,name+' CRC');entries.push(name);if(name==='index.html')entryHash=crypto.createHash('sha256').update(plain).digest('hex');offset+=46+nameLen+extraLen+commentLen;
}
assert.equal(entryHash,manifest.sha256);for(const name of manifest.legacyEntries)assert.ok(entries.includes(name));assert.ok(entries.includes('docs/'+(manifest.version.startsWith('5.')?'journey-v5':manifest.version.startsWith('4.')?'progression-v4':'combat-v3')+'/VERIFICATION.md'));
const report={zip:path.relative(root,file).replace(/\\/g,'/'),bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex'),entryHash,allEntryCRCsValid:true,entries};fs.writeFileSync(path.join(root,process.env.EVIDENCE_DIR||'evidence/combat-v3','package.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({bytes:report.bytes,sha256:report.sha256,entryHash,allEntryCRCsValid:true},null,2));
