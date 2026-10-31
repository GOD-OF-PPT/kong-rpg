// Compatibility entry for offline callers.
require('./prepare-assets.cjs');
(async()=>{const {build}=await import('vite');await build({mode:'offline'});})().catch(error=>{console.error(error);process.exitCode=1;});
