import React, { useState, useRef } from 'react'
import { Mic, MicOff, RotateCcw, Send, AlertCircle, Loader2, FileText, RefreshCw } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const Recorder = ({ onRecordingComplete }) => {
  // phases: idle | recording | transcribing | done | error
  const [phase, setPhase] = useState('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcribedText, setTranscribedText] = useState('')
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const streamRef = useRef(null)

  // ─── Timer ─────────────────────────────────────────────────

  const startTimer = () => {
    setRecordingTime(0)
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1)
    }, 1000)
  }

  const stopTimer = () => clearInterval(timerRef.current)

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // ─── Recording ─────────────────────────────────────────────

  const startRecording = async () => {
    setError('')
    setTranscribedText('')
    audioChunksRef.current = []

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
    } catch {
      setError('Microphone access denied. Please allow microphone permission in your browser and try again.')
      setPhase('error')
      return
    }

    const mimeType = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ].find((t) => MediaRecorder.isTypeSupported(t)) || ''

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop())
      const blob = new Blob(audioChunksRef.current, {
        type: mimeType || 'audio/webm',
      })
      transcribeAudio(blob, mimeType)
    }

    recorder.start(250)
    setPhase('recording')
    startTimer()
  }

  const stopRecording = () => {
    stopTimer()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setPhase('transcribing')
  }

  // Re-record while still recording — stop mic, reset everything, go back to idle
  const reRecordWhileRecording = () => {
    stopTimer()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // Prevent onstop from triggering transcription
      mediaRecorderRef.current.onstop = () => {
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
      }
      try { mediaRecorderRef.current.stop() } catch {}
    }
    audioChunksRef.current = []
    setPhase('idle')
    setRecordingTime(0)
    setTranscribedText('')
    setError('')
  }

  // ─── Transcription ─────────────────────────────────────────

  const transcribeAudio = async (blob, mimeType) => {
    try {
      let ext = 'webm'
      if (mimeType?.includes('ogg')) ext = 'ogg'
      else if (mimeType?.includes('mp4')) ext = 'mp4'

      const formData = new FormData()
      formData.append('audio', blob, `recording.${ext}`)

      const response = await fetch(`${API_BASE_URL}/transcribe`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || `Server error ${response.status}`)
      }

      const data = await response.json()
      const text = data.transcript || data.text || ''

      if (!text.trim()) {
        setError('No speech detected. Please re-record and speak clearly into your microphone.')
        setPhase('error')
        return
      }

      setTranscribedText(text)
      setPhase('done')
    } catch (err) {
      console.error('Transcription error:', err)
      setError(`Transcription failed: ${err.message}. Please try recording again.`)
      setPhase('error')
    }
  }

  // ─── Reset ─────────────────────────────────────────────────

  const reset = () => {
    stopTimer()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
    }
    setPhase('idle')
    setRecordingTime(0)
    setTranscribedText('')
    setError('')
    audioChunksRef.current = []
  }

  // ─── Submit ────────────────────────────────────────────────

  const submitAnswer = () => {
    if (!transcribedText.trim()) return
    onRecordingComplete(transcribedText.trim())
    reset()
  }

  // ─── UI ────────────────────────────────────────────────────

  return (
    <div className="card animate-slide-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, background: '#fef3c7',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Mic size={18} color="#d97706" />
        </div>
        <h3 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 16, fontWeight: 700, color: '#0f172a'
        }}>
          Record Your Answer
        </h3>
        {phase === 'recording' && (
          <span style={{
            marginLeft: 'auto', fontSize: 12, fontWeight: 700,
            color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
              display: 'inline-block', animation: 'pulse 1s infinite'
            }} />
            LIVE
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <>
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              border: '2px solid #fbbf24',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(251,191,36,0.25)'
            }}>
              <Mic size={36} color="#d97706" />
            </div>
            <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
              Click <strong style={{ color: '#0f172a' }}>Start Recording</strong>, speak your answer clearly,
              then click <strong style={{ color: '#0f172a' }}>Stop</strong>. We'll transcribe it automatically.
            </p>
            <button onClick={startRecording} className="btn-primary" style={{ gap: 8 }}>
              <Mic size={16} />
              Start Recording
            </button>
          </>
        )}

        {/* ── RECORDING ── */}
        {phase === 'recording' && (
          <>
            {/* Pulsing mic */}
            <div style={{ position: 'relative', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                position: 'absolute', width: 100, height: 100, borderRadius: '50%',
                background: 'rgba(239,68,68,0.15)', animation: 'ripple 1.2s infinite'
              }} />
              <div style={{
                position: 'absolute', width: 76, height: 76, borderRadius: '50%',
                background: 'rgba(239,68,68,0.2)', animation: 'ripple 1.2s infinite 0.4s'
              }} />
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(239,68,68,0.4)', zIndex: 1
              }}>
                <Mic size={26} color="white" />
              </div>
            </div>

            {/* Timer */}
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 44, fontWeight: 800, color: '#0f172a',
              letterSpacing: '-1px', lineHeight: 1
            }}>
              {formatTime(recordingTime)}
            </div>

            {/* Audio visualiser bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 40 }}>
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 5, borderRadius: 999,
                    background: `hsl(${20 + i * 5}, 90%, 55%)`,
                    height: `${30 + ((i * 23) % 60)}%`,
                    animation: `bar 0.6s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.07}s`,
                  }}
                />
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              {/* Re-record while recording */}
              <button
                onClick={reRecordWhileRecording}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  flex: 1, padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: '1px solid #e2e8f0', background: 'white', color: '#64748b',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748b' }}
              >
                <RefreshCw size={15} />
                Re-record
              </button>

              {/* Stop */}
              <button
                onClick={stopRecording}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  flex: 2, padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                  border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white', cursor: 'pointer', boxShadow: '0 4px 14px rgba(239,68,68,0.35)',
                  transition: 'all 0.15s'
                }}
              >
                <MicOff size={16} />
                Stop Recording
              </button>
            </div>
          </>
        )}

        {/* ── TRANSCRIBING ── */}
        {phase === 'transcribing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 0' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(251,191,36,0.3)'
            }}>
              <Loader2 size={28} color="#d97706" style={{ animation: 'spin 0.9s linear infinite' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>
                Transcribing your answer…
              </p>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>This usually takes a few seconds</p>
            </div>
          </div>
        )}

        {/* ── DONE — transcript + re-record + submit ── */}
        {phase === 'done' && (
          <>
            <div style={{ width: '100%' }}>
              {/* Transcript header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6, background: '#d1fae5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <FileText size={14} color="#10b981" />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  Transcribed Answer
                </span>
                <span style={{
                  marginLeft: 'auto', fontSize: 12, color: '#94a3b8', fontWeight: 500,
                  background: '#f1f5f9', padding: '2px 10px', borderRadius: 999
                }}>
                  {transcribedText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              {/* Transcript box */}
              <div style={{
                width: '100%', padding: '16px 18px',
                background: '#f8fafc',
                border: '1.5px solid #10b981',
                borderRadius: 10,
                minHeight: 120,
                fontSize: 14, color: '#1e293b',
                lineHeight: 1.75,
                whiteSpace: 'pre-wrap',
                boxSizing: 'border-box'
              }}>
                {transcribedText}
              </div>

              {/* Hint */}
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
                Not happy with your answer?{' '}
                <button
                  onClick={reset}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#f59e0b', fontWeight: 700, fontSize: 12, padding: 0
                  }}
                >
                  Re-record it
                </button>
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button
                onClick={reset}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  flex: 1, padding: '11px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: '1px solid #e2e8f0', background: 'white', color: '#64748b',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0' }}
              >
                <RefreshCw size={15} />
                Re-record
              </button>
              <button
                onClick={submitAnswer}
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center', gap: 8 }}
              >
                <Send size={15} />
                Submit Answer
              </button>
            </div>
          </>
        )}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <>
            <div style={{
              width: '100%', background: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: 10,
              padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start'
            }}>
              <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.6 }}>{error}</p>
            </div>
            <button onClick={reset} className="btn-primary" style={{ gap: 8 }}>
              <RefreshCw size={15} />
              Try Again
            </button>
          </>
        )}

      </div>

      <style>{`
        @keyframes ripple {
          0% { transform: scale(0.85); opacity: 0.6; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes bar {
          0% { transform: scaleY(0.5); }
          100% { transform: scaleY(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

export default Recorder