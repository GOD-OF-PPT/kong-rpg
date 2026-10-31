import {defineConfig} from 'vite';
import {gameDistribution} from './tools/vite-game.mjs';

export default defineConfig(({mode})=>{
  const offline=mode==='offline';
  return {
    base:'./',publicDir:false,
    plugins:[gameDistribution(offline)],
    // The browser code has no npm imports. Never crawl retained giant HTML
    // releases or generated base64 catalogues during dependency discovery.
    optimizeDeps:{entries:['index.html'],noDiscovery:true},
    server:{host:'127.0.0.1',port:5173,strictPort:true},
    preview:{host:'127.0.0.1',port:4173,strictPort:true},
    build:{
      outDir:offline?'dist-offline':'dist',
      // The plugin atomically writes current assets, then removes stale files
      // only inside these two dedicated output directories.
      emptyOutDir:false,write:false,assetsInlineLimit:0,modulePreload:false,cssCodeSplit:false,
      target:'es2022',minify:true,sourcemap:false,manifest:false,reportCompressedSize:false,
      chunkSizeWarningLimit:offline?640:512,
      rolldownOptions:{output:{
        format:offline?'iife':'es',
        ...(offline?{codeSplitting:false}:{}),
        hashCharacters:'hex',entryFileNames:'game.[hash:16].js',assetFileNames:'assets/[name].[hash:16][extname]'
      }}
    }
  };
});
