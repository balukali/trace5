/**
 * Verdict feedback audio.
 *
 * A correct flag gets a short rising two-tone confirmation. A wrong one gets a
 * descending "fahhhh" buzz. Both are synthesised with the Web Audio API, so
 * there is no asset to download and nothing to ship in the bundle.
 *
 * Browsers refuse to start audio until the user has interacted with the page,
 * so callers must invoke this from a real user gesture (a click, a key press).
 * Every failure path is swallowed: audio is a nicety and must never break the
 * submission flow or leak an unhandled rejection.
 */

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context) {
    try {
      context = new Ctor();
    } catch {
      return null;
    }
  }
  // Autoplay policy can leave the context suspended until a gesture unlocks it.
  if (context.state === "suspended") void context.resume().catch(() => undefined);
  return context;
}

type Tone = { frequency: number; duration: number; delay: number; type: OscillatorType };

function play(ctx: AudioContext, tones: Tone[], gainPeak: number) {
  const start = ctx.currentTime;
  for (const tone of tones) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tone.type;
    osc.frequency.setValueAtTime(tone.frequency, start + tone.delay);

    // Ramp in and out so each tone does not click.
    const t0 = start + tone.delay;
    const t1 = t0 + tone.duration;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainPeak, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t1 + 0.02);
  }
}

/** Rising two-tone chime for an accepted flag. */
export function playCorrectSound() {
  try {
    const ctx = audioContext();
    if (!ctx) return;
    play(
      ctx,
      [
        { frequency: 660, duration: 0.12, delay: 0, type: "sine" },
        { frequency: 990, duration: 0.22, delay: 0.11, type: "sine" },
      ],
      0.18,
    );
  } catch {
    /* audio is optional */
  }
}

/** Descending buzz for a rejected flag. */
export function playWrongSound() {
  try {
    const ctx = audioContext();
    if (!ctx) return;
    play(
      ctx,
      [
        { frequency: 300, duration: 0.2, delay: 0, type: "square" },
        { frequency: 200, duration: 0.24, delay: 0.16, type: "square" },
        { frequency: 130, duration: 0.34, delay: 0.36, type: "sawtooth" },
      ],
      0.12,
    );
  } catch {
    /* audio is optional */
  }
}
