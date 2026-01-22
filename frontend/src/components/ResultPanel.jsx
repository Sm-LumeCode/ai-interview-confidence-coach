import React from 'react'
import { TrendingUp, MessageCircle, Award, Target, AlertTriangle, CheckCircle, XCircle, List, Zap } from 'lucide-react'

const ResultPanel = ({ results }) => {
  const scores = results
    ? {
        technicalScore: results.technical_score ?? 0,
        structureScore: results.structure_score ?? 0,
        confidenceScore: results.confidence_score ?? 0,
        communicationScore: results.communication_score ?? 0,
        overallScore: results.overall_score ?? 0,
        feedback: results.brief_feedback ?? '',
        strengths: results.strengths || [],
        improvements: results.improvements || [],
        fillerWords: results.filler_words_analysis || null,
        keywordCoverage: results.keyword_coverage || null,
        structureAnalysis: results.structure_analysis || null,
        structureDetection: results.structure_detection || null,
      }
    : null

  if (!scores) return null

  const ScoreCard = ({ title, score, icon: Icon, color }) => (
    <div className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-3xl font-bold text-beige-800">{score}%</div>
      </div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-700'
    if (score >= 60) return 'text-yellow-700'
    return 'text-red-700'
  }

  const getScoreBadge = (score) => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-800' }
    if (score >= 75) return { label: 'Good', color: 'bg-blue-100 text-blue-800' }
    if (score >= 60) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Needs Work', color: 'bg-red-100 text-red-800' }
  }

  const badge = getScoreBadge(scores.overallScore)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overall Score Banner */}
      <div className="card bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-600">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Overall Performance</h2>
            <p className="text-gray-600 text-sm">{scores.feedback}</p>
          </div>
          <div className="text-center">
            <div className={`text-5xl font-bold ${getScoreColor(scores.overallScore)} mb-2`}>
              {scores.overallScore}%
            </div>
            <span className={`px-4 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
              {badge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Technical"
          score={scores.technicalScore}
          icon={Target}
          color="from-amber-500 to-amber-700"
        />
        <ScoreCard
          title="Structure (DPMA)"
          score={scores.structureScore}
          icon={List}
          color="from-purple-500 to-purple-700"
        />
        <ScoreCard
          title="Communication"
          score={scores.communicationScore}
          icon={MessageCircle}
          color="from-blue-500 to-blue-700"
        />
        <ScoreCard
          title="Confidence"
          score={scores.confidenceScore}
          icon={TrendingUp}
          color="from-green-500 to-green-700"
        />
      </div>

      {/* Quick Feedback Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        {scores.strengths.length > 0 && (
          <div className="card bg-green-50 border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-bold text-green-800">What You Did Well</h3>
            </div>
            <ul className="space-y-2">
              {scores.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-green-700">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {scores.improvements.length > 0 && (
          <div className="card bg-amber-50 border-l-4 border-amber-500">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-6 h-6 text-amber-600" />
              <h3 className="text-lg font-bold text-amber-800">Quick Wins</h3>
            </div>
            <ul className="space-y-2">
              {scores.improvements.map((improvement, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-amber-700">
                  <span className="text-amber-600 mt-0.5">→</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* DPMA Structure Quick View */}
      {(scores.structureAnalysis || scores.structureDetection) && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <List className="w-5 h-5 text-purple-700" />
            DPMA Structure Check
            <span className="text-sm font-normal text-gray-600">
              ({scores.structureDetection?.components_present || 0}/4 components)
            </span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Definition */}
            <div className={`p-3 rounded-lg text-center ${
              (scores.structureAnalysis?.definition_present || scores.structureDetection?.structure_found?.definition)
                ? 'bg-green-100 border-2 border-green-400'
                : 'bg-red-100 border-2 border-red-400'
            }`}>
              {(scores.structureAnalysis?.definition_present || scores.structureDetection?.structure_found?.definition) ? (
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
              )}
              <h4 className="font-semibold text-sm">Definition</h4>
            </div>

            {/* Process */}
            <div className={`p-3 rounded-lg text-center ${
              (scores.structureAnalysis?.process_present || scores.structureDetection?.structure_found?.process)
                ? 'bg-green-100 border-2 border-green-400'
                : 'bg-red-100 border-2 border-red-400'
            }`}>
              {(scores.structureAnalysis?.process_present || scores.structureDetection?.structure_found?.process) ? (
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
              )}
              <h4 className="font-semibold text-sm">Process</h4>
            </div>

            {/* Method */}
            <div className={`p-3 rounded-lg text-center ${
              (scores.structureAnalysis?.method_present || scores.structureDetection?.structure_found?.method)
                ? 'bg-green-100 border-2 border-green-400'
                : 'bg-red-100 border-2 border-red-400'
            }`}>
              {(scores.structureAnalysis?.method_present || scores.structureDetection?.structure_found?.method) ? (
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
              )}
              <h4 className="font-semibold text-sm">Method</h4>
            </div>

            {/* Application */}
            <div className={`p-3 rounded-lg text-center ${
              (scores.structureAnalysis?.application_present || scores.structureDetection?.structure_found?.application)
                ? 'bg-green-100 border-2 border-green-400'
                : 'bg-red-100 border-2 border-red-400'
            }`}>
              {(scores.structureAnalysis?.application_present || scores.structureDetection?.structure_found?.application) ? (
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
              )}
              <h4 className="font-semibold text-sm">Application</h4>
            </div>
          </div>
        </div>
      )}

      {/* Keyword & Filler Words - Compact View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Keywords */}
        {scores.keywordCoverage && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-600" />
                Keywords
              </h3>
              <span className={`text-lg font-bold ${
                scores.keywordCoverage.coverage_percentage >= 70 ? 'text-green-600' : 'text-red-600'
              }`}>
                {scores.keywordCoverage.coverage_percentage}%
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {scores.keywordCoverage.covered.slice(0, 5).map((kw, i) => (
                <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                  ✓ {kw}
                </span>
              ))}
              {scores.keywordCoverage.missing.slice(0, 3).map((kw, i) => (
                <span key={i} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                  ✗ {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filler Words */}
        {scores.fillerWords && scores.fillerWords.total_count > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                Filler Words
              </h3>
              <span className={`text-lg font-bold ${
                scores.fillerWords.total_count > 5 ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {scores.fillerWords.total_count}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(scores.fillerWords.filler_details).slice(0, 6).map(([word, count]) => (
                <span key={word} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                  {word} ({count})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResultPanel