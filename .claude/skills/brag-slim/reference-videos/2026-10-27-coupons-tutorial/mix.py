# Places voiceover chunks on the 36 s timeline, ducks the music ~11 dB under the voice, adds SFX.
# Output: mix_raw.wav (then loudness-normalised with ffmpeg loudnorm).
import json, wave
import numpy as np

SR = 48000
DUR = 36.0
N = int(SR * DUR)

def read(path):
    with wave.open(path, "rb") as w:
        ch, sr, n = w.getnchannels(), w.getframerate(), w.getnframes()
        x = np.frombuffer(w.readframes(n), dtype="<i2").astype(np.float64) / 32768
    assert sr == SR, sr
    x = x.reshape(-1, ch)
    if ch == 1: x = np.repeat(x, 2, axis=1)
    return x

vo_take = read("vo/take1.wav")
chunks = json.load(open("vo_chunks.json"))
vo = np.zeros((N, 2))
for c in chunks:
    a, b = int(c["from"] * SR), int(c["to"] * SR)
    seg = vo_take[a:b].copy()
    f = int(0.012 * SR)
    seg[:f] *= np.linspace(0, 1, f)[:, None]; seg[-f:] *= np.linspace(1, 0, f)[:, None]
    i = int(c["at"] * SR)
    vo[i:i + len(seg)] += seg[: N - i]

music = read("music.wav")[:N]
sfx = read("sfx.wav")[:N]

# sidechain envelope from the voice
lvl = np.abs(vo).max(axis=1)
win = int(0.03 * SR)
lvl = np.convolve(lvl, np.ones(win) / win, mode="same")
active = (lvl > 0.01).astype(float)
# attack 60 ms, release 350 ms
g = np.zeros(N); state = 0.0
att = 1 - np.exp(-1 / (0.06 * SR)); rel = 1 - np.exp(-1 / (0.35 * SR))
for i in range(N):
    tgt = active[i]
    state += (tgt - state) * (att if tgt > state else rel)
    g[i] = state
duck_db = -11.0
gain = 10 ** (duck_db * g / 20)

mix = music * 0.55 * gain[:, None] + vo * 1.0 + sfx * 0.35  # owner 2026-10-27: SFX lower (was 0.9)
peak = np.abs(mix).max()
mix = mix / peak * 0.89
with wave.open("mix_raw.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
with wave.open("vo_track.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(vo, -1, 1) * 32767).astype("<i2").tobytes())
print("mixed; peak before norm", round(peak, 3))
