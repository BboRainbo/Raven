'use client'
import { useRef } from 'react'
import React, { useState } from 'react'
import Tree from 'react-d3-tree'
import { useEffect, useCallback, useMemo } from 'react';

interface TreeClientProps {
  data: TreeNode[];
  onNodeSelect?: (nodeName: string) => void;  // ✅ 新增這行
}


interface TreeNode {
  id: string
  displayMode?: 'tree' | 'list'
  name: string
  progress? : number
  prompt?: string
  textOffset?: { x: number; y: number }
  children?: TreeNode[]
}
const getVisibleTreeData = (node: TreeNode, isAncestorListMode = false): TreeNode => {
  const inListMode = isAncestorListMode || node.displayMode === 'list'

  return {
    ...node,
    children: !inListMode && node.children
      ? node.children.map(child => getVisibleTreeData(child, inListMode))
      : undefined,
  }
}

const initialTreeData: TreeNode = {
  id: 'root',
  name: '轉職計畫',
  progress : 30,
  textOffset: { x: 15, y: 5 },
  children: [
    {
      id: 'sub1',
      name: '專案',
      progress : 50,
      textOffset: { x: 15, y: 5 },
      children: [{ id: 'task1', name: 'Task 1', textOffset: { x: 15, y: 5 } }],
    },
    {
      id: 'LeetCode',
      name: 'LeetCode',
      progress : 50,
      textOffset: { x: 15, y: 5 },
    },
  ],
}

export default function TreeClient({ data, onNodeSelect }: TreeClientProps) {
  const isDraggingTree = useRef(false)
  const [treeData, setTreeData] = useState<TreeNode>(initialTreeData)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggingNode, setDraggingNode] = useState<{
    id: string
    startX: number
    startY: number
  } | null>(null)
  //1025
  useEffect(() => {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    const { parent, tasks } = detail;

    setTreeData((prevTree) => {
      const newTree = JSON.parse(JSON.stringify(prevTree)); // 深拷貝
      const findAndAppend = (nodes: TreeNode[]): boolean => {
        for (let node of nodes) {
          if (node.name === parent) {
            if (!node.children) node.children = [];
            tasks.forEach((taskName: string) => {
              node.children!.push({
                name: taskName,
                progress: 0,
              });
            });
            return true;
          }
          if (node.children && findAndAppend(node.children)) return true;
        }
        return false;
      };
      findAndAppend([newTree]);
      return newTree;
    });
  };

  window.addEventListener('add-subtasks', handler);
  return () => window.removeEventListener('add-subtasks', handler);
}, []);

  //1025

  const [draggingId, setDraggingId] = useState<string | null>(null)

  const handleNodeClick = (nodeData: any) => {
    setSelectedId(nodeData.data.id)
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation()
    setDraggingId(id)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggingId || draggingId === targetId) return

    const [newTree, draggedNode] = removeNodeAndReturn(treeData, draggingId)
    if (!draggedNode) return

    if (isDescendant(draggedNode, targetId)) return

    const updatedTree = insertNodeAsChild(newTree, targetId, draggedNode)
    setTreeData(updatedTree)
    setDraggingId(null)
  }

  const isDescendant = (node: TreeNode, targetId: string): boolean => {
    if (node.id === targetId) return true
    return node.children?.some((child) => isDescendant(child, targetId)) ?? false
  }

  const removeNodeAndReturn = (tree: TreeNode, id: string): [TreeNode, TreeNode | null] => {
    if (tree.children) {
      const idx = tree.children.findIndex((c) => c.id === id)
      if (idx !== -1) {
        const removed = tree.children[idx]
        const newChildren = [...tree.children.slice(0, idx), ...tree.children.slice(idx + 1)]
        return [{ ...tree, children: newChildren }, removed]
      }

      const newChildren: TreeNode[] = []
      let removedNode: TreeNode | null = null

      for (const child of tree.children) {
        const [updatedChild, removed] = removeNodeAndReturn(child, id)
        newChildren.push(updatedChild)
        if (removed) removedNode = removed
      }

      return [{ ...tree, children: newChildren }, removedNode]
    }

    return [tree, null]
  }

  const insertNodeAsChild = (tree: TreeNode, parentId: string, newNode: TreeNode): TreeNode => {
    if (tree.id === parentId) {
      return {
        ...tree,
        children: [...(tree.children || []), newNode],
      }
    }

    return {
      ...tree,
      children: tree.children?.map((child) =>
        insertNodeAsChild(child, parentId, newNode)
      ),
    }
  }

  const updateTextOffset = (tree: TreeNode): TreeNode => {
    if (!draggingNode) return tree

    if (tree.id === draggingNode.id) {
      const dx = draggingNode.startX
      const dy = draggingNode.startY
      return {
        ...tree,
        textOffset: {
          x: (tree.textOffset?.x || 0) + dx,
          y: (tree.textOffset?.y || 0) + dy,
        },
      }
    }

    return {
      ...tree,
      children: tree.children?.map(updateTextOffset),
    }
  }

const renderNode = ({ nodeDatum }: any) => {
  // 條列模式：將 children 渲染為進度條清單
if (nodeDatum.displayMode === 'list' && nodeDatum.children?.length > 0) {
  return (
    <g>
      <foreignObject x={-100} y={10} width={200} height={nodeDatum.children.length * 50}>
        <div xmlns="http://www.w3.org/1999/xhtml" className="bg-white border p-2 rounded shadow text-xs">
          <div className="font-bold mb-1">{nodeDatum.name}</div>
          {nodeDatum.children.map((child: TreeNode) => (
            <div key={child.id} className="mb-2">
              <div className="text-[13px]">{child.name}</div>
              <div className="w-full bg-gray-200 h-2 rounded">
                <div
                  className="bg-blue-600 h-2 rounded"
                  style={{ width: `${child.progress ?? 0}%` }}
                />
              </div>
              <div className="text-right text-gray-500 text-[11px]">{(child.progress ?? 0)}%</div>
            </div>
          ))}
        </div>
      </foreignObject>
    </g>
  )
}

  const id = nodeDatum.id ?? nodeDatum.id
  const name = nodeDatum.name ?? nodeDatum.name
  const offset = nodeDatum.textOffset ?? { x: 15, y: 5 }
  const progress = nodeDatum.progress ?? 0 // 新增進度
  const isSelected = id === selectedId

  const progressBarWidth = 80
  const progressBarHeight = 8

  const handleClick = () => {
    setSelectedId(id)
  }

  const onMouseDown = (e: React.MouseEvent<SVGTextElement, MouseEvent>) => {
    e.stopPropagation()
    setDraggingNode({ id, startX: e.clientX, startY: e.clientY })
  }

  return (
    <g
onClick={() => {
  if (onNodeSelect) {
    onNodeSelect(nodeDatum.name); // 假設 node.name 是節點名稱
  }
}}

      draggable
      onDragStart={(e) => handleDragStart(e, id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDrop(e, id)}
      style={{ cursor: 'grab' }}
    >
      {/* 保留原本的圓形節點選中效果 */}
      <circle
        r={10}
        fill={isSelected ? '#dbdb06ff' : '#ffffffff'}
        stroke="#000000ff"
        strokeWidth={2}
      />

      {/* 新增進度條背景 */}
      <rect
        x={-40}
        y={-30}
        width={progressBarWidth}
        height={progressBarHeight}
        fill="#ccc"
        rx={4}
        ry={4}
      />
      {/* 新增進度條進度 */}
      <rect
        x={-40}
        y={-30}
        width={(progress / 100) * progressBarWidth}
        height={progressBarHeight}
        fill="#4f46e5"
        rx={4}
        ry={4}
      />

      {/* 節點名稱 + onMouseDown 拖曳 offset 功能 */}
      <text
        fill="#000"
        x={offset.x}
        y={offset.y}
        fontFamily="Arial, sans-serif"
        fontSize={16}
        fontWeight="normal"
        pointerEvents="none"
        style={{ textRendering: 'geometricPrecision' }}
        onMouseDown={onMouseDown}
      >
      {name}
      {`${progress}%`}
        
      </text>
    </g>
  )
}


  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!draggingNode) return
    const dx = e.movementX
    const dy = e.movementY

    setDraggingNode({
      id: draggingNode.id,
      startX: dx,
      startY: dy,
    })

    const updatedTree = updateTextOffset(treeData)
    setTreeData(updatedTree)
  }

  const handleMouseUp = () => {
    setDraggingNode(null)
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
          textOffset: { x: 15, y: 5 },
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

  const handleAction = async (action: 'add' | 'rename' | 'delete' | 'ai'|'toggleView') => {
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
        body: JSON.stringify({ prompt: userInput }),
      })

      const data = await res.json()
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'AI 無回應'
      alert(`AI 回覆：\n\n${reply}`)
    }
     else if (action === 'toggleView') {
  const toggle = (tree: TreeNode): TreeNode => {
    if (tree.id === selectedId) {
      return {
        ...tree,
        displayMode: tree.displayMode === 'list' ? 'tree' : 'list',
      }
    }
    return {
      ...tree,
      children: tree.children?.map(toggle),
    }
  }
  setTreeData(toggle(treeData))
}

  }

  return (
    <div
      className="h-full w-full"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="flex gap-2 mb-2">
        <button onClick={() => handleAction('add')} className="bg-green-500 text-white px-2 py-1">
          新增
        </button>
        <button onClick={() => handleAction('rename')} className="bg-yellow-500 text-white px-2 py-1">
          改名
        </button>
        <button onClick={() => handleAction('delete')} className="bg-red-500 text-white px-2 py-1">
          刪除
        </button>
        <button onClick={() => handleAction('ai')} className="bg-blue-600 text-white px-2 py-1">
          AI 討論
        </button>
        <button onClick={() => handleAction('toggleView')} className="bg-gray-600 text-white px-2 py-1">
        切換顯示模式
        </button>


      </div>

      <div className="border h-[90%] bg-white">
        <Tree
          data={getVisibleTreeData(treeData)}
          orientation="vertical"
          zoomable
          translate={{ x: 300, y: 100 }}
          onNodeClick={handleNodeClick}
          renderCustomNodeElement={renderNode}
          enableLegacyTransitions={false}
          styles={{
            links: {
              stroke: '#000000ff',
              strokeWidth: 2,
            },
          }}
        />
      </div>
    </div>
  )
}
