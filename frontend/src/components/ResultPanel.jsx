import React from 'react'
import { TrendingUp, MessageCircle, Award, Target } from 'lucide-react'

const ResultPanel = ({ results }) => {
  const scores = results || {
    technicalScore: 0,
    confidenceScore: 0,
    communicationScore: 0,
    overallScore: 0
  }

  const ScoreCard = ({ title, score, icon: Icon, color }) => (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-3xl font-bold gradient-text">{score}%</div>
      </div>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card">
        <h2 className="text-2xl font-bold gradient-text mb-6">Performance Analysis</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ScoreCard
            title="Technical Score"
            score={scores.technicalScore}
            icon={Target}
            color="from-blue-500 to-cyan-500"
          />
          <ScoreCard
            title="Confidence Score"
            score={scores.confidenceScore}
            icon={TrendingUp}
            color="from-purple-500 to-pink-500"
          />
          <ScoreCard
            title="Communication"
            score={scores.communicationScore}
            icon={MessageCircle}
            color="from-green-500 to-emerald-500"
          />
          <ScoreCard
            title="Overall Score"
            score={scores.overallScore}
            icon={Award}
            color="from-orange-500 to-red-500"
          />
        </div>
      </div>

      {/* Confidence Map Placeholder */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Confidence Map</h3>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            Detailed confidence analysis will be displayed here after backend integration
          </p>
        </div>
      </div>

      {/* AI Feedback Placeholder */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-800 mb-4">AI Feedback</h3>
        <div className="space-y-3">
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-green-800">
              <strong>Strengths:</strong> Backend integration pending for detailed feedback
            </p>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <p className="text-yellow-800">
              <strong>Areas for Improvement:</strong> Backend integration pending for detailed feedback
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultPanel