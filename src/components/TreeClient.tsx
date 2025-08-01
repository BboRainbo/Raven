'use client'

import React, { useState } from 'react'
import Tree from 'react-d3-tree'

interface TreeNode {
  id: string
  name: string
  prompt?: string
  hasHistory?: boolean // 先不實作，但未來可用於顯示「已討論過」
  // history?: string[] ← ❌ 先不要實作
  children?: TreeNode[]
}

const initialTreeData: TreeNode = {
  id: 'root',
  name: '轉職計畫',
  children: [
    {
      id: 'sub1',
      name: '專案',
      children: [{ id: 'task1', name: 'Task 1' }],
    },
    {
      id: 'LeetCode',
      name: 'LeetCode',
    },
  ],
}

export default function TreeClient() {
  const [treeData, setTreeData] = useState<TreeNode>(initialTreeData)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleNodeClick = (nodeData: any) => {
    setSelectedId(nodeData.data.id)
  }
const renderNode = ({ nodeDatum }: any) => {
  const id = nodeDatum.__data__?.id ?? nodeDatum.id
  const name = nodeDatum.__data__?.name ?? nodeDatum.name
  const isSelected = id === selectedId

  const handleClick = () => {
    setSelectedId(id)
  }

  return (
    <g onClick={handleClick} style={{ cursor: 'pointer' }}>
      <circle
        r={10}
        fill={isSelected ? '#dbdb06ff' : '#3c7f9aff'}
        stroke="#000000ff"
        strokeWidth={2}
      />
      <text fill="#000000ff" x={15} y={5}>
        {name}
      </text>
    </g>
  )
}


  const updateNode = (tree: TreeNode): TreeNode => {
    if (tree.id === selectedId) {
      const name = prompt('重新命名節點', tree.name)
      if (name) return { ...tree, name }
      return tree
    }
    return {
      ...tree,
      children: tree.children?.map(updateNode),
    }
  }

  const deleteNode = (tree: TreeNode): TreeNode | null => {
    if (tree.children) {
      const filtered = tree.children
        .map(deleteNode)
        .filter((c) => c !== null) as TreeNode[]
      return { ...tree, children: filtered }
    }
    return tree.id === selectedId ? null : tree
  }

  const addNode = (tree: TreeNode): TreeNode => {
    if (tree.id === selectedId) {
      const newName = prompt('輸入新增節點名稱')
      if (newName) {
        const newChild: TreeNode = {
          id: `${tree.id}-${Date.now()}`,
          name: newName,
        }
        return {
          ...tree,
          children: [...(tree.children || []), newChild],
        }
      }
    }
    return {
      ...tree,
      children: tree.children?.map(addNode),
    }
  }

  const handleAction = async (action: 'add' | 'rename' | 'delete' | 'ai') => {
    if (!selectedId) return

    if (action === 'rename') {
      setTreeData(updateNode(treeData))
    } else if (action === 'delete') {
      const result = deleteNode(treeData)
      if (result) setTreeData(result)
    } else if (action === 'add') {
      setTreeData(addNode(treeData))
} else if (action === 'ai') {
  const userInput = prompt('與 AI 討論任務內容？')
  if (!userInput) return

  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: userInput }), // ✅ 這裡關鍵
  })

  const data = await res.json()
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'AI 無回應'
  alert(`AI 回覆：\n\n${reply}`)
}

  }

  return (
    <div className="h-full w-full bg-white">
      <div className="flex gap-2 mb-2">
        <button onClick={() => handleAction('add')} className="bg-green-500 text-white px-2 py-1">新增</button>
        <button onClick={() => handleAction('rename')} className="bg-yellow-500 text-white px-2 py-1">改名</button>
        <button onClick={() => handleAction('delete')} className="bg-red-500 text-white px-2 py-1">刪除</button>
        <button onClick={() => handleAction('ai')} className="bg-blue-600 text-white px-2 py-1">AI 討論</button>
      </div>

      <div className="border h-[90%] bg-white">

<Tree
  data={treeData}
  orientation="vertical"
  zoomable
  translate={{ x: 300, y: 100 }}
  onNodeClick={handleNodeClick}
  renderCustomNodeElement={renderNode}
  styles={{
    links: {
      stroke: '#ffffff',
      strokeWidth: 2,
    },
  }}
/>


      </div>
    </div>
  )
}
