"use client";

import { useState, useEffect } from "react";

const targetDate = new Date("2027-03-03T09:00:00");

const emptyTimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

const getTimeLeft = () => {
  const diff = targetDate.getTime() - new Date().getTime();
  if (diff <= 0) return emptyTimeLeft;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState(emptyTimeLeft);

  useEffect(() => {
    setTimeLeft(getTimeLeft());
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const units = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Minutes" },
    { value: timeLeft.seconds, label: "Seconds" },
  ];

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {units.map((unit) => (
        <div key={unit.label} className="rounded-md border border-teal/15 bg-teal/5 px-1.5 py-2 text-center">
          <div className="font-display text-2xl font-extrabold text-teal">
            {String(unit.value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            {unit.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CountdownTimer;
