/**
 * Simple sound utility using Web Audio API to play a "click" sound.
 */

let audioCtx: AudioContext | null = null;
let isMuted = false;

export const setMuted = (muted: boolean) => {
  isMuted = muted;
};

export const getMuted = () => isMuted;

export const playClickSound = () => {
  if (isMuted) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05);
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
};

export const setupGlobalClickSound = () => {
  const handleGlobalClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const interactive = target.closest('button, a, [role="button"], .cursor-pointer');
    if (interactive) {
      playClickSound();
    }
  };

  window.addEventListener('click', handleGlobalClick, { capture: true });
  return () => window.removeEventListener('click', handleGlobalClick);
};
