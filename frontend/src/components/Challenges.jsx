import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import {
  Trophy, Star, Lock, Zap, Target, Users, Calendar, Crown,
  CheckCircle, Shield, Medal, Award
} from 'lucide-react'
import { getChallengeData, getEnrichedChallenges, LEVELS } from '../utils/ChallengeManager'
import { getDailyProgressTimeline } from '../utils/dailyProgressManager'
import { motion } from 'framer-motion'

const ICON_MAP = { Zap, Target, Users, Calendar, Crown, Trophy, Shield, Medal, Award }

const getRank = (points) => {
  if (points < 1000) return { name: 'Bronze Novice', icon: Shield, color: '#10b981', bg: '#d1fae5', next: 1000 }
  if (points < 2500) return { name: 'Silver Pro', icon: Medal, color: '#34d399', bg: '#ecfdf5', next: 2500 }
  if (points < 5000) return { name: 'Gold Expert', icon: Award, color: '#059669', bg: '#a7f3d0', next: 5000 }
  return { name: 'Diamond Master', icon: Crown, color: '#047857', bg: '#6ee7b7', next: null }
}

const InteractiveRoadmapContainer = ({ children }) => {
  const [ripples, setRipples] = useState([])

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    // Calculate position relative to the scrolled content
    const x = (e.clientX - rect.left) + e.currentTarget.scrollLeft
    const y = (e.clientY - rect.top) + e.currentTarget.scrollTop
    
    const id = Date.now()
    setRipples(prev => [...prev, { x, y, id }])
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 1000)
  }

  return (
    <div 
      onClick={handleClick}
      className="hide-scroll"
      style={{ 
        flex: 1, display: 'flex', overflowX: 'auto',
        padding: '40px 40px', alignItems: 'center', position: 'relative',
        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', // Light green landing page match
        borderRadius: 24, border: '1px solid #a7f3d0',
        boxShadow: 'inset 0 2px 20px rgba(16,185,129,0.05)',
        minHeight: 620, marginBottom: 40,
        overflowY: 'hidden', cursor: 'crosshair'
      }}
    >
      {/* Background ambient animations */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }}>
         <div style={{ position: 'absolute', width: '100%', height: '200%', top: '-50%', left: 0, background: 'radial-gradient(circle at 50% 50%, rgba(52, 211, 153, 0.15) 0%, transparent 50%)', animation: 'spinAmbient 20s linear infinite' }} />
         <div style={{ position: 'absolute', width: '100%', height: '200%', top: '-50%', right: 0, background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)', animation: 'spinAmbient 25s linear infinite reverse' }} />
      </div>

      {/* Render Ripples */}
      {ripples.map(r => (
         <motion.div 
           key={r.id}
           initial={{ width: 0, height: 0, opacity: 0.6, x: r.x, y: r.y }}
           animate={{ width: 300, height: 300, opacity: 0, x: r.x - 150, y: r.y - 150 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           style={{
             position: 'absolute',
             borderRadius: '50%',
             border: '2px solid #059669',
             background: 'rgba(16, 185, 129, 0.15)',
             pointerEvents: 'none',
             zIndex: 0
           }}
         />
      ))}

      {/* Content wrapper */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}

const RoadPaths = ({ nodes }) => {
  const totalWidth = nodes.length * 280

  return (
    <svg style={{ position: 'absolute', left: 60, top: 0, width: totalWidth, height: 600, zIndex: 0, pointerEvents: 'none', overflow: 'visible' }}>
      {/* Adjusted shadow opacity for lighter green background */}
      <filter id="road-shadow" x="-10%" y="-20%" width="120%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#0f172a" floodOpacity={0.15} />
      </filter>

      {/* Unified Road Base */}
      <g filter="url(#road-shadow)">
        <path 
           d={`M -60,${(nodes[0]?.y || 0) + 300} L 140,${(nodes[0]?.y || 0) + 300}`} 
           fill="none" stroke={nodes[0]?.isCompleted ? '#10b981' : '#1e293b'} strokeWidth="48" strokeLinecap="round" 
        />
        {nodes.map((node, i) => {
           if (i === nodes.length - 1) return null
           const nextNode = nodes[i+1]
           const startX = i * 280 + 140
           const endX = (i+1) * 280 + 140
           return (
             <path 
                key={`road-${i}`}
                d={`M ${startX},${node.y + 300} C ${startX + 120},${node.y + 300} ${endX - 120},${nextNode.y + 300} ${endX},${nextNode.y + 300}`}
                fill="none" stroke={node.isCompleted ? '#10b981' : '#1e293b'} strokeWidth="48"
                style={{ transition: 'stroke 0.5s ease' }}
             />
           )
        })}
        <path 
           d={`M ${(nodes.length - 1) * 280 + 140},${(nodes[nodes.length - 1]?.y || 0) + 300} L ${(nodes.length - 1) * 280 + 200},${(nodes[nodes.length - 1]?.y || 0) + 300}`} 
           fill="none" stroke={nodes[nodes.length - 1]?.isCompleted ? '#10b981' : '#1e293b'} strokeWidth="48" strokeLinecap="round" 
        />
      </g>

      {/* Unified Dashed Lines */}
      <path 
         d={`M -60,${(nodes[0]?.y || 0) + 300} L 140,${(nodes[0]?.y || 0) + 300}`} 
         fill="none" stroke="#ffffff" strokeWidth="4" strokeDasharray="14 14" 
      />
      {nodes.map((node, i) => {
         if (i === nodes.length - 1) return null
         const nextNode = nodes[i+1]
         const startX = i * 280 + 140
         const endX = (i+1) * 280 + 140
         return (
           <path 
              key={`dash-${i}`}
              d={`M ${startX},${node.y + 300} C ${startX + 120},${node.y + 300} ${endX - 120},${nextNode.y + 300} ${endX},${nextNode.y + 300}`}
              fill="none" stroke="#ffffff" strokeWidth="4" strokeDasharray="14 14"
           />
         )
      })}
    </svg>
  )
}

const ChallengeNode = ({ ch, index, nodeNum, yOffset, isCompleted, onStart }) => {
  const isTop = yOffset < 0
  const Icon = ICON_MAP[ch.icon] || Trophy
  const pct = ch.metricTotal > 0 ? Math.round((ch.metricProgress / ch.metricTotal) * 100) : 0

  return (
    <div style={{ width: 280, height: 600, position: 'relative', flexShrink: 0 }}>
      
      {/* Giant Number Background */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: `translate(-50%, calc(-50% + ${isTop ? 140 : -140}px))`,
        fontSize: 180, fontWeight: 900,
        color: '#10b981', 
        zIndex: 0, userSelect: 'none', letterSpacing: '-0.05em',
        opacity: 0.15
      }}>
        {String(nodeNum).padStart(2, '0')}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: isTop ? 20 : -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        style={{
          position: 'absolute', top: '50%', left: '50%', 
          transform: `translate(-50%, calc(-50% + ${yOffset}px))`,
          zIndex: 20
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: '50%', 
          background: ch.completed ? '#10b981' : '#1e293b',
          border: `4px solid #fff`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
        }}>
          {ch.locked ? <Lock size={20} color="#94a3b8" /> : <Icon size={24} color="#fff" />}
        </div>

        <div style={{
          position: 'absolute',
          [isTop ? 'bottom' : 'top']: '100%',
          left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: isTop ? 'column' : 'column-reverse',
          alignItems: 'center',
          marginTop: isTop ? 0 : 8,
          marginBottom: isTop ? 8 : 0,
        }}>
          {/* White connecting pointer */}
          <div style={{
            width: 0, height: 0,
            borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
            [isTop ? 'borderTop' : 'borderBottom']: `10px solid #ffffff`,
            zIndex: 5
          }} />

          {/* White Card */}
          <motion.div
            onClick={(e) => e.stopPropagation()} // Prevent triggering background ripple
            whileHover={{ scale: ch.locked ? 1 : 1.02 }}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: 20, padding: '20px', width: 240,
              boxShadow: ch.locked ? 'inset 0 0 0 1px #e2e8f0, 0 8px 24px rgba(0,0,0,0.02)' : `0 12px 30px rgba(0,0,0,0.08)`,
              opacity: ch.locked ? 0.7 : 1,
              border: ch.locked ? 'none' : `1px solid ${ch.color}20`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{ch.title}</h4>
              {ch.completed && <CheckCircle size={18} color="#10b981" />}
            </div>
            <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 16, lineHeight: 1.4 }}>{ch.description}</p>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 6, opacity: 0.7 }}>
                <span>Progress</span>
                <span>{ch.metricProgress} / {ch.metricTotal}</span>
              </div>
              <div style={{ background: '#f1f5f9', height: 6, borderRadius: 999 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: ch.completed ? '#10b981' : ch.color, borderRadius: 999 }} />
              </div>
            </div>
            <button
              onClick={() => !ch.locked && onStart(ch.id)}
              disabled={ch.locked}
              style={{
                width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                background: ch.completed ? '#ecfdf5' : ch.locked ? '#f8fafc' : `${ch.color}15`,
                color: ch.completed ? '#10b981' : ch.locked ? '#94a3b8' : ch.color,
                fontSize: 13, fontWeight: 800,
                cursor: ch.locked ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {ch.completed ? 'Play Again' : ch.locked ? 'Locked' : 'Start Challenge'}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

const LevelBadgeNode = ({ lvl, isComplete, isLocked, index, yOffset }) => {
  const BadgeIcon = ICON_MAP[lvl.badgeIcon] || Shield

  return (
    <div style={{ width: 280, height: 600, position: 'relative', flexShrink: 0 }}>
      <motion.div 
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: index * 0.1, type: 'spring' }}
        style={{
          position: 'absolute', top: '50%', left: '50%', 
          transform: `translate(-50%, calc(-50% + ${yOffset}px))`,
          zIndex: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}
      >
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: isComplete ? 'linear-gradient(135deg, #10b981, #059669)' : isLocked ? '#f1f5f9' : `linear-gradient(135deg, #34d399, #059669)`,
          border: `6px solid #fff`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isLocked ? 'inset 0 0 0 2px #e2e8f0' : `0 12px 30px rgba(16,185,129,0.3)`,
          color: isLocked ? '#cbd5e1' : '#fff',
        }}>
          <BadgeIcon size={36} />
        </div>
        
        <div style={{ position: 'absolute', top: '100%', marginTop: 16, textAlign: 'center', width: 180 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: isComplete ? '#059669' : '#047857', textTransform: 'uppercase', letterSpacing: 1 }}>
            Level {lvl.id} Milestone
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{lvl.title}</h3>
        </div>
      </motion.div>
    </div>
  )
}

const Challenges = ({ user, onLogout }) => {
  const navigate = useNavigate()
  const [challenges, setChallenges] = useState([])
  const [totalPoints, setTotalPoints] = useState(0)

  useEffect(() => {
    const timeline = getDailyProgressTimeline(user.email)
    const sorted = [...timeline].reverse()
    let streak = 0
    for (const day of sorted) {
      if (day.didPractice) streak++
      else break
    }

    const enriched = getEnrichedChallenges(user.email, streak)
    const { totalPoints: pts } = getChallengeData(user.email)
    setChallenges(enriched)
    setTotalPoints(pts || 0)
  }, [user.email])

  const handleStart = (id) => navigate(`/challenge/${id}`)

  const rank = getRank(totalPoints)
  const RankIcon = rank.icon

  const currentLevelObj = LEVELS.find(l => {
    const lvlChallenges = challenges.filter(c => c.level === l.id)
    return lvlChallenges.some(c => !c.completed)
  }) || LEVELS[LEVELS.length - 1]

  const timelineNodes = []
  let isTopToggle = true
  let challengeCounter = 1

  LEVELS.forEach(lvl => {
    const lvlChallenges = challenges.filter(c => c.level === lvl.id)
    lvlChallenges.forEach(ch => {
      timelineNodes.push({ type: 'challenge', data: ch, isCompleted: ch.completed, y: isTopToggle ? -70 : 70, number: challengeCounter++ })
      isTopToggle = !isTopToggle
    })
    
    const isComplete = lvlChallenges.length > 0 && lvlChallenges.every(c => c.completed)
    const isLocked = lvlChallenges.length > 0 && lvlChallenges.every(c => c.locked)
    timelineNodes.push({ type: 'badge', data: lvl, isCompleted: isComplete, isComplete, isLocked, y: isTopToggle ? -70 : 70 })
    isTopToggle = !isTopToggle
  })

  return (
    <div className="app-layout">
      <Navbar user={user} onLogout={onLogout} />

      <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* ── Top Premium Light Green Stats Cards ── */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
          
          <div style={{ flex: 1, minWidth: 300, height: 140, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 24, padding: '24px 32px', color: '#fff', boxShadow: '0 12px 30px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: 24, position: 'relative', overflow: 'hidden' }}>
            <Star size={160} color="#fff" style={{ position: 'absolute', right: -30, top: -30, opacity: 0.15 }} />
            <div style={{ background: 'rgba(255,255,255,0.2)', width: 72, height: 72, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <Star size={32} color="#fff" />
            </div>
            <div style={{ zIndex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#d1fae5', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Total Points</p>
              <h2 style={{ margin: 0, fontSize: 36, fontWeight: 900, lineHeight: 1 }}>{totalPoints}</h2>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 300, height: 140, background: 'linear-gradient(135deg, #34d399, #10b981)', borderRadius: 24, padding: '24px 32px', color: '#fff', boxShadow: '0 12px 30px rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', gap: 24, position: 'relative', overflow: 'hidden' }}>
            <Target size={160} color="#fff" style={{ position: 'absolute', right: -30, top: -30, opacity: 0.15 }} />
            <div style={{ background: 'rgba(255,255,255,0.2)', width: 72, height: 72, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <Target size={32} color="#fff" />
            </div>
            <div style={{ zIndex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#d1fae5', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Current Level</p>
              <h2 style={{ margin: 0, fontSize: 36, fontWeight: 900, lineHeight: 1 }}>Level {currentLevelObj.id}</h2>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 300, height: 140, background: 'linear-gradient(135deg, #059669, #047857)', borderRadius: 24, padding: '24px 32px', color: '#fff', boxShadow: '0 12px 30px rgba(5,150,105,0.3)', display: 'flex', alignItems: 'center', gap: 24, position: 'relative', overflow: 'hidden' }}>
            <RankIcon size={160} color="#fff" style={{ position: 'absolute', right: -30, top: -30, opacity: 0.15 }} />
            <div style={{ background: `rgba(255,255,255,0.2)`, width: 72, height: 72, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <RankIcon size={32} color="#fff" />
            </div>
            <div style={{ zIndex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#d1fae5', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Rank Badge</p>
              <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, lineHeight: 1.1 }}>{rank.name}</h2>
            </div>
          </div>

        </div>

        {/* ── Title Above Road ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingLeft: 8 }}>
          <div style={{ width: 8, height: 28, background: '#10b981', borderRadius: 8 }} />
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: -0.5 }}>Your Challenge Roadmap</h2>
        </div>

        {/* ── Interactive Roadmap Container ── */}
        <InteractiveRoadmapContainer>
          <div style={{ width: 60, height: 600, position: 'relative', flexShrink: 0 }} /> {/* Entry Space */}

          <RoadPaths nodes={timelineNodes} />
          
          {timelineNodes.map((node, i) => {
            if (node.type === 'challenge') {
              return (
                <ChallengeNode 
                  key={`ch-${node.data.id}`} 
                  ch={node.data} 
                  index={i} 
                  nodeNum={node.number}
                  yOffset={node.y} 
                  isCompleted={node.isCompleted}
                  onStart={handleStart} 
                />
              )
            } else {
              return (
                <LevelBadgeNode 
                  key={`lvl-${node.data.id}`} 
                  lvl={node.data} 
                  isComplete={node.isComplete} 
                  isLocked={node.isLocked} 
                  index={i}
                  yOffset={node.y}
                />
              )
            }
          })}
          
          <div style={{ width: 60, height: 600, position: 'relative', flexShrink: 0 }} /> {/* Exit Space */}
        </InteractiveRoadmapContainer>

        {/* ── Achievements Log ── */}
        <div className="card animate-fade-in" style={{ padding: 24, borderRadius: 20 }}>
          <h2 className="card-title" style={{ fontSize: 16 }}>Recent Achievements</h2>
          {challenges.filter(c => c.completed).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>
              Complete your first challenge to see achievements here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {challenges.filter(c => c.completed).map((ch, i) => {
                const Icon = ICON_MAP[ch.icon] || Trophy
                return (
                  <div key={ch.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                    borderBottom: i < challenges.filter(c => c.completed).length - 1 ? '1px solid #f1f5f9' : 'none'
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: ch.colorLight,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon size={16} color={ch.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{ch.title}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', padding: '4px 10px', borderRadius: 999 }}>
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>+{ch.points}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </main>
      
      <style>{`
        @keyframes spinAmbient {
          100% { transform: rotate(360deg); }
        }
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
        .hide-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

export default Challenges