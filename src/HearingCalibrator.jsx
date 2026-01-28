import React, { useState, useRef, useCallback, useEffect } from 'react';

// Frequency bands for calibration (standard audiometric frequencies)
const FREQUENCY_BANDS = [
  { freq: 63, label: '63 Hz', description: 'Sub-bass rumble' },
  { freq: 125, label: '125 Hz', description: 'Bass foundations' },
  { freq: 250, label: '250 Hz', description: 'Low-mid warmth' },
  { freq: 500, label: '500 Hz', description: 'Mid-bass body' },
  { freq: 1000, label: '1 kHz', description: 'Midrange presence' },
  { freq: 2000, label: '2 kHz', description: 'Upper-mid clarity' },
  { freq: 4000, label: '4 kHz', description: 'Brilliance range' },
  { freq: 8000, label: '8 kHz', description: 'Air and sparkle' },
  { freq: 12000, label: '12 kHz', description: 'High frequency detail' },
];

// Equal loudness compensation (approximate, based on Fletcher-Munson)
// These are dB reductions relative to 1kHz at moderate listening levels
const LOUDNESS_COMPENSATION = {
  63: -8,
  125: -4,
  250: -1,
  500: 0,
  1000: 0,
  2000: 2,
  4000: 3,
  8000: 0,
  12000: -4,
};

// Convert dB to linear gain
const dbToGain = (db) => Math.pow(10, db / 20);

// Styles object for the retro audiophile aesthetic
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(145deg, #1a1410 0%, #2d2319 50%, #1a1410 100%)',
    fontFamily: "'Courier New', monospace",
    color: '#e8dcc8',
    padding: '20px',
    boxSizing: 'border-box',
  },
  woodPanel: {
    background: `
      linear-gradient(90deg, 
        rgba(62, 45, 34, 0.8) 0%, 
        rgba(82, 60, 45, 0.6) 20%,
        rgba(72, 52, 38, 0.7) 40%,
        rgba(85, 62, 47, 0.6) 60%,
        rgba(65, 48, 36, 0.8) 80%,
        rgba(75, 55, 42, 0.7) 100%
      )`,
    borderRadius: '12px',
    padding: '30px',
    boxShadow: `
      inset 0 2px 4px rgba(255, 200, 150, 0.1),
      inset 0 -2px 4px rgba(0, 0, 0, 0.3),
      0 10px 40px rgba(0, 0, 0, 0.5)
    `,
    border: '2px solid #3d2d22',
  },
  metalPlate: {
    background: 'linear-gradient(180deg, #4a4035 0%, #3a3028 50%, #2a2018 100%)',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: `
      inset 0 1px 0 rgba(255, 220, 180, 0.2),
      inset 0 -1px 0 rgba(0, 0, 0, 0.4),
      0 4px 12px rgba(0, 0, 0, 0.3)
    `,
    border: '1px solid #5a4a3a',
  },
  title: {
    fontFamily: "'Georgia', serif",
    fontSize: '28px',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#d4a574',
    textShadow: '0 0 20px rgba(212, 165, 116, 0.5), 0 2px 4px rgba(0, 0, 0, 0.5)',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  subtitle: {
    textAlign: 'center',
    color: '#a89078',
    fontSize: '12px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    marginBottom: '30px',
  },
  glowingText: {
    color: '#ffb347',
    textShadow: '0 0 10px rgba(255, 179, 71, 0.8), 0 0 20px rgba(255, 179, 71, 0.4)',
  },
  filamentGlow: {
    color: '#ff8c42',
    textShadow: `
      0 0 5px rgba(255, 140, 66, 1),
      0 0 10px rgba(255, 140, 66, 0.8),
      0 0 20px rgba(255, 140, 66, 0.6),
      0 0 40px rgba(255, 140, 66, 0.4)
    `,
  },
  knobContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
  },
  knob: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: `
      radial-gradient(ellipse at 30% 30%, #8b7355 0%, #5a4a3a 40%, #3a2a1a 100%)
    `,
    boxShadow: `
      0 4px 8px rgba(0, 0, 0, 0.4),
      inset 0 2px 4px rgba(255, 220, 180, 0.2),
      inset 0 -2px 4px rgba(0, 0, 0, 0.3)
    `,
    border: '3px solid #6b5b4b',
    position: 'relative',
    cursor: 'pointer',
    userSelect: 'none',
  },
  knobIndicator: {
    position: 'absolute',
    top: '10px',
    left: '50%',
    width: '4px',
    height: '20px',
    background: 'linear-gradient(180deg, #ffd700 0%, #ff8c00 100%)',
    borderRadius: '2px',
    transformOrigin: 'center 50px',
    boxShadow: '0 0 8px rgba(255, 215, 0, 0.8)',
  },
  knobLabel: {
    fontSize: '11px',
    color: '#a89078',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  vuMeter: {
    width: '100%',
    height: '60px',
    background: 'linear-gradient(180deg, #1a1510 0%, #0d0a08 100%)',
    borderRadius: '4px',
    border: '2px solid #3a2a1a',
    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.8)',
    position: 'relative',
    overflow: 'hidden',
  },
  vuMeterFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #2d5a27 0%, #4a8b3b 30%, #7ab648 50%, #c4a000 70%, #ff6b35 85%, #ff3535 100%)',
    transition: 'width 0.1s ease-out',
    boxShadow: '0 0 10px rgba(122, 182, 72, 0.5)',
  },
  button: {
    background: 'linear-gradient(180deg, #5a4a3a 0%, #3a2a1a 100%)',
    border: '2px solid #6b5b4b',
    borderRadius: '8px',
    padding: '12px 24px',
    color: '#e8dcc8',
    fontSize: '14px',
    fontFamily: "'Courier New', monospace",
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    boxShadow: `
      0 4px 8px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 220, 180, 0.2)
    `,
    transition: 'all 0.15s ease',
  },
  buttonActive: {
    background: 'linear-gradient(180deg, #6b5b4b 0%, #4a3a2a 100%)',
    boxShadow: `
      0 2px 4px rgba(0, 0, 0, 0.3),
      inset 0 2px 4px rgba(0, 0, 0, 0.2)
    `,
  },
  buttonPrimary: {
    background: 'linear-gradient(180deg, #8b6914 0%, #5a4408 100%)',
    border: '2px solid #a87b1c',
    color: '#ffe4a0',
  },
  toggleSwitch: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  toggleTrack: {
    width: '50px',
    height: '24px',
    background: 'linear-gradient(180deg, #2a2018 0%, #1a1008 100%)',
    borderRadius: '12px',
    border: '2px solid #4a3a2a',
    position: 'relative',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)',
  },
  toggleThumb: {
    position: 'absolute',
    top: '2px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: 'linear-gradient(180deg, #8b7355 0%, #5a4a3a 100%)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    transition: 'left 0.2s ease',
  },
  indicatorLight: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#2a1a0a',
    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5)',
  },
  indicatorLightOn: {
    background: 'radial-gradient(ellipse at 30% 30%, #ffcc00 0%, #ff8c00 50%, #cc5500 100%)',
    boxShadow: `
      0 0 8px rgba(255, 140, 0, 0.8),
      0 0 16px rgba(255, 140, 0, 0.4),
      inset 0 -2px 4px rgba(0, 0, 0, 0.2)
    `,
  },
  frequencyDisplay: {
    fontFamily: "'Courier New', monospace",
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ff8c42',
    textShadow: `
      0 0 10px rgba(255, 140, 66, 0.8),
      0 0 20px rgba(255, 140, 66, 0.5)
    `,
    textAlign: 'center',
    padding: '10px',
    background: 'linear-gradient(180deg, #1a1510 0%, #0d0a08 100%)',
    borderRadius: '4px',
    border: '2px solid #3a2a1a',
  },
  progressBar: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  progressDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#2a1a0a',
    border: '1px solid #4a3a2a',
  },
  progressDotActive: {
    background: 'radial-gradient(ellipse at 30% 30%, #ffcc00 0%, #ff8c00 100%)',
    boxShadow: '0 0 8px rgba(255, 140, 0, 0.6)',
  },
  progressDotComplete: {
    background: 'radial-gradient(ellipse at 30% 30%, #7ab648 0%, #4a8b3b 100%)',
    boxShadow: '0 0 8px rgba(122, 182, 72, 0.6)',
  },
  card: {
    background: 'linear-gradient(180deg, rgba(58, 48, 38, 0.8) 0%, rgba(42, 32, 24, 0.9) 100%)',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #4a3a2a',
  },
  slider: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    background: 'linear-gradient(180deg, #1a1510 0%, #0d0a08 100%)',
    outline: 'none',
    cursor: 'pointer',
  },
  resultBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '12px',
    background: 'linear-gradient(180deg, rgba(42, 32, 24, 0.8) 0%, rgba(26, 20, 16, 0.9) 100%)',
    borderRadius: '6px',
    border: '1px solid #3a2a1a',
  },
  exportBox: {
    background: '#0d0a08',
    borderRadius: '4px',
    padding: '15px',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#7ab648',
    border: '1px solid #2a1a0a',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    maxHeight: '200px',
    overflow: 'auto',
  },
};

// Rotary Knob Component
const RotaryKnob = ({ value, onChange, min = -50, max = 50, size = 120, label }) => {
  const knobRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  // Convert value to rotation angle (-135 to 135 degrees)
  const valueToAngle = (val) => {
    const normalized = (val - min) / (max - min);
    return -135 + normalized * 270;
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startValue.current = value;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const deltaY = startY.current - e.clientY;
    const sensitivity = (max - min) / 200;
    let newValue = startValue.current + deltaY * sensitivity;
    newValue = Math.max(min, Math.min(max, newValue));
    onChange(Math.round(newValue));
  }, [min, max, onChange]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    const newValue = Math.max(min, Math.min(max, value + delta));
    onChange(newValue);
  };

  return (
    <div style={styles.knobContainer}>
      <div
        ref={knobRef}
        style={{
          ...styles.knob,
          width: `${size}px`,
          height: `${size}px`,
        }}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        <div
          style={{
            ...styles.knobIndicator,
            transform: `translateX(-50%) rotate(${valueToAngle(value)}deg)`,
            transformOrigin: `center ${size / 2 - 10}px`,
          }}
        />
        {/* Knob markings */}
        {[-50, -25, 0, 25, 50].map((mark, i) => {
          const angle = valueToAngle(mark) - 90;
          const radius = size / 2 + 15;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          return (
            <div
              key={mark}
              style={{
                position: 'absolute',
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
                fontSize: '9px',
                color: mark === 0 ? '#ffd700' : '#8b7355',
              }}
            >
              {mark === 0 ? 'C' : mark > 0 ? `R${mark}` : `L${Math.abs(mark)}`}
            </div>
          );
        })}
      </div>
      {label && <div style={styles.knobLabel}>{label}</div>}
    </div>
  );
};

// Toggle Switch Component
const ToggleSwitch = ({ checked, onChange, leftLabel, rightLabel }) => (
  <div style={styles.toggleSwitch} onClick={() => onChange(!checked)}>
    <span style={{ color: !checked ? '#ffd700' : '#8b7355', fontSize: '12px' }}>{leftLabel}</span>
    <div style={styles.toggleTrack}>
      <div
        style={{
          ...styles.toggleThumb,
          left: checked ? '28px' : '4px',
        }}
      />
    </div>
    <span style={{ color: checked ? '#ffd700' : '#8b7355', fontSize: '12px' }}>{rightLabel}</span>
  </div>
);

// Indicator Light Component
const IndicatorLight = ({ on, color = 'amber' }) => {
  const colors = {
    amber: { on: '#ff8c00', glow: 'rgba(255, 140, 0, 0.8)' },
    green: { on: '#7ab648', glow: 'rgba(122, 182, 72, 0.8)' },
    red: { on: '#ff4444', glow: 'rgba(255, 68, 68, 0.8)' },
  };
  
  return (
    <div
      style={{
        ...styles.indicatorLight,
        ...(on ? {
          background: `radial-gradient(ellipse at 30% 30%, ${colors[color].on} 0%, ${colors[color].on}88 100%)`,
          boxShadow: `0 0 8px ${colors[color].glow}, 0 0 16px ${colors[color].glow}`,
        } : {}),
      }}
    />
  );
};

// VU Meter Component
const VUMeter = ({ level }) => (
  <div style={styles.vuMeter}>
    <div
      style={{
        ...styles.vuMeterFill,
        width: `${Math.min(100, level)}%`,
      }}
    />
    {/* Meter markings */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0 10px',
      alignItems: 'flex-end',
      pointerEvents: 'none',
    }}>
      {['-20', '-10', '-5', '0', '+3'].map((label) => (
        <span key={label} style={{ fontSize: '8px', color: '#8b7355' }}>{label}</span>
      ))}
    </div>
  </div>
);

// Progress Indicator Component
const ProgressIndicator = ({ current, total, completed }) => (
  <div style={styles.progressBar}>
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        style={{
          ...styles.progressDot,
          ...(i < completed ? styles.progressDotComplete : {}),
          ...(i === current ? styles.progressDotActive : {}),
        }}
      />
    ))}
  </div>
);

// Main App Component
const HearingCalibrator = () => {
  const [screen, setScreen] = useState('welcome'); // welcome, calibrate, results, export
  const [currentBandIndex, setCurrentBandIndex] = useState(0);
  const [calibrationData, setCalibrationData] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPulsed, setIsPulsed] = useState(false); // Default to continuous
  const [balance, setBalance] = useState(0);
  const [volume, setVolume] = useState(50);
  const [vuLevel, setVuLevel] = useState(0);
  
  // A/B Testing state
  const [abTestFreq, setAbTestFreq] = useState(null);
  const [abIsCompensated, setAbIsCompensated] = useState(true);
  const [abIsPlaying, setAbIsPlaying] = useState(false);
  
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const pannerRef = useRef(null);
  const pulseIntervalRef = useRef(null);

  const currentBand = FREQUENCY_BANDS[currentBandIndex];

  // Initialize or get AudioContext
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Start tone
  const startTone = useCallback(() => {
    const ctx = getAudioContext();
    
    // Stop any existing tone
    stopTone();

    const createOscillator = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner();

      osc.type = 'sine';
      osc.frequency.value = currentBand.freq;

      // Apply loudness compensation and volume
      const compensation = LOUDNESS_COMPENSATION[currentBand.freq] || 0;
      const baseGain = dbToGain(compensation) * (volume / 100) * 0.3;
      gain.gain.value = baseGain;

      // Apply balance (-50 to 50 maps to -1 to 1)
      panner.pan.value = balance / 50;

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
      pannerRef.current = panner;

      osc.start();
      setVuLevel(70 + Math.random() * 20);
    };

    if (isPulsed) {
      let isOn = true;
      createOscillator();
      
      pulseIntervalRef.current = setInterval(() => {
        if (isOn) {
          if (gainNodeRef.current) {
            gainNodeRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
          }
          setVuLevel(0);
        } else {
          const compensation = LOUDNESS_COMPENSATION[currentBand.freq] || 0;
          const baseGain = dbToGain(compensation) * (volume / 100) * 0.3;
          if (gainNodeRef.current) {
            gainNodeRef.current.gain.setTargetAtTime(baseGain, ctx.currentTime, 0.05);
          }
          setVuLevel(70 + Math.random() * 20);
        }
        isOn = !isOn;
      }, 750);
    } else {
      createOscillator();
    }

    setIsPlaying(true);
  }, [currentBand, balance, volume, isPulsed]);

  // Stop tone
  const stopTone = useCallback(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    if (pannerRef.current) {
      pannerRef.current.disconnect();
      pannerRef.current = null;
    }
    if (pulseIntervalRef.current) {
      clearInterval(pulseIntervalRef.current);
      pulseIntervalRef.current = null;
    }
    setIsPlaying(false);
    setVuLevel(0);
  }, []);

  // A/B Test tone functions
  const startABTone = useCallback((freq, compensated) => {
    const ctx = getAudioContext();
    
    // Stop any existing tone
    stopTone();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();

    osc.type = 'sine';
    osc.frequency.value = freq;

    // Apply loudness compensation and volume
    const compensation = LOUDNESS_COMPENSATION[freq] || 0;
    const baseGain = dbToGain(compensation) * (volume / 100) * 0.3;
    gain.gain.value = baseGain;

    // Apply balance only if compensated mode
    const balanceVal = compensated ? (calibrationData[freq] || 0) : 0;
    panner.pan.value = balanceVal / 50;

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);

    oscillatorRef.current = osc;
    gainNodeRef.current = gain;
    pannerRef.current = panner;

    osc.start();
    setVuLevel(70 + Math.random() * 20);
    setAbIsPlaying(true);
  }, [calibrationData, volume, stopTone]);

  const toggleABCompensation = useCallback(() => {
    if (abTestFreq && abIsPlaying) {
      const newCompensated = !abIsCompensated;
      setAbIsCompensated(newCompensated);
      
      // Update the panner value
      if (pannerRef.current) {
        const balanceVal = newCompensated ? (calibrationData[abTestFreq] || 0) : 0;
        pannerRef.current.pan.value = balanceVal / 50;
      }
    }
  }, [abTestFreq, abIsPlaying, abIsCompensated, calibrationData]);

  const stopABTone = useCallback(() => {
    stopTone();
    setAbIsPlaying(false);
    setVuLevel(0);
  }, [stopTone]);

  // Update pan value when balance changes
  useEffect(() => {
    if (pannerRef.current) {
      pannerRef.current.pan.value = balance / 50;
    }
  }, [balance]);

  // Update gain when volume changes
  useEffect(() => {
    if (gainNodeRef.current && isPlaying) {
      const compensation = LOUDNESS_COMPENSATION[currentBand.freq] || 0;
      const baseGain = dbToGain(compensation) * (volume / 100) * 0.3;
      gainNodeRef.current.gain.setTargetAtTime(baseGain, audioContextRef.current?.currentTime || 0, 0.05);
    }
  }, [volume, currentBand, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTone();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopTone]);

  // Save current calibration and move to next
  const saveAndNext = () => {
    stopTone();
    setCalibrationData((prev) => ({
      ...prev,
      [currentBand.freq]: balance,
    }));

    if (currentBandIndex < FREQUENCY_BANDS.length - 1) {
      setCurrentBandIndex(currentBandIndex + 1);
      setBalance(0);
    } else {
      setScreen('results');
    }
  };

  // Go to previous frequency
  const goToPrevious = () => {
    stopTone();
    if (currentBandIndex > 0) {
      const prevIndex = currentBandIndex - 1;
      setCurrentBandIndex(prevIndex);
      setBalance(calibrationData[FREQUENCY_BANDS[prevIndex].freq] || 0);
    }
  };

  // Download file helper
  const downloadFile = (content, filename, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate EasyEffects/PulseEffects native JSON preset
  const generateEasyEffectsPreset = () => {
    const createBands = (isLeft) => {
      const bands = {};
      Object.entries(calibrationData).forEach(([freq, balanceVal], index) => {
        // For left channel: positive balance means boost left (we stored L+ as negative internally, so flip)
        // For right channel: negative balance means boost right
        const gainDb = isLeft 
          ? (balanceVal / 50) * 12  // Left gets positive gain when balance is toward left
          : -(balanceVal / 50) * 12; // Right gets inverse
        
        bands[`band${index}`] = {
          frequency: parseFloat(freq),
          gain: parseFloat(gainDb.toFixed(1)),
          mode: "APO (DR)",
          mute: false,
          q: 1.0,
          slope: "x1",
          solo: false,
          type: "Bell",
          width: 4.0
        };
      });
      return bands;
    };

    const preset = {
      output: {
        blocklist: [],
        "equalizer#0": {
          balance: 0.0,
          bypass: false,
          "input-gain": 0.0,
          left: createBands(true),
          right: createBands(false),
          mode: "IIR",
          "num-bands": Object.keys(calibrationData).length,
          "output-gain": 0.0,
          "pitch-left": 0.0,
          "pitch-right": 0.0,
          "split-channels": true
        },
        plugins_order: ["equalizer#0"]
      }
    };

    return JSON.stringify(preset, null, 2);
  };

  // Generate Equalizer APO config - LEFT channel only
  const generateEqualizerAPO_Left = () => {
    let config = '# Hearing Compensation Profile - LEFT CHANNEL\n';
    config += '# Generated by Audiophile Hearing Calibrator\n';
    config += `# Date: ${new Date().toISOString()}\n\n`;
    config += '# Import this into EasyEffects Left channel\n\n';
    
    Object.entries(calibrationData).forEach(([freq, balanceVal]) => {
      if (balanceVal !== 0) {
        const gainDb = (balanceVal / 50) * 12;
        config += `Filter: ON PK Fc ${freq} Hz Gain ${gainDb.toFixed(1)} dB Q 1.0\n`;
      }
    });

    return config;
  };

  // Generate Equalizer APO config - RIGHT channel only
  const generateEqualizerAPO_Right = () => {
    let config = '# Hearing Compensation Profile - RIGHT CHANNEL\n';
    config += '# Generated by Audiophile Hearing Calibrator\n';
    config += `# Date: ${new Date().toISOString()}\n\n`;
    config += '# Import this into EasyEffects Right channel\n\n';
    
    Object.entries(calibrationData).forEach(([freq, balanceVal]) => {
      if (balanceVal !== 0) {
        const gainDb = -(balanceVal / 50) * 12; // Inverse for right channel
        config += `Filter: ON PK Fc ${freq} Hz Gain ${gainDb.toFixed(1)} dB Q 1.0\n`;
      }
    });

    return config;
  };

  // Generate Equalizer APO config (combined - for Windows)
  const generateEqualizerAPO = () => {
    let config = '# Hearing Compensation Profile\n';
    config += '# Generated by Audiophile Hearing Calibrator\n';
    config += `# Date: ${new Date().toISOString()}\n\n`;
    config += '# This profile compensates for frequency-dependent hearing differences\n';
    config += '# by adjusting the LEFT channel gain at specific frequencies.\n\n';
    config += 'Channel: L\n';
    
    Object.entries(calibrationData).forEach(([freq, balanceVal]) => {
      if (balanceVal !== 0) {
        // Balance of -50 (full left) means right ear needs boost, so reduce left
        // Balance of +50 (full right) means left ear needs boost, so boost left
        const gainDb = (balanceVal / 50) * 12; // Max 12dB adjustment
        config += `Filter: ON PK Fc ${freq} Hz Gain ${gainDb.toFixed(1)} dB Q 1.0\n`;
      }
    });

    config += '\nChannel: R\n';
    Object.entries(calibrationData).forEach(([freq, balanceVal]) => {
      if (balanceVal !== 0) {
        const gainDb = -(balanceVal / 50) * 12;
        config += `Filter: ON PK Fc ${freq} Hz Gain ${gainDb.toFixed(1)} dB Q 1.0\n`;
      }
    });

    return config;
  };

  // Generate EasyEffects/PulseEffects preset
  const generateEasyEffects = () => {
    const createBand = (freq, gain) => ({
      frequency: freq,
      gain: gain,
      mode: "RLC (BT)",
      mute: false,
      q: 1.5,
      slope: "x1",
      solo: false,
      type: "Bell",
      width: 4.0
    });

    // Create bands for left and right channels
    const leftBands = {};
    const rightBands = {};
    
    FREQUENCY_BANDS.forEach((band, index) => {
      const balanceVal = calibrationData[band.freq] || 0;
      // Positive balance = boost left, negative = boost right
      const leftGain = (balanceVal / 50) * 12; // Max 12dB
      const rightGain = -(balanceVal / 50) * 12;
      
      leftBands[`band${index}`] = createBand(band.freq, leftGain);
      rightBands[`band${index}`] = createBand(band.freq, rightGain);
    });

    const preset = {
      output: {
        blocklist: [],
        "equalizer#0": {
          balance: 0.0,
          bypass: false,
          "input-gain": 0.0,
          left: leftBands,
          right: rightBands,
          mode: "IIR",
          "num-bands": FREQUENCY_BANDS.length,
          "output-gain": 0.0,
          "pitch-left": 0.0,
          "pitch-right": 0.0,
          "split-channels": true
        },
        plugins_order: ["equalizer#0"]
      }
    };

    return JSON.stringify(preset, null, 2);
  };

  // Generate JSON export
  const generateJSON = () => {
    return JSON.stringify({
      version: '1.0',
      generatedAt: new Date().toISOString(),
      calibrationData: calibrationData,
      frequencies: FREQUENCY_BANDS.map((b) => b.freq),
    }, null, 2);
  };

  // Render Welcome Screen
  const renderWelcome = () => (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={styles.woodPanel}>
        <h1 style={styles.title}>Hearing Calibrator</h1>
        <p style={styles.subtitle}>Precision Audio Balance Tool</p>

        <div style={{ ...styles.metalPlate, marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <IndicatorLight on={true} color="amber" />
            <span style={styles.glowingText}>Headphones Required</span>
          </div>
          <p style={{ color: '#a89078', lineHeight: '1.6', margin: 0 }}>
            This tool helps you create a personalized hearing compensation profile 
            by calibrating left/right balance at different frequencies. Perfect for 
            audiophiles with frequency-dependent hearing differences.
          </p>
        </div>

        <div style={styles.card}>
          <h3 style={{ color: '#d4a574', marginTop: 0, marginBottom: '15px' }}>How It Works</h3>
          <ol style={{ color: '#a89078', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
            <li>Put on your headphones</li>
            <li>For each frequency, adjust the balance knob until the sound feels centered in your head</li>
            <li>Confirm and move to the next frequency</li>
            <li>Export your profile for Equalizer APO or other software</li>
          </ol>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button
            style={{ ...styles.button, ...styles.buttonPrimary, fontSize: '16px', padding: '15px 40px' }}
            onClick={() => setScreen('calibrate')}
          >
            Begin Calibration
          </button>
        </div>
      </div>
    </div>
  );

  // Render Calibration Screen
  const renderCalibration = () => (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={styles.woodPanel}>
        <h1 style={{ ...styles.title, fontSize: '22px' }}>Frequency Calibration</h1>
        
        <ProgressIndicator
          current={currentBandIndex}
          total={FREQUENCY_BANDS.length}
          completed={Object.keys(calibrationData).length}
        />

        <div style={{ ...styles.metalPlate, marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div>
              <div style={styles.frequencyDisplay}>{currentBand.label}</div>
              <div style={{ color: '#8b7355', fontSize: '12px', textAlign: 'center', marginTop: '5px' }}>
                {currentBand.description}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#a89078', fontSize: '11px', marginBottom: '5px' }}>
                STEP {currentBandIndex + 1} OF {FREQUENCY_BANDS.length}
              </div>
              <ToggleSwitch
                checked={isPulsed}
                onChange={setIsPulsed}
                leftLabel="CONTINUOUS"
                rightLabel="PULSED"
              />
            </div>
          </div>

          <VUMeter level={vuLevel} />
        </div>

        <div style={{ ...styles.card, marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#d4a574', marginBottom: '10px', fontSize: '12px' }}>LEFT</div>
              <div style={{ fontSize: '24px', color: balance < 0 ? '#ffd700' : '#5a4a3a' }}>
                {balance < 0 ? `+${Math.abs(balance)}%` : '—'}
              </div>
            </div>

            <RotaryKnob
              value={balance}
              onChange={setBalance}
              min={-50}
              max={50}
              size={140}
              label="BALANCE"
            />

            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#d4a574', marginBottom: '10px', fontSize: '12px' }}>RIGHT</div>
              <div style={{ fontSize: '24px', color: balance > 0 ? '#ffd700' : '#5a4a3a' }}>
                {balance > 0 ? `+${balance}%` : '—'}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ color: '#8b7355', fontSize: '11px' }}>VOLUME</span>
              <span style={{ color: '#a89078', fontSize: '11px' }}>{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              style={{
                ...styles.slider,
                WebkitAppearance: 'none',
                background: `linear-gradient(90deg, #7ab648 0%, #7ab648 ${volume}%, #1a1510 ${volume}%, #1a1510 100%)`,
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
          <button
            style={{ ...styles.button, opacity: currentBandIndex === 0 ? 0.5 : 1 }}
            onClick={goToPrevious}
            disabled={currentBandIndex === 0}
          >
            ← Previous
          </button>

          <button
            style={{
              ...styles.button,
              ...(isPlaying ? styles.buttonActive : {}),
              minWidth: '120px',
            }}
            onClick={isPlaying ? stopTone : startTone}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <IndicatorLight on={isPlaying} color="green" />
              {isPlaying ? 'Stop' : 'Play Tone'}
            </span>
          </button>

          <button
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={saveAndNext}
          >
            {currentBandIndex === FREQUENCY_BANDS.length - 1 ? 'Finish' : 'Confirm →'}
          </button>
        </div>

        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <span
            style={{ color: '#6b5b4b', fontSize: '12px', cursor: 'pointer' }}
            onClick={() => {
              stopTone();
              setScreen('welcome');
            }}
          >
            Cancel Calibration
          </span>
        </div>
      </div>
    </div>
  );

  // Render Results Screen
  const renderResults = () => (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={styles.woodPanel}>
        <h1 style={styles.title}>Calibration Complete</h1>
        <p style={styles.subtitle}>Your Hearing Compensation Profile</p>

        <div style={{ ...styles.metalPlate, marginBottom: '20px' }}>
          <h3 style={{ color: '#d4a574', marginTop: 0, marginBottom: '15px' }}>Compensation Curve</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {FREQUENCY_BANDS.map((band) => {
              const balanceVal = calibrationData[band.freq] || 0;
              const leftWidth = balanceVal < 0 ? Math.abs(balanceVal) : 0;
              const rightWidth = balanceVal > 0 ? balanceVal : 0;
              const isSelected = abTestFreq === band.freq;
              
              return (
                <div 
                  key={band.freq} 
                  style={{
                    ...styles.resultBar,
                    cursor: 'pointer',
                    border: isSelected ? '1px solid #ffd700' : '1px solid transparent',
                    boxShadow: isSelected ? '0 0 10px rgba(255, 215, 0, 0.3)' : 'none',
                  }}
                  onClick={() => {
                    if (abTestFreq === band.freq && abIsPlaying) {
                      stopABTone();
                      setAbTestFreq(null);
                    } else {
                      setAbTestFreq(band.freq);
                      startABTone(band.freq, abIsCompensated);
                    }
                  }}
                >
                  <div style={{ width: '70px', color: isSelected ? '#ffd700' : '#a89078', fontSize: '12px' }}>
                    {band.label}
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '45%', display: 'flex', justifyContent: 'flex-end' }}>
                      <div
                        style={{
                          width: `${leftWidth * 2}%`,
                          height: '16px',
                          background: leftWidth > 0 ? 'linear-gradient(90deg, #4a8b3b, #7ab648)' : 'transparent',
                          borderRadius: '3px 0 0 3px',
                          boxShadow: leftWidth > 0 ? '0 0 8px rgba(122, 182, 72, 0.4)' : 'none',
                        }}
                      />
                    </div>
                    <div style={{
                      width: '4px',
                      height: '20px',
                      background: '#ffd700',
                      boxShadow: '0 0 6px rgba(255, 215, 0, 0.6)',
                    }} />
                    <div style={{ width: '45%' }}>
                      <div
                        style={{
                          width: `${rightWidth * 2}%`,
                          height: '16px',
                          background: rightWidth > 0 ? 'linear-gradient(90deg, #7ab648, #4a8b3b)' : 'transparent',
                          borderRadius: '0 3px 3px 0',
                          boxShadow: rightWidth > 0 ? '0 0 8px rgba(122, 182, 72, 0.4)' : 'none',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ width: '50px', textAlign: 'right', color: balanceVal !== 0 ? '#ffd700' : '#5a4a3a', fontSize: '12px' }}>
                    {balanceVal > 0 ? `R+${balanceVal}` : balanceVal < 0 ? `L+${Math.abs(balanceVal)}` : '—'}
                  </div>
                  <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
                    <IndicatorLight on={isSelected && abIsPlaying} color="green" />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '12px', background: 'linear-gradient(90deg, #4a8b3b, #7ab648)', borderRadius: '2px' }} />
              <span style={{ color: '#8b7355', fontSize: '11px' }}>LEFT BOOST</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '12px', background: 'linear-gradient(90deg, #7ab648, #4a8b3b)', borderRadius: '2px' }} />
              <span style={{ color: '#8b7355', fontSize: '11px' }}>RIGHT BOOST</span>
            </div>
          </div>
        </div>

        {/* A/B Testing Panel */}
        <div style={{ ...styles.metalPlate, marginBottom: '20px' }}>
          <h3 style={{ color: '#d4a574', marginTop: 0, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IndicatorLight on={abIsPlaying} color="amber" />
            A/B Comparison Test
          </h3>
          
          <p style={{ color: '#8b7355', fontSize: '12px', marginBottom: '15px' }}>
            Click any frequency above to play it, then toggle between compensated and flat to verify calibration.
          </p>

          {abTestFreq ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={styles.frequencyDisplay}>
                  {FREQUENCY_BANDS.find(b => b.freq === abTestFreq)?.label}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#8b7355', fontSize: '10px', marginBottom: '4px' }}>CALIBRATION VALUE</div>
                  <div style={{ color: '#ffd700', fontSize: '18px' }}>
                    {calibrationData[abTestFreq] > 0 
                      ? `R+${calibrationData[abTestFreq]}` 
                      : calibrationData[abTestFreq] < 0 
                        ? `L+${Math.abs(calibrationData[abTestFreq])}` 
                        : 'CENTER'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  style={{
                    ...styles.button,
                    flex: 1,
                    ...(abIsCompensated ? { 
                      background: 'linear-gradient(180deg, #2d5a27 0%, #1a3a15 100%)',
                      border: '2px solid #4a8b3b',
                      color: '#7ab648',
                      boxShadow: '0 0 15px rgba(122, 182, 72, 0.3)',
                    } : {}),
                  }}
                  onClick={() => {
                    if (!abIsCompensated) toggleABCompensation();
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <IndicatorLight on={abIsCompensated} color="green" />
                    Compensated
                  </span>
                </button>
                <button
                  style={{
                    ...styles.button,
                    flex: 1,
                    ...(!abIsCompensated ? { 
                      background: 'linear-gradient(180deg, #5a4a14 0%, #3a3008 100%)',
                      border: '2px solid #8b7b1c',
                      color: '#ffd700',
                      boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)',
                    } : {}),
                  }}
                  onClick={() => {
                    if (abIsCompensated) toggleABCompensation();
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <IndicatorLight on={!abIsCompensated} color="amber" />
                    Flat (Center)
                  </span>
                </button>
              </div>

              <div style={{ 
                padding: '10px', 
                background: 'rgba(0,0,0,0.3)', 
                borderRadius: '4px',
                textAlign: 'center',
              }}>
                <span style={{ color: '#a89078', fontSize: '12px' }}>
                  {abIsCompensated 
                    ? '🎯 Playing with your calibration applied — should sound CENTERED'
                    : '⚖️ Playing flat (no compensation) — may sound off-center'}
                </span>
              </div>

              <button
                style={{ ...styles.button, width: '100%' }}
                onClick={() => {
                  stopABTone();
                  setAbTestFreq(null);
                }}
              >
                Stop Test
              </button>
            </div>
          ) : (
            <div style={{ 
              padding: '30px', 
              textAlign: 'center', 
              color: '#6b5b4b',
              border: '2px dashed #3a2a1a',
              borderRadius: '8px',
            }}>
              Click a frequency row above to start A/B testing
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            style={styles.button}
            onClick={() => {
              stopABTone();
              setAbTestFreq(null);
              setCurrentBandIndex(0);
              setBalance(calibrationData[FREQUENCY_BANDS[0].freq] || 0);
              setScreen('calibrate');
            }}
          >
            Recalibrate
          </button>
          <button
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={() => {
              stopABTone();
              setAbTestFreq(null);
              setScreen('export');
            }}
          >
            Export Profile →
          </button>
        </div>
      </div>
    </div>
  );

  // Render Export Screen
  const renderExport = () => (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={styles.woodPanel}>
        <h1 style={styles.title}>Export Profile</h1>
        <p style={styles.subtitle}>Choose Your Format</p>

        {/* EasyEffects - Primary */}
        <div style={{ ...styles.metalPlate, border: '2px solid #4a8b3b', marginBottom: '20px' }}>
          <h3 style={{ color: '#7ab648', marginTop: 0, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IndicatorLight on={true} color="green" />
            EasyEffects / PulseEffects (Linux)
          </h3>
          <p style={{ color: '#8b7355', fontSize: '12px', marginBottom: '15px' }}>
            Two separate APO files—import Left into the Left channel, Right into the Right channel.
            Make sure "Split Channels" is enabled first.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <div style={{ color: '#d4a574', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>Left Channel</div>
              <div style={{ ...styles.exportBox, maxHeight: '120px', fontSize: '11px' }}>
                {generateEqualizerAPO_Left()}
              </div>
              <button
                style={{ ...styles.button, width: '100%', marginTop: '10px', background: 'linear-gradient(180deg, #2d5a27 0%, #1a3a15 100%)', border: '2px solid #4a8b3b' }}
                onClick={() => downloadFile(generateEqualizerAPO_Left(), 'hearing-LEFT.txt')}
              >
                Download Left
              </button>
            </div>
            <div>
              <div style={{ color: '#d4a574', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>Right Channel</div>
              <div style={{ ...styles.exportBox, maxHeight: '120px', fontSize: '11px' }}>
                {generateEqualizerAPO_Right()}
              </div>
              <button
                style={{ ...styles.button, width: '100%', marginTop: '10px', background: 'linear-gradient(180deg, #2d5a27 0%, #1a3a15 100%)', border: '2px solid #4a8b3b' }}
                onClick={() => downloadFile(generateEqualizerAPO_Right(), 'hearing-RIGHT.txt')}
              >
                Download Right
              </button>
            </div>
          </div>
          
          <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
            <div style={{ color: '#ffd700', fontSize: '11px', marginBottom: '5px' }}>Quick Setup:</div>
            <ol style={{ color: '#a89078', fontSize: '11px', margin: 0, paddingLeft: '18px', lineHeight: '1.6' }}>
              <li>Enable "Split Channels" in EasyEffects Equalizer settings</li>
              <li>Click "Left" tab → Presets → Apply APO Preset → select hearing-LEFT.txt</li>
              <li>Click "Right" tab → Presets → Apply APO Preset → select hearing-RIGHT.txt</li>
              <li>Save as a new preset</li>
            </ol>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Equalizer APO - Windows */}
          <div style={styles.metalPlate}>
            <h3 style={{ color: '#d4a574', marginTop: 0, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <IndicatorLight on={true} color="amber" />
              Equalizer APO (Windows)
            </h3>
            <p style={{ color: '#8b7355', fontSize: '12px', marginBottom: '15px' }}>
              Combined L/R config for Windows.
            </p>
            <div style={{ ...styles.exportBox, maxHeight: '100px' }}>
              {generateEqualizerAPO()}
            </div>
            <button
              style={{ ...styles.button, ...styles.buttonPrimary, width: '100%', marginTop: '10px' }}
              onClick={() => downloadFile(generateEqualizerAPO(), 'hearing-compensation.txt')}
            >
              Download APO Config
            </button>
          </div>

          {/* Raw JSON backup */}
          <div style={styles.metalPlate}>
            <h3 style={{ color: '#d4a574', marginTop: 0, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <IndicatorLight on={true} color="amber" />
              Raw Calibration Data
            </h3>
            <p style={{ color: '#8b7355', fontSize: '12px', marginBottom: '15px' }}>
              Backup your calibration values.
            </p>
            <div style={{ ...styles.exportBox, maxHeight: '100px' }}>
              {generateJSON()}
            </div>
            <button
              style={{ ...styles.button, width: '100%', marginTop: '10px' }}
              onClick={() => downloadFile(generateJSON(), 'hearing-calibration.json', 'application/json')}
            >
              Download JSON
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            style={styles.button}
            onClick={() => setScreen('results')}
          >
            ← Back to Results
          </button>
          <button
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={() => {
              setScreen('welcome');
              setCurrentBandIndex(0);
              setCalibrationData({});
              setBalance(0);
            }}
          >
            Start New Calibration
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {screen === 'welcome' && renderWelcome()}
      {screen === 'calibrate' && renderCalibration()}
      {screen === 'results' && renderResults()}
      {screen === 'export' && renderExport()}
    </div>
  );
};

export default HearingCalibrator;
