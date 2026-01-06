const QuestionCard = ({ question, keywords, index, total }) => {
  return (
    <div className="bg-white p-6 rounded shadow mb-6">
      <p className="text-gray-500 mb-2">
        Question {index + 1} of {total}
      </p>

      <h2 className="text-xl font-semibold mb-4">
        {question}
      </h2>

      {keywords && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((k, i) => (
            <span
              key={i}
              className="bg-gray-200 px-3 py-1 rounded text-sm"
            >
              {k}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
