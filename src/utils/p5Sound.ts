export const SFX_STORAGE_KEY = 'aiu_p5r_sfx_enabled_v1';

let cachedSfxEnabled: boolean | null = null;
let audioCtx: AudioContext | null = null;

function readStoredSfx(): boolean {
  try {
    return window.localStorage.getItem(SFX_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function isSfxEnabled(): boolean {
  if (cachedSfxEnabled === null) {
    cachedSfxEnabled = readStoredSfx();
  }
  return cachedSfxEnabled;
}

export function setSfxEnabled(enabled: boolean): boolean {
  cachedSfxEnabled = enabled;
  try {
    window.localStorage.setItem(SFX_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage quota or private-browsing errors
  }
  return cachedSfxEnabled;
}

export function toggleSfx(): boolean {
  const next = !isSfxEnabled();
  setSfxEnabled(next);
  if (next) {
    playConfirm();
  }
  return next;
}

function getAudioContext(): AudioContext | null {
  if (!isSfxEnabled()) return null;
  try {
    if (!audioCtx) {
      const AudioCtor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtor) return null;
      audioCtx = new AudioCtor();
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playToneSequence(
  steps: Array<{
    freq: number;
    endFreq?: number;
    duration: number;
    delay?: number;
    gain: number;
    type: OscillatorType;
    filterHz?: number;
  }>
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const baseTime = ctx.currentTime;
    for (const step of steps) {
      const start = baseTime + (step.delay ?? 0);
      const end = start + step.duration;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = step.type;
      osc.frequency.setValueAtTime(step.freq, start);
      if (step.endFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(40, step.endFreq),
          end
        );
      }

      gainNode.gain.setValueAtTime(0.0001, start);
      gainNode.gain.linearRampToValueAtTime(step.gain, start + 0.006);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, end);

      if (step.filterHz) {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(step.filterHz, start);
        osc.connect(filter);
        filter.connect(gainNode);
      } else {
        osc.connect(gainNode);
      }

      gainNode.connect(ctx.destination);
      osc.start(start);
      osc.stop(end + 0.01);
    }
  } catch {
    // Ignore transient Web Audio API errors
  }
}

export function playSwitch(): void {
  playToneSequence([
    { freq: 520, endFreq: 780, duration: 0.055, gain: 0.065, type: 'triangle' },
  ]);
}

export function playOpen(): void {
  playToneSequence([
    { freq: 440, endFreq: 880, duration: 0.065, gain: 0.075, type: 'triangle' },
    {
      freq: 1320,
      duration: 0.04,
      delay: 0.04,
      gain: 0.045,
      type: 'sine',
    },
  ]);
}

export function playConfirm(): void {
  playToneSequence([
    {
      freq: 587.33,
      duration: 0.055,
      gain: 0.08,
      type: 'square',
      filterHz: 2400,
    },
    {
      freq: 880,
      duration: 0.085,
      delay: 0.045,
      gain: 0.085,
      type: 'triangle',
      filterHz: 2800,
    },
  ]);
}

export function playCancel(): void {
  playToneSequence([
    { freq: 520, endFreq: 280, duration: 0.08, gain: 0.07, type: 'triangle' },
  ]);
}
