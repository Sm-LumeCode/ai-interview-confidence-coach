import React, { useState, useRef } from 'react'
import { Mic, MicOff, Play, Pause, RotateCcw } from 'lucide-react'

const Recorder = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setIsPaused(false)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        clearInterval(timerRef.current)
      }
      setIsPaused(!isPaused)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      clearInterval(timerRef.current)
    }
  }

  const resetRecording = () => {
    setAudioBlob(null)
    setRecordingTime(0)
    chunksRef.current = []
  }

  const submitRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob)
      resetRecording()
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="card animate-slide-up">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Record Your Answer</h3>

      <div className="flex flex-col items-center gap-6">
        {/* Timer Display */}
        <div className="text-center">
          <div className="text-5xl font-bold gradient-text mb-2">
            {formatTime(recordingTime)}
          </div>
          <div className="text-sm text-gray-600">
            {isRecording && !isPaused && (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                Recording...
              </span>
            )}
            {isRecording && isPaused && (
              <span className="text-yellow-600">Paused</span>
            )}
            {!isRecording && audioBlob && (
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
                className="w-2 bg-gradient-to-t from-blue-500 to-purple-600 rounded-full animate-pulse"
                style={{
                  height: `${20 + Math.random() * 40}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              ></div>
            ))}
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-4">
          {!isRecording && !audioBlob && (
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
                Stop
              </button>
            </>
          )}

          {audioBlob && !isRecording && (
            <>
              <button
                onClick={resetRecording}
                className="btn-secondary flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Re-record
              </button>
              <button
                onClick={submitRecording}
                className="btn-primary flex items-center gap-2"
              >
                Submit Answer
              </button>
            </>
          )}
        </div>

        {/* Audio Preview */}
        {audioBlob && !isRecording && (
          <div className="w-full">
            <audio
              controls
              src={URL.createObjectURL(audioBlob)}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Recorder