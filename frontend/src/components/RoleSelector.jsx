import React from 'react'
import { Code, Database, Brain, Cloud, Shield, Users, ArrowRight } from 'lucide-react'

const THEME_COLOR = '#10b981' // Vibrant Emerald Green
const THEME_LIGHT = '#f0fdf4'

export const categories = [
  {
    id: 'software_development',
    name: 'Software Development',
    icon: Code,
    description: 'Master coding, system design, and software architecture principles.'
  },
  {
    id: 'data_analytics',
    name: 'Data & Analytics',
    icon: Database,
    description: 'Expertise in data analysis, SQL queries, and visualization techniques.'
  },
  {
    id: 'data_science_ml',
    name: 'Data Science & ML',
    icon: Brain,
    description: 'Dive deep into machine learning models and AI concepts.'
  },
  {
    id: 'cloud_devops',
    name: 'Cloud & DevOps',
    icon: Cloud,
    description: 'Infrastructure management, AWS, GCP, and CI/CD pipelines.'
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    icon: Shield,
    description: 'Learn security principles, threat modeling, and risk management.'
  },
  {
    id: 'hr_round',
    name: 'HR Round',
    icon: Users,
    description: 'Polish your behavioral, situational, and cultural fit responses.'
  }
]

const RoleSelector = ({ onSelectRole, userProgress = {} }) => {
  return (
    <div style={{ position: 'relative', maxWidth: 800, margin: '20px auto', paddingLeft: 60 }}>
      {/* Vertical Line on the left */}
      <div style={{
        position: 'absolute',
        left: 20,
        top: 20,
        bottom: 20,
        width: 2,
        background: `linear-gradient(to bottom, ${THEME_LIGHT}, ${THEME_COLOR}33, ${THEME_LIGHT})`,
        zIndex: 0
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {categories.map((cat, index) => {
          const Icon = cat.icon
          const progress = userProgress[cat.id]
          const hasProgress = progress && progress.currentQuestionIndex > 0
          const pct = hasProgress
            ? Math.round((progress.currentQuestionIndex / progress.totalQuestions) * 100)
            : 0

          return (
            <div key={cat.id} id={`category-${cat.id}`} style={{ position: 'relative', scrollMarginTop: '120px' }}>
              {/* Dot on the line with Glow */}
              <div style={{
                position: 'absolute',
                left: -48,
                top: 40,
                width: 18,
                height: 18,
                background: 'white',
                border: `4.5px solid ${THEME_COLOR}`,
                borderRadius: '50%',
                zIndex: 2,
                boxShadow: `0 0 0 6px ${THEME_COLOR}15, 0 0 15px ${THEME_COLOR}25`
              }} />

              {/* Horizontal Connector Line */}
              <div style={{
                position: 'absolute',
                left: -32,
                top: 48,
                width: 32,
                height: 2,
                background: `${THEME_COLOR}22`,
                zIndex: 1
              }} />

              {/* Card */}
              <button
                onClick={() => onSelectRole(cat.id)}
                className="animate-slide-up"
                style={{
                  width: '100%',
                  animationDelay: `${index * 80}ms`,
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: 20,
                  padding: '24px 32px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = THEME_COLOR
                  e.currentTarget.style.boxShadow = `0 12px 30px ${THEME_COLOR}15`
                  e.currentTarget.style.transform = 'translateX(10px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                {/* Icon Box */}
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: THEME_LIGHT,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `inset 0 0 0 1px ${THEME_COLOR}15`
                }}>
                  <Icon size={30} color={THEME_COLOR} />
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 800, fontSize: 19, color: '#0f172a', marginBottom: 6
                  }}>
                    {cat.name}
                  </div>
                  <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                    {cat.description}
                  </div>
                </div>

                {/* Progress / Status */}
                <div style={{ textAlign: 'right', minWidth: 120 }}>
                  {hasProgress ? (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: THEME_COLOR, marginBottom: 6, letterSpacing: '0.05em' }}>
                        {pct}% COMPLETE
                      </div>
                      <div style={{ width: 80, height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginLeft: 'auto' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: THEME_COLOR, borderRadius: 99 }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      background: THEME_LIGHT, 
                      color: THEME_COLOR, 
                      padding: '8px 16px', 
                      borderRadius: 99,
                      fontWeight: 800, 
                      fontSize: 12, 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      letterSpacing: '0.05em' 
                    }}>
                      PRACTICE <ArrowRight size={14} />
                    </div>
                  )}
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RoleSelector