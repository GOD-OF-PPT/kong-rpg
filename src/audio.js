(function (K) {
  'use strict';

  const THEMES = {
    menu: {
      step: .52,
      lead: [220, 0, 261.63, 293.66, 329.63, 0, 293.66, 261.63, 220, 196, 164.81, 0, 196, 220, 0, 0],
      bass: [110, 0, 0, 0, 87.31, 0, 0, 0, 98, 0, 0, 0, 110, 0, 0, 0],
      drum: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]
    },
    0: {
      step: .36,
      lead: [146.83, 220, 261.63, 293.66, 329.63, 293.66, 220, 0, 196, 220, 261.63, 220, 164.81, 146.83, 196, 0],
      bass: [73.42, 0, 0, 0, 110, 0, 0, 0, 98, 0, 0, 0, 73.42, 0, 0, 0],
      drum: [1, 0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 0, 2, 0, 0, 0]
    },
    1: {
      step: .32,
      lead: [164.81, 196, 246.94, 293.66, 329.63, 293.66, 246.94, 196, 220, 246.94, 329.63, 392, 329.63, 246.94, 196, 164.81],
      bass: [82.41, 0, 82.41, 0, 98, 0, 0, 0, 110, 0, 98, 0, 82.41, 0, 0, 0],
      drum: [1, 0, 2, 0, 1, 0, 0, 2, 1, 0, 2, 0, 1, 0, 2, 0]
    },
    2: {
      step: .30,
      lead: [130.81, 196, 233.08, 261.63, 311.13, 261.63, 233.08, 196, 174.61, 196, 261.63, 293.66, 261.63, 196, 155.56, 130.81],
      bass: [65.41, 0, 0, 65.41, 77.78, 0, 0, 0, 87.31, 0, 0, 87.31, 65.41, 0, 0, 0],
      drum: [1, 0, 2, 0, 0, 1, 2, 0, 1, 0, 2, 0, 1, 2, 0, 0]
    },
    3: {
      step: .21,
      lead: [110, 130.81, 164.81, 196, 220, 233.08, 220, 164.81, 146.83, 164.81, 220, 261.63, 233.08, 196, 164.81, 130.81],
      bass: [55, 55, 0, 55, 65.41, 0, 65.41, 0, 73.42, 73.42, 0, 73.42, 58.27, 0, 55, 0],
      drum: [1, 2, 0, 2, 1, 0, 2, 1, 1, 2, 0, 2, 1, 1, 2, 2]
    }
  };

  K.Audio = class {
    constructor() {
      this.ctx = null;
      this.volume = .38;
      this.muted = false;
      this.next = 0;
      this.stepIdx = 0;
      this.lastTheme = null;
      this.enabled = true;
    }

    unlock() {
      try {
        if (!this.ctx) {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
          this.bus = this.ctx.createGain();
          this.bus.gain.value = this.muted ? 0 : this.volume * .35;
          this.bus.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
      } catch {
        this.enabled = false;
      }
    }

    setVolume(v) {
      this.volume = K.clamp(Number(v) || 0, 0, 1);
      if (this.bus) this.bus.gain.value = this.muted ? 0 : this.volume * .35;
    }

    setMuted(m) {
      this.muted = !!m;
      if (this.bus) this.bus.gain.value = this.muted ? 0 : this.volume * .35;
    }

    tone(freq, len = .12, type = 'triangle', gain = .2, delay = 0, slideTo = 0) {
      if (!this.ctx || !this.enabled || this.muted || this.volume <= 0.001) return;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t + len * .85);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + .007);
      g.gain.exponentialRampToValueAtTime(.0008, t + len);
      osc.connect(g); g.connect(this.bus);
      osc.start(t); osc.stop(t + len + .025);
    }

    pluck(freq, len = .42, gain = .09, delay = 0) {
      if (!this.ctx || !this.enabled || this.muted || this.volume <= 0.001) return;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator(), sub = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      osc.type = 'sawtooth';
      sub.type = 'triangle';
      osc.frequency.setValueAtTime(freq * 1.008, t);
      osc.frequency.exponentialRampToValueAtTime(freq, t + .035);
      sub.frequency.setValueAtTime(freq * 2, t);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(3400, freq * 6.5), t);
      filter.frequency.exponentialRampToValueAtTime(Math.max(260, freq * 1.6), t + len);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + .008);
      g.gain.exponentialRampToValueAtTime(.0008, t + len);
      const subGain = this.ctx.createGain();
      subGain.gain.value = .28;
      osc.connect(filter); sub.connect(subGain); subGain.connect(filter);
      filter.connect(g); g.connect(this.bus);
      osc.start(t); sub.start(t);
      osc.stop(t + len + .03); sub.stop(t + len + .03);
    }

    noise(length = .08, gain = .09, filterFreq = 1800) {
      if (!this.ctx || !this.enabled || this.muted || this.volume <= 0.001) return;
      const count = Math.floor(this.ctx.sampleRate * length);
      const buffer = this.ctx.createBuffer(1, count, this.ctx.sampleRate);
      const samples = buffer.getChannelData(0);
      let n = 73;
      for (let i = 0; i < count; i++) {
        n = (n * 16807) % 2147483647;
        samples[i] = (n / 1073741824 - 1) * Math.pow(1 - i / count, 1.8);
      }
      const source = this.ctx.createBufferSource(), filter = this.ctx.createBiquadFilter(), level = this.ctx.createGain();
      source.buffer = buffer;
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;
      filter.Q.value = .85;
      level.gain.value = gain;
      source.connect(filter); filter.connect(level); level.connect(this.bus);
      source.start();
    }

    event(e) {
      if (!e) return;
      switch (e.type) {
        case 'swing':
          if (e.riposte) {
            this.noise(.18, .18, 2500);
            this.tone(320, .15, 'sawtooth', .18, 0, 740);
            this.tone(920, .20, 'triangle', .14, .03);
          } else if (e.style === 'thrust') {
            this.noise(.09, .14, 3200);
            this.tone(420 + e.combo * 85, .07, 'sawtooth', .10, 0, 240);
          } else {
            this.noise(e.combo === 3 ? .15 : .085, .15, e.combo === 3 ? 1150 : 2100);
            this.tone(165 + e.combo * 58, .09, 'triangle', .12, 0, 105 + e.combo * 28);
          }
          break;
        case 'stance-switch':
          this.pluck(e.flow ? 587.33 : 440, .24, .12);
          if (e.flow) { this.noise(.12, .12, 2600); this.tone(880, .14, 'triangle', .11, .03); }
          break;
        case 'immobilize':
          this.tone(587.33, .38, 'sine', .19, 0, 1174.66);
          this.pluck(880, .45, .14, .04);
          break;
        case 'shatter':
          this.noise(.20, .20, 3400);
          this.tone(1244.5, .16, 'triangle', .16, 0, 440);
          this.tone(98, .25, 'sawtooth', .18, 0, 48);
          break;
        case 'rock-cast':
          this.tone(196, .16, 'square', .10, 0, 164.81);
          this.tone(392, .12, 'triangle', .09);
          break;
        case 'pillar-cast':
          this.tone(140, .24, 'sawtooth', .17, 0, 290);
          this.tone(520 + (e.power || 1) * 110, .22, 'triangle', .14, .03);
          break;
        case 'pillar-hit':
          this.noise(.26, .24, 620);
          this.tone(92, .38, 'sawtooth', .24, 0, 42);
          this.tone(220, .32, 'triangle', .18, .02, 110);
          this.pluck(440, .5, .15, .04);
          break;
        case 'jar-boom':
          this.noise(.32, .26, 480);
          this.tone(86, .42, 'sawtooth', .24, 0, 36);
          break;
        case 'chest-open':
        case 'forge-buy':
          [392, 493.88, 587.33, 783.99].forEach((f, i) => this.pluck(f, .42, .13, i * .055));
          break;
        case 'mote':
          this.tone(880, .055, 'sine', .055, 0, 1174.66);
          break;
        case 'insight':
          if (e.rock) {
            this.tone(220, .48, 'triangle', .24);
            this.tone(659.25, .42, 'sine', .22, .01);
            this.tone(1318.5, .36, 'triangle', .16, .03);
            this.noise(.14, .18, 2800);
          } else {
            this.tone(880, .25, 'sine', .2, 0, 1320);
            this.tone(1318.5, .34, 'triangle', .15, .04);
            this.tone(110, .22, 'sine', .18, 0, 55);
          }
          break;
        case 'stance-up':
          this.pluck(523.25 + (e.stance || 1) * 65, .28, .12);
          break;
        case 'hit':
          this.tone(122, .09, 'square', .14, 0, 70);
          this.tone(490, .048, 'triangle', .12);
          this.noise(.055, .10, 1950);
          break;
        case 'ward-block':
          this.tone(660, .16, 'triangle', .14);
          this.tone(990, .2, 'sine', .11, .03);
          break;
        case 'hurt':
          this.tone(82, .22, 'sawtooth', .16, 0, 46);
          this.noise(.16, .14, 900);
          break;
        case 'jump':
          this.tone(e.air ? 560 : 350, .11, 'sine', .16, 0, e.air ? 780 : 510);
          if (e.air) this.tone(840, .13, 'sine', .08, .04);
          break;
        case 'pad-jump':
          [392, 523.25, 783.99].forEach((f, i) => this.pluck(f, .32, .12, i * .045));
          break;
        case 'dash':
          this.noise(.11, .09, 2600);
          this.tone(760, .065, 'triangle', .07, 0, 420);
          break;
        case 'clone':
          this.pluck(440, .38, .13);
          this.tone(659.25, .36, 'sine', .14, .08);
          break;
        case 'reflect':
          this.tone(740, .12, 'triangle', .15, 0, 1180);
          this.noise(.07, .08, 3200);
          break;
        case 'bell-ring':
        case 'bell-clear':
        case 'mirror-break':
          this.tone(196, .85, 'sine', .22);
          this.tone(392, .65, 'triangle', .12, .02);
          this.tone(587.33, .5, 'sine', .08, .05);
          break;
        case 'stele-awake':
          [293.66, 392, 493.88, 587.33].forEach((f, i) => this.pluck(f, .55, .13, i * .07));
          break;
        case 'boss-phase':
        case 'boss-beam':
          this.noise(.34, .22, 540);
          this.tone(73.42, .55, 'sawtooth', .22, 0, 52);
          this.tone(220, .45, 'triangle', .15, .06, 146.83);
          break;
        case 'pillar-erupt':
          this.noise(.18, .15, 720);
          this.tone(98, .22, 'sawtooth', .14, 0, 58);
          break;
        case 'warning':
        case 'boss-warning':
          this.tone(e.type === 'boss-warning' ? 220 : 330, .15, 'triangle', .095);
          this.tone(e.type === 'boss-warning' ? 330 : 440, .11, 'sine', .075, .09);
          break;
        case 'enemy-attack':
          this.noise(.09, .1, 1400);
          this.tone(155, .08, 'triangle', .11, 0, 95);
          break;
        case 'interrupt':
          this.tone(680, .15, 'triangle', .15);
          this.tone(1040, .1, 'sine', .1, .03);
          break;
        case 'seal':
        case 'relic':
        case 'victory':
        case 'macaque-kill':
        case 'warden-kill':
          [329.63, 440, 587.33, 659.25].forEach((f, i) => this.pluck(f, .52, .15, i * .085));
          break;
        case 'blocked':
        case 'boss-guard':
          this.tone(960, .05, 'square', .065);
          break;
      }
    }

    tick(playing, stage = 0, bossHp = 270, inMenu = false) {
      if (!this.ctx || !this.enabled || this.muted || this.volume <= 0.001) return;
      if (!playing && !inMenu) return;
      const key = inMenu ? 'menu' : stage;
      if (this.lastTheme !== key) { this.lastTheme = key; this.stepIdx = 0; }
      const theme = THEMES[key] || THEMES[0];
      const t = this.ctx.currentTime;
      if (t < this.next) return;
      let tempo = theme.step;
      if (!inMenu && stage === 3 && bossHp < 180) tempo = bossHp <= 130 ? .165 : .19;
      this.next = t + tempo;
      const i = this.stepIdx++ % 16;
      const lead = theme.lead[i];
      const bass = theme.bass[i];
      const drum = theme.drum[i];
      if (lead > 0) this.pluck(lead, tempo * 1.65, inMenu ? .052 : .074);
      if (bass > 0) this.tone(bass, tempo * 2.1, 'sine', inMenu ? .055 : .088);
      if (drum === 1) {
        this.tone(82, .14, 'sine', .11, 0, 42);
        this.noise(.06, .035, 420);
      } else if (drum === 2) {
        this.tone(680, .035, 'triangle', .045);
      }
    }
  };
})(globalThis.Kong ||= {});
