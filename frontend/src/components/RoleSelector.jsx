import React from 'react'
import { Code, Database, Brain, Cloud, Shield, Users, ArrowRight } from 'lucide-react'

const categories = [
  {
    id: 'software_development',
    name: 'Software Development',
    icon: Code,
    accent: '#3b82f6',
    accentLight: '#dbeafe',
    description: 'Coding, system design & architecture'
  },
  {
    id: 'data_analytics',
    name: 'Data & Analytics',
    icon: Database,
    accent: '#8b5cf6',
    accentLight: '#ede9fe',
    description: 'Data analysis, SQL & visualization'
  },
  {
    id: 'data_science_ml',
    name: 'Data Science & ML',
    icon: Brain,
    accent: '#10b981',
    accentLight: '#d1fae5',
    description: 'Machine learning & AI concepts'
  },
  {
    id: 'cloud_devops',
    name: 'Cloud & DevOps',
    icon: Cloud,
    accent: '#f59e0b',
    accentLight: '#fef3c7',
    description: 'AWS, GCP, CI/CD pipelines'
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    icon: Shield,
    accent: '#6366f1',
    accentLight: '#e0e7ff',
    description: 'Security principles & threat modeling'
  },
  {
    id: 'hr_round',
    name: 'HR Round',
    icon: Users,
    accent: '#ec4899',
    accentLight: '#fce7f3',
    description: 'Behavioral & situational questions'
  }
]

const RoleSelector = ({ onSelectRole, userProgress = {} }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 16
    }}>
      {categories.map((cat, index) => {
        const Icon = cat.icon
        const progress = userProgress[cat.id]
        const hasProgress = progress && progress.currentQuestionIndex > 0
        const pct = hasProgress
          ? Math.round((progress.currentQuestionIndex / progress.totalQuestions) * 100)
          : 0

        return (
          <button
            key={cat.id}
            onClick={() => onSelectRole(cat.id)}
            className="animate-slide-up"
            style={{
              animationDelay: `${index * 60}ms`,
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 20,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = cat.accent
              e.currentTarget.style.boxShadow = `0 4px 20px ${cat.accent}22`
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2e8f0'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {/* Icon */}
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: cat.accentLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <Icon size={22} color={cat.accent} />
            </div>

            {/* Title */}
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: '#0f172a',
              marginBottom: 4
            }}>
              {cat.name}
            </div>

            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              {cat.description}
            </div>

            {/* Progress bar */}
            {hasProgress ? (
              <div style={{ marginBottom: 12 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  color: '#94a3b8',
                  fontWeight: 500,
                  marginBottom: 6
                }}>
                  <span>{progress.currentQuestionIndex}/{progress.totalQuestions} done</span>
                  <span>{pct}%</span>
                </div>
                <div className="progress-bar-track" style={{ height: 5 }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${pct}%`, background: cat.accent }}
                  />
                </div>
              </div>
            ) : null}

            {/* CTA */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: cat.accent
            }}>
              <span>{hasProgress ? 'Continue Practice' : 'Start Practice'}</span>
              <ArrowRight size={14} />
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default RoleSelector