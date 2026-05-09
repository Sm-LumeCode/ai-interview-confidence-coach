import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, Trophy, User, LogOut,
  Code2, ChevronRight, PanelLeftClose, PanelLeftOpen, Bookmark
} from 'lucide-react'

const Navbar = ({ user, onLogout }) => {
  const location = useLocation()
  const navigate = useNavigate()
  
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true'
  })

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const newState = !prev
      localStorage.setItem('sidebar_collapsed', newState)
      return newState
    })
  }

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const candidateLinks = [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/improvements', icon: Bookmark,         label: 'Improvements' },
    { to: '/progress',     icon: TrendingUp,      label: 'Analytics'  },
    { to: '/challenges',   icon: Trophy,           label: 'Challenges' },
    { to: '/profile',      icon: User,             label: 'Profile'    },
  ]

  const W = collapsed ? 68 : 260

  const linkStyle = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: collapsed ? 0 : 12,
    padding: collapsed ? '10px 0' : '10px 12px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    borderRadius: 8,
    color: active ? '#ffffff' : '#94a3b8',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    background: active ? '#1e2430' : 'none',
    marginBottom: 2,
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    overflow: 'hidden'
  })

  return (
    <>
      {/* Spacer that pushes main content */}
      <div style={{ width: W, flexShrink: 0, transition: 'width 0.25s ease' }} />

      <aside style={{
        width: W,
        background: '#0f1117',
        minHeight: '100vh',
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        transition: 'width 0.25s ease',
        overflow: 'hidden'
      }}>
        {/* Logo + toggle */}
        <div style={{
          padding: '20px 14px',
          borderBottom: '1px solid #1e2430',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 64,
          gap: 8
        }}>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 18, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap'
              }}>
                <span style={{ color: '#10b981' }}>Interview</span>Coach
              </h1>
              <p style={{ fontSize: 11, color: '#3d4a5c', fontWeight: 500, marginTop: 2 }}>
                AI-Powered Practice
              </p>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#475569', padding: 6, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
            onMouseLeave={e => e.currentTarget.style.color = '#475569'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {!collapsed && (
            <p style={{
              padding: '14px 8px 6px', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3d4a5c'
            }}>Candidate</p>
          )}
          {collapsed && <div style={{ height: 14 }} />}

          {candidateLinks.map(({ to, icon: Icon, label }) => {
            const active = isActive(to)
            return (
              <Link key={to} to={to} title={collapsed ? label : ''} style={linkStyle(active)}
                onMouseEnter={e => {
                  if (!active) { e.currentTarget.style.background = '#1e2430'; e.currentTarget.style.color = '#cbd5e1' }
                }}
                onMouseLeave={e => {
                  if (!active) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8' }
                }}
              >
                <Icon size={18} color={active ? '#10b981' : undefined} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
                {!collapsed && active && <ChevronRight size={14} color="#10b981" />}
              </Link>
            )
          })}

          {!collapsed && (
            <p style={{
              padding: '14px 8px 6px', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3d4a5c', marginTop: 4
            }}>Practice</p>
          )}
          {collapsed && <div style={{ height: 8 }} />}

          <Link to="/dashboard" title={collapsed ? 'Start Session' : ''}
            style={{ ...linkStyle(false), color: '#475569' }}
          >
            <Code2 size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Start Session</span>}
          </Link>
        </nav>

        {/* Footer */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid #1e2430' }}>
          {/* Logout */}
          <button
            onClick={() => { onLogout(); navigate('/') }}
            title={collapsed ? 'Logout' : ''}
            style={{
              width: '100%', border: 'none', background: 'none', cursor: 'pointer',
              color: '#ef4444',
              padding: collapsed ? '10px 0' : '10px 12px',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : 12,
              fontSize: 14, fontWeight: 500, transition: 'background 0.15s',
              marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a0f0f'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Logout</span>}
          </button>

          {/* User — clicking opens profile */}
          <div
            onClick={() => navigate('/profile')}
            title="View Profile"
            style={{
              display: 'flex', alignItems: 'center',
              gap: collapsed ? 0 : 10,
              padding: collapsed ? '8px 0' : '8px 10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1e2430'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0,
              border: '2px solid #1e2430'
            }}>
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {user?.username || 'User'}
                  {user?.isGuest && (
                    <span style={{ fontSize: 9, background: '#1e2430', color: '#10b981', padding: '1px 6px', borderRadius: 4, fontWeight: 800, border: '1px solid #10b98133', textTransform: 'uppercase' }}>Guest</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email || ''}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

export default Navbar