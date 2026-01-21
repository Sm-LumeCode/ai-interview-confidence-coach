import React from 'react'
import {
  TrendingUp,
  MessageCircle,
  Award,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  List,
  Lightbulb,
  BookOpen,
  TrendingDown,
  Plus
} from 'lucide-react'

const ResultPanel = ({ results }) => {
  const scores = results
    ? {
        technicalScore: results.technical_score ?? 0,
        structureScore: results.structure_score ?? 0,
        confidenceScore: results.confidence_score ?? 0,
        communicationScore: results.communication_score ?? 0,
        overallScore: results.overall_score ?? 0,
        feedback: results.brief_feedback ?? '',
        strengths: Array.isArray(results.strengths) ? results.strengths : [],
        improvements: Array.isArray(results.improvements) ? results.improvements : [],
        fillerWords: results.filler_words_analysis || null,
        keywordCoverage: results.keyword_coverage || null,
        structureAnalysis: results.structure_analysis || null,
        structureDetection: results.structure_detection || null,
        llmFeedback: results.llm_structured_feedback || null,
        llmMethod: results.llm_feedback_method || 'not_generated',
      }
    : null

  if (!scores) return null

  const ScoreCard = ({ title, score, icon: Icon, color }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center shadow-md`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-3xl font-bold text-gray-800">{score}%</div>
      </div>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Performance Analysis */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Performance Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <ScoreCard title="Technical Score" score={scores.technicalScore} icon={Target} color="bg-blue-600" />
          <ScoreCard title="Structure Score" score={scores.structureScore} icon={List} color="bg-purple-600" />
          <ScoreCard title="Confidence Score" score={scores.confidenceScore} icon={TrendingUp} color="bg-green-600" />
          <ScoreCard title="Communication" score={scores.communicationScore} icon={MessageCircle} color="bg-orange-600" />
          <ScoreCard title="Overall Score" score={scores.overallScore} icon={Award} color="bg-indigo-600" />
        </div>
      </div>

      {/* Keyword Coverage */}
      {scores.keywordCoverage && (
        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Keyword Coverage: {scores.keywordCoverage.coverage_percentage ?? 0}%
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(scores.keywordCoverage.covered || []).length > 0 && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-800">Covered Keywords</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(scores.keywordCoverage.covered || []).slice(0, 5).map((kw, i) => (
                    <span key={i} className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(scores.keywordCoverage.missing || []).length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-800">Missing Keywords</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(scores.keywordCoverage.missing || []).slice(0, 5).map((kw, i) => (
                    <span key={i} className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filler Words */}
      {scores.fillerWords && scores.fillerWords.total_count > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            Filler Words Detected: {scores.fillerWords.total_count ?? 0}
          </h3>

          <div className={`border-l-4 p-4 rounded ${
            scores.fillerWords.total_count > 10 
              ? 'bg-red-50 border-red-500' 
              : scores.fillerWords.total_count > 5 
              ? 'bg-yellow-50 border-yellow-500'
              : 'bg-blue-50 border-blue-500'
          }`}>
            <p className={`mb-3 text-sm ${
              scores.fillerWords.total_count > 10 
                ? 'text-red-800' 
                : scores.fillerWords.total_count > 5 
                ? 'text-yellow-800'
                : 'text-blue-800'
            }`}>
              {scores.fillerWords.total_count > 10 
                ? '⚠️ High usage of filler words - work on speaking more fluently'
                : scores.fillerWords.total_count > 5 
                ? '⚠️ Moderate filler words - try to reduce for better confidence'
                : '✓ Acceptable filler word usage'}
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(scores.fillerWords.filler_details || {})
                .slice(0, 8)
                .map(([word, count]) => (
                  <span key={word} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {word}: <strong>{count}</strong>
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Basic Feedback */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          Quick Feedback
        </h3>

        {scores.feedback && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
            <p className="text-blue-900 font-medium">{scores.feedback}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scores.strengths.length > 0 && (
            <div>
              <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Strengths
              </h4>
              <ul className="space-y-2">
                {scores.strengths.slice(0, 3).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-600 mt-1">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {scores.improvements.length > 0 && (
            <div>
              <h4 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Quick Improvements
              </h4>
              <ul className="space-y-2">
                {scores.improvements.slice(0, 3).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* AI STRUCTURED FEEDBACK - NEW SECTION */}
      {scores.llmFeedback && (
        <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">AI Structured Feedback</h3>
              <p className="text-sm text-gray-600">
                Personalized insights based on your answer
                {scores.llmMethod === 'fallback_generated' && ' (Fallback mode)'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What You Covered */}
            {scores.llmFeedback.what_you_covered && scores.llmFeedback.what_you_covered.length > 0 && (
              <div className="bg-white rounded-lg p-5 shadow-md border-l-4 border-green-500">
                <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2 text-lg">
                  <CheckCircle className="w-5 h-5" />
                  What You Covered Well
                </h4>
                <ul className="space-y-2">
                  {scores.llmFeedback.what_you_covered.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-green-600 font-bold mt-1">✓</span>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What You Missed */}
            {scores.llmFeedback.what_you_missed && scores.llmFeedback.what_you_missed.length > 0 && (
              <div className="bg-white rounded-lg p-5 shadow-md border-l-4 border-red-500">
                <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2 text-lg">
                  <TrendingDown className="w-5 h-5" />
                  What You Missed
                </h4>
                <ul className="space-y-2">
                  {scores.llmFeedback.what_you_missed.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-red-600 font-bold mt-1">✗</span>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* How to Improve */}
            {scores.llmFeedback.how_to_improve && scores.llmFeedback.how_to_improve.length > 0 && (
              <div className="bg-white rounded-lg p-5 shadow-md border-l-4 border-blue-500">
                <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2 text-lg">
                  <Lightbulb className="w-5 h-5" />
                  How to Improve
                </h4>
                <ul className="space-y-2">
                  {scores.llmFeedback.how_to_improve.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-blue-600 font-bold mt-1">→</span>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Additions */}
            {scores.llmFeedback.suggested_additions && scores.llmFeedback.suggested_additions.length > 0 && (
              <div className="bg-white rounded-lg p-5 shadow-md border-l-4 border-purple-500">
                <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2 text-lg">
                  <Plus className="w-5 h-5" />
                  Suggested Additions
                </h4>
                <ul className="space-y-2">
                  {scores.llmFeedback.suggested_additions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-purple-600 font-bold mt-1">+</span>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Learning Tip */}
          <div className="mt-6 bg-white rounded-lg p-4 border-2 border-indigo-200">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <h5 className="font-semibold text-indigo-900 mb-1">💡 Pro Tip</h5>
                <p className="text-sm text-gray-700">
                  Use the "What You Missed" section to enhance your next answer. Focus on adding those concepts to strengthen your technical depth.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading state if LLM feedback is being generated */}
      {!scores.llmFeedback && (
        <div className="card bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600">Generating AI structured feedback...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultPanel