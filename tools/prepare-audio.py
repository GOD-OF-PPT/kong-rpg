"""Deterministic edits of the five ElevenLabs sources; requires ffmpeg and numpy.

No generation or network access. All recipe times are source seconds.
"""
import hashlib
import json
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'assets/audio-v6'
RATE = 32000
# id, source, start, maximum output length, speed, highpass, lowpass, peak
RECIPES = [
    ('staff-light-a', 'staff-light', 0, .23, 1, 100, 10500, .62),
    ('staff-light-b', 'staff-light', 0, .21, 1.06, 130, 10000, .59),
    ('staff-heavy', 'staff-heavy', 0, .38, 1, 55, 8500, .70),
    ('shield-block', 'shield-block', .934, .28, 1, 500, 11000, .55),
    ('ring-hit-a', 'ring-hit', 0, .29, 1, 380, 11500, .56),
    ('ring-hit-b', 'ring-hit', 0, .30, .94, 380, 11500, .54),
    ('ground-slam', 'staff-heavy', 0, .44, .82, 45, 3800, .72),
    ('ultimate-hit', 'ultimate-hit', 0, .55, 1, 50, 8000, .72),
]


def write_wav(path, samples):
    with wave.open(str(path), 'wb') as output:
        output.setparams((1, 2, RATE, len(samples), 'NONE', 'not compressed'))
        output.writeframes(np.round(np.clip(samples, -1, 1) * 32767).astype('<i2').tobytes())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


report = {'sampleRate': RATE, 'channels': 1, 'format': 'PCM16 WAV', 'assets': {}}
reel = []
for name, source, start, duration, speed, highpass, lowpass, peak in RECIPES:
    original = BASE / 'source' / (source + '.mp3')
    filters = f'highpass=f={highpass},lowpass=f={lowpass}'
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(original),
                                   '-af', filters, '-f', 'f32le', '-ac', '1', '-ar', str(RATE), 'pipe:1'])
    decoded = np.frombuffer(raw, dtype='<f4').astype(np.float64)
    positions = start * RATE + np.arange(round(duration * RATE)) * speed
    samples = np.interp(positions, np.arange(len(decoded)), decoded, left=0, right=0)
    samples -= samples.mean()
    # Keep the transient; taper the tail to avoid masking the next telegraph.
    fade_in = round(.0005 * RATE)
    samples[:fade_in] *= np.linspace(0, 1, fade_in)
    fade_from = round(len(samples) * (.30 if name in ('ultimate-hit', 'shield-block') else .55))
    samples[fade_from:] *= np.linspace(1, 0, len(samples) - fade_from) ** 1.7
    samples *= peak / max(float(np.max(np.abs(samples))), 1e-8)
    target = BASE / 'processed' / (name + '.wav')
    write_wav(target, samples)
    active = np.flatnonzero(np.abs(samples) > peak * .05)
    report['assets'][name] = {
        'file': target.relative_to(ROOT).as_posix(), 'sha256': digest(target),
        'source': source, 'sourceSha256': digest(original), 'sourceStart': start,
        'duration': duration, 'speed': speed, 'highpass': highpass, 'lowpass': lowpass,
        'peak': round(float(np.max(np.abs(samples))), 5),
        'rms': round(float(np.sqrt(np.mean(samples ** 2))), 5),
        'onsetMs': round(float(active[0]) / RATE * 1000, 3), 'fadeInMs': .5,
    }
    if not name.endswith('-b'):
        reel.extend([samples * .6, np.zeros(round(.55 * RATE))])

write_wav(BASE / 'impact-reel.wav', np.concatenate(reel))
(BASE / 'manifest.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf8')
print(json.dumps(report, indent=2))
