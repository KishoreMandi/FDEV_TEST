const QuestionPalette = ({ total, answers, current, onSelect }) => {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={`w-10 h-10 rounded font-semibold ${
            current === index
              ? "bg-yellow-400"
              : answers[index] !== undefined
              ? "bg-green-500 text-white"
              : "bg-gray-300"
          }`}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
};

export default QuestionPalette;
