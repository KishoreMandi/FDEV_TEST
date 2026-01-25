import { useEffect, useState } from "react";

const Timer = ({ duration, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div
      className={`px-4 py-2 rounded text-white font-semibold ${
        timeLeft < 300 ? "bg-red-600" : "bg-green-600"
      }`}
    >
      ⏱ {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  );
};

export default Timer;
