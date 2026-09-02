"use client";

/** Default rider / short alert — replace by adding this file under public/. */
export const NOTIFICATION_SOUND_URL = "/sounds/notification.mp3";

/** Admin pending-queue alert — longer; replace by adding this file under public/. */
export const PENDING_NOTIFICATION_SOUND_URL = "/sounds/pending-notification.mp3";

let audioContext: AudioContext | null = null;
let unlocked = false;

const audioCache = new Map<string, HTMLAudioElement>();

function getCachedAudio(url: string): HTMLAudioElement {
  const cached = audioCache.get(url);
  if (cached) return cached;

  const audio = new Audio(url);
  audio.preload = "auto";
  audioCache.set(url, audio);
  return audio;
}

/** Unlock Web Audio + prime HTML Audio on first user gesture (autoplay policy). */
export function unlockNotificationAudio(): void {
  if (unlocked || typeof window === "undefined") return;

  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    getCachedAudio(NOTIFICATION_SOUND_URL).load();
    getCachedAudio(PENDING_NOTIFICATION_SOUND_URL).load();

    unlocked = true;
  } catch {
    // Audio unavailable — silently ignore.
  }
}

function playSynthBeepShort(): void {
  if (typeof window === "undefined") return;

  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    const ctx = audioContext;
    const now = ctx.currentTime;

    const playTone = (frequency: number, start: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(start);
      oscillator.stop(start + duration);
    };

    playTone(880, now, 0.1);
    playTone(1174.66, now + 0.12, 0.12);
  } catch {
    // Blocked or unsupported — no-op.
  }
}

/** ~1s three-tone chime when no MP3 is present. */
function playSynthBeepLong(): void {
  if (typeof window === "undefined") return;

  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    const ctx = audioContext;
    const now = ctx.currentTime;

    const playTone = (
      frequency: number,
      start: number,
      duration: number,
      volume = 0.28
    ) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(start);
      oscillator.stop(start + duration);
    };

    playTone(659.25, now, 0.18);
    playTone(783.99, now + 0.2, 0.18);
    playTone(987.77, now + 0.4, 0.28);
    playTone(783.99, now + 0.65, 0.22);
  } catch {
    // Blocked or unsupported — no-op.
  }
}

function playFromFile(url: string, fallback: () => void): void {
  if (typeof window === "undefined") return;

  try {
    const audio = getCachedAudio(url);
    audio.currentTime = 0;

    const playPromise = audio.play();
    if (!playPromise) {
      fallback();
      return;
    }

    playPromise.catch(() => {
      fallback();
    });
  } catch {
    fallback();
  }
}

/** Short alert for rider new assignments (~200ms synth fallback). */
export function playNotificationSound(): void {
  playFromFile(NOTIFICATION_SOUND_URL, playSynthBeepShort);
}

/** Longer alert for admin pending queue (~1s synth fallback). */
export function playPendingNotificationSound(): void {
  playFromFile(PENDING_NOTIFICATION_SOUND_URL, playSynthBeepLong);
}
