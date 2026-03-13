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
    joinDate: 'January 2026',
    totalInterviews: 50,
    averageScore: 52
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
 
// STEP 1: build weekly average data
const weeklyAvgData = (() => {
  const weeks = []
  let lastAvg = null

  for (let i = 0; i < dailyTimeline.length; i += 7) {
    const weekSlice = dailyTimeline.slice(i, i + 7)

    const validDays = weekSlice.filter(
      d => typeof d.technicalScore === 'number' &&
           typeof d.confidenceScore === 'number'
    )

    let avg = lastAvg
    let absent = true

    if (validDays.length > 0) {
      avg =
        validDays.reduce((sum, d) => {
          return sum + ((d.technicalScore + d.confidenceScore) / 2)
        }, 0) / validDays.length

      avg = Math.round(avg)
      lastAvg = avg
      absent = false
    }

    weeks.push({
      week: `Week ${weeks.length + 1}`,
      avgScore: avg,
      absent
    })
  }

  // show only last 5 weeks (sliding)
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
                  <h3 className="font-semibold text-gray-700">Total Questions</h3>
                </div>
                <p className="text-gray-800 font-medium text-2xl">{profileData.totalInterviews}</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-center text-white">
             
              <h3 className="text-xl font-semibold mb-2">Average Score</h3>
              <p className="text-5xl font-bold">{profileData.averageScore}%</p>
              <p className="mt-2 opacity-90">Keep up the great work!</p>
            </div>


      
 </div>
          </div>
        </div>
      </div>
       
    
  )
}

export default Profile