(function (K) {
  'use strict';

  const TRACKED = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyJ', 'KeyK', 'KeyL', 'KeyU', 'KeyR', 'KeyQ', 'KeyF', 'KeyC', 'KeyE', 'ShiftLeft', 'ShiftRight'];

  K.Input = class {
    constructor(canvas, onControl, onInput) {
      this.keys = new Set();
      this.pressed = new Set();
      this.virtual = new Set();
      this.mouse = false;
      this.aimFace = 0;
      this.active = false;
      this.onControl = onControl;
      this.onInput = onInput;

      window.addEventListener('keydown', e => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
        if (e.code === 'Escape') { e.preventDefault(); if (!e.repeat) onControl('pause'); return; }
        if (e.code === 'KeyM' && !e.repeat) { onControl('mute'); return; }
        if (!this.active) return;
        if (TRACKED.includes(e.code)) {
          e.preventDefault();
          if (!this.keys.has(e.code)) {
            this.pressed.add(e.code);
            onInput(e.timeStamp, e.code);
          }
          this.keys.add(e.code);
        }
      });

      window.addEventListener('keyup', e => this.keys.delete(e.code));
      window.addEventListener('keydown', e => {
        if (this.active && e.code === 'Tab') { e.preventDefault(); this.clear(); onControl('pause'); }
      });

      canvas.addEventListener('pointerdown', e => {
        if (!this.active) return;
        e.preventDefault();
        canvas.focus({ preventScroll: true });
        this.aimFace = K.pointerFace ? K.pointerFace(e.clientX) : 0;
        if (e.button === 0) { this.mouse = true; this.pressed.add('MouseLeft'); onInput(e.timeStamp, 'MouseLeft'); }
        if (e.button === 1) { this.pressed.add('KeyU'); onInput(e.timeStamp, 'MouseMiddle'); }
        if (e.button === 2) { this.pressed.add('KeyL'); onInput(e.timeStamp, 'MouseRight'); }
      });

      window.addEventListener('pointerup', () => this.mouse = false);
      canvas.addEventListener('contextmenu', e => e.preventDefault());
      canvas.addEventListener('pointermove', e => {
        if (this.active && this.mouse) this.aimFace = K.pointerFace ? K.pointerFace(e.clientX) : 0;
      });
      window.addEventListener('blur', () => { this.clear(); onControl('blur'); });
      document.addEventListener('visibilitychange', () => { if (document.hidden) { this.clear(); onControl('blur'); } });
    }

    pressVirtual(code, down) {
      if (!this.active) return;
      if (down) {
        if (!this.virtual.has(code)) {
          this.pressed.add(code);
          this.onInput?.(performance.now(), code);
        }
        this.virtual.add(code);
      } else {
        this.virtual.delete(code);
      }
    }

    clear() {
      this.keys.clear();
      this.pressed.clear();
      this.virtual.clear();
      this.mouse = false;
      this.aimFace = 0;
    }

    setActive(v) { if (v !== this.active) this.clear(); this.active = v; }

    read() {
      const k = (...ks) => ks.some(q => this.keys.has(q) || this.virtual.has(q));
      const p = (...ks) => ks.some(q => this.pressed.has(q));
      const a = {
        left: k('KeyA', 'ArrowLeft'),
        right: k('KeyD', 'ArrowRight'),
        down: k('KeyS', 'ArrowDown'),
        jump: k('Space', 'KeyW', 'ArrowUp'),
        jumpPressed: p('Space', 'KeyW', 'ArrowUp'),
        attack: k('KeyJ') || p('KeyJ', 'MouseLeft') || this.mouse,
        attackPressed: p('KeyJ', 'MouseLeft'),
        dashPressed: p('KeyK', 'ShiftLeft', 'ShiftRight'),
        clonePressed: p('KeyL'),
        heavyPressed: p('KeyU', 'KeyR'),
        stancePressed: p('KeyQ'),
        immobPressed: p('KeyF'),
        parryPressed: p('KeyC'),
        interactPressed: p('KeyE'),
        aimFace: this.mouse || p('MouseLeft') ? this.aimFace : 0
      };
      this.pressed.clear();
      return a;
    }
  };
})(globalThis.Kong ||= {});
