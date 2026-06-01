import { useEffect, useRef } from 'react';

interface VictoryModalProps {
  gameName: string;
  onClose: () => void;
}

const COLORS = ['#f5a623', '#4CAF50', '#ce93d8', '#ff5252', '#ffe082', '#00e5ff', '#ff6d00'];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export default function VictoryModal({ gameName, onClose }: VictoryModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtx = useRef<AudioContext | null>(null);

  // Конфетти
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({ length: 180 }, () => ({
      x: randomBetween(0, canvas.width),
      y: randomBetween(-canvas.height * 0.5, 0),
      w: randomBetween(6, 14),
      h: randomBetween(10, 22),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: randomBetween(0, Math.PI * 2),
      spin: randomBetween(-0.12, 0.12),
      vx: randomBetween(-2, 2),
      vy: randomBetween(3, 7),
    }));

    let raf: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        ctx.save();
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        p.vy += 0.07;
      });
      raf = requestAnimationFrame(draw);
    }
    draw();

    const timer = setTimeout(() => cancelAnimationFrame(raf), 5000);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, []);

  // Фанфары — синтетический звук
  useEffect(() => {
    try {
      const ctx = new AudioContext();
      audioCtx.current = ctx;

      const notes = [523, 659, 784, 1047, 784, 1047, 1319];
      const times = [0, 0.12, 0.24, 0.38, 0.52, 0.64, 0.78];

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + times[i]);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + times[i] + 0.02);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + times[i] + 0.18);
        osc.start(ctx.currentTime + times[i]);
        osc.stop(ctx.currentTime + times[i] + 0.2);
      });
    } catch { /* ignore */ }

    return () => { audioCtx.current?.close(); };
  }, []);

  // Автозакрытие через 6 сек
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />
      <div
        className="relative z-10 flex flex-col items-center gap-4 px-8 py-8 rounded-2xl text-center animate-scale-in"
        style={{
          background: 'linear-gradient(160deg, rgba(20,15,5,0.97) 0%, rgba(10,6,2,0.97) 100%)',
          border: '2px solid rgba(245,166,35,0.6)',
          boxShadow: '0 0 60px rgba(245,166,35,0.4), 0 0 120px rgba(245,166,35,0.15)',
          maxWidth: '340px',
          width: '90vw',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: '4rem', lineHeight: 1 }}>🏆</div>
        <div
          className="font-montserrat font-black text-2xl"
          style={{
            background: 'linear-gradient(135deg, #fff7c0, #f5a623, #c97b00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          ПОБЕДА!
        </div>
        <div className="text-sm text-muted-foreground">
          Вы победили в игре
        </div>
        <div
          className="font-montserrat font-700 text-base px-4 py-1.5 rounded-lg"
          style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--gold)', border: '1px solid rgba(245,166,35,0.3)' }}
        >
          {gameName}
        </div>
        <button
          onClick={onClose}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
