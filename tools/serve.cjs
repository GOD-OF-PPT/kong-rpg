const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const lan=process.argv.includes('--lan'),root=path.resolve(__dirname,lan?'../release':'..');
const port=Number(process.env.PORT||5188),host=process.env.HOST||(lan?'0.0.0.0':'127.0.0.1');
// LAN sharing serves the standalone game, rather than the development checkout.
http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
  if(lan&&pathname.startsWith('/release/'))pathname=pathname.slice(8);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.json')?'application/json; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(data);});
}).listen(port,host,()=>console.log((lan?'LAN game':'Preview')+' http://'+host+':'+port));
