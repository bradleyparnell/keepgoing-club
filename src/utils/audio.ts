// Brain.fm-style neural entrainment audio engine.
// All sound is generated via Web Audio API — no external files.
// Uses amplitude modulation (AM) at neural entrainment frequencies layered
// over soft sine-wave chord pads and pink noise, similar to Brain.fm.

export type BeatMode = 'gamma' | 'alpha' | 'theta' | 'binaural' | 'lofi' | 'ceo';

export interface ModeInfo {
  name: string;
  hz: number;
  tagline: string;
  desc: string;
  hzLabel: string;
}

export const MODE_META: Record<BeatMode, ModeInfo> = {
  gamma: {
    name: 'GAMMA FOCUS',
    hz: 40,
    hzLabel: '40Hz',
    tagline: 'Peak cognition. Total lock-in.',
    desc: 'Soft Am pads with 40Hz amplitude modulation. Primes gamma brainwaves for sharp, razor-focused thought. The frequency of flow.',
  },
  alpha: {
    name: 'ALPHA FLOW',
    hz: 10,
    hzLabel: '10Hz',
    tagline: 'Relaxed. Alert. Unstoppable.',
    desc: 'Warm Fmaj7 harmonics with a gentle 10Hz pulse — the sweet spot between calm and driven. Sustained attention for long sessions.',
  },
  theta: {
    name: 'THETA DEEP',
    hz: 6,
    hzLabel: '6Hz',
    tagline: 'Immersed. Creative. Present.',
    desc: 'Deep Em drones with slow 6Hz entrainment. Hypnotic immersion for creative work, writing, and complex problem-solving.',
  },
  binaural: {
    name: 'BETA BINAURAL',
    hz: 18,
    hzLabel: '18Hz',
    tagline: 'Alert. Sharp. Decisive.',
    desc: '18Hz binaural beats for peak beta state. Left ear 200Hz, right ear 218Hz — the brain produces an 18Hz beat. Headphones required.',
  },
  lofi: {
    name: 'LOFI RAIN',
    hz: 0,
    hzLabel: '80 BPM',
    tagline: 'Beats. Rain. Total calm.',
    desc: 'Classic lofi hip-hop rhythm — soft kick & hihat at 80 BPM — layered over warm Cmaj9 pads and rain ambience. Like a productive rainy afternoon.',
  },
  ceo: {
    name: 'CEO FLOW',
    hz: 0,
    hzLabel: 'Cinematic',
    tagline: 'Build empires. Stay locked.',
    desc: 'Cinematic Dmaj chord pads with a slow 60 BPM heartbeat pulse and a deep bass drone. Epic, driving, focused. The soundtrack of big decisions.',
  },
};

// Paul Kellet's "economy" pink noise approximation
function buildPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = sr * 10; // 10-second looping buffer
  const buf = ctx.createBuffer(2, len, sr); // stereo
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616  * b5 - w * 0.0168980;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  return buf;
}

// Silent MP3 (1 second, 8kHz mono) as a data URI.
// Playing this as an <audio> element registers the page as an audio source
// with iOS/Android, which keeps the Web Audio API alive through screen lock.
const SILENT_MP3 =
  'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZFRlYW0gLyBMYXVyZW5zIEhvbGxhYW5kZXIAVFhYWAAAABkAAANTb2Z0d2FyZQBMYXZjNTguMTMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DECwAAAkgAAAAAvVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

class NeuralAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private _playing = false;
  private _volume = 0.35;
  private _track: BeatMode = 'gamma';
  private _noiseBuf: AudioBuffer | null = null;
  private _silentAudio: HTMLAudioElement | null = null;
  private _rhythmTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Resume AudioContext whenever the page becomes visible again (screen unlock)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this._playing) {
        if (this.ctx) this.ctx.resume().catch(() => {});
        // Also nudge the silent audio back to playing (iOS may have paused it)
        if (this._silentAudio && this._silentAudio.paused) {
          this._silentAudio.play().catch(() => {});
        }
      }
    });
  }

  private ensureSilentAudio(): void {
    if (this._silentAudio) return;
    const audio = new Audio(SILENT_MP3);
    audio.loop = true;
    audio.volume = 0.001;          // effectively silent
    (audio as any).playsInline = true; // iOS: don't fullscreen the audio element
    this._silentAudio = audio;
  }

  // Register a MediaSession with iOS/Android so the OS treats this page
  // as an active media source — keeps WebAudio alive through screen lock.
  private registerMediaSession(): void {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Neural Focus Audio',
      artist: 'Keep Going',
      album: 'keepgoing.club',
    });
    // Provide no-op handlers so iOS doesn't kill the session
    navigator.mediaSession.setActionHandler('play',  () => { this.ctx?.resume(); });
    navigator.mediaSession.setActionHandler('pause', () => { /* keep running */ });
  }

  // Call this from a raw touchstart/click handler to satisfy mobile AudioContext policy
  unlock(): void {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._volume;
      this.masterGain.connect(this.ctx.destination);
      this._noiseBuf = null;
    }
    const state = this.ctx.state as string;
    if (state === 'suspended' || state === 'interrupted') {
      this.ctx.resume().catch(() => {});
    }
  }

  private ensureCtx(): AudioContext {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._volume;
      this.masterGain.connect(this.ctx.destination);
      this._noiseBuf = null;
    }
    const state = this.ctx.state as string;
    if (state === 'suspended' || state === 'interrupted') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  private keep<T extends AudioNode>(n: T): T {
    this.activeNodes.push(n);
    return n;
  }

  private getPinkNoise(ctx: AudioContext): AudioBuffer {
    if (!this._noiseBuf) this._noiseBuf = buildPinkNoiseBuffer(ctx);
    return this._noiseBuf;
  }

  // Adds a gentle pink noise floor (warm, not harsh)
  private addNoise(ctx: AudioContext, level: number): void {
    const src = this.keep(ctx.createBufferSource() as AudioBufferSourceNode);
    (src as AudioBufferSourceNode).buffer = this.getPinkNoise(ctx);
    (src as AudioBufferSourceNode).loop = true;
    const lpf = this.keep(ctx.createBiquadFilter());
    (lpf as BiquadFilterNode).type = 'lowpass';
    (lpf as BiquadFilterNode).frequency.value = 900;
    const g = this.keep(ctx.createGain());
    (g as GainNode).gain.setValueAtTime(0, ctx.currentTime);
    (g as GainNode).gain.linearRampToValueAtTime(level, ctx.currentTime + 2.5);
    (src as AudioBufferSourceNode).connect(lpf as BiquadFilterNode);
    (lpf as BiquadFilterNode).connect(g as GainNode);
    (g as GainNode).connect(this.masterGain!);
    (src as AudioBufferSourceNode).start();
  }

  // Core method: sine chord pads with AM entrainment modulation.
  // Uses a two-gain approach so AM always oscillates around 1.0 (no phase inversion).
  //   freqs      — chord frequencies in Hz
  //   padGain    — base volume for loudest note
  //   filterFreq — lowpass filter center frequency
  //   entrainHz  — AM modulation frequency (the neural entrainment target)
  //   amDepth    — modulation depth (0–0.5). 0.05–0.15 is subtle; 0.15–0.25 is noticeable.
  private addChordWithAM(
    ctx: AudioContext,
    freqs: number[],
    padGain: number,
    filterFreq: number,
    entrainHz: number,
    amDepth: number,
  ): void {
    const now = ctx.currentTime;

    // Shared AM oscillator — modulates every note in the chord together
    const amOsc = this.keep(ctx.createOscillator() as OscillatorNode);
    (amOsc as OscillatorNode).type = 'sine';
    (amOsc as OscillatorNode).frequency.value = entrainHz;
    const amScale = this.keep(ctx.createGain());
    (amScale as GainNode).gain.value = amDepth; // scales [-1,1] → [-amDepth, +amDepth]
    (amOsc as OscillatorNode).connect(amScale as GainNode);
    (amOsc as OscillatorNode).start();

    freqs.forEach((freq, i) => {
      // Two subtly detuned sines per note → gentle natural chorus, not game-y
      const o1 = this.keep(ctx.createOscillator() as OscillatorNode);
      const o2 = this.keep(ctx.createOscillator() as OscillatorNode);
      (o1 as OscillatorNode).type = 'sine';
      (o2 as OscillatorNode).type = 'sine';
      (o1 as OscillatorNode).frequency.value = freq * 0.9993; // 0.07% flat
      (o2 as OscillatorNode).frequency.value = freq * 1.0007; // 0.07% sharp

      // Warm lowpass — keeps it smooth and non-digital
      const lpf = this.keep(ctx.createBiquadFilter());
      (lpf as BiquadFilterNode).type = 'lowpass';
      (lpf as BiquadFilterNode).frequency.value = filterFreq;
      (lpf as BiquadFilterNode).Q.value = 0.45;

      // Very slow filter LFO — each voice evolves at a slightly different rate
      // This creates the gentle "breathing" quality of Brain.fm audio
      const fLfo = this.keep(ctx.createOscillator() as OscillatorNode);
      (fLfo as OscillatorNode).type = 'sine';
      (fLfo as OscillatorNode).frequency.value = 0.035 + i * 0.011; // ~28–40s cycle
      const fLfoG = this.keep(ctx.createGain());
      (fLfoG as GainNode).gain.value = filterFreq * 0.22; // sweep ±22% of filter freq
      (fLfo as OscillatorNode).connect(fLfoG as GainNode);
      (fLfoG as GainNode).connect((lpf as BiquadFilterNode).frequency);
      (fLfo as OscillatorNode).start();

      // Fade-in gain (volume ramp so audio starts gently)
      const fadeG = this.keep(ctx.createGain());
      const vol = padGain * Math.pow(0.80, i); // higher harmonics slightly quieter
      (fadeG as GainNode).gain.setValueAtTime(0, now);
      (fadeG as GainNode).gain.linearRampToValueAtTime(vol, now + 3.5 + i * 0.5);

      // AM gain node — sits downstream of fade, oscillates around 1.0
      // Actual gain = 1.0 + amScale_output = 1.0 ± amDepth (always positive)
      const amG = this.keep(ctx.createGain());
      (amG as GainNode).gain.value = 1.0;
      (amScale as GainNode).connect((amG as GainNode).gain); // AM modulation

      (o1 as OscillatorNode).connect(lpf as BiquadFilterNode);
      (o2 as OscillatorNode).connect(lpf as BiquadFilterNode);
      (lpf as BiquadFilterNode).connect(fadeG as GainNode);
      (fadeG as GainNode).connect(amG as GainNode);
      (amG as GainNode).connect(this.masterGain!);
      (o1 as OscillatorNode).start();
      (o2 as OscillatorNode).start();
    });
  }

  // ── Mode implementations ──────────────────────────────────────────────────

  // GAMMA FOCUS — 40Hz AM over A minor chord
  // Am: A2 (110), E3 (164.8), A3 (220), C4 (261.6)
  // 40Hz is perceptible as a subtle "texture" or shimmer, not distinct pulses.
  private startGamma(ctx: AudioContext): void {
    this.addChordWithAM(ctx, [110, 164.8, 220, 261.6], 0.18, 580, 40, 0.09);
    // Sub bass drone — grounding, deepens focus
    const sub = this.keep(ctx.createOscillator() as OscillatorNode);
    (sub as OscillatorNode).type = 'sine';
    (sub as OscillatorNode).frequency.value = 55; // A1
    const subG = this.keep(ctx.createGain());
    (subG as GainNode).gain.setValueAtTime(0, ctx.currentTime);
    (subG as GainNode).gain.linearRampToValueAtTime(0.06, ctx.currentTime + 4);
    (sub as OscillatorNode).connect(subG as GainNode);
    (subG as GainNode).connect(this.masterGain!);
    (sub as OscillatorNode).start();
    this.addNoise(ctx, 0.032);
  }

  // ALPHA FLOW — 10Hz AM over Fmaj7 chord
  // Fmaj7: F3 (174.6), A3 (220), C4 (261.6), E4 (329.6)
  // 10Hz is perceptible as a gentle rhythmic swell — calming but alert.
  private startAlpha(ctx: AudioContext): void {
    this.addChordWithAM(ctx, [174.6, 220, 261.6, 329.6], 0.16, 650, 10, 0.12);
    // Add an octave-down F2 root for warmth
    const root = this.keep(ctx.createOscillator() as OscillatorNode);
    (root as OscillatorNode).type = 'sine';
    (root as OscillatorNode).frequency.value = 87.3; // F2
    const rootLfo = this.keep(ctx.createOscillator() as OscillatorNode);
    (rootLfo as OscillatorNode).frequency.value = 0.08; // gentle vibrato
    const rootLfoG = this.keep(ctx.createGain());
    (rootLfoG as GainNode).gain.value = 0.6;
    (rootLfo as OscillatorNode).connect(rootLfoG as GainNode);
    (rootLfoG as GainNode).connect((root as OscillatorNode).frequency);
    const rootG = this.keep(ctx.createGain());
    (rootG as GainNode).gain.setValueAtTime(0, ctx.currentTime);
    (rootG as GainNode).gain.linearRampToValueAtTime(0.055, ctx.currentTime + 4);
    (root as OscillatorNode).connect(rootG as GainNode);
    (rootG as GainNode).connect(this.masterGain!);
    (root as OscillatorNode).start();
    (rootLfo as OscillatorNode).start();
    this.addNoise(ctx, 0.024);
  }

  // THETA DEEP — 6Hz AM over E minor chord (low register)
  // Em: E2 (82.4), B2 (123.5), E3 (164.8), G3 (196)
  // 6Hz is a slow, hypnotic swell — the meditative "deep work" state.
  private startTheta(ctx: AudioContext): void {
    this.addChordWithAM(ctx, [82.4, 123.5, 164.8, 196], 0.20, 480, 6, 0.16);
    // Very low sub E1 drone for depth
    const drone = this.keep(ctx.createOscillator() as OscillatorNode);
    (drone as OscillatorNode).type = 'sine';
    (drone as OscillatorNode).frequency.value = 41.2; // E1
    const droneLfo = this.keep(ctx.createOscillator() as OscillatorNode);
    (droneLfo as OscillatorNode).frequency.value = 0.05;
    const droneLfoG = this.keep(ctx.createGain());
    (droneLfoG as GainNode).gain.value = 0.4;
    (droneLfo as OscillatorNode).connect(droneLfoG as GainNode);
    (droneLfoG as GainNode).connect((drone as OscillatorNode).frequency);
    const droneG = this.keep(ctx.createGain());
    (droneG as GainNode).gain.setValueAtTime(0, ctx.currentTime);
    (droneG as GainNode).gain.linearRampToValueAtTime(0.07, ctx.currentTime + 5);
    (drone as OscillatorNode).connect(droneG as GainNode);
    (droneG as GainNode).connect(this.masterGain!);
    (drone as OscillatorNode).start();
    (droneLfo as OscillatorNode).start();
    this.addNoise(ctx, 0.018);
  }

  // BINAURAL BETA — 18Hz binaural beats (headphones required)
  // Left ear: 200Hz carrier. Right ear: 218Hz carrier.
  // The brain produces an 18Hz "beat" (beta state) from the difference.
  // Backed by a gentle ambient Am pad to reduce ear fatigue.
  private startBinaural(ctx: AudioContext): void {
    const now = ctx.currentTime;

    // Stereo channel merger for the binaural carriers
    const merger = this.keep(ctx.createChannelMerger(2));
    (merger as ChannelMergerNode).connect(this.masterGain!);

    // Left channel — 200Hz carrier
    const leftOsc = this.keep(ctx.createOscillator() as OscillatorNode);
    (leftOsc as OscillatorNode).type = 'sine';
    (leftOsc as OscillatorNode).frequency.value = 200;
    const leftG = this.keep(ctx.createGain());
    (leftG as GainNode).gain.setValueAtTime(0, now);
    (leftG as GainNode).gain.linearRampToValueAtTime(0.09, now + 2.5);
    (leftOsc as OscillatorNode).connect(leftG as GainNode);
    (leftG as GainNode).connect(merger as ChannelMergerNode, 0, 0); // → L
    (leftOsc as OscillatorNode).start();

    // Right channel — 218Hz carrier (difference = 18Hz beta beat)
    const rightOsc = this.keep(ctx.createOscillator() as OscillatorNode);
    (rightOsc as OscillatorNode).type = 'sine';
    (rightOsc as OscillatorNode).frequency.value = 218;
    const rightG = this.keep(ctx.createGain());
    (rightG as GainNode).gain.setValueAtTime(0, now);
    (rightG as GainNode).gain.linearRampToValueAtTime(0.09, now + 2.5);
    (rightOsc as OscillatorNode).connect(rightG as GainNode);
    (rightG as GainNode).connect(merger as ChannelMergerNode, 0, 1); // → R
    (rightOsc as OscillatorNode).start();

    // Background Am pad — soft sine layer to reduce carrier tone fatigue
    const padFreqs = [110, 164.8, 220]; // A2, E3, A3
    padFreqs.forEach((freq, i) => {
      const o = this.keep(ctx.createOscillator() as OscillatorNode);
      (o as OscillatorNode).type = 'sine';
      (o as OscillatorNode).frequency.value = freq;
      const lpf = this.keep(ctx.createBiquadFilter());
      (lpf as BiquadFilterNode).type = 'lowpass';
      (lpf as BiquadFilterNode).frequency.value = 420;
      const g = this.keep(ctx.createGain());
      (g as GainNode).gain.setValueAtTime(0, now);
      (g as GainNode).gain.linearRampToValueAtTime(0.055 - i * 0.012, now + 4);
      (o as OscillatorNode).connect(lpf as BiquadFilterNode);
      (lpf as BiquadFilterNode).connect(g as GainNode);
      (g as GainNode).connect(this.masterGain!);
      (o as OscillatorNode).start();
    });

    this.addNoise(ctx, 0.03);
  }

  // ── LOFI helpers ─────────────────────────────────────────────────────────

  private scheduleKick(ctx: AudioContext, t: number): void {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.07);
    g.gain.setValueAtTime(0.85, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    osc.connect(g);
    g.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.42);
  }

  private scheduleHihat(ctx: AudioContext, t: number, open: boolean): void {
    const dur    = open ? 0.16 : 0.035;
    const bufLen = Math.ceil(ctx.sampleRate * (dur + 0.01));
    const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d      = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 7500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(open ? 0.10 : 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(hpf);
    hpf.connect(g);
    g.connect(this.masterGain!);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private scheduleSnare(ctx: AudioContext, t: number): void {
    const dur    = 0.18;
    const bufLen = Math.ceil(ctx.sampleRate * dur);
    const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d      = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 1100;
    bpf.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.10, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(bpf);
    bpf.connect(g);
    g.connect(this.masterGain!);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  // Lofi rhythm scheduler — 80 BPM, 8th-note resolution
  private startLofiRhythm(ctx: AudioContext): void {
    const BPM    = 80;
    const eighth = 60 / BPM / 2; // 8th note in seconds
    let nextBeat = ctx.currentTime + 0.05;
    let step     = 0;

    const KICK_STEPS  = new Set([0, 4]);           // beats 1 & 3
    const SNARE_STEPS = new Set([2, 6]);            // beats 2 & 4
    const OPEN_STEPS  = new Set([3, 7]);            // open hihat on upbeats

    const tick = () => {
      if (!this._playing || this._track !== 'lofi') return;
      const lookAhead = 0.15;
      while (nextBeat < ctx.currentTime + lookAhead) {
        const s = step % 8;
        const human = (Math.random() - 0.5) * 0.007;
        const t = Math.max(ctx.currentTime, nextBeat + human);
        if (KICK_STEPS.has(s))  this.scheduleKick(ctx, t);
        if (SNARE_STEPS.has(s)) this.scheduleSnare(ctx, t);
        const skipHat = Math.random() < 0.08;
        if (!skipHat) this.scheduleHihat(ctx, t, OPEN_STEPS.has(s));
        nextBeat += eighth;
        step++;
      }
      this._rhythmTimer = setTimeout(tick, 50);
    };
    tick();
  }

  // LOFI RAIN — warm Cmaj9 pads + rain + 80 BPM rhythm
  private startLofi(ctx: AudioContext): void {
    // Warm Cmaj9 pad (C3 E3 G3 B3) — very gentle AM just for breathing feel
    this.addChordWithAM(ctx, [130.8, 164.8, 196.0, 246.9], 0.11, 580, 0.08, 0.02);
    // Heavy rain: pink noise through a steep lowpass
    this.addNoise(ctx, 0.065);
    // Sub bass C2 for warmth
    const sub = this.keep(ctx.createOscillator() as OscillatorNode);
    (sub as OscillatorNode).type = 'sine';
    (sub as OscillatorNode).frequency.value = 65.4; // C2
    const subG = this.keep(ctx.createGain());
    (subG as GainNode).gain.setValueAtTime(0, ctx.currentTime);
    (subG as GainNode).gain.linearRampToValueAtTime(0.04, ctx.currentTime + 3);
    (sub as OscillatorNode).connect(subG as GainNode);
    (subG as GainNode).connect(this.masterGain!);
    (sub as OscillatorNode).start();
    // Kick in the beat after pads have started
    setTimeout(() => {
      if (this._playing && this._track === 'lofi') this.startLofiRhythm(ctx);
    }, 2000);
  }

  // CEO FLOW — cinematic Dmaj pads + heartbeat pulse + deep bass
  private startCeo(ctx: AudioContext): void {
    // Big Dmaj chord: D3 F#3 A3 D4
    this.addChordWithAM(ctx, [146.8, 185.0, 220.0, 293.7], 0.17, 700, 0.25, 0.06);
    // Deep bass D2
    const bass = this.keep(ctx.createOscillator() as OscillatorNode);
    (bass as OscillatorNode).type = 'sine';
    (bass as OscillatorNode).frequency.value = 73.4; // D2
    const bassLfo = this.keep(ctx.createOscillator() as OscillatorNode);
    (bassLfo as OscillatorNode).frequency.value = 0.06;
    const bassLfoG = this.keep(ctx.createGain());
    (bassLfoG as GainNode).gain.value = 0.5;
    (bassLfo as OscillatorNode).connect(bassLfoG as GainNode);
    (bassLfoG as GainNode).connect((bass as OscillatorNode).frequency);
    const bassG = this.keep(ctx.createGain());
    (bassG as GainNode).gain.setValueAtTime(0, ctx.currentTime);
    (bassG as GainNode).gain.linearRampToValueAtTime(0.09, ctx.currentTime + 5);
    (bass as OscillatorNode).connect(bassG as GainNode);
    (bassG as GainNode).connect(this.masterGain!);
    (bass as OscillatorNode).start();
    (bassLfo as OscillatorNode).start();
    // Heartbeat — soft kick pulse at 60 BPM (1s interval)
    const BPM = 60;
    const interval = 60 / BPM;
    let nextPulse = ctx.currentTime + 2.5;
    const pulse = () => {
      if (!this._playing || this._track !== 'ceo') return;
      while (nextPulse < ctx.currentTime + 0.2) {
        this.scheduleKick(ctx, Math.max(ctx.currentTime + 0.005, nextPulse));
        nextPulse += interval;
      }
      this._rhythmTimer = setTimeout(pulse, 100);
    };
    setTimeout(pulse, 2400);
    // Light ambient noise floor
    this.addNoise(ctx, 0.018);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  start(track: BeatMode, volume: number): void {
    this.stop();
    this._volume = volume;
    this._track = track;
    const ctx = this.ensureCtx();
    this.masterGain!.gain.setValueAtTime(volume, ctx.currentTime);
    this._playing = true;
    // Auto-resume AudioContext if iOS suspends/interrupts it (e.g. phone call)
    ctx.addEventListener('statechange', () => {
      if (this._playing && (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted')) {
        ctx.resume().catch(() => {});
      }
    });
    // Start silent audio to keep iOS/Android audio session alive through lock screen
    this.ensureSilentAudio();
    this._silentAudio!.play().catch(() => {});
    // Register with OS media center — required for iOS lock screen keepalive
    this.registerMediaSession();
    switch (track) {
      case 'gamma':    this.startGamma(ctx);    break;
      case 'alpha':    this.startAlpha(ctx);    break;
      case 'theta':    this.startTheta(ctx);    break;
      case 'binaural': this.startBinaural(ctx); break;
      case 'lofi':     this.startLofi(ctx);     break;
      case 'ceo':      this.startCeo(ctx);      break;
    }
  }

  stop(): void {
    this._playing = false;
    if (this._rhythmTimer !== null) { clearTimeout(this._rhythmTimer); this._rhythmTimer = null; }
    // Stop the silent audio keepalive
    if (this._silentAudio) {
      this._silentAudio.pause();
      this._silentAudio.currentTime = 0;
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
    }
    const nodes = [...this.activeNodes];
    this.activeNodes = [];
    setTimeout(() => {
      nodes.forEach(n => {
        try {
          if ((n as OscillatorNode).stop)          (n as OscillatorNode).stop(0);
          if ((n as AudioBufferSourceNode).stop)   (n as AudioBufferSourceNode).stop(0);
          n.disconnect();
        } catch (_) { /* already stopped */ }
      });
    }, 500);
  }

  setVolume(v: number): void {
    this._volume = v;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    }
  }

  get isPlaying(): boolean { return this._playing; }
  get currentTrack(): BeatMode { return this._track; }
}

export const neuroBeat = new NeuralAudioEngine();
