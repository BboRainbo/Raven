'use client'
import AIPanel from '@/components/AIPanel'
import dynamic from 'next/dynamic'
import { useRef, useState } from 'react'

const TreeClient = dynamic(() => import('@/components/TreeClient'), { ssr: false })

export default function PromptPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const containerRef = useRef(null)

  // ✅ AI Panel → 通知 TreeClient 插入子任務（由 TreeClient 實際修改）
  function handleAddSubtasksFromAI(tasks: string[]): void {
    if (!selectedNodeId) return
    window.dispatchEvent(new CustomEvent('add-subtasks', {
      detail: {
        parent: selectedNodeId,
        tasks: tasks,
      }
    }))
  }

  return (
    <div className="flex w-full h-screen">
      {/* 左邊：AI 面板 */}
      {selectedNodeId && (
        <AIPanel
          selectedNodeName={selectedNodeId}
          onAddSubtasks={handleAddSubtasksFromAI}
        />
      )}

      {/* 右邊：樹圖面板 */}
      <div ref={containerRef} className="w-1/2 p-4 h-full overflow-hidden">
        <TreeClient
          onNodeSelect={(nodeId) => {
            console.log('選取節點：', nodeId)
            setSelectedNodeId(nodeId)
          }}
        />
      </div>
    </div>
  )
}
