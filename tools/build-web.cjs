// Compatibility entry; production bundling is owned by vite.config.mjs.
(async()=>{const {build}=await import('vite');await build({mode:process.argv.includes('--offline')?'offline':'production'});})().catch(error=>{console.error(error);process.exitCode=1;});
