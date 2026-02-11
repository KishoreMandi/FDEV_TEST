const QuestionPalette = ({ total, answers, current, onSelect, marked }) => {
  return (
    <div className="flex flex-wrap gap-2 justify-start">
      {Array.from({ length: total }).map((_, index) => {
        let bgClass = "bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200"; // Default: Not visited/unanswered
        
        if (current === index) {
          bgClass = "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200 ring-offset-1"; // Current
        } else if (marked.has(index)) {
          bgClass = "bg-purple-600 text-white border-purple-600"; // Marked for Review
        } else if (answers[index] !== undefined) {
          bgClass = "bg-green-500 text-white border-green-500"; // Answered
        }

        return (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`w-9 h-9 text-xs rounded-md font-bold flex items-center justify-center transition-all ${bgClass}`}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
};

export default QuestionPalette;
