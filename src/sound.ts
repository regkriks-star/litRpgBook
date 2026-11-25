export type Sound = 'click' | 'attack' | 'strike' | 'bolt' | 'sting' | 'claws';

// Pitch sweep, duration, waveform, noise cutoff and number of impacts.
const sounds: Record<Sound, [number, number, number, OscillatorType, number, number]> = {
  click: [400, 130, .15, 'sine', 0, 1],
  attack: [170, 45, .22, 'triangle', 1200, 1],
  strike: [240, 32, .4, 'triangle', 2200, 1],
  bolt: [1500, 90, .32, 'sawtooth', 6500, 1],
  sting: [850, 180, .16, 'sine', 3800, 1],
  claws: [320, 75, .13, 'square', 1700, 2],
};

export function playEffect(ctx: AudioContext, sound: Sound) {
  const [from, to, duration, waveform, cutoff, impacts] = sounds[sound];
  for (let i = 0; i < impacts; i++) {
    const start = ctx.currentTime + i * .1;
    const end = start + duration;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(sound === 'click' ? .045 : .09, start + .005);
    gain.gain.exponentialRampToValueAtTime(.001, end);
    const tone = ctx.createOscillator();
    tone.type = waveform;
    tone.frequency.setValueAtTime(from, start);
    tone.frequency.exponentialRampToValueAtTime(to, end);
    tone.connect(gain);
    tone.start(start);
    tone.stop(end);
    tone.onended = () => { tone.disconnect(); gain.disconnect(); };

    if (!cutoff) continue;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let j = 0; j < samples.length; j++) samples[j] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    noise.buffer = buffer;
    noise.connect(filter); filter.connect(gain);
    noise.start(start); noise.stop(end);
    noise.onended = () => { noise.disconnect(); filter.disconnect(); };
  }
}
