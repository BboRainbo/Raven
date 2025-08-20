'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'


interface Step2PageProps {
  onAddSubtasks: (tasks: string[]) => void
}

export default function Step2Page({ onAddSubtasks }: Step2PageProps) {
  const router = useRouter()
  const sp = useSearchParams()
  const brief = sp.get('brief') ?? ''
  const parentId = sp.get('nodeId') ?? ''   // ✅ Step1 記得傳 nodeId

  const [aiDescription, setAiDescription] = useState('')
  const [subtasks, setSubtasks] = useState<string[]>([])
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])

  // 🚀 抓 AI 回覆
  useEffect(() => {
    if (!brief) return

    async function fetchAI() {
      const promptText = `請針對以下描述，提出一個總體描述，以及 3~5 個子任務建議，以選項清單回覆格式呈現：
描述內容：「${brief}」
---
回覆格式：
描述：...
- 子任務一
- 子任務二
- 子任務三`

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      })

      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

      const descMatch = text.match(/描述[:：](.*)/)
      setAiDescription(descMatch ? descMatch[1].trim() : 'AI 沒有提供描述')

      const options = text
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())

      setSubtasks(options)
    }

    fetchAI()
  }, [brief])

  // 🚀 定案
const finalizeAndBack = () => {
  if (selectedTasks.length === 0) {
    alert('請至少選擇一個子任務')
    return
  }

  // ✅ 產生 JSON 子樹
  const subtree = {
    id: Date.now().toString(), // 簡單生成一個 ID
    name: aiDescription || brief, // 主節點名稱 (用描述或 brief)
    progress: 0,
    textOffset: { x: 15, y: 5 },
    children: selectedTasks.map(task => ({
      id: Math.random().toString(36).slice(2),
      name: task,
      progress: 0,
      textOffset: { x: 15, y: 5 }
    }))
  }
console.log('[DEBUG Step2] Subtree JSON:', subtree)
  // ✅ 帶回 parentId & JSON 給主頁
  router.push(
    `/?insertSubtree=${encodeURIComponent(JSON.stringify(subtree))}&parentId=${parentId}`
  )
}


  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <div className="w-2/3 p-6 space-y-6">
        <h3 className="text-lg font-bold mb-2">AI 回覆的 Description（可編輯）</h3>
        <textarea
          value={aiDescription}
          onChange={(e) => setAiDescription(e.target.value)}
          className="w-full h-28 bg-gray-800 rounded p-2"
        />

        {/* 子任務選單 */}
        {subtasks.map((task, idx) => (
          <div key={idx} className="bg-gray-800 p-3 rounded mt-4 flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedTasks.includes(task)}
              onChange={(e) => {
                const checked = e.target.checked
                setSelectedTasks(prev =>
                  checked ? [...prev, task] : prev.filter(t => t !== task)
                )
              }}
            />
            <span>{task}</span>
          </div>
        ))}

        <div className="flex space-x-4 mt-6">
          <button className="bg-blue-700 px-4 py-2 rounded">開啟討論分支</button>
          <button
            className="bg-green-700 px-4 py-2 rounded"
            onClick={finalizeAndBack}
          >
            定案！加入子任務
          </button>
        </div>
      </div>

      {/* 右側討論歷程 */}
      <div className="w-1/3 p-6 border-l border-gray-700">
        <h3 className="text-lg font-bold mb-4">討論歷程</h3>
        <ul className="text-sm space-y-2">
          <li>main → 使用者第一次回應</li>
          <li>AI 回覆</li>
          <li>第二次討論進展</li>
          <li>支線討論 (背景知識)</li>
        </ul>
      </div>
    </div>
  )
}
