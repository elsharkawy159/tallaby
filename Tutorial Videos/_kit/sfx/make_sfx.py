"""Makes the five tutorial sounds (TUTORIALS.md section 5).

Run:  python make_sfx.py
Writes pop.wav, tap.wav, key.wav, whoosh.wav and success.wav next to this file
(48 kHz, 16-bit, stereo). Pure Python, no packages needed. The output is the same
on every run (fixed random seed), so every tutorial sounds the same.

Rules the sounds follow (owner, 2026-11-17: simple, low volume, not bold): one
plain soft tone each, no layered notes or noise bursts, a 5-10 ms fade-in, no
harsh highs, and every peak at or under -18 dBFS. PEAK_DB below is each sound's peak; change a value and run
again to make one sound louder or quieter in every future video.
"""

import math
import os
import random
import struct
import wave

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))

# Peak of each file in dBFS. Quiet on purpose: the sounds are a light touch, not events.
PEAK_DB = {
    "pop": -22.0,
    "tap": -20.0,
    "key": -30.0,
    "whoosh": -28.0,
    "success": -18.0,
}


def fade_in(samples, ms):
    n = min(len(samples), int(SR * ms / 1000))
    for i in range(n):
        samples[i] *= 0.5 - 0.5 * math.cos(math.pi * i / n)
    return samples


def fade_out(samples, ms):
    n = min(len(samples), int(SR * ms / 1000))
    for i in range(n):
        samples[-1 - i] *= 0.5 - 0.5 * math.cos(math.pi * i / n)
    return samples


def lowpass(samples, cutoff):
    """One-pole low-pass, run twice: takes the harsh highs off."""
    a = 1.0 - math.exp(-2.0 * math.pi * cutoff / SR)
    for _ in range(2):
        y = 0.0
        for i, x in enumerate(samples):
            y += a * (x - y)
            samples[i] = y
    return samples


def normalize(samples, peak_db):
    peak = max(abs(s) for s in samples) or 1.0
    gain = (10 ** (peak_db / 20.0)) / peak
    return [s * gain for s in samples]


def write(name, samples):
    samples = normalize(samples, PEAK_DB[name])
    path = os.path.join(HERE, name + ".wav")
    with wave.open(path, "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        frames = bytearray()
        for s in samples:
            v = int(max(-1.0, min(1.0, s)) * 32767)
            frames += struct.pack("<hh", v, v)
        f.writeframes(bytes(frames))
    print(f"{name}.wav  {len(samples) / SR * 1000:.0f} ms  peak {PEAK_DB[name]} dBFS")


def pop():
    """Title card: one short, soft, round tone."""
    n = int(SR * 0.14)
    out = []
    for i in range(n):
        t = i / SR
        out.append(math.exp(-t / 0.045) * math.sin(2 * math.pi * 392 * t))
    return fade_out(fade_in(lowpass(out, 2400), 8), 40)


def tap():
    """Tap marker: a very short, low, soft touch."""
    n = int(SR * 0.08)
    out = []
    for i in range(n):
        t = i / SR
        out.append(math.exp(-t / 0.02) * math.sin(2 * math.pi * 240 * t))
    return fade_out(fade_in(lowpass(out, 2000), 6), 25)


def key():
    """Typing: one tiny, dull tick, barely there."""
    n = int(SR * 0.035)
    out = []
    for i in range(n):
        t = i / SR
        out.append(math.exp(-t / 0.008) * math.sin(2 * math.pi * 520 * t))
    return fade_out(fade_in(lowpass(out, 1800), 5), 12)


def whoosh():
    """Step change: a faint breath of air, about 0.3 s."""
    rnd = random.Random(21)
    n = int(SR * 0.3)
    out = [(rnd.random() * 2 - 1) * math.sin(math.pi * i / n) ** 2 for i in range(n)]
    return fade_out(fade_in(lowpass(out, 700), 10), 80)


def success():
    """Result: one soft note that fades away."""
    n = int(SR * 0.6)
    out = []
    for i in range(n):
        t = i / SR
        out.append(math.exp(-t / 0.16) * math.sin(2 * math.pi * 659.25 * t))
    return fade_out(fade_in(lowpass(out, 3000), 10), 120)


if __name__ == "__main__":
    write("pop", pop())
    write("tap", tap())
    write("key", key())
    write("whoosh", whoosh())
    write("success", success())
