const http=require('node:http'),path=require('node:path'),createGameHandler=require('./static-game.cjs');
const project=path.resolve(__dirname,'..'),lan=process.argv.includes('--lan'),web=lan||process.argv.includes('--web');
const root=path.join(project,web?'dist':''),port=Number(process.env.PORT||5188),host=process.env.HOST||(lan?'0.0.0.0':'127.0.0.1');
http.createServer(createGameHandler({root,project,web})).listen(port,host,()=>console.log((web?'Web game':'Source preview')+' http://'+host+':'+port+' root='+root));
