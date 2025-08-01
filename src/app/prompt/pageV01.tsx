'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

// 避免 SSR hydration mismatch
const Tree = dynamic(() => import('react-d3-tree'), { ssr: false })

interface TaskNode {
  name: string
  children?: TaskNode[]
}

const initialData: TaskNode = {
  name: 'Main Goal',
  children: [
    {
      name: 'Sub Goal 1',
      children: [
        { name: 'Task 1-1' },
        { name: 'Task 1-2' },
      ],
    },
    {
      name: 'Sub Goal 2',
    },
  ],
}

export default function Page() {
  const [treeData, setTreeData] = useState<TaskNode>(initialData)
  const [selectedPath, setSelectedPath] = useState<number[]>([])
  const [prompt, setPrompt] = useState('')
  const [aiReply, setAiReply] = useState('')
  const [viewMode, setViewMode] = useState<'tree' | 'column'>('tree')
  const containerRef = useRef<HTMLDivElement>(null)

  const getSelectedNode = (path: number[]): TaskNode | null => {
    let node: TaskNode = treeData
    for (let i of path) {
      if (!node.children || !node.children[i]) return null
      node = node.children[i]
    }
    return node
  }

  const updateTreeAtPath = (path: number[], updateFn: (node: TaskNode) => void) => {
    const recursive = (node: TaskNode, depth = 0): TaskNode => {
      if (depth === path.length) {
        const newNode = { ...node }
        updateFn(newNode)
        return newNode
      }
      if (!node.children) return node
      const index = path[depth]
      return {
        ...node,
        children: node.children.map((child, i) =>
          i === index ? recursive(child, depth + 1) : child
        ),
      }
    }
    setTreeData(recursive(treeData))
  }

  const addChild = () => {
    updateTreeAtPath(selectedPath, (node) => {
      node.children = [...(node.children || []), { name: '新子節點' }]
    })
  }

  const renameNode = (newName: string) => {
    updateTreeAtPath(selectedPath, (node) => {
      node.name = newName
    })
  }

  const deleteNode = () => {
    if (selectedPath.length === 0) return // 根節點不可刪
    const parentPath = selectedPath.slice(0, -1)
    const indexToDelete = selectedPath[selectedPath.length - 1]
    updateTreeAtPath(parentPath, (parent) => {
      parent.children?.splice(indexToDelete, 1)
    })
    setSelectedPath(parentPath)
  }

  const handleClickNode = (nodeData: any, event: any) => {
    const path = event.target.getAttribute('data-path')?.split('-').map(Number)
    if (Array.isArray(path)) setSelectedPath(path)
  }

  const convertToD3 = (node: TaskNode, path: number[] = []): any => ({
    name: node.name,
    attributes: { path: path.join('-') },
    children: node.children?.map((child, idx) => convertToD3(child, [...path, idx])),
  })

  const renderTree = () => (
    <div ref={containerRef} style={{ width: '100%', height: '600px' }}>
      <Tree
        data={convertToD3(treeData)}
        orientation="vertical"
        translate={{ x: 300, y: 100 }}
        zoomable
        onNodeClick={handleClickNode}
        enableLegacyTransitions
      />
    </div>
  )

  const renderColumn = () => {
    const selected = getSelectedNode(selectedPath)
    if (!selected) return <div>無法取得節點</div>
    return (
      <ul className="list-disc list-inside">
        {selected.children?.map((child, idx) => (
          <li key={idx}>{child.name}</li>
        )) || <li>無子節點</li>}
      </ul>
    )
  }

  const sendPrompt = async () => {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    const data = await res.json()
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      setAiReply(data.candidates[0].content.parts[0].text)
    } else {
      setAiReply('無法取得回應')
    }
  }

  return (
    <div className="flex h-screen">
      {/* 左側 Prompt 區 */}
      <div className="w-1/2 p-4 border-r space-y-4">
        <h2 className="text-xl font-bold">Prompt 與 AI 對話</h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="輸入 prompt..."
          className="w-full h-40 p-2 border rounded"
        />
        <button
          onClick={sendPrompt}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          送出給 AI
        </button>
        {aiReply && (
          <div className="mt-4 p-2 border rounded bg-gray-100 whitespace-pre-wrap">
            <strong>AI 回應：</strong>
            <div>{aiReply}</div>
          </div>
        )}
      </div>

      {/* 右側任務樹區 */}
      <div className="w-1/2 p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">任務樹</h2>
          <div className="space-x-2">
            <button onClick={addChild} className="bg-green-500 text-white px-2 py-1 rounded">新增</button>
            <button onClick={() => {
              const newName = prompt("輸入新名稱：")
              if (newName) renameNode(newName)
            }} className="bg-yellow-500 text-white px-2 py-1 rounded">改名</button>
            <button onClick={deleteNode} className="bg-red-500 text-white px-2 py-1 rounded">刪除</button>
            <button
              onClick={() => setViewMode(viewMode === 'tree' ? 'column' : 'tree')}
              className="bg-gray-700 text-white px-2 py-1 rounded"
            >
              切換：{viewMode === 'tree' ? '欄位顯示' : '樹狀圖'}
            </button>
          </div>
        </div>
        {viewMode === 'tree' ? renderTree() : renderColumn()}
      </div>
    </div>
  )
}
