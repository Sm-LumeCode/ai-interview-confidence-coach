import React from 'react'
import { TrendingUp, MessageCircle, Award, Target, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

const ResultPanel = ({ results }) => {
  const scores = results
    ? {
        technicalScore: results.technical_score ?? 0,
        confidenceScore: results.confidence_score ?? 0,
        communicationScore: results.communication_score ?? 0,
        overallScore: results.overall_score ?? 0,
        feedback: results.brief_feedback ?? '',
        strengths: results.strengths || [],
        improvements: results.improvements || [],
        fillerWords: results.filler_words_analysis || null,
        keywordCoverage: results.keyword_coverage || null,
      }
    : null

  if (!scores) return null

  const ScoreCard = ({ title, score, icon: Icon, color }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-3xl font-bold text-beige-800">{score}%</div>
      </div>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Performance Analysis
      */}
<div className="card">
<h2 className="text-2xl font-bold text-beige-800 mb-6">Performance Analysis</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <ScoreCard
        title="Technical Score"
        score={scores.technicalScore}
        icon={Target}
        color="from-amber-500 to-amber-700"
      />
      <ScoreCard
        title="Confidence Score"
        score={scores.confidenceScore}
        icon={TrendingUp}
        color="from-beige-500 to-beige-700"
      />
      <ScoreCard
        title="Communication"
        score={scores.communicationScore}
        icon={MessageCircle}
        color="from-amber-600 to-beige-600"
      />
      <ScoreCard
        title="Overall Score"
        score={scores.overallScore}
        icon={Award}
        color="from-beige-600 to-amber-800"
      />
    </div>
  </div>

  {/* Keyword Coverage */}
  {scores.keywordCoverage && (
    <div className="card">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Target className="w-6 h-6 text-amber-700" />
        Keyword Coverage: {scores.keywordCoverage.coverage_percentage}%
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scores.keywordCoverage.covered.length > 0 && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-800">Covered Keywords</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {scores.keywordCoverage.covered.map((keyword, idx) => (
                <span key={idx} className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {scores.keywordCoverage.missing.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-red-800">Missing Keywords</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {scores.keywordCoverage.missing.map((keyword, idx) => (
                <span key={idx} className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )}

  {/* Filler Words Analysis */}
  {scores.fillerWords && scores.fillerWords.total_count > 0 && (
    <div className="card">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-yellow-600" />
        Filler Words Detected: {scores.fillerWords.total_count}
      </h3>
      
      <div className={`border-l-4 p-4 rounded ${
        scores.fillerWords.total_count > 10 
          ? 'bg-red-50 border-red-500' 
          : scores.fillerWords.total_count > 5 
          ? 'bg-yellow-50 border-yellow-500'
          : 'bg-blue-50 border-blue-500'
      }`}>
        <p className={`mb-3 ${
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
          {Object.entries(scores.fillerWords.filler_details).map(([word, count]) => (
            <span key={word} className="bg-gray-200 px-3 py-1 rounded-full text-sm">
              {word}: <strong>{count}</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* AI Feedback */}
  <div className="card">
    <h3 className="text-xl font-bold text-gray-800 mb-4">AI Feedback</h3>
    
    {scores.feedback && (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
        <p className="text-blue-800">{scores.feedback}</p>
      </div>
    )}

    {scores.strengths.length > 0 && (
      <div className="mb-4">
        <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Strengths
        </h4>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          {scores.strengths.map((strength, idx) => (
            <li key={idx}>{strength}</li>
          ))}
        </ul>
      </div>
    )}

    {scores.improvements.length > 0 && (
      <div>
        <h4 className="font-semibold text-amber-700 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Areas for Improvement
        </h4>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          {scores.improvements.map((improvement, idx) => (
            <li key={idx}>{improvement}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
</div>
)
}
export default ResultPanel