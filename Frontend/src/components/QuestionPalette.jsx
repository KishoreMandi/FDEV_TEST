const QuestionPalette = ({ total, answers, current, onSelect, marked }) => {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: total }).map((_, index) => {
        let bgClass = "bg-gray-300"; // Default: Not visited/unanswered
        
        if (current === index) {
          bgClass = "bg-yellow-400 border-2 border-blue-600"; // Current
        } else if (marked.has(index)) {
          bgClass = "bg-purple-600 text-white"; // Marked for Review
        } else if (answers[index] !== undefined) {
          bgClass = "bg-green-500 text-white"; // Answered
        }

        return (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`w-10 h-10 rounded font-semibold flex items-center justify-center ${bgClass}`}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
};

export default QuestionPalette;
