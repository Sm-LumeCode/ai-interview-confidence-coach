import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X, Send, Brain } from 'lucide-react'
import { API_BASE_URL } from '../services/api'

const FloatingHelpBot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState([
    { role: 'assistant', content: 'How can I help you?' }
  ])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-app-support', handleOpen)
    return () => window.removeEventListener('open-app-support', handleOpen)
  }, [])

  const handleSend = async () => {
    if (!message.trim()) return
    
    const userMsg = { role: 'user', content: message }
    setChat(prev => [...prev, userMsg])
    setMessage('')
    setLoading(true)

    try {
      setErrorMsg('')
      console.log('Sending chat request:', { message, history: chat })
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: chat })
      })
      
      const data = await response.json()
      console.log('Received response:', data)

      if (response.ok && !data.error) {
        setChat(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        const err = data.error || 'AI service error'
        console.error('Chat Error Details:', err)
        setErrorMsg(`Error: ${err}`)
        setChat(prev => [...prev, { role: 'assistant', content: "no" }])
      }
    } catch (err) {
      console.error('Fetch Fatal Error:', err)
      setErrorMsg(`Connection Failed: ${err.message}`)
      setChat(prev => [...prev, { role: 'assistant', content: 'Connection error.' }])
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    setErrorMsg('Testing connection...')
    try {
      const response = await fetch(`${API_BASE_URL}/test-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'test', history: [] })
      })
      const data = await response.json()
      if (response.ok) {
        setChat(prev => [...prev, { role: 'assistant', content: data.response }])
        setErrorMsg('Connection successful!')
      } else {
        setErrorMsg(`Test failed: ${data.detail || 'Unknown error'}`)
      }
    } catch (err) {
      setErrorMsg(`Connection failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-80 h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center">
                  <Brain size={20} className="text-teal-400" />
                </div>
                <div>
                  <div className="font-bold text-sm">App Support</div>
                  <div className="text-[10px] text-teal-400/60 uppercase font-bold tracking-widest">Always Online</div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-[10px] font-medium border border-red-100 mb-2">
                  {errorMsg}
                  <button onClick={testConnection} className="ml-2 underline font-bold">Try Test Route</button>
                </div>
              )}
              {chat.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-white text-slate-700 border border-slate-100'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input 
                type="text" 
                placeholder="Ask about procedures..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500/10"
              />
              <button 
                onClick={handleSend}
                disabled={loading}
                className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 disabled:opacity-50 shadow-lg shadow-slate-900/10 transition-all active:scale-95"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all active:scale-95 border-4 border-white group"
      >
        <HelpCircle size={32} className="group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  )
}

export default FloatingHelpBot
