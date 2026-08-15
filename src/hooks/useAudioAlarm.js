import { useState, useRef, useEffect } from 'react';

export const useAudioAlarm = () => {
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [alarmContext, setAlarmContext] = useState(null);
  const audioCtxRef = useRef(null);
  const intervalRef = useRef(null);
  const customAudioRef = useRef(null);

  // Tone 1: Modern Chime (Crystal Glass)
  const playModernChime = (ctx) => {
    const playNote = (frequency, delay, duration) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
      const now = ctx.currentTime + delay;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gainNode.gain.setValueAtTime(0.2, now + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    };
    playNote(880.00, 0.0, 0.5);  // A5
    playNote(1318.51, 0.2, 0.5); // E6
    playNote(1760.00, 0.4, 0.8); // A6
  };

  // Tone 2: Digital Clock (Classic Watch Double Beep)
  const playDigitalClock = (ctx) => {
    const playBeep = (freq, delay) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      const now = ctx.currentTime + delay;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.01);
      gainNode.gain.setValueAtTime(0.12, now + 0.08);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.09);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    };
    playBeep(2093.00, 0.0);   // C7
    playBeep(2093.00, 0.12);  // C7
  };

  // Tone 3: Marimba Ripple (Acoustic Wooden Marimba)
  const playMarimbaRipple = (ctx) => {
    const playMarimbaKey = (freq, delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime + delay);

      const now = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    };
    playMarimbaKey(523.25, 0.0);  // C5
    playMarimbaKey(659.25, 0.08); // E5
    playMarimbaKey(783.99, 0.16); // G5
    playMarimbaKey(1046.50, 0.24); // C6
  };

  // Tone 4: Radar Ping (Sonar Echo Pulse)
  const playRadarPing = (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  };

  // Tone 5: Soft Pulse (Ambient)
  const playSoftPulse = (ctx) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);
    
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.5);
    gainNode.gain.linearRampToValueAtTime(0, now + 1.5);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 1.6);
  };

  // Tone 6: Cyber Siren (High Urgency)
  const playCyberSiren = (ctx) => {
    const playTone = (freq, delay, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      const now = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      gain.gain.linearRampToValueAtTime(0, now + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur);
    };
    playTone(960, 0.0, 0.15);
    playTone(770, 0.15, 0.15);
    playTone(960, 0.3, 0.15);
  };

  // Tone 7: Cosmic Bell (Celestial Harmonized Chord)
  const playCosmicBell = (ctx) => {
    const playBell = (freq, delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      const now = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    };
    playBell(659.25, 0.0);  // E5
    playBell(987.77, 0.15); // B5
    playBell(1318.51, 0.3); // E6
  };

  const triggerSequence = (ctx, toneType) => {
    if (ctx.state === 'closed') return;
    if (toneType === 'digital-clock') playDigitalClock(ctx);
    else if (toneType === 'marimba-ripple') playMarimbaRipple(ctx);
    else if (toneType === 'radar-ping') playRadarPing(ctx);
    else if (toneType === 'soft-pulse') playSoftPulse(ctx);
    else if (toneType === 'cyber-siren') playCyberSiren(ctx);
    else if (toneType === 'cosmic-bell') playCosmicBell(ctx);
    else playModernChime(ctx); // Default modern-chime
  };

  const startAlarm = (toneType = 'modern-chime', context = { title: 'SYSTEM ALARM', message: 'Audio alarms are active.' }) => {
    if (isAlarmPlaying) return;
    setIsAlarmPlaying(true);
    setAlarmContext(context);
    
    if (toneType === 'custom') {
      const customData = localStorage.getItem('duevault_custom_ringtone_data');
      if (customData) {
        const audio = new Audio(customData);
        audio.loop = true;
        audio.play().catch(e => console.error(e));
        customAudioRef.current = audio;
        return;
      } else {
        toneType = 'modern-chime'; // fallback
      }
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContextClass();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      triggerSequence(ctx, toneType);
      
      const loopTime = toneType === 'digital-clock' ? 800 : (toneType === 'cyber-siren' ? 900 : 2500);
      intervalRef.current = setInterval(() => triggerSequence(ctx, toneType), loopTime);

    } catch (error) {
      console.error('Audio synthesizer error:', error);
    }
  };

  const testAlarm = (toneType) => {
    if (toneType === 'custom') {
      const customData = localStorage.getItem('duevault_custom_ringtone_data');
      if (customData) {
        const audio = new Audio(customData);
        audio.play().catch(e => console.error(e));
        return;
      }
      toneType = 'modern-chime'; // fallback
    }
    
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContextClass();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      triggerSequence(ctx, toneType);
    } catch(e) {}
  };

  const stopAlarm = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (customAudioRef.current) {
      customAudioRef.current.pause();
      customAudioRef.current = null;
    }
    setIsAlarmPlaying(false);
    setAlarmContext(null);
  };

  useEffect(() => {
    return () => {
      stopAlarm();
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return { isAlarmPlaying, alarmContext, startAlarm, stopAlarm, testAlarm };
};
