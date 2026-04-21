'use client'
import { useRef, useState, useEffect } from 'react'

type Message = { role: 'ai' | 'user'; text: string }

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [scriptVisible, setScriptVisible] = useState(false)
  const [script, setScript] = useState({ p1: '', p2: '', p3: '' })
  const [activeTab, setActiveTab] = useState('p1')
  const msgsRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { startConversation() }, [])
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [messages, loading])

  async function startConversation() {
    setLoading(true)
    setMessages([])
    setScriptVisible(false)
    setScript({ p1: '', p2: '', p3: '' })
    if (taRef.current) taRef.current.value = ''
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    })
    const data = await res.json()
    setMessages([{ role: 'ai', text: data.reply }])
    setLoading(false)
    taRef.current?.focus()
  }

  async function send() {
    if (!taRef.current || loading) return
    const text = taRef.current.value.trim()
    if (!text) return
    taRef.current.value = ''
    taRef.current.style.height = 'auto'
    const newMsgs: Message[] = [...messages, { role: 'user', text }]
    setMessages(newMsgs)
    setLoading(true)
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMsgs }),
    })
    const data = await res.json()
    if (data.script) { setScript(data.script); setScriptVisible(true) }
    setMessages([...newMsgs, { role: 'ai', text: data.reply }])
    setLoading(false)
    taRef.current?.focus()
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      send()
    }
  }

  function copyScript() {
    const t = `=== パート1 ===\n${script.p1}\n\n=== パート2 ===\n${script.p2}\n\n=== パート3 ===\n${script.p3}`
    navigator.clipboard.writeText(t).then(() => alert('コピーしました！'))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(140deg,#b8d4f0 0%,#c8b8e8 35%,#e0b8d0 65%,#f0c8d8 100%)', padding: '20px 12px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1025' }}>YouTube 戦略台本エージェント</div>
          <d
