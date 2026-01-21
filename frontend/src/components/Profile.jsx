import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area
} from 'recharts'
import { getDailyProgressTimeline } from '../utils/dailyProgressManager.js'
import React, { useState } from 'react'
import Navbar from './Navbar'
import { User, Mail, Calendar, Award, Edit2, Save } from 'lucide-react'

const Profile = ({ user, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    username: user.username,
    email: user.email,
    joinDate: 'December 2025',
    totalInterviews: 45,
    averageScore: 82
  })

  const handleSave = () => {
    setIsEditing(false)
    // TODO: API call to update profile
  }
const [dailyTimeline, setDailyTimeline] = useState([])
React.useEffect(() => {
  if (!user?.email) return
  const timeline = getDailyProgressTimeline(user.email)
  setDailyTimeline(timeline)
}, [user])
 
const weeklyAvgData = (() => {
  const weeks = []
  let lastAvg = 0

  for (let i = 0; i < dailyTimeline.length; i += 7) {
    const weekSlice = dailyTimeline.slice(i, i + 7)

    const validDays = weekSlice.filter(d => d.didPractice)

    if (validDays.length > 0) {
      const avg =
        validDays.reduce((sum, d) => {
          return sum + (
            (d.technicalScore +
             d.communicationScore +
             d.confidenceScore) / 3
          )
        }, 0) / validDays.length

      lastAvg = Math.round(avg)
    }

    weeks.push({
  week: `Week ${weeks.length + 1}`,
  avgScore: lastAvg,        // for LINE
  avgScoreArea: lastAvg    // for AREA
})

  }

  // 👉 show only latest 5 weeks (sliding window)
  return weeks.slice(-5)
})()

  return (
    <div className="min-h-screen">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold gradient-text">My Profile</h1>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Edit2 className="w-5 h-5" />
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {profileData.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{profileData.username}</h2>
                <p className="text-gray-600">{profileData.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-6 h-6 text-blue-600" />
                  <h3 className="font-semibold text-gray-700">Username</h3>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                    className="input-field"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{profileData.username}</p>
                )}
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-6 h-6 text-purple-600" />
                  <h3 className="font-semibold text-gray-700">Email</h3>
                </div>
                {isEditing ? (
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="input-field"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{profileData.email}</p>
                )}
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-6 h-6 text-green-600" />
                  <h3 className="font-semibold text-gray-700">Member Since</h3>
                </div>
                <p className="text-gray-800 font-medium">{profileData.joinDate}</p>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-6 h-6 text-orange-600" />
                  <h3 className="font-semibold text-gray-700">Total Interviews</h3>
                </div>
                <p className="text-gray-800 font-medium text-2xl">{profileData.totalInterviews}</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-center text-white">
             
              <h3 className="text-xl font-semibold mb-2">Average Score</h3>
              <p className="text-5xl font-bold">{profileData.averageScore}%</p>
              <p className="mt-2 opacity-90">Keep up the great work!</p>
            </div>


           <div
  className="
    relative z-10
    rounded-2xl p-8
     bg-gradient-to-r from-yellow-100 to-yellow-100
    shadow-2xl
    -mt-6
  "
> 
           <div className="relative mt-10">




  <h3 className="text-xl font-bold text-blue-800 mb-4 text-center">
    Weekly Average Score Progress
  </h3>
<p className="text-sm text-grey-500 text-center mb-2">
  {weeklyAvgData.at(-1)?.avgScore > weeklyAvgData.at(-2)?.avgScore
    ? '📈 Improving'
    : '📉 Needs consistency'}
</p>

  <ResponsiveContainer width="100%" height={280}>
    <LineChart data={weeklyAvgData}>

      <CartesianGrid strokeDasharray="3 3" opacity={0.4} />

      <XAxis
        dataKey="week"
        interval={0}
      />

      <YAxis
        domain={[0, 100]}
        ticks={[0, 20, 40, 60, 80, 100]}
        allowDecimals={false}
      />

      <Tooltip
  formatter={(value, name, props) => {
    // show tooltip ONLY for Line, ignore Area
    if (props.dataKey !== 'avgScore' || props.payload?.__isArea) {
      return null
    }
    return [`${value}%`, 'Average Score']
  }}
  labelFormatter={(label) => label}
  contentStyle={{
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'white',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    fontSize: '14px'
  }}
/>

<defs>
  <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.9} />
    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.2} />
  </linearGradient>

  <filter id="glow">
    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
    <feMerge>
      <feMergeNode in="coloredBlur" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
</defs>
<Area
  type="monotone"
  dataKey="avgScoreArea"
  fill="url(#weeklyAreaGradient)"
  stroke="none"
  isAnimationActive
/>



     <Line
  type="monotone"
  dataKey="avgScore"
  stroke="#7c3aed"
  strokeWidth={4}
  dot={{ r: 5, fill: '#7c3aed' }}
  activeDot={{ r: 7 }}
/>


<defs>
  <linearGradient id="weeklyAreaGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#facc15" stopOpacity={0.35} />
    <stop offset="50%" stopColor="#fde68a" stopOpacity={0.18} />
    <stop offset="100%" stopColor="#fde68a" stopOpacity={0} />
  </linearGradient>
</defs>

    </LineChart>
  </ResponsiveContainer>
</div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default Profile