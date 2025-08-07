import RenderTreePanel from './RenderTreePanel'
import AIPanel  from './AIPanel'
import React, { useState, useRef } from 'react'
import type { TreeNode } from '@/type/Tree'
import type { TreeClientHandle } from '@/components/TreeClient'
import TreeClient from './TreeClient'

// TaskGenPage.tsx 中

export default function TaskGenPage() {
const [selectedNodeId, setSelectedNodeId] = useState<string>('')  // for AIPanel
const [selectedNodeName, setSelectedNodeName] = useState<string>('')
const treeClientRef = useRef<TreeClientHandle>(null)

return (
    <div className="flex h-screen">
      {/* ✅ 左邊 Tree 區域 */}
      <div className="w-1/2 h-full p-4 flex flex-col">
        {/* 工具列 */}
        <div className="flex gap-2 mb-2">
          <button onClick={() => treeClientRef.current?.handleAction('add')} className="bg-green-500 text-white px-2 py-1">新增</button>
          <button onClick={() => treeClientRef.current?.handleAction('rename')} className="bg-yellow-500 text-white px-2 py-1">改名</button>
          <button onClick={() => treeClientRef.current?.handleAction('delete')} className="bg-red-500 text-white px-2 py-1">刪除</button>
          <button onClick={() => treeClientRef.current?.handleAction('toggleView')} className="bg-gray-600 text-white px-2 py-1">切換顯示模式</button>
          <button onClick={() => treeClientRef.current?.handleCutNode()} className="bg-purple-500 text-white px-2 py-1">剪下</button>
          <button onClick={() => treeClientRef.current?.handlePasteNode()} className="bg-blue-500 text-white px-2 py-1">貼上</button>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-hidden">
          <TreeClient
            ref={treeClientRef}
            onNodeSelect={(id, name) => {
              setSelectedNodeId(id)
              setSelectedNodeName(name)
            }}
          />
        </div>
      </div>

      {/* ✅ 右邊 AI 任務討論區塊（平行於左半） */}
      <div className="w-1/2 h-full p-4 bg-gray-900 text-white overflow-auto">
        {selectedNodeId && (
          <AIPanel
            selectedNodeName={selectedNodeName}
            onAddSubtasks={(tasks) => {
              treeClientRef.current?.addSubtasksFromAI(tasks)
            }}
          />
        )}
      </div>
    </div>
  )
}

