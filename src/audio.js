(function(K){
  'use strict';
  K.Audio=class{
    constructor(){this.ctx=null;this.volume=.25;this.next=0;this.note=0;this.enabled=true;}
    unlock(){try{if(!this.ctx){this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.bus=this.ctx.createGain();this.bus.gain.value=this.volume*.3;this.bus.connect(this.ctx.destination);}if(this.ctx.state==='suspended')this.ctx.resume();}catch{this.enabled=false;}}
    tone(freq,len=.12,type='triangle',gain=.2,delay=0){if(!this.ctx||!this.enabled)return;const t=this.ctx.currentTime+delay;const osc=this.ctx.createOscillator(),g=this.ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+len);osc.connect(g);g.connect(this.bus);osc.start(t);osc.stop(t+len+.02);}
    noise(length=.08,gain=.09){if(!this.ctx||!this.enabled)return;const count=Math.floor(this.ctx.sampleRate*length),buffer=this.ctx.createBuffer(1,count,this.ctx.sampleRate),samples=buffer.getChannelData(0);let n=73;for(let i=0;i<count;i++){n=(n*16807)%2147483647;samples[i]=(n/1073741824-1)*Math.pow(1-i/count,2);}const source=this.ctx.createBufferSource(),level=this.ctx.createGain();source.buffer=buffer;level.gain.value=gain;source.connect(level);level.connect(this.bus);source.start();}
    event(e){
      if(e.type==='swing'){this.noise(e.combo===3?.13:.075,.12);this.tone(170+e.combo*55,.07,'triangle',.1);}
      if(e.type==='hit'){this.tone(115,.09,'square',.12);this.tone(470,.045,'triangle',.11);this.noise(.045,.08);}
      if(e.type==='hurt'){this.tone(72,.2,'sawtooth',.12);this.noise(.16,.11);}
      if(e.type==='jump'){this.tone(e.air?590:390,.1,'sine',.17);if(e.air)this.tone(780,.13,'sine',.08,.04);}
      if(e.type==='dash'){this.noise(.12,.08);this.tone(820,.06,'triangle',.06);}
      if(e.type==='clone'){this.tone(440,.3);this.tone(660,.4,'sine',.2,.1);}
      if(e.type==='warning'||e.type==='boss-warning'){this.tone(e.type==='boss-warning'?220:330,.15,'triangle',.09);this.tone(e.type==='boss-warning'?330:440,.1,'sine',.07,.10);}
      if(e.type==='enemy-attack'){this.noise(.09,.1);this.tone(155,.08,'triangle',.11);}
      if(e.type==='interrupt'){this.tone(680,.15,'triangle',.15);this.tone(1040,.08,'sine',.08);}
      if(['seal','relic','victory'].includes(e.type))[330,440,660].forEach((f,i)=>this.tone(f,.4,'triangle',.18,i*.11));
      if(e.type==='blocked'||e.type==='boss-guard')this.tone(970,.045,'square',.055);
    }
    tick(playing,stage=0){if(!this.ctx||!this.enabled||!playing)return;const t=this.ctx.currentTime;if(t>this.next){const melodies=[[146.83,220,261.63,293.66,220,196,164.81,220],[164.81,196,246.94,293.66,246.94,220,196,164.81],[130.81,196,233.08,261.63,196,174.61,155.56,196],[110,130.81,164.81,196,164.81,130.81,146.83,110]];const notes=melodies[stage]||melodies[0];this.next=t+(stage===3?.45:.65);this.tone(notes[this.note++%notes.length],.48,'sine',.065);if(this.note%4===0){this.tone(notes[0]/2,.6,'sine',.09);this.noise(.14,.025);}}}
    setVolume(v){this.volume=v;if(this.bus)this.bus.gain.value=v*.3;}
    menu(kind){if(kind==='move')this.tone(440,.045,'sine',.055);else{this.tone(660,.09,'triangle',.07);this.tone(880,.13,'sine',.035,.035);}}
  };
})(globalThis.Kong ||= {});
