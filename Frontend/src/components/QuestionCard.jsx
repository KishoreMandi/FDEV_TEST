const QuestionCard = ({ question, selectedOption, onSelect }) => {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="font-semibold mb-4">{question.question}</h2>

      <div className="space-y-3">
        {question.options.map((opt, index) => (
          <label
            key={index}
            className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 group ${
              selectedOption !== undefined && selectedOption !== null && String(selectedOption) === String(index)
                ? "bg-blue-50 border-blue-600 shadow-sm"
                : "bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50"
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${
               selectedOption !== undefined && selectedOption !== null && String(selectedOption) === String(index)
                ? "border-blue-600"
                : "border-gray-300 group-hover:border-blue-400"
            }`}>
              {selectedOption !== undefined && selectedOption !== null && String(selectedOption) === String(index) && (
                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
              )}
            </div>
            <input
              type="radio"
              name="option"
              className="hidden" // Hide default radio, use custom one above
              checked={selectedOption !== undefined && selectedOption !== null && String(selectedOption) === String(index)}
              onChange={() => onSelect(index)}
            />
            <span className={`text-base font-medium ${
               selectedOption !== undefined && selectedOption !== null && String(selectedOption) === String(index)
               ? "text-blue-900"
               : "text-gray-700"
            }`}>
              {opt}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
