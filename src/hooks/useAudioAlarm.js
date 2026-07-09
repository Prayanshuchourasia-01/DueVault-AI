import { useState, useRef, useEffect } from 'react';

export const useAudioAlarm = () => {
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [alarmContext, setAlarmContext] = useState(null);
  const audioCtxRef = useRef(null);
  const intervalRef = useRef(null);
  const customAudioRef = useRef(null);

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

  const playUrgentAlarm = (ctx) => {
    const playBeep = (freq, delay) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'triangle'; // Still pleasant, avoiding square/saw
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      const now = ctx.currentTime + delay;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    };
    // Double beep
    playBeep(1046.50, 0);    // C6
    playBeep(1046.50, 0.15); // C6
  };

  const triggerSequence = (ctx, toneType) => {
    if (ctx.state === 'closed') return;
    if (toneType === 'soft-pulse') playSoftPulse(ctx);
    else if (toneType === 'urgent-alarm') playUrgentAlarm(ctx);
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
      
      const loopTime = toneType === 'soft-pulse' ? 2000 : (toneType === 'urgent-alarm' ? 1000 : 3000);
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
