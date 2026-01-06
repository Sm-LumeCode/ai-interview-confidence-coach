import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import QuestionCard from "./QuestionCard";
import Recorder from "./Recorder";
import ResultPanel from "./ResultPanel";

const InterviewSession = () => {
  const { category } = useParams(); // MUST match App.jsx
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const data = await api.getQuestions(category);
        setQuestions(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load interview questions");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [category]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-xl">
        Loading interview questions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="h-screen flex items-center justify-center">
        No questions found
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen px-6 py-4 bg-yellow-400">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold uppercase">
          {category.replace("_", " ")} Interview
        </h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-white px-4 py-2 rounded"
        >
          Back
        </button>
      </div>

      {/* Question */}
      <QuestionCard
        question={currentQuestion.question}
        keywords={currentQuestion.keywords}
        index={currentIndex}
        total={questions.length}
      />

      {/* Recorder */}
      <Recorder />

      {/* Navigation */}
      <div className="flex justify-end mt-6">
        <button
          disabled={currentIndex === questions.length - 1}
          onClick={() => setCurrentIndex((i) => i + 1)}
          className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Next Question
        </button>
      </div>

      <ResultPanel />
    </div>
  );
};

export default InterviewSession;