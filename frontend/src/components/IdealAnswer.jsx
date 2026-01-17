import React from 'react'
import { BookOpen, CheckCircle, Lightbulb } from 'lucide-react'

const IdealAnswer = ({ idealAnswer }) => {
  if (!idealAnswer) return null

  const { full_answer, sections, word_count } = idealAnswer

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
          <Lightbulb className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Ideal Answer (DPMA Structure)</h3>
          <p className="text-sm text-gray-600">Follow this structure for perfect answers • {word_count} words</p>
        </div>
      </div>

      {/* Full Answer */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-lg mb-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-green-700" />
          <h4 className="font-semibold text-green-800">Complete Answer:</h4>
        </div>
        <p className="text-gray-800 leading-relaxed whitespace-pre-line">
          {full_answer}
        </p>
      </div>

      {/* DPMA Breakdown */}
      <div className="space-y-4">
        <h4 className="font-bold text-gray-800 text-lg mb-4">Structure Breakdown (DPMA):</h4>

        {/* Definition */}
        {sections.definition && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <h5 className="font-semibold text-blue-800">1. Definition</h5>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {sections.definition}
            </p>
          </div>
        )}

        {/* Process */}
        {sections.process && (
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <h5 className="font-semibold text-purple-800">2. Process</h5>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {sections.process}
            </p>
          </div>
        )}

        {/* Method */}
        {sections.method && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-amber-600" />
              <h5 className="font-semibold text-amber-800">3. Method</h5>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {sections.method}
            </p>
          </div>
        )}

        {/* Application */}
        {sections.application && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h5 className="font-semibold text-green-800">4. Application</h5>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {sections.application}
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <p className="text-yellow-800 text-sm">
          <strong>💡 Tip:</strong> Use this structure in your next answer: Start with a clear definition, 
          explain the process step-by-step, describe the method/technique, and finish with real-world applications.
        </p>
      </div>
    </div>
  )
}

export default IdealAnswer