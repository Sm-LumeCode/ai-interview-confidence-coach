import Navbar from './Navbar'
import { TrendingUp, Award, Target, CheckCircle } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { getDailyProgressTimeline } from '../utils/dailyProgressManager.js'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { getCategoryProgress } from '../utils/categoryProgressManager'
import { CATEGORY_TOTALS } from '../utils/categoryProgressManager'
import { ReferenceLine } from 'recharts'

const Progress = ({ user, onLogout }) => {
  // Mock data - replace with actual API data
   
  const categories = [
  'Software Development',
  'Data & Analytics',
  'Data Science & ML',
  'Cloud & DevOps',
  'Cybersecurity',
  'HR Round'
]
const CATEGORY_KEY_MAP = {
  'Software Development': 'software_development',
  'Data & Analytics': 'data_analytics',
  'Data Science & ML': 'data_science_ml',
  'Cloud & DevOps': 'cloud_devops',
  'Cybersecurity': 'cybersecurity',
  'HR Round': 'hr_round'
}

const categoryProgress = categories.map(cat => {
  const key = CATEGORY_KEY_MAP[cat] 
  const data = getCategoryProgress(user.email, cat)

  if (!data) {
    return {
      name: cat,
      completed: 0,
      total: CATEGORY_TOTALS[cat]||0,
      score: 0
      
    }
  }

  const avgScore =
    [...data.technicalScores, ...data.confidenceScores]
      .reduce((a, b) => a + b, 0) /
    (data.technicalScores.length + data.confidenceScores.length)

  return {
    name: cat,
    completed: data.completed,
    total: CATEGORY_TOTALS[cat]||0,
    score: Math.round(avgScore)
  }
})


  const [dailyTimeline, setDailyTimeline] = useState([])

useEffect(() => {
  if (!user?.email) return

  const timeline = getDailyProgressTimeline(user.email)
  setDailyTimeline(timeline)
}, [user])
const strongestCategory =
  categoryProgress.every(cat => cat.score === 0)
    ? 'Not enough data yet'
    : categoryProgress.reduce(
        (best, current) => (current.score > best.score ? current : best),
        categoryProgress[0]
      ).name


const practicedDays = dailyTimeline.filter(d => d.didPractice).length

const avgTechnical =
  dailyTimeline.filter(d => d.technicalScore !== null)
    .reduce((sum, d) => sum + d.technicalScore, 0) /
  (dailyTimeline.filter(d => d.technicalScore !== null).length || 1)

const avgConfidence =
  dailyTimeline.filter(d => d.confidenceScore !== null)
    .reduce((sum, d) => sum + d.confidenceScore, 0) /
  (dailyTimeline.filter(d => d.confidenceScore !== null).length || 1)

const overallAverage = Math.round((avgTechnical + avgConfidence) / 2)
const technicalScore = Math.round(avgTechnical) || 0
const communicationScore = Math.round(avgConfidence) || 0

const totalQuestions = dailyTimeline.reduce(
  (sum, d) => sum + (d.questionCount || 0),
  0
)

const last7Days = dailyTimeline.slice(-7)
const currentDayIndex = dailyTimeline.length
  ? Math.min(dailyTimeline.length, 7)
  : 1

const currentDayLabel = `Day ${currentDayIndex}`
const totalDays = dailyTimeline.length
const startDay = Math.max(1, totalDays - 6)

const chartData = Array.from({ length: 7 }, (_, i) => {
  const dayData = dailyTimeline[startDay - 1 + i]

  return {
    day: `Day ${startDay + i}`,
    technical: dayData?.didPractice ? dayData.technicalScore : null,
    communication: dayData?.didPractice ? dayData.confidenceScore : null,
    date: dayData?.date || null
  }
})

  return (
    <div className="min-h-screen">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8 animate-fade-in">Progress Tracking</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="card animate-slide-up">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Questions Answered</p>
                <p className="text-2xl font-bold text-gray-800">{totalQuestions}</p>
              </div>
            </div>
          </div>

          <div className="card animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Challenges Done</p>
                <p className="text-2xl font-bold text-gray-800">{practicedDays}</p>
              </div>
            </div>
          </div>

          <div className="card animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
               <p className="text-gray-600 text-sm">Technical Score</p>
<p className="text-2xl font-bold text-gray-800">{technicalScore}%</p>

              </div>
            </div>
          </div>

          <div className="card animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Communication Score</p>
                <p className="text-2xl font-bold text-gray-800">{communicationScore}%</p>

              </div>
            </div>
          </div>
          <div className="card animate-slide-up" style={{ animationDelay: '400ms' }}>
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
      <Award className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-gray-600 text-sm">Best Category</p>
      <p className="text-lg font-bold text-gray-800">{strongestCategory}</p>
    </div>
  </div>
</div>

        </div>
        
        {/* Category Progress */}
        <div className="card animate-fade-in">
          <h2 className="text-2xl font-bold gradient-text mb-6">Category Progress</h2>
          
          <div className="space-y-6">
            {categoryProgress.map((category, index) => (
              <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{category.name}</h3>
                  <span className="text-sm text-gray-600">
                    {category.completed}/{category.total} completed • Score: {category.score}%
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000 ease-out"
                    style={{
  width:
    category.total > 0
      ? `${(category.completed / category.total) * 100}%`
      : '0%'
}}

                  ></div>
                </div>
              </div>
            ))}
            <div className="mt-12 mb-8 text-center">
  <h2 className="text-3xl font-bold text-purple-700">
    Daily Performance Insights
  </h2>
  <p className="mt-2 text-sm text-gray-600">
    Track how your skills improve every day
  </p>
</div>



            {/* Daily Progress Graphs */}
        <div className="mt-12 rounded-2xl bg-purple-400 p-8">


<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
  
  {/* Technical Score Graph */}
  <div className="bg-white rounded-xl p-6 shadow-md">
    <h2 className="text-xl font-bold text-blue-900 mb-4">
      Technical Progress (Day-wise)
    </h2>
    <div className="rounded-xl p-4 bg-white shadow-md overflow-visible">


    <ResponsiveContainer width="100%" height={300}>
      <LineChart
  data={chartData}
  margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
>

        <CartesianGrid strokeDasharray="3 3" opacity={0.5} />

<ReferenceLine
  x={currentDayLabel}
  stroke="#f2a918"
  strokeWidth={2}
  strokeDasharray="4 4"
  label={{
    value: 'Today',
    position: 'top',
    fill: '#d29e1c',
    fontSize: 12,
    fontWeight: 600
  }}
/>
       <XAxis
  dataKey="day"
  scale="point"
  interval={0}
  padding={{left:20, right:20}}
  tick={{ fontSize: 12 }}
/>

       <YAxis
  domain={[0, 100]}
  ticks={[0, 20, 40, 60, 80, 100]}
  allowDecimals={false}
  allowDataOverflow
  hide={false}
  tick={{ fill: '#1f2937', fontSize: 12, fontWeight: 500 }}
  axisLine={{ stroke: '#374151' }}
  tickLine={{ stroke: '#374151' }}
/>



       <Tooltip
  formatter={(value, name, props) => [
    value,
    name === 'technical' ? 'Technical Score' : 'Communication Score'
  ]}
  labelFormatter={(label, payload) => {
    const date = payload?.[0]?.payload?.date
    return date ? `Date: ${date}` : label
  }}
  contentStyle={{
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
  }}
/>

        <Line
  type="monotone"
  dataKey="technical"
  stroke="#3b82f6"
  strokeWidth={3}
  dot={{ fill: '#3b82f6', r: 4 }}
  activeDot={{ r: 6 }}
  connectNulls={false}
  isAnimationActive
  animationDuration={1200}
/>

      </LineChart>
    </ResponsiveContainer>
    </div>
     </div>

  {/* Communication Score Graph */}
  <div className="bg-white rounded-xl p-6 shadow-md">


    <h2 className="text-xl font-bold text-blue-900 mb-4">
      Communication Progress (Day-wise)
    </h2>
<div className="rounded-xl p-4 bg-white shadow-md overflow-visible">

    <ResponsiveContainer width="100%" height={300}>
      <LineChart
  data={chartData}
  margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
>

        <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
    
<ReferenceLine
  x={currentDayLabel}
  stroke="#f2a918"
  strokeWidth={2}
  strokeDasharray="4 4"
  label={{
    value: 'Today',
    position: 'top',
    fill: '#d29e1c',
    fontSize: 12,
    fontWeight: 600
  }}
/>
        <XAxis
  dataKey="day"
  scale="point"
  interval={0}
  padding={{left:20, right:20}}
  tick={{ fontSize: 12 }}
/>
        <YAxis
  domain={[0, 100]}
  ticks={[0, 20, 40, 60, 80, 100]}
  allowDecimals={false}
  allowDataOverflow
  hide={false}
  tick={{ fill: '#1f2937', fontSize: 12, fontWeight: 500 }}
  axisLine={{ stroke: '#374151' }}
  tickLine={{ stroke: '#374151' }}
/>



       <Tooltip
  formatter={(value, name, props) => [
    value,
    name === 'technical' ? 'Technical Score' : 'Communication Score'
  ]}
  labelFormatter={(label, payload) => {
    const date = payload?.[0]?.payload?.date
    return date ? `Date: ${date}` : label
  }}
  contentStyle={{
    borderRadius: '8px',
    fontSize: '14px',
    border: 'none',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
  }}
/>


        <Line
  type="monotone"
  dataKey="communication"
  stroke="#22c55e"
  strokeWidth={3}
  dot={{ fill: '#22c55e', r: 4 }}
  activeDot={{ r: 6 }}
  connectNulls={false}
  isAnimationActive
  animationDuration={1200}
/>

      </LineChart>
    </ResponsiveContainer>
    </div>
  </div>

</div>

          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default Progress