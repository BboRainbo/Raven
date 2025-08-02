'use client'
import AIPanel from '@/components/AIPanel'
import { addNodeToTree } from '@/utils/TreeUtils/addNodeToTree'
import dynamic from 'next/dynamic'
import { useRef, useState } from 'react'
import type { TreeNode } from '@/type/Tree'
import { generateUniqueId } from '@/utils/generateUniqueId'

const TreeClient = dynamic(() => import('@/components/TreeClient'), { ssr: false })
const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null); // ✅ 改這行

export default function PromptPage() {
  const [prompt, setPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState('')

  // ✅ 將 treeData 改為單一節點
  const [treeData, setTreeData] = useState<TreeNode>({
    id: generateUniqueId(),
    name: "主任務",
    textOffset: { x: 15, y: 5 },
    children: [
      {
        id: generateUniqueId(),
        name: "子任務 1",
        textOffset: { x: 15, y: 5 },
        progress: 0
      },
      {
        id: generateUniqueId(),
        name: "子任務 2",
        textOffset: { x: 15, y: 5 },
        progress: 0
      }
    ]
  })

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const containerRef = useRef(null)

  // ✅ Gemini AI 對話產生子任務
  const [discussionPrompt, setDiscussionPrompt] = useState('')
  const [discussionResponse, setDiscussionResponse] = useState('')
  const [discussionOptions, setDiscussionOptions] = useState<string[]>([])
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

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

  const sendDiscussionPrompt = async () => {
    const promptText = `請根據節點「${treeData.name}」任務，給我 3~5 個子任務建議，以選項清單回覆格式呈現：
- 子任務一
- 子任務二
...`

    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText }),
    })
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '無回應'
    setDiscussionResponse(text)

    const options = text
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())

    setDiscussionOptions(options)
  }

  // ✅ 關鍵邏輯：AI 回傳子任務 → 加到樹中
  function handleAddSubtasksFromAI(tasks: string[]): void {
    if (!selectedNodeId) return
    const updatedTree = addNodeToTree(treeData, selectedNodeId, tasks)
    setTreeData(updatedTree)
  }

  return (
    <div className="flex w-full h-screen">
      
      {/* Left Panel: AIPanel */}
      {selectedNodeId && (
        <AIPanel 
          selectedNodeName={selectedNodeId} 
          onAddSubtasks={handleAddSubtasksFromAI}
        />
      )}

      {/* Right Panel: Tree */}
      <div ref={containerRef} className="w-1/2 p-4 h-full overflow-hidden">
        <TreeClient
          data={treeData}
          onNodeSelect={(nodeId) => {
            console.log("選到節點 ID：", nodeId)
            setSelectedNodeId(nodeId)
          }}
        />
      </div>
    </div>
  )
}
