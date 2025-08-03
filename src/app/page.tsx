'use client'
import TreeClient from '@/components/TreeClient'
import AIPanel from '@/components/AIPanel'
import { useState } from 'react'
import { addNodeToTree } from '@/utils/TreeUtils/addNodeToTree'
import type { TreeNode } from '@/type/Tree'

const initialTreeData: TreeNode = {
  id: 'root',
  name: '轉職計畫',
  textOffset: { x: 15, y: 5 },
  progress: 0,
  children: [],
}

export default function PromptPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [treeData, setTreeData] = useState<TreeNode>(initialTreeData)

  const handleAddSubtasks = (tasks: string[]) => {
    if (!selectedNodeId) return
    const updated = addNodeToTree(treeData, selectedNodeId, tasks)
    setTreeData(updated)
  }

  return (
    <div className="flex h-screen">
      {/* 左側：AI 對話區 */}
      <div className="w-1/2 p-4 overflow-auto">
        <AIPanel onAddSubtasks={handleAddSubtasks} />
      </div>

      {/* 右側：樹狀圖區 */}
      <div className="w-1/2 p-4">
        <TreeClient
          treeData={treeData}
          setTreeData={setTreeData}
          selectedNodeId={selectedNodeId}
          onNodeSelect={setSelectedNodeId}
        />
      </div>
    </div>
  )
}
