// Web Audio API and Web Speech API utilities for delightful, instant audio feedback

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playSuccessChime(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + idx * 0.08;
    const duration = 0.35;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  });
}

export function playRewardFanfare(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    { freq: 440.0, time: 0.0, dur: 0.15 },
    { freq: 554.37, time: 0.12, dur: 0.15 },
    { freq: 659.25, time: 0.24, dur: 0.2 },
    { freq: 880.0, time: 0.42, dur: 0.6 }
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + time;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.22, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + dur);
  });
}

export function playLevelUp(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const chord = [523.25, 659.25, 783.99, 1046.5, 1318.51];
  chord.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + i * 0.06;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.7);
  });
}

export function playClick(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const startTime = ctx.currentTime;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, startTime);
  osc.frequency.exponentialRampToValueAtTime(400, startTime + 0.04);

  gain.gain.setValueAtTime(0.08, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + 0.04);
}

export function playPenaltySound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    { freq: 392.0, time: 0.0, dur: 0.22 }, // G4
    { freq: 329.63, time: 0.16, dur: 0.35 } // E4
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + time;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.94, startTime + dur);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + dur);
  });
}

/**
 * 1. Tiếng "Tách/Nứt vỏ" và "Ting ting chúc mừng" khi quả trứng đạt mốc 50 sao và nở ra
 */
export function playEggCrackAndHatchSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Part A: 3 crisp "Tách / Rắc" eggshell crack snaps using short noise bursts + high pitch snaps
  const crackOffsets = [0.0, 0.16, 0.3];
  crackOffsets.forEach((offset) => {
    const start = now + offset;
    const bufferSize = Math.floor(ctx.sampleRate * 0.055);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1900, start);
    filter.Q.setValueAtTime(2.5, start);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.055);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(start);

    // Crisp shell snap tone
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(1400, start);
    snapOsc.frequency.exponentialRampToValueAtTime(320, start + 0.045);
    snapGain.gain.setValueAtTime(0.18, start);
    snapGain.gain.exponentialRampToValueAtTime(0.001, start + 0.045);

    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapOsc.start(start);
    snapOsc.stop(start + 0.05);
  });

  // Part B: "Ting ting chúc mừng" magical chime arpeggio after shell cracks
  const chimeNotes = [
    { freq: 523.25, delay: 0.44, dur: 0.35 }, // C5
    { freq: 659.25, delay: 0.54, dur: 0.35 }, // E5
    { freq: 783.99, delay: 0.64, dur: 0.35 }, // G5
    { freq: 1046.5, delay: 0.74, dur: 0.45 }, // C6 (Ting!)
    { freq: 1318.51, delay: 0.88, dur: 0.5 }, // E6 (Ting!)
    { freq: 1567.98, delay: 1.02, dur: 0.75 } // G6 (Sparkle!)
  ];

  chimeNotes.forEach(({ freq, delay, dur }) => {
    const start = now + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.22, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + dur);
  });
}

/**
 * 2. Tiếng "Nhai giòn/Chóp chép vui tai" khi bấm nút "Cho ăn"
 */
export function playFeedCrunchSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const munchTimes = [0.0, 0.16, 0.32];

  munchTimes.forEach((offset, idx) => {
    const start = now + offset;
    // Crispy apple crunch noise burst
    const bufferSize = Math.floor(ctx.sampleRate * 0.085);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.38));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1150 + idx * 180, start);
    filter.Q.setValueAtTime(1.8, start);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.26, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.085);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(start);

    // Playful "chóp chép" mouth pop
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(340 + idx * 60, start + 0.02);
    popOsc.frequency.exponentialRampToValueAtTime(680 + idx * 80, start + 0.09);

    popGain.gain.setValueAtTime(0.16, start + 0.02);
    popGain.gain.exponentialRampToValueAtTime(0.001, start + 0.095);

    popOsc.connect(popGain);
    popGain.connect(ctx.destination);
    popOsc.start(start + 0.02);
    popOsc.stop(start + 0.1);
  });

  // Final happy "Yum!" ding
  const dingOsc = ctx.createOscillator();
  const dingGain = ctx.createGain();
  const dingStart = now + 0.48;
  dingOsc.type = 'sine';
  dingOsc.frequency.setValueAtTime(880, dingStart);
  dingOsc.frequency.exponentialRampToValueAtTime(1174.66, dingStart + 0.18);
  dingGain.gain.setValueAtTime(0.18, dingStart);
  dingGain.gain.exponentialRampToValueAtTime(0.001, dingStart + 0.25);

  dingOsc.connect(dingGain);
  dingGain.connect(ctx.destination);
  dingOsc.start(dingStart);
  dingOsc.stop(dingStart + 0.26);
}

/**
 * 3. Tiếng "Tít tít/Gừ gừ dễ thương" khi bấm nút "Xoa đầu"
 */
export function playPetPurrBeepSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Warm gentle purr ("Gừ gừ" cozy vibration)
  const purrOsc = ctx.createOscillator();
  const purrLfo = ctx.createOscillator();
  const purrLfoGain = ctx.createGain();
  const purrGain = ctx.createGain();

  purrOsc.type = 'triangle';
  purrOsc.frequency.setValueAtTime(165, now);
  purrOsc.frequency.linearRampToValueAtTime(210, now + 0.35);

  purrLfo.type = 'sine';
  purrLfo.frequency.setValueAtTime(24, now);
  purrLfoGain.gain.setValueAtTime(30, now);

  purrLfo.connect(purrOsc.frequency);
  purrGain.gain.setValueAtTime(0.01, now);
  purrGain.gain.linearRampToValueAtTime(0.14, now + 0.06);
  purrGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

  purrOsc.connect(purrGain);
  purrGain.connect(ctx.destination);

  purrLfo.start(now);
  purrOsc.start(now);
  purrLfo.stop(now + 0.38);
  purrOsc.stop(now + 0.38);

  // Cute double chirp "Tít tít!"
  const chirps = [
    { startOffset: 0.18, f1: 980, f2: 1480, dur: 0.11 },
    { startOffset: 0.32, f1: 1120, f2: 1680, dur: 0.14 }
  ];

  chirps.forEach(({ startOffset, f1, f2, dur }) => {
    const start = now + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(f1, start);
    osc.frequency.exponentialRampToValueAtTime(f2, start + dur);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur);
  });
}

/**
 * 4. Tiếng reo vui cổ vũ ngắn khi bé bấm hoàn thành 1 nhiệm vụ bất kỳ
 */
export function playTaskCheerSound(enabled: boolean = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 587.33, offset: 0.0, dur: 0.11 }, // D5
    { freq: 739.99, offset: 0.08, dur: 0.11 }, // F#5
    { freq: 880.0, offset: 0.16, dur: 0.12 }, // A5
    { freq: 1174.66, offset: 0.25, dur: 0.38 } // D6 ("Hoan hô!")
  ];

  notes.forEach(({ freq, offset, dur }) => {
    const start = now + offset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.22, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur);
  });
}

// Web Speech Synthesis
export function speakText(text: string, lang: 'vi' | 'en' = 'vi', enabled: boolean = true): Promise<void> {
  return new Promise((resolve) => {
    if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Friendly cadence for children
      utterance.pitch = 1.12; // Cheerful, warm tone

      const targetLang = lang === 'vi' ? 'vi-VN' : 'en-US';
      utterance.lang = targetLang;

      // Try finding appropriate voice
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(lang === 'vi' ? 'vi' : 'en'));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
