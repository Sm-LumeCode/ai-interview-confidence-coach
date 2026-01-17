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
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      setSttSupported(false)
      console.warn('Speech Recognition not supported in this browser')
      return
    }

    // Initialize Speech Recognition with better settings
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = 'en-US'
    recognitionRef.current.maxAlternatives = 1

    recognitionRef.current.onresult = (event) => {
      let interim = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript + ' '
          setTranscribedText(finalTranscriptRef.current)
        } else {
          interim += transcript
        }
      }
      
      setInterimText(interim)
    }

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'no-speech') {
        console.log('No speech detected, continuing...')
      } else if (event.error === 'aborted') {
        console.log('Speech recognition aborted')
      }
    }

    recognitionRef.current.onend = () => {
      // Auto-restart if still recording
      if (isRecording && !isPaused) {
        try {
          recognitionRef.current.start()
        } catch (error) {
          console.warn('Could not restart recognition:', error)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (error) {
          console.warn('Error stopping recognition:', error)
        }
      }
    }
  }, [isRecording, isPaused])

  const startRecording = async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      setIsRecording(true)
      setIsPaused(false)
      setTranscribedText('')
      setInterimText('')
      finalTranscriptRef.current = ''

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      // Start Speech Recognition
      if (recognitionRef.current && sttSupported) {
        try {
          recognitionRef.current.start()
          setIsTranscribing(true)
        } catch (error) {
          console.warn('Speech recognition start error:', error)
        }
      }

    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const pauseRecording = () => {
    if (isRecording) {
      if (isPaused) {
        // Resume
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
        
        if (recognitionRef.current && sttSupported) {
          try {
            recognitionRef.current.start()
            setIsTranscribing(true)
          } catch (error) {
            console.warn('Recognition already started')
          }
        }
        setIsPaused(false)
      } else {
        // Pause
        clearInterval(timerRef.current)
        
        if (recognitionRef.current && sttSupported) {
          recognitionRef.current.stop()
          setIsTranscribing(false)
        }
        setIsPaused(true)
      }
    }
  }

  const stopRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      setIsPaused(false)
      clearInterval(timerRef.current)
      setInterimText('')

      // Stop Speech Recognition
      if (recognitionRef.current && sttSupported) {
        recognitionRef.current.stop()
        setIsTranscribing(false)
      }
    }
  }

  const resetRecording = () => {
    setRecordingTime(0)
    setTranscribedText('')
    setInterimText('')
    setIsRecording(false)
    setIsPaused(false)
    setIsTranscribing(false)
    finalTranscriptRef.current = ''
  }

  const submitAnswer = () => {
    const finalText = transcribedText.trim()
    if (finalText) {
      onRecordingComplete(finalText)
      resetRecording()
    } else {
      alert('Please provide an answer first')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const displayText = transcribedText + (interimText ? ` ${interimText}` : '')

  return (
    <div className="card animate-slide-up">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Record Your Answer</h3>

      {!sttSupported && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-800 text-sm">
            Speech-to-Text not supported. Please use Chrome, Edge, or Safari, or type your answer below.
          </p>
        </div>
      )}

      <div className="flex flex-col items-center gap-6">
        {/* Timer Display */}
        <div className="text-center">
          <div className="text-5xl font-bold text-beige-800 mb-2">
            {formatTime(recordingTime)}
          </div>
          <div className="text-sm text-gray-600">
            {isRecording && !isPaused && (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                {isTranscribing ? 'Recording & Transcribing...' : 'Recording...'}
              </span>
            )}
            {isRecording && isPaused && (
              <span className="text-yellow-600">Paused</span>
            )}
            {!isRecording && transcribedText && (
              <span className="text-green-600">Recording Complete</span>
            )}
          </div>
        </div>

        {/* Recording Visualization */}
        {isRecording && !isPaused && (
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 bg-gradient-to-t from-amber-600 to-amber-700 rounded-full animate-pulse"
                style={{
                  height: `${20 + Math.random() * 40}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              ></div>
            ))}
          </div>
        )}

        {/* Live Transcription Display */}
        {(sttSupported && (isRecording || displayText)) && (
          <div className="w-full bg-gray-50 border-2 border-amber-600 rounded-lg p-4 min-h-[120px] max-h-[300px] overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-5 h-5 text-amber-700" />
              <h4 className="font-semibold text-gray-700">
                {isRecording ? 'Live Transcription:' : 'Your Answer:'}
              </h4>
            </div>
            {displayText ? (
              <p className="text-gray-800 whitespace-pre-wrap">
                {displayText}
                {interimText && <span className="text-gray-400 italic"> {interimText}</span>}
              </p>
            ) : (
              <p className="text-gray-400 italic">Start speaking... your words will appear here in real-time</p>
            )}
            <div className="mt-2 text-xs text-gray-500">
              Word count: {displayText.split(/\s+/).filter(w => w).length}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-4 flex-wrap justify-center">
          {!isRecording && !transcribedText && (
            <button
              onClick={startRecording}
              className="btn-primary flex items-center gap-2"
            >
              <Mic className="w-5 h-5" />
              Start Recording
            </button>
          )}

          {isRecording && (
            <>
              <button
                onClick={pauseRecording}
                className="btn-secondary flex items-center gap-2"
              >
                {isPaused ? (
                  <>
                    <Play className="w-5 h-5" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5" />
                    Pause
                  </>
                )}
              </button>
              <button
                onClick={stopRecording}
                className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
              >
                <MicOff className="w-5 h-5" />
                Stop Recording
              </button>
            </>
          )}

          {!isRecording && transcribedText && (
            <>
              <button
                onClick={resetRecording}
                className="btn-secondary flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Re-record
              </button>
              <button
                onClick={submitAnswer}
                className="btn-primary flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Submit Answer
              </button>
            </>
          )}
        </div>

        {/* Manual Text Input Fallback */}
        {!sttSupported && (
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type your answer:
            </label>
            <textarea
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-600 focus:outline-none min-h-[120px]"
            />
            <button
              onClick={submitAnswer}
              disabled={!transcribedText.trim()}
              className="btn-primary mt-4 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              Submit Answer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Recorder