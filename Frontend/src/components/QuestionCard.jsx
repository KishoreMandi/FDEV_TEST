const QuestionCard = ({ question, selectedOption, onSelect }) => {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="font-semibold mb-4">{question.question}</h2>

      <div className="space-y-3">
        {question.options.map((opt, index) => (
          <label
            key={index}
            className={`flex items-center p-3 border rounded cursor-pointer ${
              selectedOption === index
                ? "bg-blue-100 border-blue-500"
                : "hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="option"
              className="mr-3"
              checked={selectedOption === index}
              onChange={() => onSelect(index)}
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
