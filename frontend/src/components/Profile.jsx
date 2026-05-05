// Profile Component - Clean Slate v1.0.2
import React, { useState, useEffect, useRef } from 'react'
import Navbar from './Navbar'
import { 
  User, Mail, Calendar, Edit2, Save, X, 
  Lock, Shield, Bell, Camera, Globe, 
  ChevronRight, Trash2, Key, Send, Users, LogOut, CheckCircle
} from 'lucide-react'
import { getChallengeData, getEnrichedChallenges, LEVELS } from '../utils/ChallengeManager'

const Profile = ({ user, onLogout, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    username: user.username || '',
    fullName: user.fullName || '',
    email: user.email || '',
    bio: user.bio || '',
    location: user.location || "San Francisco, CA",
    avatarColor: user.avatarColor || '#10b981',
  })

  const fileInputRef = useRef(null)
  const [activeTab, setActiveTab] = useState('account')
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSelectingAvatar, setIsSelectingAvatar] = useState(false)
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [oldPassword, setOldPassword] = useState('')

  const AVATAR_OPTIONS = [
    { name: 'Emerald', color: '#10b981' },
    { name: 'Teal', color: '#14b8a6' },
    { name: 'Indigo', color: '#6366f1' },
    { name: 'Rose', color: '#f43f5e' },
    { name: 'Amber', color: '#f59e0b' },
    { name: 'Violet', color: '#8b5cf6' },
    { name: 'Cyan', color: '#06b6d4' },
    { name: 'Slate', color: '#475569' },
  ]

  // Sync profile data when user prop changes (e.g. after a save)
  useEffect(() => {
    if (!isEditing) {
      setProfileData({
        username: user.username || '',
        fullName: user.fullName || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || "San Francisco, CA",
        avatarColor: user.avatarColor || '#10b981',
        photoUrl: user.photoUrl || null
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
      console.log(`Updating ${field} for ${user.email}`)
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          [field]: value
        })
      })

      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        throw new Error('Server returned an invalid response. Please check backend logs.')
      }

      if (!response.ok) {
        console.error('Server error during update:', data)
        throw new Error(data.detail || 'Failed to update setting')
      }

      onUpdateUser(data.user)
      const humanName = field.replace(/([A-Z])/g, ' $1').toLowerCase()
      showMessage(`Successfully updated ${humanName}`)
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
          location: profileData.location,
          avatarColor: profileData.avatarColor,
          photoUrl: profileData.photoUrl
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

  const handleDeactivate = () => {
    if (confirm("Are you sure you want to deactivate your account? You can reactivate it later by logging in.")) {
      showMessage("Account deactivated. (Logic to be implemented)")
    }
  }

  const handleSendTestReport = async () => {
    setIsSaving(true)
    try {
      const { totalPoints } = getChallengeData(user.email)
      const enriched = getEnrichedChallenges(user.email, 0)
      const currentLevel = (enriched.filter(c => c.completed).length > 0) ? Math.max(...enriched.filter(c => c.completed).map(c => c.level)) : 1
      
      const res = await fetch('http://localhost:8000/api/auth/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          fullName: user.fullName,
          level: currentLevel,
          points: totalPoints,
          rank: 'Bronze Novice'
        })
      })
      const data = await res.json()
      if (res.ok) showMessage("Report sent successfully!")
      else throw new Error(data.detail || "Failed to send report")
    } catch (err) {
      showMessage(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarSelect = (color) => {
    const newData = { ...profileData, avatarColor: color, photoUrl: null }
    setProfileData(newData)
    if (!isEditing) {
      // Direct update
      setIsSaving(true)
      fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          avatarColor: color,
          photoUrl: null
        })
      })
      .then(res => res.json())
      .then(data => {
        onUpdateUser(data.user)
        showMessage('Avatar color updated')
      })
      .finally(() => setIsSaving(false))
    }
    setIsSelectingAvatar(false)
    setShowPhotoMenu(false)
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 800000) {
      showMessage('Error: File size too large (max 800KB)')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result
      setProfileData({ ...profileData, photoUrl: base64String })
      if (!isEditing) {
        updateSetting('photoUrl', base64String)
      }
      setShowPhotoMenu(false)
      showMessage('Photo uploaded successfully!')
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    const newData = { ...profileData, photoUrl: null }
    setProfileData(newData)
    if (!isEditing) {
      updateSetting('photoUrl', null)
    }
    setShowPhotoMenu(false)
    showMessage('Photo removed')
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

  const SettingRow = ({ icon: Icon, label, value, description, actionLabel, onClick, actionColor = '#10b981', disabled, loading }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 0', borderBottom: '1px solid #f1f5f9',
      opacity: disabled ? 0.6 : 1, transition: 'opacity 0.2s'
    }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14, background: '#f8fafc',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          border: '1px solid #e2e8f0', color: '#64748b'
        }}>
          <Icon size={20} />
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{label}</p>
          <p style={{ fontSize: 13, color: '#64748b' }}>{description || value}</p>
        </div>
      </div>
      <button 
        onClick={onClick}
        disabled={disabled || loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 12,
          background: actionColor === '#ef4444' ? '#fef2f2' : (actionColor === '#64748b' ? '#f1f5f9' : '#f0fdf4'),
          border: `1px solid ${actionColor}30`,
          color: actionColor,
          fontSize: 13, fontWeight: 700,
          cursor: 'pointer', transition: 'all 0.2s',
          minWidth: 100, justifyContent: 'center'
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = actionColor; e.currentTarget.style.color = '#fff'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = actionColor === '#ef4444' ? '#fef2f2' : (actionColor === '#64748b' ? '#f1f5f9' : '#f0fdf4'); e.currentTarget.style.color = actionColor; }}
      >
        {loading ? '...' : actionLabel}
        {!loading && <ChevronRight size={14} />}
      </button>
    </div>
  )

  return (
    <div className="app-layout" style={{ background: '#f8fafc' }} onClick={() => setShowPhotoMenu(false)}>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*" 
        onChange={handlePhotoUpload} 
      />
      {message && (
        <div style={{
          position: 'fixed', top: 24, right: 24, background: '#0f172a', color: 'white',
          padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 2000,
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

      {(isChangingPassword || isSelectingAvatar) && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
          padding: 20
        }} onClick={e => e.stopPropagation()}>
          <div className="animate-slide-up" style={{
            background: 'white', padding: 32, borderRadius: 24, width: '100%', maxWidth: 450,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            {isChangingPassword ? (
              <>
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
              </>
            ) : (
              <>
                <SectionTitle title="Choose Avatar" subtitle="Select a color scheme for your profile avatar." />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                  {AVATAR_OPTIONS.map(opt => (
                    <button
                      key={opt.name}
                      onClick={() => handleAvatarSelect(opt.color)}
                      style={{
                        width: '100%', aspectRatio: '1/1', borderRadius: '50%', background: opt.color,
                        border: profileData.avatarColor === opt.color ? '4px solid #0f172a' : '4px solid #fff',
                        cursor: 'pointer', transition: 'transform 0.2s',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ))}
                </div>
                <button className="btn-secondary" onClick={() => setIsSelectingAvatar(false)} style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0' }}>Close</button>
              </>
            )}
          </div>
        </div>
      )}

      <main className="main-content">
        <div className="page-header" style={{ marginBottom: 40 }}>
          <h1 className="page-title" style={{ color: '#0f172a' }}>Account Settings</h1>
          <p className="page-subtitle" style={{ color: '#64748b' }}>Manage your professional profile and security preferences</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 48 }}>
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

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 48, padding: '40px', background: '#f0fdf4', borderRadius: 32, border: '1px solid #10b98120', position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <div 
                      onClick={(e) => { e.stopPropagation(); setShowPhotoMenu(!showPhotoMenu); }}
                      style={{ 
                        width: 140, height: 140, borderRadius: '50%', 
                        background: profileData.photoUrl ? `url(${profileData.photoUrl})` : `linear-gradient(135deg, ${profileData.avatarColor}, ${profileData.avatarColor}dd)`, 
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', 
                        fontWeight: 800, fontSize: 56, boxShadow: `0 15px 35px ${profileData.avatarColor}40`, 
                        border: '6px solid #fff', cursor: 'pointer', transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05) rotate(5deg)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
                    >
                      {!profileData.photoUrl && profileData.username.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ position: 'absolute', bottom: 6, right: 6, width: 38, height: 38, borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <Camera size={18} />
                    </div>

                    {/* Photo Action Menu */}
                    {showPhotoMenu && (
                      <div style={{
                        position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)',
                        background: '#fff', borderRadius: 16, padding: '8px', width: 220,
                        boxShadow: '0 15px 40px rgba(0,0,0,0.15)', border: '1px solid #f1f5f9', zIndex: 100
                      }} onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => setIsSelectingAvatar(true)}
                          style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: 'none', background: 'transparent', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: '#1e293b', fontSize: 13, fontWeight: 600 }}>
                          <Edit2 size={16} color="#10b981" /> Choose Color Avatar
                        </button>
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: 'none', background: 'transparent', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: '#1e293b', fontSize: 13, fontWeight: 600 }}>
                          <Camera size={16} color="#3b82f6" /> Upload New Photo
                        </button>
                        {(profileData.photoUrl || profileData.avatarColor !== '#10b981') && (
                          <>
                            <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
                            <button 
                              onClick={handleRemovePhoto}
                              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: 'none', background: 'transparent', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
                              <Trash2 size={16} /> Remove / Reset
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{profileData.fullName || 'New Member'}</h3>
                    <p style={{ fontSize: 14, color: '#64748b' }}>{profileData.photoUrl ? 'Custom Image' : 'Color Avatar'}</p>
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
                <SectionTitle title="Security Settings" subtitle="Control how your account is protected." />
                <SettingRow icon={Key} label="Password" description="Choose a strong, unique password" actionLabel="Update" onClick={() => setIsChangingPassword(true)} />
                <SettingRow 
                  icon={Lock} 
                  label="2FA Authentication" 
                  description="Verify your identity via email on every login" 
                  actionLabel={user.twoFactorEnabled ? "Turn Off" : "Enable"} 
                  actionColor={user.twoFactorEnabled ? "#ef4444" : "#10b981"} 
                  onClick={() => updateSetting('twoFactorEnabled', !user.twoFactorEnabled)} 
                  loading={isSaving} 
                />
                <SettingRow icon={LogOut} label="Active Sessions" description="Manage devices currently logged in" actionLabel="View" onClick={() => alert("Sessions view")} />
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="animate-fade-in">
                <SectionTitle title="Privacy & Visibility" subtitle="Choose how you appear to other members." />
                <div style={{ marginBottom: 24, padding: 20, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                   <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                     <b>Public Visibility:</b> When enabled, your level, rank, and achievements will be visible on the global leaderboard. This helps you network with other high-performing candidates.
                   </p>
                </div>
                <SettingRow 
                  icon={Globe} 
                  label="Public Profile" 
                  description="Appear on global leaderboards and rankings" 
                  actionLabel={user.publicProfile ? "Visible" : "Hidden"} 
                  actionColor={user.publicProfile ? "#10b981" : "#64748b"} 
                  onClick={() => updateSetting('publicProfile', !user.publicProfile)} 
                  loading={isSaving} 
                />
                <SettingRow 
                  icon={Users} 
                  label="Anonymous Analytics" 
                  description="Share your data to help improve community benchmarks" 
                  actionLabel={user.shareAnalytics ? "On" : "Off"} 
                  onClick={() => updateSetting('shareAnalytics', !user.shareAnalytics)} 
                  loading={isSaving} 
                />
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="animate-fade-in">
                <SectionTitle title="Notifications" subtitle="Stay updated with your progress." />
                <div style={{ marginBottom: 24, padding: 20, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                   <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                     <b>Email Reports:</b> We send a weekly performance audit summarizing your score trends, technical mastery, and points earned.
                   </p>
                </div>
                <SettingRow 
                  icon={Mail} 
                  label="Weekly Reports" 
                  description="Receive performance audits every Sunday" 
                  actionLabel={user.emailReports ? "Enabled" : "Disabled"} 
                  actionColor={user.emailReports ? "#10b981" : "#64748b"} 
                  onClick={() => updateSetting('emailReports', !user.emailReports)} 
                  loading={isSaving} 
                />
                {user.emailReports && (
                   <div style={{ marginTop: 20, textAlign: 'center', padding: 20, background: '#f0fdf4', borderRadius: 20, border: '1px solid #dcfce7' }}>
                      <p style={{ margin: '0 0 16px 0', fontSize: 13, color: '#166534', fontWeight: 600 }}>Verify your email reporting configuration:</p>
                      <button onClick={handleSendTestReport} disabled={isSaving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                        <Send size={16} /> Send Test Report Now
                      </button>
                   </div>
                )}
                <SettingRow icon={Bell} label="Push Notifications" description="Daily reminders and challenge alerts" actionLabel="Manage" onClick={() => alert("Notification permissions")} />
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="animate-fade-in">
                <SectionTitle title="Advanced Options" subtitle="Manage account lifecycle and data removal." />
                <SettingRow 
                  icon={Trash2} 
                  label="Deactivate Account" 
                  description="Temporarily hide your profile and pause everything" 
                  actionLabel="Deactivate" 
                  actionColor="#ef4444" 
                  onClick={handleDeactivate} 
                />
                <div style={{ marginTop: 32, padding: 24, background: '#fef2f2', borderRadius: 20, border: '1px solid #fee2e2' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#991b1b', fontSize: 16, fontWeight: 800 }}>Danger Zone</h4>
                  <p style={{ margin: '0 0 20px 0', color: '#b91c1c', fontSize: 14, lineHeight: 1.5 }}>
                    Deleting your account is permanent. All your interview recordings, "Legend" status, and point history will be wiped from our servers.
                  </p>
                  <button 
                    onClick={() => confirm("PERMANENTLY DELETE ACCOUNT?") && alert("Account deletion request submitted.")}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 20px rgba(239,68,68,0.2)' }}
                  >
                    Permanently Delete Everything
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { id: 'account', label: 'Public Profile', icon: User },
              { id: 'security', label: 'Security & Privacy', icon: Shield },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'advanced', label: 'Advanced', icon: Trash2 },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 16, border: 'none',
                background: activeTab === tab.id ? '#10b981' : 'transparent', color: activeTab === tab.id ? '#ffffff' : '#64748b',
                boxShadow: activeTab === tab.id ? '0 8px 20px rgba(16,185,129,0.25)' : 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.2s'
              }}>
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Profile