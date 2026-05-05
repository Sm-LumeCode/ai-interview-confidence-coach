// Profile Component - Clean Slate v1.0.2
import React, { useState, useEffect } from 'react'
import Navbar from './Navbar'
import { 
  User, Mail, Calendar, Edit2, Save, X, 
  Lock, Shield, Bell, Camera, Globe, 
  ChevronRight, Trash2, Key
} from 'lucide-react'

const Profile = ({ user, onLogout, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    username: user.username || '',
    fullName: user.fullName || '',
    email: user.email || '',
    bio: user.bio || '',
    location: user.location || "San Francisco, CA",
  })

  const [activeTab, setActiveTab] = useState('account')
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [oldPassword, setOldPassword] = useState('')

  // Sync profile data when user prop changes (e.g. after a save)
  useEffect(() => {
    if (!isEditing) {
      setProfileData({
        username: user.username || '',
        fullName: user.fullName || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || "San Francisco, CA",
      })
    }
  }, [user, isEditing])

  const showMessage = (text) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  const updateSetting = async (field, value) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          [field]: value
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Failed to update setting')

      onUpdateUser(data.user)
      const humanName = field.replace(/([A-Z])/g, ' $1').toLowerCase()
      showMessage(`Successfully ${value ? 'enabled' : 'disabled'} ${humanName}`)
    } catch (err) {
      console.error('Update failed:', err)
      showMessage('Error: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const joinKey = `join_date_${user.email}`
  const joinDate = new Date(localStorage.getItem(joinKey) || new Date()).toLocaleDateString('en-GB', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          username: profileData.username,
          fullName: profileData.fullName,
          bio: profileData.bio,
          location: profileData.location
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update profile')
      }
      
      onUpdateUser(data.user)
      setIsEditing(false)
      showMessage('Profile updated successfully!')
    } catch (err) {
      showMessage('Error: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!oldPassword) {
      showMessage('Current password is required.')
      return
    }
    if (newPassword.length < 6) {
      showMessage('New password must be at least 6 characters.')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          oldPassword: oldPassword,
          newPassword: newPassword
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Failed to update password')
      }

      setIsChangingPassword(false)
      setOldPassword('')
      setNewPassword('')
      showMessage('Password updated successfully!')
    } catch (err) {
      showMessage('Error: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const SectionTitle = ({ title, subtitle }) => (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h2>
      <p style={{ fontSize: 14, color: '#64748b' }}>{subtitle}</p>
    </div>
  )

  const SettingRow = ({ icon: Icon, label, value, description, actionLabel, onClick, actionColor = '#10b981', disabled }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 0', borderBottom: '1px solid #f1f5f9',
      opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto',
      transition: 'opacity 0.2s'
    }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, background: '#f8fafc',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          border: '1px solid #e2e8f0'
        }}>
          <Icon size={18} color="#64748b" />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{label}</p>
          <p style={{ fontSize: 13, color: '#64748b' }}>{description || value}</p>
        </div>
      </div>
      <button 
        onClick={onClick}
        disabled={disabled}
        style={{
          background: 'none', border: 'none', color: actionColor, 
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4
        }}>
        {actionLabel} <ChevronRight size={14} />
      </button>
    </div>
  )

  return (
    <div className="app-layout" style={{ background: '#f8fafc' }}>
      {message && (
        <div style={{
          position: 'fixed', top: 24, right: 24, background: '#0f172a', color: 'white',
          padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: 10, animation: 'slideIn 0.3s ease'
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
          {message}
        </div>
      )}
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
      <Navbar user={user} onLogout={onLogout} />

      {isChangingPassword && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
          padding: 20
        }}>
          <div className="animate-slide-up" style={{
            background: 'white', padding: 32, borderRadius: 24, width: '100%', maxWidth: 400,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            <SectionTitle title="Update Password" subtitle="Verify your identity and choose a strong new password." />
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Current Password</label>
              <input type="password" autoFocus style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', color: '#1e293b', fontSize: 14, outline: 'none' }} placeholder="Enter current password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>New Password</label>
              <input type="password" style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', color: '#1e293b', fontSize: 14, outline: 'none' }} placeholder="Enter new password (min 6 chars)" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" onClick={() => setIsChangingPassword(false)} disabled={isSaving} style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0' }}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdatePassword} disabled={isSaving} style={{ flex: 2, background: '#10b981', color: 'white', opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="main-content">
        <div className="page-header" style={{ marginBottom: 40 }}>
          <h1 className="page-title" style={{ color: '#0f172a' }}>Account Settings</h1>
          <p className="page-subtitle" style={{ color: '#64748b' }}>Manage your professional profile and security preferences</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { id: 'account', label: 'Public Profile', icon: User },
              { id: 'security', label: 'Security & Privacy', icon: Shield },
              { id: 'notifications', label: 'Notifications', icon: Bell },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: 'none',
                background: activeTab === tab.id ? '#ffffff' : 'transparent', color: activeTab === tab.id ? '#10b981' : '#64748b',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.2s', border: activeTab === tab.id ? '1px solid #e2e8f0' : '1px solid transparent'
              }}>
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>

          <div style={{ background: '#ffffff', padding: '40px', borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', minHeight: 650 }}>
            {activeTab === 'account' && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                  <SectionTitle title="Public Profile" subtitle="Your professional information visible to the community." />
                  {!isEditing ? (
                    <button className="btn-secondary" onClick={() => setIsEditing(true)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                      <Edit2 size={14} /> Edit Profile
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn-secondary" onClick={() => setIsEditing(false)} disabled={isSaving} style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}><X size={14} /></button>
                      <button className="btn-primary" onClick={handleSave} disabled={isSaving} style={{ background: '#10b981', color: 'white', opacity: isSaving ? 0.7 : 1 }}>
                        {isSaving ? 'Saving...' : <><Save size={14} /> Save Changes</>}
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 48, padding: '24px', background: '#f8fafc', borderRadius: 20, border: '1px solid #f1f5f9' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 44, boxShadow: '0 12px 24px rgba(16,185,129,0.25)', border: '4px solid #fff' }}>
                      {profileData.username.charAt(0).toUpperCase()}
                    </div>
                    <button style={{ position: 'absolute', bottom: 4, right: 4, width: 34, height: 34, borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}><Camera size={16} /></button>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Profile Picture</h3>
                    <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>JPG, GIF or PNG. Max size of 800K</p>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Upload Image</button>
                      <button style={{ background: 'none', border: 'none', color: '#ef4444', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>Full Name</label>
                  <input disabled={!isEditing} style={{ width: '100%', background: isEditing ? '#fff' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', color: '#1e293b', fontSize: 14, outline: 'none', transition: 'all 0.2s', boxShadow: isEditing ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }} placeholder="Enter your full name" value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 40 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>Username</label>
                    <input disabled={!isEditing} style={{ width: '100%', background: isEditing ? '#fff' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', color: '#1e293b', fontSize: 14, outline: 'none', transition: 'all 0.2s', boxShadow: isEditing ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }} value={profileData.username} onChange={e => setProfileData({...profileData, username: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>Email Address</label>
                    <input disabled={true} style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', color: '#64748b', fontSize: 14, cursor: 'not-allowed' }} value={profileData.email} />
                  </div>
                </div>

                <div style={{ marginBottom: 40 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>Location</label>
                  <input disabled={!isEditing} style={{ width: '100%', background: isEditing ? '#fff' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', color: '#1e293b', fontSize: 14, outline: 'none', transition: 'all 0.2s', boxShadow: isEditing ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }} placeholder="e.g. San Francisco, CA" value={profileData.location} onChange={e => setProfileData({...profileData, location: e.target.value})} />
                </div>

                <div style={{ marginBottom: 40 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>Biography</label>
                  <textarea disabled={!isEditing} rows={5} style={{ width: '100%', background: isEditing ? '#fff' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', color: '#1e293b', resize: 'none', fontSize: 15, lineHeight: '1.6', outline: 'none', transition: 'all 0.2s', boxShadow: isEditing ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }} value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} />
                </div>

                <div style={{ display: 'flex', gap: 24, paddingTop: 32, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
                    <Calendar size={18} /> Member since {joinDate}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
                    <Globe size={18} /> Based in {profileData.location}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="animate-fade-in">
                <SectionTitle title="Security & Privacy" subtitle="Advanced protection and visibility settings." />
                <SettingRow icon={Key} label="Account Password" description="Keep your account secure with a strong password" actionLabel="Update Password" onClick={() => setIsChangingPassword(true)} />
                <SettingRow icon={Lock} label="Two-Factor Authentication" description="Secure your account with an additional verification step" actionLabel={isSaving ? "..." : (user.twoFactorEnabled ? "Deactivate" : "Activate")} actionColor={user.twoFactorEnabled ? "#ef4444" : "#10b981"} onClick={() => updateSetting('twoFactorEnabled', !user.twoFactorEnabled)} disabled={isSaving} />
                <SettingRow icon={Shield} label="Public Profile Visibility" description={user.privacyModeEnabled ? "Hidden from leaderboards" : "Visible to the community"} actionLabel={isSaving ? "..." : (user.privacyModeEnabled ? "Turn Off" : "Turn On")} onClick={() => updateSetting('privacyModeEnabled', !user.privacyModeEnabled)} disabled={isSaving} />
                <SettingRow icon={Trash2} label="Danger Zone" description="Permanently delete your data and account access" actionLabel="Delete Account" actionColor="#ef4444" onClick={() => showMessage('Please contact support to delete your account.')} />
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="animate-fade-in">
                <SectionTitle title="Notifications" subtitle="Choose your preferred communication channels." />
                <SettingRow icon={Mail} label="Email Reports" description={user.emailNotificationsEnabled === false ? "Paused" : "Weekly performance summaries"} actionLabel={isSaving ? "..." : (user.emailNotificationsEnabled === false ? "Enable" : "Disable")} onClick={() => updateSetting('emailNotificationsEnabled', !user.emailNotificationsEnabled)} disabled={isSaving} />
                <SettingRow icon={Bell} label="Application Alerts" description={user.appNotificationsEnabled === false ? "Paused" : "Real-time challenge updates"} actionLabel={isSaving ? "..." : (user.appNotificationsEnabled === false ? "Enable" : "Disable")} onClick={() => updateSetting('appNotificationsEnabled', !user.appNotificationsEnabled)} disabled={isSaving} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Profile