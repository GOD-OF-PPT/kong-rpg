(function(K){
  'use strict';
  K.Audio=class{
    constructor(){this.ctx=null;this.volume=.25;this.next=0;this.note=0;this.enabled=true;}
    unlock(){try{if(!this.ctx){this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.bus=this.ctx.createGain();this.bus.gain.value=this.volume*.3;this.bus.connect(this.ctx.destination);}if(this.ctx.state==='suspended')this.ctx.resume();}catch{this.enabled=false;}}
    tone(freq,len=.12,type='triangle',gain=.2,delay=0){if(!this.ctx||!this.enabled)return;const t=this.ctx.currentTime+delay;const osc=this.ctx.createOscillator(),g=this.ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+len);osc.connect(g);g.connect(this.bus);osc.start(t);osc.stop(t+len+.02);}
    event(e){if(e.type==='swing')this.tone(180+e.combo*70,.07,'triangle',.23);if(e.type==='hit'){this.tone(115,.09,'square',.15);this.tone(470,.045,'triangle',.1);}if(e.type==='hurt')this.tone(72,.2,'sawtooth',.12);if(e.type==='jump')this.tone(e.air?590:390,.1,'sine',.17);if(e.type==='dash')this.tone(820,.06,'triangle',.1);if(e.type==='clone'){this.tone(440,.3);this.tone(660,.4,'sine',.2,.1);}if(['seal','relic','victory'].includes(e.type)){[330,440,660].forEach((f,i)=>this.tone(f,.4,'triangle',.2,i*.11));}if(e.type==='blocked')this.tone(970,.045,'square',.07);}
    tick(playing){if(!this.ctx||!this.enabled||!playing)return;const t=this.ctx.currentTime;if(t>this.next){this.next=t+.65;const notes=[146.83,220,261.63,293.66,220,196,164.81,220];this.tone(notes[this.note++%notes.length],.48,'sine',.065);if(this.note%4===0)this.tone(73.42,.6,'sine',.09);}}
    setVolume(v){this.volume=v;if(this.bus)this.bus.gain.value=v*.3;}
  };
})(globalThis.Kong ||= {});
