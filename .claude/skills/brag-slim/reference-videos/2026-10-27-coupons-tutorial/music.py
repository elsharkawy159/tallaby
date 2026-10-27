# Original music bed + SFX for the Tallaby coupons tutorial (numpy only).
# Egyptian maqsum doum-tak at 108 BPM, warm pad (D minor-ish Hijaz colour), soft bass.
# Writes music.wav (bed) and sfx.wav (UI sounds) at 48 kHz stereo float.
import json, sys, wave
import numpy as np

SR = 48000
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 35.0
BPM = 108.0
BEAT = 60.0 / BPM
N = int(SR * DUR)
rng = np.random.default_rng(7)

def env(n, a, d, s=0.0, r=0.0):
    t = np.arange(n) / SR
    e = np.ones(n)
    ai = int(a * SR); e[:ai] = np.linspace(0, 1, max(ai, 1))[:ai]
    e[ai:] = np.exp(-(t[ai:] - a) / max(d, 1e-4)) * (1 - s) + s
    return e

def add(buf, x, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(x), 0] += x * gain * l
    buf[i:i + len(x), 1] += x * gain * r

def doum():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 62 + 70 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.16)

def tak():
    n = int(0.12 * SR); t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    tone = np.sin(2 * np.pi * 420 * t) * 0.5
    x = (noise * 0.6 + tone) * env(n, 0.001, 0.025)
    return np.convolve(x, np.ones(6) / 6, mode="same")

def ka():
    return tak() * 0.45

def note(freq, dur, kind="pad"):
    n = int(dur * SR); t = np.arange(n) / SR
    if kind == "pad":
        x = sum(np.sin(2 * np.pi * freq * m * t + m) / (m ** 1.6) for m in range(1, 6))
        x += 0.6 * np.sin(2 * np.pi * freq * 1.003 * t)
        e = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.8).clip(0, 1)
        return x * e * 0.25
    if kind == "bass":
        x = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * 2 * freq * t)
        return x * env(n, 0.01, 0.35, 0.25) * np.minimum(1, (dur - t) / 0.05).clip(0, 1)
    if kind == "pluck":
        x = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * 2 * freq * t) + 0.12 * np.sin(2 * np.pi * 3 * freq * t)
        return x * env(n, 0.003, 0.22)
    raise ValueError(kind)

hz = lambda m: 440 * 2 ** ((m - 69) / 12)
bed = np.zeros((N, 2))

# Chords every 2 bars (8 beats): Dm  Bb  C  Dm (A hijaz flavour on the plucks)
prog = [[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [50, 57, 62, 66]]
bar = 4 * BEAT
t = 0.0; ci = 0
while t < DUR:
    ch = prog[ci % 4]
    for m in ch[1:]:
        add(bed, note(hz(m + 12), 2 * bar + 0.6), t, 0.10, pan=(m % 5 - 2) / 4)
    for b in range(8):
        tb = t + b * BEAT
        if b % 2 == 0:
            add(bed, note(hz(ch[0] - 12), BEAT * 1.6, "bass"), tb, 0.30)
    t += 2 * bar; ci += 1

# Maqsum: D T . T D . T . (eighths) per bar
pattern = ["D", "T", None, "T", "D", None, "T", None]
t = 0.0
while t < DUR:
    for i, p in enumerate(pattern):
        tt = t + i * BEAT / 2
        if p == "D": add(bed, doum(), tt, 0.55)
        elif p == "T": add(bed, tak(), tt, 0.22, pan=0.25)
        else: add(bed, ka(), tt, 0.10, pan=-0.3)
    t += bar

# Hijaz pluck motif on the off-bars (D Eb F# G A)
motif = [62, 63, 66, 67, 69, 67, 66, 63]
t = 2 * bar
while t < DUR - bar:
    for i, m in enumerate(motif):
        add(bed, note(hz(m + 12), 0.5, "pluck"), t + i * BEAT / 2, 0.06, pan=0.35)
    t += 4 * bar

# gentle fade in / out
fi = int(0.25 * SR); fo = int(1.5 * SR)
bed[:fi] *= np.linspace(0, 1, fi)[:, None]
bed[-fo:] *= np.linspace(1, 0, fo)[:, None]

# ---- SFX from cue list
cues = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else []
sfx = np.zeros((N, 2))
def whoosh():
    n = int(0.45 * SR); x = rng.standard_normal(n)
    k = np.linspace(0, 1, n)
    e = np.sin(np.pi * k) ** 2
    y = np.convolve(x, np.ones(40) / 40, mode="same") * e
    return y * 3
def tapsnd():
    n = int(0.06 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1800 * t) * 0.5 + rng.standard_normal(n) * 0.3) * env(n, 0.001, 0.012)
def key():
    n = int(0.035 * SR); t = np.arange(n) / SR
    return (rng.standard_normal(n) * 0.5 + np.sin(2 * np.pi * 2600 * t) * 0.3) * env(n, 0.0005, 0.008)
def chime():
    out = np.zeros(int(0.9 * SR))
    for j, m in enumerate([74, 78, 81]):
        x = note(hz(m), 0.9 - j * 0.08, "pluck") * 0.8
        out[int(j * 0.08 * SR): int(j * 0.08 * SR) + len(x)] += x
    return out
def bell():
    n = int(1.6 * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * hz(86) * r * t) * a for r, a in [(1, 1), (2.76, 0.4), (5.4, 0.2)])
    return x * env(n, 0.002, 0.6)
lib = {"whoosh": (whoosh, 0.10), "tap": (tapsnd, 0.22), "key": (key, 0.10), "chime": (chime, 0.20), "bell": (bell, 0.18)}
for c in cues:
    fn, g = lib[c["k"]]
    add(sfx, fn(), c["t"], g * c.get("g", 1.0), pan=c.get("p", 0.0))

def write(path, x):
    x = np.clip(x, -1, 1)
    pcm = (x * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

peak = np.abs(bed).max(); bed = bed / peak * 0.7
write("music.wav", bed)
write("sfx.wav", sfx)
print("ok", DUR, "beat", BEAT)
