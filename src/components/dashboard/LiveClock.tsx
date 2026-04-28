import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function LiveClock() {
  const [time, setTime] = useState(new Date());
  // Default to WIB (GMT+7)
  const [timezone, setTimezone] = useState(localStorage.getItem('timezone') || 'Asia/Jakarta');

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    const handleTimezoneChange = () => {
      setTimezone(localStorage.getItem('timezone') || 'Asia/Jakarta');
    };

    window.addEventListener('timezone-changed', handleTimezoneChange);
    return () => {
      clearInterval(timer);
      window.removeEventListener('timezone-changed', handleTimezoneChange);
    };
  }, []);

  const timeString = time.toLocaleTimeString('id-ID', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const timezoneLabel = timezone === 'Asia/Jakarta' ? 'WIB' : timezone === 'Asia/Makassar' ? 'WITA' : 'WIT';

  return (
    <div className="flex items-center gap-3 px-4 py-2 border border-slate-200 rounded-lg shadow-sm bg-white min-w-[120px]">
      <Clock className="w-4 h-4 text-slate-400" />
      <div className="flex flex-col items-center">
        <span className="text-sm font-bold text-slate-900 tabular-nums">
          {timeString}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase -mt-1 tracking-wider">
          {timezoneLabel}
        </span>
      </div>
    </div>
  );
}
