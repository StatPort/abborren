/* Syntetisk trumpetfanfar med Web Audio API – ingen ljudfil behövs. */
function playFanfare() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const now = ctx.currentTime;

  // "ta-ta-ta-taa" motiv
  const notes = [
    { freq: 523.25, start: 0.0, dur: 0.16 },  // C5
    { freq: 523.25, start: 0.2, dur: 0.16 },  // C5
    { freq: 523.25, start: 0.4, dur: 0.16 },  // C5
    { freq: 659.25, start: 0.62, dur: 0.55 }  // E5 (hållton)
  ];

  notes.forEach((n) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sawtooth";
    osc2.type = "square";
    osc1.frequency.value = n.freq;
    osc2.frequency.value = n.freq;
    osc2.detune.value = 6;

    const t0 = now + n.start;
    const t1 = t0 + n.dur;

    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.22, t0 + 0.02);
    gain.gain.linearRampToValueAtTime(0.16, t0 + n.dur * 0.6);
    gain.gain.linearRampToValueAtTime(0, t1);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(t0);
    osc2.start(t0);
    osc1.stop(t1 + 0.02);
    osc2.stop(t1 + 0.02);
  });

  setTimeout(() => ctx.close(), 1600);
}
