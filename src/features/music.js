const CHORDS = [
  [146.83, 220, 277.18, 329.63],
  [123.47, 185, 246.94, 293.66],
  [98, 146.83, 196, 246.94],
  [110, 164.81, 220, 246.94],
];

const MELODY = [587.33, 659.25, 493.88, 440, 392, 493.88, 369.99, 440];
const CHORD_INTERVAL = 9000;
const NOTE_INTERVAL = 5600;

function createReverb(context) {
  const duration = 2.8;
  const length = context.sampleRate * duration;
  const impulse = context.createBuffer(2, length, context.sampleRate);

  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      const decay = (1 - index / length) ** 3.4;
      data[index] = (Math.random() * 2 - 1) * decay;
    }
  }

  const reverb = context.createConvolver();
  reverb.buffer = impulse;
  return reverb;
}

function createWind(context, destination) {
  const duration = 4;
  const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < data.length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  source.buffer = buffer;
  source.loop = true;
  filter.type = 'bandpass';
  filter.frequency.value = 620;
  filter.Q.value = 0.35;
  gain.gain.value = 0.008;

  source.connect(filter).connect(gain).connect(destination);
  source.start();

  return source;
}

export function createMusicExperience({ button, label, status }) {
  if (!button || !label || !status) return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let context;
  let master;
  let padBus;
  let voices = [];
  let chordIndex = 0;
  let melodyIndex = 0;
  let chordTimer;
  let melodyTimer;
  let suspendTimer;
  let isPlaying = false;

  function updateControl(message) {
    button.classList.toggle('is-playing', isPlaying);
    button.setAttribute('aria-pressed', String(isPlaying));
    button.setAttribute('aria-label', isPlaying ? '暂停背景音乐' : '播放背景音乐');
    label.textContent = isPlaying ? '暂停' : '夜曲';
    status.textContent = message;
  }

  function setChord(index, transition = 3.8) {
    const now = context.currentTime;
    const chord = CHORDS[index % CHORDS.length];

    voices.forEach(({ oscillator }, voiceIndex) => {
      oscillator.frequency.cancelScheduledValues(now);
      oscillator.frequency.setValueAtTime(oscillator.frequency.value, now);
      oscillator.frequency.exponentialRampToValueAtTime(chord[voiceIndex], now + transition);
    });
  }

  function playNote() {
    if (!isPlaying || context.state !== 'running') return;

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const panner = context.createStereoPanner?.();

    oscillator.type = 'sine';
    oscillator.frequency.value = MELODY[melodyIndex % MELODY.length];
    oscillator.detune.value = melodyIndex % 2 ? 4 : -4;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.032, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

    if (panner) {
      panner.pan.value = ((melodyIndex % 5) - 2) * 0.17;
      oscillator.connect(gain).connect(panner).connect(padBus);
    } else {
      oscillator.connect(gain).connect(padBus);
    }

    oscillator.start(now);
    oscillator.stop(now + 3.5);
    melodyIndex += 1;
  }

  function startSequences() {
    window.clearInterval(chordTimer);
    window.clearInterval(melodyTimer);
    chordTimer = window.setInterval(() => {
      chordIndex = (chordIndex + 1) % CHORDS.length;
      setChord(chordIndex);
    }, CHORD_INTERVAL);
    melodyTimer = window.setInterval(playNote, NOTE_INTERVAL);
  }

  function createSoundscape() {
    context = new AudioContext();
    master = context.createGain();
    padBus = context.createGain();
    const filter = context.createBiquadFilter();
    const reverb = createReverb(context);
    const wet = context.createGain();
    const dry = context.createGain();

    master.gain.value = 0.0001;
    padBus.gain.value = 0.11;
    filter.type = 'lowpass';
    filter.frequency.value = 1150;
    filter.Q.value = 0.45;
    wet.gain.value = 0.24;
    dry.gain.value = 0.82;

    padBus.connect(filter);
    filter.connect(dry).connect(master);
    filter.connect(reverb).connect(wet).connect(master);
    master.connect(context.destination);

    voices = CHORDS[0].map((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index % 2 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      oscillator.detune.value = [-6, 4, -3, 7][index];
      gain.gain.value = [0.14, 0.11, 0.075, 0.05][index];
      oscillator.connect(gain).connect(padBus);
      oscillator.start();
      return { oscillator, gain };
    });

    createWind(context, master);
    startSequences();
    window.setTimeout(playNote, 1800);
  }

  async function start() {
    window.clearTimeout(suspendTimer);
    if (!context) createSoundscape();
    await context.resume();

    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.exponentialRampToValueAtTime(0.12, now + 1.8);
    isPlaying = true;
    updateControl('背景音乐已播放');
  }

  function pause() {
    if (!context) return;

    isPlaying = false;
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
    suspendTimer = window.setTimeout(() => context.suspend(), 700);
    updateControl('背景音乐已暂停');
  }

  if (!AudioContext) {
    button.disabled = true;
    button.setAttribute('aria-label', '当前浏览器不支持背景音乐');
    label.textContent = '不可用';
    return;
  }

  button.addEventListener('click', async () => {
    try {
      if (isPlaying) pause();
      else await start();
    } catch {
      isPlaying = false;
      updateControl('背景音乐启动失败，请再次尝试');
    }
  });

  document.addEventListener('visibilitychange', async () => {
    if (!context) return;
    if (document.hidden) {
      await context.suspend();
    } else if (isPlaying) {
      await context.resume();
    }
  });
}
