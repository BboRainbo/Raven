//專注於樹的邏輯控制
'use client'

import { addNodeToTree } from '../utils/TreeUtils/addNodeToTree'
import { deleteNodeFromTree } from '../utils/TreeUtils/deleteNodeFromTree'
import { renameNodeInTree } from '../utils/TreeUtils/renameNodeInTree'
import type { TreeNode } from '@/type/Tree'

import { generateUniqueId } from '@/utils/generateUniqueId'
import { useRef } from 'react'
import React, { useState } from 'react'
import Tree from 'react-d3-tree'
import { useEffect, useCallback, useMemo } from 'react';
import RenderNode from './RenderNode';

interface TreeClientProps {
  onNodeSelect?: (nodeName: string) => void;
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

export default function TreeClient({ onNodeSelect }: TreeClientProps)
 {
  const isDraggingTree = useRef(false)
  const [treeData, setTreeData] = useState<TreeNode>(initialTreeData)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggingNode, setDraggingNode] = useState<{
    id: string
    startX: number
    startY: number
  } | null>(null)


  // ✅ 給 AI 使用的新增子任務函數（使用 addNodeToTree）
  const handleAddSubtasksFromAI = (tasks: string[]) => {
    if (!selectedId) return
    const updatedTree = addNodeToTree(treeData, selectedId, tasks)
    setTreeData(updatedTree)
    }

  //統一管理 add node邏輯
useEffect(() => {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    const { parent, tasks } = detail;

    setTreeData(prevTree => addNodeToTree(prevTree, parent, tasks));
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


//封裝節點渲染
const renderNode = ({ nodeDatum }: any) => (
  <RenderNode
    nodeDatum={nodeDatum}
    selectedId={selectedId}
    onSelect={(id, name) => {
      setSelectedId(id)
      if (onNodeSelect) onNodeSelect(name)
    }}
    onDragStart={handleDragStart}
    onDrop={handleDrop}
    onMouseDown={(e, id, x, y) => setDraggingNode({ id, startX: x, startY: y })}
  />
)


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



  const handleAction = async (action: 'add' | 'rename' | 'delete'|'toggleView') => {
    if (!selectedId) return

    if (action === 'rename') {
      setTreeData(renameNodeInTree(treeData, selectedId))
    } else if (action === 'delete') {
      const result = deleteNodeFromTree(treeData, selectedId)
      if (result) setTreeData(result)
    } else if (action === 'add') {
      setTreeData(addNodeToTree(treeData, selectedId))
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
