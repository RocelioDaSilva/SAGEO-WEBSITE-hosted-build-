import { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer() {
  const targetDate = new Date('2026-11-23T09:00:00').getTime();
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 p-4 bg-slate-950/40 border border-[#dfac34]/15 backdrop-blur-md rounded-2xl max-w-lg mx-auto">
      <div className="text-center min-w-[70px]">
        <div className="font-mono text-3xl md:text-4xl font-bold text-[#dfac34] bg-[#dfac34]/5 px-3 py-2 rounded-xl border border-[#dfac34]/15">
          {String(timeLeft.days).padStart(2, '0')}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-amber-500/80 font-bold mt-1.5 block font-mono">Dias</span>
      </div>
      <span className="text-xl font-bold text-[#dfac34]/40 self-start mt-2">:</span>
      <div className="text-center min-w-[70px]">
        <div className="font-mono text-3xl md:text-4xl font-bold text-[#dfac34] bg-[#dfac34]/5 px-3 py-2 rounded-xl border border-[#dfac34]/15">
          {String(timeLeft.hours).padStart(2, '0')}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-amber-500/80 font-bold mt-1.5 block font-mono">Horas</span>
      </div>
      <span className="text-xl font-bold text-[#dfac34]/40 self-start mt-2">:</span>
      <div className="text-center min-w-[70px]">
        <div className="font-mono text-3xl md:text-4xl font-bold text-[#dfac34] bg-[#dfac34]/5 px-3 py-2 rounded-xl border border-[#dfac34]/15">
          {String(timeLeft.minutes).padStart(2, '0')}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-amber-500/80 font-bold mt-1.5 block font-mono">Minutos</span>
      </div>
      <span className="text-xl font-bold text-[#dfac34]/40 self-start mt-2">:</span>
      <div className="text-center min-w-[70px]">
        <div className="font-mono text-3xl md:text-4xl font-bold text-[#dfac34] bg-[#dfac34]/5 px-3 py-2 rounded-xl border border-[#dfac34]/15">
          {String(timeLeft.seconds).padStart(2, '0')}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-amber-500/80 font-bold mt-1.5 block font-mono">Segundos</span>
      </div>
    </div>
  );
}
