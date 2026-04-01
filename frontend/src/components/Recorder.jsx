import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Play, Pause, RotateCcw, Send, Volume2, AlertCircle } from 'lucide-react'

const Recorder = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcribedText, setTranscribedText] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [sttSupported, setSttSupported] = useState(true)
  const [interimText, setInterimText] = useState('')

  const recognitionRef = useRef(null)
  const timerRef = useRef(null)
  const finalTranscriptRef = useRef('')

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { setSttSupported(false); return }
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = 'en-US'
    recognitionRef.current.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) { finalTranscriptRef.current += t + ' '; setTranscribedText(finalTranscriptRef.current) }
        else interim += t
      }
      setInterimText(interim)
    }
    recognitionRef.current.onerror = () => {}
    recognitionRef.current.onend = () => {
      if (isRecording && !isPaused) {
        try { recognitionRef.current.start() } catch {}
      }
    }
    return () => { try { recognitionRef.current?.stop() } catch {} }
  }, [isRecording, isPaused])

  const startRecording = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setIsRecording(true); setIsPaused(false)
      setTranscribedText(''); setInterimText(''); finalTranscriptRef.current = ''
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000)
      if (recognitionRef.current && sttSupported) {
        try { recognitionRef.current.start(); setIsTranscribing(true) } catch {}
      }
    } catch { alert('Could not access microphone. Please check permissions.') }
  }

  const pauseRecording = () => {
    if (!isRecording) return
    if (isPaused) {
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000)
      try { recognitionRef.current?.start(); setIsTranscribing(true) } catch {}
      setIsPaused(false)
    } else {
      clearInterval(timerRef.current)
      recognitionRef.current?.stop(); setIsTranscribing(false); setIsPaused(true)
    }
  }

  const stopRecording = () => {
    setIsRecording(false); setIsPaused(false)
    clearInterval(timerRef.current); setInterimText('')
    recognitionRef.current?.stop(); setIsTranscribing(false)
  }

  const resetRecording = () => {
    setRecordingTime(0); setTranscribedText(''); setInterimText('')
    setIsRecording(false); setIsPaused(false); setIsTranscribing(false)
    finalTranscriptRef.current = ''
  }

  const submitAnswer = () => {
    const t = transcribedText.trim()
    if (t) { onRecordingComplete(t); resetRecording() }
    else alert('Please provide an answer first')
  }

  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  const displayText = transcribedText + (interimText ? ` ${interimText}` : '')
  const wordCount = displayText.split(/\s+/).filter(Boolean).length

  return (
    <div className="card animate-slide-up">
      <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 20 }}>
        Record Your Answer
      </h3>

      {!sttSupported && (
        <div style={{ background: '#fefbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10 }}>
          <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: '#92400e' }}>
            Speech-to-Text not supported. Please use Chrome or Safari, or type your answer below.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        {/* Timer */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 52, fontWeight: 800,
            color: isRecording ? '#10b981' : '#94a3b8', lineHeight: 1, letterSpacing: '-2px'
          }}>
            {fmt(recordingTime)}
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>
            {isRecording && !isPaused && (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s ease infinite' }} />
                {isTranscribing ? 'Recording & Transcribing…' : 'Recording…'}
              </span>
            )}
            {isRecording && isPaused && <span style={{ color: '#f59e0b' }}>Paused</span>}
            {!isRecording && transcribedText && <span style={{ color: '#10b981' }}>✓ Recording Complete</span>}
          </div>
        </div>

        {/* Waveform */}
        {isRecording && !isPaused && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[...Array(7)].map((_, i) => (
              <div key={i} style={{
                width: 4, background: '#10b981', borderRadius: 999,
                animation: `wave 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                height: `${16 + Math.random() * 20}px`
              }} />
            ))}
          </div>
        )}

        {/* Transcript box */}
        {sttSupported && (isRecording || displayText) && (
          <div style={{
            width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 10, padding: '14px 16px',
            minHeight: 100, maxHeight: 240, overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Volume2 size={14} color="#10b981" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                {isRecording ? 'Live Transcription' : 'Your Answer'}
              </span>
              {wordCount > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>{wordCount} words</span>
              )}
            </div>
            {displayText ? (
              <p style={{ fontSize: 14, color: '#0f172a', lineHeight: 1.6 }}>{displayText}</p>
            ) : (
              <p style={{ fontSize: 14, color: '#94a3b8', fontStyle: 'italic' }}>Start speaking — your words will appear here…</p>
            )}
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {!isRecording && !transcribedText && (
            <button onClick={startRecording} className="btn-primary">
              <Mic size={16} /> Start Recording
            </button>
          )}
          {isRecording && (
            <>
              <button onClick={pauseRecording} className="btn-secondary">
                {isPaused ? <><Play size={16} /> Resume</> : <><Pause size={16} /> Pause</>}
              </button>
              <button onClick={stopRecording} style={{
                background: '#ef4444', color: 'white', padding: '10px 20px',
                borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8
              }}>
                <MicOff size={16} /> Stop
              </button>
            </>
          )}
          {!isRecording && transcribedText && (
            <>
              <button onClick={resetRecording} className="btn-secondary">
                <RotateCcw size={16} /> Re-record
              </button>
              <button onClick={submitAnswer} className="btn-primary">
                <Send size={16} /> Submit Answer
              </button>
            </>
          )}
        </div>

        {/* Fallback textarea */}
        {!sttSupported && (
          <div style={{ width: '100%' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
              Type your answer:
            </label>
            <textarea
              value={transcribedText}
              onChange={e => setTranscribedText(e.target.value)}
              placeholder="Type your answer here…"
              className="input-field"
              style={{ minHeight: 120, resize: 'vertical' }}
            />
            <button onClick={submitAnswer} disabled={!transcribedText.trim()}
              className="btn-primary" style={{ marginTop: 12, opacity: transcribedText.trim() ? 1 : 0.5 }}>
              <Send size={16} /> Submit Answer
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes wave { from { transform: scaleY(0.5); } to { transform: scaleY(1.5); } }
      `}</style>
    </div>
  )
}

export default Recorder