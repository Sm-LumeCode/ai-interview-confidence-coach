import React, { useState } from 'react'
import Navbar from './Navbar'
import { User, Mail, Calendar, Award, Edit2, Save, X } from 'lucide-react'
import { getDailyProgressTimeline } from '../utils/dailyProgressManager.js'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const Profile = ({ user, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    username: user.username,
    email: user.email,
    joinDate: 'January 2026',
  })

  const timeline = getDailyProgressTimeline(user.email)
  const totalQuestions = timeline.reduce((s, d) => s + (d.questionCount || 0), 0)
  const validDays = timeline.filter(d => d.technicalScore !== null)
  const avgScore = validDays.length
    ? Math.round(validDays.reduce((s, d) => s + ((d.technicalScore + (d.confidenceScore || 0)) / 2), 0) / validDays.length)
    : 0

  // weekly chart
  const weeklyData = (() => {
    const weeks = []
    for (let i = 0; i < timeline.length; i += 7) {
      const slice = timeline.slice(i, i + 7).filter(d => d.technicalScore !== null)
      if (slice.length > 0) {
        const avg = Math.round(slice.reduce((s, d) => s + ((d.technicalScore + (d.confidenceScore || 0)) / 2), 0) / slice.length)
        weeks.push({ week: `W${weeks.length + 1}`, score: avg })
      } else {
        weeks.push({ week: `W${weeks.length + 1}`, score: null })
      }
    }
    return weeks.slice(-6)
  })()

  const handleSave = () => setIsEditing(false)

  const InfoRow = ({ icon: Icon, label, value, editable, field }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={18} color="#64748b" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginBottom: 2 }}>{label}</p>
        {isEditing && editable ? (
          <input
            className="input-field"
            style={{ padding: '6px 10px', fontSize: 14 }}
            value={profileData[field]}
            onChange={e => setProfileData({ ...profileData, [field]: e.target.value })}
          />
        ) : (
          <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{value}</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="app-layout">
      <Navbar user={user} onLogout={onLogout} />

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account and view your stats</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>
          {/* Left: Profile card */}
          <div>
            <div className="card animate-slide-up" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 className="card-title" style={{ marginBottom: 0 }}>Account</h2>
                {!isEditing ? (
                  <button className="btn-secondary" onClick={() => setIsEditing(true)}
                    style={{ padding: '6px 14px', fontSize: 13 }}>
                    <Edit2 size={14} /> Edit
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-secondary" onClick={() => setIsEditing(false)}
                      style={{ padding: '6px 12px', fontSize: 13 }}>
                      <X size={14} />
                    </button>
                    <button className="btn-primary" onClick={handleSave}
                      style={{ padding: '6px 14px', fontSize: 13 }}>
                      <Save size={14} /> Save
                    </button>
                  </div>
                )}
              </div>

              {/* Avatar */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 800, fontSize: 28, margin: '0 auto 12px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}>
                  {profileData.username.charAt(0).toUpperCase()}
                </div>
                <p style={{ fontWeight: 700, fontSize: 18, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {profileData.username}
                </p>
                <p style={{ fontSize: 13, color: '#64748b' }}>{profileData.email}</p>
              </div>

              <InfoRow icon={User} label="Username" value={profileData.username} editable field="username" />
              <InfoRow icon={Mail} label="Email" value={profileData.email} editable field="email" />
              <InfoRow icon={Calendar} label="Member Since" value={profileData.joinDate} />
            </div>

            {/* Score card */}
            <div className="card animate-slide-up" style={{ animationDelay: '100ms', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Overall Average Score</p>
              <div style={{
                width: 100, height: 100, borderRadius: '50%', margin: '0 auto 12px',
                background: avgScore >= 70 ? '#d1fae5' : avgScore >= 50 ? '#fef3c7' : '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 28,
                  color: avgScore >= 70 ? '#065f46' : avgScore >= 50 ? '#92400e' : '#991b1b'
                }}>
                  {avgScore}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{totalQuestions}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>Questions</p>
                </div>
                <div style={{ width: 1, background: '#e2e8f0' }} />
                <div>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{timeline.filter(d => d.didPractice).length}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>Practice Days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Weekly chart */}
          <div className="card animate-fade-in">
            <h2 className="card-title">Weekly Performance</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, marginTop: -8 }}>
              Average score per week of practice
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                  formatter={(v) => [`${v}%`, 'Avg Score']}
                />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5}
                  dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }}
                  connectNulls={false} animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>

            {weeklyData.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                <Award size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p style={{ fontSize: 14 }}>Start practicing to see your progress here</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Profile