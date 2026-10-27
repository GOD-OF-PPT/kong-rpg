(function(K){
  'use strict';
  K.Audio=class{
    constructor(){this.ctx=null;this.volume=.25;this.enabled=true;this.buffers={};this.voices=[];this.lastSample={};this.variants={};this.ready=null;this.screen='menu';this.music=null;this.stats={played:{},fallbacks:0,coalesced:0,stolen:0,maxVoices:0,decodeErrors:[],recent:[]};}
    unlock(){
      try{
        if(!this.ctx){
          this.ctx=new(window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});
          this.master=this.ctx.createGain();this.master.gain.value=this.volume;
          this.bus=this.ctx.createGain();this.bus.gain.value=.3;
          this.impactBus=this.ctx.createGain();this.impactBus.gain.value=.65;
          const compressor=this.ctx.createDynamicsCompressor();compressor.threshold.value=-10;compressor.knee.value=6;compressor.ratio.value=5;compressor.attack.value=.003;compressor.release.value=.08;
          // A safety ceiling after the volume stage; quiet transients stay linear.
          const ceiling=this.ctx.createWaveShaper(),curve=new Float32Array(4097);
          for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1,a=Math.abs(x);curve[i]=Math.sign(x)*(a<=.8?a:.8+.15*Math.tanh((a-.8)/.15));}
          ceiling.curve=curve;ceiling.oversample='4x';
          this.bus.connect(compressor);this.impactBus.connect(compressor);compressor.connect(this.master);this.master.connect(ceiling);ceiling.connect(this.ctx.destination);
          if(K.Music&&K.MusicTracks)this.music=new K.Music(this.ctx,compressor,K.MusicTracks);
          this.setScreen(this.screen);
          this.ready=Promise.all(Object.entries(K.ImpactSamples||{}).map(async([id,data])=>{
            try{const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));this.buffers[id]=await this.ctx.decodeAudioData(bytes.buffer);}
            catch{this.stats.decodeErrors.push(id);}
          }));
        }
        if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
        this.music?.retry();
      }catch{this.enabled=false;}
    }
    stopVoice(voice){const t=this.ctx.currentTime;voice.level.gain.cancelScheduledValues(t);voice.level.gain.setTargetAtTime(0,t,.002);try{voice.source.stop(t+.012);}catch{}this.voices=this.voices.filter(v=>v!==voice);}
    stopImpacts(){for(const voice of [...this.voices])this.stopVoice(voice);this.lastSample={};}
    sample(kind,gain=.65,priority=1){
      if(!this.ctx||!this.enabled)return false;
      const variants=kind==='staff-light'?['staff-light-a','staff-light-b']:kind==='ring-hit'?['ring-hit-a','ring-hit-b']:[kind];
      const index=this.variants[kind]||0,id=variants[index%variants.length],buffer=this.buffers[id];
      if(!buffer){this.stats.fallbacks++;return false;}
      const t=this.ctx.currentTime,cooldown=kind==='ultimate-hit'?.12:kind==='shield-block'?.065:.045;
      if(t-(this.lastSample[kind]??-1)<cooldown){this.stats.coalesced++;return true;}
      this.voices=this.voices.filter(v=>v.end>t);
      if(this.voices.length>=6){const victim=this.voices.reduce((a,b)=>a.priority<=b.priority?a:b);if(victim.priority>priority){this.stats.coalesced++;return true;}this.stopVoice(victim);this.stats.stolen++;}
      this.lastSample[kind]=t;this.variants[kind]=index+1;
      const source=this.ctx.createBufferSource(),level=this.ctx.createGain();source.buffer=buffer;level.gain.value=gain;source.connect(level);level.connect(this.impactBus);
      const voice={source,level,priority,end:t+buffer.duration};this.voices.push(voice);source.onended=()=>{source.disconnect();level.disconnect();this.voices=this.voices.filter(v=>v!==voice);};source.start(t);
      this.stats.played[id]=(this.stats.played[id]||0)+1;this.stats.maxVoices=Math.max(this.stats.maxVoices,this.voices.length);
      this.stats.recent.push({id,time:+t.toFixed(4),submittedMs:+performance.now().toFixed(2)});if(this.stats.recent.length>64)this.stats.recent.shift();
      return true;
    }
    events(events){
      const slam=events.some(e=>e.type==='slam-land'),guard=events.some(e=>e.type==='boss-guard'),thunder=events.some(e=>e.type==='thunder-hit'),contact=events.some(e=>['hit','blocked','boss-guard','slam-land','ultimate-hit','thunder-hit'].includes(e.type));
      for(const e of events){
        // One sound per resolved action, including area attacks and guard chip.
        if(e.type==='hit'&&(e.impact==='ultimate'||(slam&&e.impact==='heavy')||(guard&&e.kind==='boss')||(thunder&&e.impact==='thunder')))continue;
        if(e.type==='seal-hit'&&contact)continue;
        this.event(e);
      }
    }
    diagnostics(){return{context:this.ctx?.state||'locked',sampleRate:this.ctx?.sampleRate||0,baseLatencyMs:+((this.ctx?.baseLatency||0)*1000).toFixed(3),outputLatencyMs:+((this.ctx?.outputLatency||0)*1000).toFixed(3),volume:this.volume,masterGain:this.master?.gain.value??0,music:this.music?.diagnostics()||{scene:'locked',current:null},decoded:Object.keys(this.buffers),activeVoices:this.voices.length,...JSON.parse(JSON.stringify(this.stats))};}
    tone(freq,len=.12,type='triangle',gain=.2,delay=0){if(!this.ctx||!this.enabled)return;const t=this.ctx.currentTime+delay;const osc=this.ctx.createOscillator(),g=this.ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+len);osc.connect(g);g.connect(this.bus);osc.start(t);osc.stop(t+len+.02);}
    noise(length=.08,gain=.09){if(!this.ctx||!this.enabled)return;const count=Math.floor(this.ctx.sampleRate*length),buffer=this.ctx.createBuffer(1,count,this.ctx.sampleRate),samples=buffer.getChannelData(0);let n=73;for(let i=0;i<count;i++){n=(n*16807)%2147483647;samples[i]=(n/1073741824-1)*Math.pow(1-i/count,2);}const source=this.ctx.createBufferSource(),level=this.ctx.createGain();source.buffer=buffer;level.gain.value=gain;source.connect(level);level.connect(this.bus);source.start();}
    sweep(from,to,len=.1,gain=.1){if(!this.ctx||!this.enabled)return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='triangle';o.frequency.setValueAtTime(from,t);o.frequency.exponentialRampToValueAtTime(to,t+len);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+len);o.connect(g);g.connect(this.bus);o.start(t);o.stop(t+len+.01);}
    event(e){
      if(e.type==='staff-extend'){this.sweep(370,95,.13,.075);this.noise(.065,.04);}
      if(e.type==='staff-vault'){this.sweep(210,620,.2,.07);this.sample('ground-slam',.35,1);}
      if(e.type==='wheel-start'){this.noise(.12,.035);this.sweep(240,670,.18,.06);}
      if(e.type==='ultimate'){this.sweep(95,360,.2,.13);this.tone(146.83,.7,'triangle',.12);this.tone(293.66,.65,'sine',.1,.13);}
      if(e.type==='ultimate-hit'&&!this.sample('ultimate-hit',.85,3)){this.sweep(190,35,.3,.17);this.noise(.2,.16);}
      if(e.type==='ultimate-ready'){[440,660,880].forEach((f,i)=>this.tone(f,.17,'sine',.07,i*.08));}
      if(e.type==='talisman'){this.tone(e.id==='ward'?660:1180,.24,'sine',.1);}
      if(e.type==='thunder-hit'){this.noise(.13,.12);this.sweep(900,70,.13,.12);}
      if(e.type==='guardian-enter'){this.tone(82,.7,'triangle',.15);this.noise(.2,.08);}
      if(e.type==='guardian-defeat'){[220,330,440,660].forEach((f,i)=>this.tone(f,.4,'triangle',.11,i*.1));}
      if(e.type==='swing'){this.noise(e.combo===3?.11:.055,e.combo===3?.075:.045);this.sweep(e.combo===3?300:620,e.combo===3?90:240,e.combo===3?.13:.07,.055);}
      if(e.type==='hit'&&e.impact!=='ultimate'){const heavy=['heavy','thunder'].includes(e.impact);if(!this.sample(e.impact==='ring'?'ring-hit':heavy?'staff-heavy':'staff-light',heavy?.8:.65,heavy?2:1)){this.sweep(heavy?150:330,heavy?48:130,heavy?.16:.075,heavy?.15:.09);this.noise(heavy?.09:.035,heavy?.12:.065);}}
      if(e.type==='seal-hit')this.sample('staff-light',.5);
      if(e.type==='hurt'){this.tone(72,.2,'sawtooth',.12);this.noise(.16,.11);}
      if(e.type==='jump'){this.tone(e.air?590:390,.1,'sine',.17);if(e.air)this.tone(780,.13,'sine',.08,.04);}
      if(e.type==='dash'){this.noise(.12,.08);this.tone(820,.06,'triangle',.06);}
      if(e.type==='clone'){this.tone(440,.3);this.tone(660,.4,'sine',.2,.1);}
      if(e.type==='warning'||e.type==='boss-warning'){this.tone(e.type==='boss-warning'?220:330,.15,'triangle',.09);this.tone(e.type==='boss-warning'?330:440,.1,'sine',.07,.10);}
      if(e.type==='enemy-attack'){this.noise(.09,.1);this.tone(155,.08,'triangle',.11);}
      if(e.type==='interrupt'){this.tone(680,.15,'triangle',.15);this.tone(1040,.08,'sine',.08);}
      if(e.type==='slam-land'&&!this.sample('ground-slam',.8,2)){this.sweep(140,45,.22,.14);this.noise(.16,.13);}
      if(e.type==='reflect'){this.tone(880,.13,'sine',.09);this.tone(1320,.16,'sine',.05,.04);}
      if(e.type==='world-start'||e.type==='world-clear'||e.type==='story'){this.tone(220,.7,'sine',.07);this.tone(607,.6,'sine',.035,.04);}
      if(['seal','relic','victory'].includes(e.type))[330,440,660].forEach((f,i)=>this.tone(f,.4,'triangle',.18,i*.11));
      if((e.type==='blocked'||e.type==='boss-guard')&&!this.sample('shield-block',.65,2))this.tone(970,.045,'square',.055);
    }
    setScreen(screen){
      this.screen=screen;
      const mode=screen==='playing'?'playing':['dead','won','epilogue','legacy'].includes(screen)?'silent':['paused','build'].includes(screen)?'quiet':['reward','replace'].includes(screen)?'reading':screen==='help'&&this.music?.current?.id==='gameplay'?'quiet':'menu';
      this.music?.setScene(mode);
    }
    tick(){this.music?.tick();}
    setVolume(v){this.volume=Number.isFinite(v)?Math.max(0,Math.min(1,v)):.25;if(this.master)this.master.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.012);}
    menu(kind){if(kind==='move')this.tone(440,.045,'sine',.055);else{this.tone(660,.09,'triangle',.07);this.tone(880,.13,'sine',.035,.035);}}
  };
})(globalThis.Kong ||= {});
