import React from 'react'
import Navbar from './Navbar'
import { Trophy, Star, Lock, Zap, Target, Users, Calendar, Crown } from 'lucide-react'
import { getChallengeData } from '../utils/ChallengeManager'

const Challenges = ({ user, onLogout }) => {
  const { totalPoints } = getChallengeData(user.email)

  const challenges = [
    { id: 1, title: 'Speed Demon', description: 'Complete 10 questions in under 2 minutes each', icon: Zap, progress: 7, total: 10, points: 500, locked: false, color: '#f59e0b', colorLight: '#fef3c7' },
    { id: 2, title: 'Perfect Score', description: 'Achieve 100% score in any category', icon: Target, progress: 0, total: 1, points: 1000, locked: false, color: '#3b82f6', colorLight: '#dbeafe' },
    { id: 3, title: 'Category Master', description: 'Complete all questions in one category', icon: Crown, progress: 27, total: 831, points: 750, locked: false, color: '#8b5cf6', colorLight: '#ede9fe' },
    { id: 4, title: 'Consistency King', description: 'Complete interviews for 7 consecutive days', icon: Calendar, progress: 3, total: 7, points: 600, locked: false, color: '#10b981', colorLight: '#d1fae5' },
    { id: 5, title: 'Grand Master', description: 'Complete all categories with 90%+ average', icon: Trophy, progress: 0, total: 5, points: 2000, locked: true, color: '#64748b', colorLight: '#f1f5f9' },
    { id: 6, title: 'Communication Expert', description: 'Achieve 95%+ communication score in 5 interviews', icon: Users, progress: 0, total: 5, points: 800, locked: false, color: '#ec4899', colorLight: '#fce7f3' },
  ]

  const completedCount = challenges.filter(c => c.progress >= c.total && !c.locked).length

  return (
    <div className="app-layout">
      <Navbar user={user} onLogout={onLogout} />

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Challenges</h1>
          <p className="page-subtitle">Complete challenges to earn points and unlock achievements</p>
        </div>

        {/* Top stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <div className="stat-card animate-slide-up">
            <div className="stat-card-icon" style={{ background: '#fef3c7' }}>
              <Star size={18} color="#f59e0b" />
            </div>
            <p className="stat-card-label">Total Points</p>
            <p className="stat-card-value">{totalPoints || 520}</p>
          </div>
          <div className="stat-card animate-slide-up" style={{ animationDelay: '80ms' }}>
            <div className="stat-card-icon" style={{ background: '#d1fae5' }}>
              <Trophy size={18} color="#10b981" />
            </div>
            <p className="stat-card-label">Completed</p>
            <p className="stat-card-value">{completedCount}/{challenges.filter(c => !c.locked).length}</p>
          </div>
          <div className="stat-card animate-slide-up" style={{ animationDelay: '160ms' }}>
            <div className="stat-card-icon" style={{ background: '#ede9fe' }}>
              <Lock size={18} color="#8b5cf6" />
            </div>
            <p className="stat-card-label">Locked</p>
            <p className="stat-card-value">{challenges.filter(c => c.locked).length}</p>
          </div>
        </div>

        {/* Challenges grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {challenges.map((ch, i) => {
            const Icon = ch.icon
            const pct = Math.round((ch.progress / ch.total) * 100)
            const done = ch.progress >= ch.total && !ch.locked

            return (
              <div
                key={ch.id}
                className="card animate-slide-up"
                style={{
                  animationDelay: `${i * 60}ms`,
                  opacity: ch.locked ? 0.6 : 1,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {done && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: '#d1fae5', color: '#065f46',
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999
                  }}>
                    COMPLETED
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: ch.locked ? '#f1f5f9' : ch.colorLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {ch.locked
                      ? <Lock size={20} color="#94a3b8" />
                      : <Icon size={20} color={ch.color} />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 3
                    }}>
                      {ch.title}
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b' }}>{ch.description}</p>
                  </div>
                  {!ch.locked && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                      background: '#fef3c7', padding: '4px 10px', borderRadius: 999
                    }}>
                      <Star size={12} color="#f59e0b" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>{ch.points}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
                    <span>Progress</span>
                    <span>{ch.progress}/{ch.total} · {pct}%</span>
                  </div>
                  <div className="progress-bar-track" style={{ height: 7 }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: ch.locked ? '#cbd5e1' : done ? '#10b981' : ch.color
                      }}
                    />
                  </div>
                </div>

                {ch.locked && (
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>
                    🔒 Complete previous challenges to unlock
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Recent achievements */}
        <div className="card animate-fade-in" style={{ marginTop: 24 }}>
          <h2 className="card-title">Recent Achievements</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: Zap, color: '#f59e0b', bg: '#fef3c7', title: 'Speed Demon Progress', desc: 'Completed 7 out of 10 fast questions', time: '1 day ago' },
              { icon: Trophy, color: '#10b981', bg: '#d1fae5', title: 'First Interview', desc: 'Completed your first practice session', time: '1 day ago' },
            ].map((a, i) => {
              const Icon = a.icon
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 0', borderBottom: i === 0 ? '1px solid #f1f5f9' : 'none'
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: a.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Icon size={18} color={a.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{a.title}</p>
                    <p style={{ fontSize: 13, color: '#64748b' }}>{a.desc}</p>
                  </div>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{a.time}</span>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Challenges