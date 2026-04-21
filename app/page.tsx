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
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [] }) })
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
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: newMsgs }) })
    const data = await res.json()
    if (data.script) { setScript(data.script); setScriptVisible(true) }
    setMessages([...newMsgs, { role: 'ai', text: data.reply }])
    setLoading(false)
    taRef.current?.focus()
  }
  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); send() }
  }
  function copyScript() {
    const t = `=== パート1 ===\n${script.p1}\n\n=== パート2 ===\n${script.p2}\n\n=== パート3 ===\n${script.p3}`
    navigator.clipboard.writeText(t).then(() => alert('コピーしました！'))
  }
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(140deg,#b8d4f0 0%,#c8b8e8 35%,#e0b8d0 65%,#f0c8d8 100%)',padding:'20px 12px'}}>
      <div style={{maxWidth:720,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{fontSize:20,fontWeight:700,color:'#1a1025'}}>YouTube 戦略台本エージェント</div>
          <div style={{fontSize:12,color:'#666',marginTop:4}}>チャットで答えるだけでプロ品質の台本を生成</div>
        </div>
        <div style={{background:'rgba(255,255,255,0.93)',borderRadius:20,overflow:'hidden',marginBottom:16}}>
          <div style={{padding:'10px 16px',background:'rgba(0,0,0,0.03)',borderBottom:'0.5px solid rgba(0,0,0,0.08)',display:'flex',justifyContent:'flex-end'}}>
            <button onClick={startConversation} disabled={loading} style={{padding:'6px 14px',borderRadius:20,border:'0.5px solid rgba(0,0,0,0.15)',background:'white',fontSize:12,cursor:'pointer',color:'#666',fontFamily:'Noto Sans JP, sans-serif'}}>🔄 最初からやり直す</button>
          </div>
          <div ref={msgsRef} style={{height:380,overflowY:'auto',padding:20,display:'flex',flexDirection:'column',gap:12,background:'#f8f7fc'}}>
            {messages.map((m,i) => (
              <div key={i} style={{display:'flex',flexDirection:'column',alignItems:m.role==='ai'?'flex-start':'flex-end'}}>
                <div style={{fontSize:10,color:'#999',marginBottom:3,padding:'0 4px'}}>{m.role==='ai'?'AI':'あなた'}</div>
                <div style={{maxWidth:'85%',padding:'12px 16px',borderRadius:16,fontSize:13,lineHeight:1.8,whiteSpace:'pre-wrap',background:m.role==='ai'?'white':'linear-gradient(135deg,#7c5cbf,#c87bb8)',color:m.role==='ai'?'#1a1025':'white',border:m.role==='ai'?'0.5px solid rgba(0,0,0,0.1)':'none',borderBottomLeftRadius:m.role==='ai'?4:16,borderBottomRightRadius:m.role==='user'?4:16}}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start'}}>
                <div style={{fontSize:10,color:'#999',marginBottom:3,padding:'0 4px'}}>AI</div>
                <div style={{background:'white',border:'0.5px solid rgba(0,0,0,0.1)',borderRadius:16,borderBottomLeftRadius:4,padding:'12px 16px',display:'flex',gap:4}}>
                  {[0,1,2].map(j => <div key={j} style={{width:6,height:6,borderRadius:'50%',background:'#ccc',animation:'blink 1.2s infinite',animationDelay:`${j*0.2}s`}} />)}
                </div>
              </div>
            )}
          </div>
          <div style={{padding:'12px 16px',background:'white',borderTop:'0.5px solid rgba(0,0,0,0.1)',display:'flex',gap:8,alignItems:'flex-end'}}>
            <textarea ref={taRef} onKeyDown={onKey} placeholder="ここに入力...（Enterで送信）" rows={1} style={{flex:1,border:'0.5px solid rgba(0,0,0,0.15)',borderRadius:12,padding:'10px 14px',fontSize:13,fontFamily:'Noto Sans JP, sans-serif',resize:'none',outline:'none',lineHeight:1.6}} />
            <button onClick={send} disabled={loading} style={{width:42,height:42,borderRadius:12,border:'none',background:'linear-gradient(135deg,#7c5cbf,#c87bb8)',color:'white',cursor:'pointer',fontSize:16,flexShrink:0}}>↑</button>
          </div>
        </div>
        {scriptVisible && (
          <div style={{background:'rgba(255,255,255,0.93)',borderRadius:20,padding:24}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:700,color:'#1a1025'}}>生成された台本</div>
              <button onClick={copyScript} style={{padding:'8px 18px',borderRadius:10,border:'1px solid #b8a8e0',background:'white',color:'#7c5cbf',fontSize:12,cursor:'pointer',fontWeight:700}}>全部コピー</button>
            </div>
            <div style={{display:'flex',gap:4,marginBottom:16,background:'rgba(0,0,0,0.05)',borderRadius:10,padding:3}}>
              {(['p1','p2','p3'] as const).map(k => (
                <button key={k} onClick={() => setActiveTab(k)} style={{flex:1,padding:'7px 4px',borderRadius:7,border:'none',background:activeTab===k?'white':'transparent',color:activeTab===k?'#7c5cbf':'#999',fontWeight:activeTab===k?700:400,fontSize:11,cursor:'pointer',fontFamily:'Noto Sans JP, sans-serif'}}>
                  {k==='p1'?'パート1':k==='p2'?'パート2':'パート3'}
                </button>
              ))}
            </div>
            <div style={{background:'#f9f8ff',border:'0.5px solid #ddd8f8',borderRadius:12,padding:16,maxHeight:400,overflowY:'auto',fontSize:13,lineHeight:1.9,color:'#1a1025',whiteSpace:'pre-wrap'}}>
              {script[activeTab]}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes blink{0%,80%,100%{opacity:.3}40%{opacity:1}}`}</style>
    </div>
  )
}
