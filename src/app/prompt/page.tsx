'use client'

import dynamic from 'next/dynamic'
import { useRef, useState } from 'react'

const TreeClient = dynamic(() => import('@/components/TreeClient'), { ssr: false })

export default function PromptPage() {
  const [prompt, setPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const containerRef = useRef(null)

  const sendPrompt = async () => {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    const data = await res.json()
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      setAiResponse(data.candidates[0].content.parts[0].text)
    } else {
      setAiResponse(data.error || 'AI 無回應')
    }
  }

  return (
    <div className="flex w-full h-screen">
      {/* Left Panel */}
      <div className="w-1/2 p-4 border-r border-gray-300 overflow-auto">
        <h2 className="text-lg font-bold mb-2">GPT Prompt 輸入</h2>
        <textarea
          className="w-full h-40 p-2 border"
          placeholder="輸入任務、目標、問題..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          onClick={sendPrompt}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          發送
        </button>
        <div className="mt-4 whitespace-pre-wrap">{aiResponse}</div>
      </div>

      {/* Right Panel */}
      <div ref={containerRef} className="w-1/2 p-4 h-full overflow-hidden bg-white">
        <TreeClient />
      </div>
    </div>
  )
}
