'use client'

import dynamic from 'next/dynamic'
import { useRef, useState } from 'react'
import AIDiscussionPanel from '@/components/AIDiscussionPanel'
const TreeClient = dynamic(() => import('@/components/TreeClient'), { ssr: false })

interface TreeNode {
  name: string
  children?: TreeNode[]
}

// 工具函式：遞迴新增子節點
function addChildrenToNode(tree: TreeNode[], targetName: string, newChildren: string[]): TreeNode[] {
  return tree.map((node) => {
    if (node.name === targetName) {
      return {
        ...node,
        children: [
          ...(node.children || []),
          ...newChildren.map((name) => ({ name })),
        ],
      }
    } else if (node.children) {
      return {
        ...node,
        children: addChildrenToNode(node.children, targetName, newChildren),
      }
    } else {
      return node
    }
  })
}

export default function PromptPage() {
  const [prompt, setPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [selectedNodeName, setSelectedNodeName] = useState('')
  const [treeData, setTreeData] = useState<TreeNode[]>([
    {
      name: '主任務',
      children: [{ name: '子任務 1' }, { name: '子任務 2' }],
    },
  ])

  const containerRef = useRef(null)

  const sendPrompt = async () => {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '無回應'
    setAiResponse(text)
  }

  return (
    <div className="flex w-full h-screen">
      {/* 左側：輸入與討論 */}
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

        {selectedNodeName && (
          <AIDiscussionPanel
            selectedNodeName={selectedNodeName}
            onAddSubtasks={(subtasks) => {
              const updated = addChildrenToNode(treeData, selectedNodeName, subtasks)
              setTreeData(updated)
            }}
          />
        )}
      </div>

      {/* 右側：樹狀圖 */}
      <div ref={containerRef} className="w-1/2 p-4 h-full overflow-hidden">
        <TreeClient
          data={treeData}
          onNodeSelect={(nodeName: string) => {
            setSelectedNodeName(nodeName)
          }}
        />
      </div>
    </div>
  )
}
