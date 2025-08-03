//專注於樹的邏輯控制
'use client'
import AIPanel from './TreeClient/AIPanel'
import { findNodeById } from '@/utils/TreeUtils/findNodeById'
import { removeNodeById } from '@/utils/TreeUtils/removeNodeById'
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeName, setSelectedNodeName] = useState<string>('');
  const [treeData, setTreeData] = useState<TreeNode>(initialTreeData);
  const [clipboardNode, setClipboardNode] = useState<TreeNode | null>(null)
  const isDraggingTree = useRef(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null)
  const [draggingNode, setDraggingNode] = useState<{
    id: string
    startX: number
    startY: number
  } | null>(null)

const handleCutNode = () => {
  if (!selectedId || selectedId === 'root') return
  const found = findNodeById(treeData, selectedId)
  if (!found) return
  const updatedTree = removeNodeById(treeData, selectedId)
  setTreeData(updatedTree)
  setClipboardNode(found)
}

const handlePasteNode = () => {
  if (!selectedId || !clipboardNode) return
  const updatedTree = addNodeToTree(treeData, selectedId, [clipboardNode.name])
  setTreeData(updatedTree)
  setClipboardNode(null)
}

const handleNodeClick = (nodeData: any) => {
  const id = nodeData.data.id;
  const name = nodeData.data.name;
  setSelectedNodeId(id);
  setSelectedNodeName(name);
};



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
//dragging功能未成功

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

const handleMouseEnter = (id: string) => {
  // 你可以在這裡加上 debug 訊息或 hover 效果處理
  setHoverTargetId(id)  // ✅ 關鍵：更新目前滑鼠所在節點
  console.log(`Hovered on node: ${id}`)
}

const handleMouseDownStart = (id: string, x: number, y: number) => {
  setDraggingNode({ id, startX: x, startY: y });
};

//封裝節點渲染
const renderNode = ({ nodeDatum }: any) => (
  <RenderNode
  onMouseEnter={handleMouseEnter}
  onMouseDownStart={handleMouseDownStart}
    nodeDatum={nodeDatum}
    selectedId={selectedId}
onSelect={(id, name) => {
  setSelectedId(id)
  setSelectedNodeId(id)         
  setSelectedNodeName(name)     
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
  if (draggingId && hoverTargetId && draggingId !== hoverTargetId) {
    const [newTree, draggedNode] = removeNodeAndReturn(treeData, draggingId)
    if (!draggedNode) return

    const updatedTree = insertNodeAsChild(newTree, hoverTargetId, draggedNode)
    setTreeData(updatedTree)
  }
  setDraggingId(null)
  setHoverTargetId(null)
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
  <div className="flex h-screen">
    {/* ✅ 左邊 Tree 區域 */}
    <div className="w-1/2 h-full p-4" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* 工具列 */}
      <div className="flex gap-2 mb-2">
        <button onClick={() => handleAction('add')} className="bg-green-500 text-white px-2 py-1">新增</button>
        <button onClick={() => handleAction('rename')} className="bg-yellow-500 text-white px-2 py-1">改名</button>
        <button onClick={() => handleAction('delete')} className="bg-red-500 text-white px-2 py-1">刪除</button>
        <button onClick={() => handleAction('toggleView')} className="bg-gray-600 text-white px-2 py-1">切換顯示模式</button>
        <button onClick={handleCutNode} className="bg-purple-500 text-white px-2 py-1">剪下</button>
        <button onClick={handlePasteNode} className="bg-blue-500 text-white px-2 py-1">貼上</button>
      </div>

      {/* Tree */}
      <div className="border h-[90%] bg-white">
        <Tree
          data={getVisibleTreeData(treeData)}
          orientation="vertical"
          zoomable
          translate={{ x: 300, y: 100 }}
          onNodeClick={handleNodeClick}
          renderCustomNodeElement={renderNode}
          enableLegacyTransitions={false}
          panOnDrag={false}
          styles={{
            links: {
              stroke: '#000000ff',
              strokeWidth: 2,
            },
          }}
        />
      </div>
    </div>

    {/* ✅ 右邊 AI Panel */}
    <div className="w-1/2 h-full p-4 bg-gray-900 text-white overflow-auto">
      {selectedNodeId && (
      <AIPanel
  selectedNodeId={selectedId}
  selectedNodeName={selectedNodeName}
  onAddSubtasks={(tasks) => {
    if (!selectedId) return;
    const newTree = addNodeToTree(treeData, selectedId, tasks);
    setTreeData(newTree);
  }}
/>


      )}
    </div>
  </div>
)
}