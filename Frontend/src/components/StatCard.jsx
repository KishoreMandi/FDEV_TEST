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

  // Card color schemes based on index
  const colorSchemes = [
    {
      gradient: "from-pink-500 via-purple-500 to-blue-500",
      bgGradient: "from-pink-50 to-blue-50",
      iconBg: "bg-gradient-to-br from-pink-500 to-purple-600",
      shadow: "hover:shadow-pink-500/20",
      border: "border-pink-200/50",
      glow: "group-hover:shadow-pink-400/30"
    },
    {
      gradient: "from-blue-500 via-purple-500 to-pink-500",
      bgGradient: "from-blue-50 to-pink-50",
      iconBg: "bg-gradient-to-br from-blue-500 to-purple-600",
      shadow: "hover:shadow-blue-500/20",
      border: "border-blue-200/50",
      glow: "group-hover:shadow-blue-400/30"
    },
    {
      gradient: "from-purple-500 via-pink-500 to-blue-500",
      bgGradient: "from-purple-50 to-pink-50",
      iconBg: "bg-gradient-to-br from-purple-500 to-pink-600",
      shadow: "hover:shadow-purple-500/20",
      border: "border-purple-200/50",
      glow: "group-hover:shadow-purple-400/30"
    },
    {
      gradient: "from-indigo-500 via-blue-500 to-pink-500",
      bgGradient: "from-indigo-50 to-blue-50",
      iconBg: "bg-gradient-to-br from-indigo-500 to-blue-600",
      shadow: "hover:shadow-indigo-500/20",
      border: "border-indigo-200/50",
      glow: "group-hover:shadow-indigo-400/30"
    }
  ];

  const scheme = colorSchemes[index % colorSchemes.length];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        bg-gradient-to-br ${scheme.bgGradient} p-6 border ${scheme.border}
        hover:scale-[1.02] hover:-translate-y-2 shadow-lg ${scheme.shadow} hover:shadow-2xl ${scheme.glow}
        cursor-pointer`}
    >
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-r ${scheme.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br ${scheme.gradient} rounded-full opacity-20 blur-xl group-hover:scale-150 group-hover:opacity-30 transition-all duration-700`} />
        <div className={`absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-br ${scheme.gradient} rounded-full opacity-15 blur-lg group-hover:scale-125 group-hover:opacity-25 transition-all duration-500 delay-100`} />
      </div>

      {/* Shimmer effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium mb-2 uppercase tracking-wider">
            {title}
          </p>
          <h3 className={`text-4xl font-bold bg-gradient-to-r ${scheme.gradient} bg-clip-text text-transparent`}>
            {isVisible && !isNaN(numericValue) ? `${count.toFixed(count % 1 === 0 ? 0 : 1)}${suffix}` : value}
          </h3>
        </div>
        
        {/* Animated icon container */}
        <div className={`${scheme.iconBg} p-3 rounded-xl shadow-lg transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300`}>
          {Icon && <Icon className="w-6 h-6 text-white" />}
        </div>
      </div>

      {/* Bottom animated line */}
      <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${scheme.gradient} w-0 group-hover:w-full transition-all duration-500`} />
    </div>
  );
};

export default StatCard;