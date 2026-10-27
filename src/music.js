(function(K){
  'use strict';
  // HTMLMediaElement decodes long tracks on demand; data URLs keep file://
  // independent of fetch, servers, cached resources and browser security flags.
  K.Music=class{
    constructor(ctx,destination,tracks){
      this.ctx=ctx;this.tracks=tracks||{};this.voices=new Map();this.scene='silent';this.current=null;this.bag=[];this.lastMenu=null;this.hidden=document.hidden;
      this.bus=ctx.createGain();this.bus.gain.value=1;this.bus.connect(destination);
      this.analyser=ctx.createAnalyser();this.analyser.fftSize=256;this.bus.connect(this.analyser);
      this.stats={starts:[],errors:[],blocked:0,loops:0,menuChanges:0};
    }
    menuTrack(){
      if(!this.bag.length){
        this.bag=Object.keys(this.tracks).filter(id=>id.startsWith('menu-'));
        for(let i=this.bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];}
        if(this.bag.length>1&&this.bag[this.bag.length-1]===this.lastMenu)this.bag.reverse();
      }
      const id=this.bag.pop();this.lastMenu=id;return id;
    }
    voice(id){
      if(this.voices.has(id))return this.voices.get(id);
      const track=this.tracks[id];if(!track)return null;
      const media=new Audio();media.preload='none';media.src=track.src;media.loop=id==='gameplay';
      const source=this.ctx.createMediaElementSource(media),gain=this.ctx.createGain();gain.gain.value=0;source.connect(gain);gain.connect(this.bus);
      const voice={id,media,source,gain,fade:null,lastPosition:0,pending:false};this.voices.set(id,voice);
      media.addEventListener('ended',()=>{if(this.current!==voice||this.scene!=='menu'||this.hidden)return;this.stats.menuChanges++;this.switchTo(this.menuTrack(),true);});
      media.addEventListener('error',()=>{this.stats.errors.push({id,code:media.error?.code||0});});
      return voice;
    }
    target(){return this.scene==='playing'?1:this.scene==='quiet'?.28:this.scene==='reading'?.48:this.scene==='menu'?1:0;}
    ramp(voice,target,seconds=.65){
      // Linear ramps have an explicit model so a rapid menu/pause transition
      // starts from the current interpolated level, without jumps or stale stops.
      const now=this.ctx.currentTime,fade=voice.fade,start=fade?fade.from+(fade.to-fade.from)*Math.min(1,Math.max(0,(now-fade.at)/fade.seconds)):voice.gain.gain.value;
      voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setValueAtTime(start,now);voice.gain.gain.linearRampToValueAtTime(target,now+seconds);
      voice.fade={from:start,to:target,at:now,seconds};
    }
    play(voice){
      if(!voice||this.hidden||this.scene==='silent'||(!voice.media.paused&&!voice.media.ended)||voice.pending)return;
      voice.pending=true;
      const attempt=voice.media.play();
      Promise.resolve(attempt).then(()=>{
        voice.pending=false;
        if(this.hidden||this.current!==voice||this.scene==='silent'){voice.media.pause();return;}
        this.stats.starts.push({id:voice.id,time:+this.ctx.currentTime.toFixed(3)});if(this.stats.starts.length>32)this.stats.starts.shift();
      }).catch(e=>{voice.pending=false;if(e.name==='NotAllowedError')this.stats.blocked++;else if(e.name!=='AbortError')this.stats.errors.push({id:voice.id,name:e.name});});
    }
    switchTo(id,restart=false){
      const next=this.voice(id);if(!next)return;
      if(this.current===next){this.ramp(next,(this.tracks[id].gain||.3)*this.target());this.play(next);return;}
      for(const voice of this.voices.values())if(voice!==next)this.ramp(voice,0);
      this.current=next;
      if(restart){next.media.currentTime=0;next.lastPosition=0;}
      this.ramp(next,(this.tracks[id].gain||.3)*this.target());this.play(next);
    }
    setScene(scene){
      if(this.scene===scene)return;
      const previous=this.scene;this.scene=scene;
      if(scene==='silent'){for(const voice of this.voices.values())this.ramp(voice,0,.18);return;}
      if(scene==='menu'){if(previous!=='menu')this.switchTo(this.menuTrack(),true);}
      else if(!this.current||this.current.id!=='gameplay')this.switchTo('gameplay',previous==='menu');
      else{this.ramp(this.current,(this.tracks.gameplay.gain||.3)*this.target(),.25);this.play(this.current);}
    }
    setHidden(hidden){
      this.hidden=hidden;
      if(hidden){for(const voice of this.voices.values())voice.media.pause();}
      else if(this.current){this.ramp(this.current,(this.tracks[this.current.id].gain||.3)*this.target(),.25);this.play(this.current);}
    }
    tick(){
      const now=this.ctx.currentTime;
      for(const voice of this.voices.values()){
        if(voice.fade&&now>=voice.fade.at+voice.fade.seconds){if(voice.fade.to===0)voice.media.pause();voice.fade=null;}
        const at=voice.media.currentTime;if(voice.media.loop&&at+.5<voice.lastPosition&&!voice.media.seeking)this.stats.loops++;voice.lastPosition=at;
      }
    }
    retry(){if(this.current&&!this.hidden&&this.scene!=='silent')this.play(this.current);}
    diagnostics(){
      const wave=new Float32Array(this.analyser.fftSize);this.analyser.getFloatTimeDomainData(wave);let energy=0;for(const v of wave)energy+=v*v;
      return{scene:this.scene,current:this.current?.id||null,hidden:this.hidden,rms:+Math.sqrt(energy/wave.length).toFixed(6),...JSON.parse(JSON.stringify(this.stats)),voices:[...this.voices.values()].map(v=>({id:v.id,paused:v.media.paused,position:+v.media.currentTime.toFixed(3),duration:Number.isFinite(v.media.duration)?+v.media.duration.toFixed(3):null,readyState:v.media.readyState,loop:v.media.loop,gain:+v.gain.gain.value.toFixed(4),fading:!!v.fade}))};
    }
  };
})(globalThis.Kong ||= {});
