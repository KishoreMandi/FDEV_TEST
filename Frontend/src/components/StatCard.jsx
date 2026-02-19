import { useEffect, useState } from "react";

const StatCard = ({ title, value, icon: Icon, index = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [count, setCount] = useState(0);

  // Extract numeric value for animation
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
  const suffix = typeof value === 'string' ? value.replace(/[0-9.]/g, '') : '';

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    if (!isVisible || isNaN(numericValue)) return;
    
    const duration = 1500;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    
    const counter = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setCount(numericValue);
        clearInterval(counter);
      } else {
        setCount(Math.floor(current * 10) / 10);
      }
    }, duration / steps);

    return () => clearInterval(counter);
  }, [isVisible, numericValue]);

  const colorSchemes = [
    {
      accent: "text-indigo-600",
      accentBg: "bg-indigo-50",
      border: "border-indigo-100",
      bar: "bg-indigo-500"
    },
    {
      accent: "text-sky-600",
      accentBg: "bg-sky-50",
      border: "border-sky-100",
      bar: "bg-sky-500"
    },
    {
      accent: "text-emerald-600",
      accentBg: "bg-emerald-50",
      border: "border-emerald-100",
      bar: "bg-emerald-500"
    },
    {
      accent: "text-rose-600",
      accentBg: "bg-rose-50",
      border: "border-rose-100",
      bar: "bg-rose-500"
    }
  ];

  const scheme = colorSchemes[index % colorSchemes.length];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        bg-white p-6 border ${scheme.border}
        hover:-translate-y-1 hover:shadow-md shadow-sm
        cursor-default`}
    >
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-500 text-xs font-medium mb-1 uppercase tracking-wide">
            {title}
          </p>
          <h3 className={`text-3xl font-semibold ${scheme.accent}`}>
            {isVisible && !isNaN(numericValue) ? `${count.toFixed(count % 1 === 0 ? 0 : 1)}${suffix}` : value}
          </h3>
        </div>
        
        <div className={`${scheme.accentBg} text-slate-700 p-3 rounded-full flex items-center justify-center`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>

      <div className={`absolute bottom-0 left-0 h-1 ${scheme.bar} w-full`} />
    </div>
  );
};

export default StatCard;
