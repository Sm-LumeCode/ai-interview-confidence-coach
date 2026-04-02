import React, { useState } from 'react'
import Navbar from './Navbar'
import { User, Mail, Calendar, Award, Edit2, Save, X } from 'lucide-react'
import { getDailyProgressTimeline } from '../utils/dailyProgressManager.js'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Label
} from 'recharts'

// Format ISO date → "12 April 2025"
function formatJoinDate(isoString) {
  if (!isoString) return 'Unknown'
  const d = new Date(isoString)
  if (isNaN(d)) return 'Unknown'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

const Profile = ({ user, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    username: user.username,
    email: user.email,
  })

  // Read the real first-login date saved by App.jsx handleLogin
  const joinKey = `join_date_${user.email}`
  const joinDate = formatJoinDate(localStorage.getItem(joinKey))

  const timeline = getDailyProgressTimeline(user.email)
  const totalQuestions = timeline.reduce((s, d) => s + (d.questionCount || 0), 0)
  const validDays = timeline.filter(d => d.technicalScore !== null)
  const avgScore = validDays.length
    ? Math.round(validDays.reduce((s, d) => s + ((d.technicalScore + (d.confidenceScore || 0)) / 2), 0) / validDays.length)
    : 0

  // Weekly chart data — label as "Week 1", "Week 2", etc.
  const weeklyData = (() => {
    const weeks = []
    for (let i = 0; i < timeline.length; i += 7) {
      const slice = timeline.slice(i, i + 7).filter(d => d.technicalScore !== null)
      const weekNum = weeks.length + 1
      if (slice.length > 0) {
        const avg = Math.round(
          slice.reduce((s, d) => s + ((d.technicalScore + (d.confidenceScore || 0)) / 2), 0) /
          slice.length
        )
        weeks.push({ week: `Week ${weekNum}`, score: avg })
      } else {
        weeks.push({ week: `Week ${weekNum}`, score: null })
      }
    }
    return weeks.slice(-6)
  })()

  const handleSave = () => setIsEditing(false)

  const InfoRow = ({ icon: Icon, label, value, editable, field }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 0', borderBottom: '1px solid #f1f5f9'
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={17} color="#64748b" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
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

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
        padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
      }}>
        <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{label}</p>
        <p style={{ color: '#10b981' }}>Score: <strong>{payload[0].value}%</strong></p>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Navbar user={user} onLogout={onLogout} />

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account and view your stats</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>

          {/* ── Left column ── */}
          <div>
            {/* Account card */}
            <div className="card animate-slide-up" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h2 className="card-title" style={{ marginBottom: 0 }}>Account</h2>
                {!isEditing ? (
                  <button className="btn-secondary" onClick={() => setIsEditing(true)}
                    style={{ padding: '5px 13px', fontSize: 13 }}>
                    <Edit2 size={13} /> Edit
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-secondary" onClick={() => setIsEditing(false)}
                      style={{ padding: '5px 10px', fontSize: 13 }}>
                      <X size={13} />
                    </button>
                    <button className="btn-primary" onClick={handleSave}
                      style={{ padding: '5px 13px', fontSize: 13 }}>
                      <Save size={13} /> Save
                    </button>
                  </div>
                )}
              </div>

              {/* Avatar */}
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div style={{
                  width: 68, height: 68, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 800, fontSize: 26, margin: '0 auto 10px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: '0 4px 16px rgba(16,185,129,0.3)'
                }}>
                  {profileData.username.charAt(0).toUpperCase()}
                </div>
                <p style={{ fontWeight: 700, fontSize: 17, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {profileData.username}
                </p>
                <p style={{ fontSize: 13, color: '#64748b' }}>{profileData.email}</p>
              </div>

              <InfoRow icon={User}     label="Username"     value={profileData.username} editable field="username" />
              <InfoRow icon={Mail}     label="Email"        value={profileData.email}    editable field="email" />
              <InfoRow icon={Calendar} label="Member Since" value={joinDate} />
            </div>

            {/* Score card */}
            <div className="card animate-slide-up" style={{ animationDelay: '100ms', textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Overall Average Score
              </p>
              <div style={{
                width: 96, height: 96, borderRadius: '50%', margin: '0 auto 16px',
                background: avgScore >= 70 ? '#d1fae5' : avgScore >= 50 ? '#fef3c7' : '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: avgScore >= 70
                  ? '0 4px 16px rgba(16,185,129,0.2)'
                  : avgScore >= 50 ? '0 4px 16px rgba(245,158,11,0.2)'
                  : '0 4px 16px rgba(239,68,68,0.15)'
              }}>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 26,
                  color: avgScore >= 70 ? '#065f46' : avgScore >= 50 ? '#92400e' : '#991b1b'
                }}>
                  {avgScore}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 28 }}>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{totalQuestions}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>Questions</p>
                </div>
                <div style={{ width: 1, background: '#e2e8f0' }} />
                <div>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {timeline.filter(d => d.didPractice).length}
                  </p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>Practice Days</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column: Weekly chart ── */}
          <div className="card animate-fade-in">
            <h2 className="card-title">Weekly Performance</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24, marginTop: -8 }}>
              Average score per week of practice
            </p>

            {weeklyData.filter(w => w.score !== null).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={weeklyData}
                  margin={{ top: 10, right: 20, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  >
                    {/* X-axis label */}
                    <Label
                      value="Week"
                      offset={-10}
                      position="insideBottom"
                      style={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    />
                  </XAxis>

                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    tickFormatter={v => `${v}%`}
                  >
                    {/* Y-axis label */}
                    <Label
                      value="Score (%)"
                      angle={-90}
                      position="insideLeft"
                      offset={-10}
                      style={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    />
                  </YAxis>

                  <Tooltip content={<CustomTooltip />} />

                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 5, strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: '#059669' }}
                    connectNulls={false}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                <Award size={44} style={{ margin: '0 auto 14px', opacity: 0.35 }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                  No data yet
                </p>
                <p style={{ fontSize: 13 }}>
                  Complete practice sessions to see your weekly progress here
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Profile