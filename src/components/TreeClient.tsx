'use client'
import type { TreeNode } from '@/type/Tree'
import RenderTreePanel from './RenderTreePanel'
import { findNodeById } from '@/utils/TreeUtils/findNodeById'
import { removeNodeById } from '@/utils/TreeUtils/removeNodeById'
import { addNodeToTree } from '@/utils/TreeUtils/addNodeToTree'
import { deleteNodeFromTree } from '@/utils/TreeUtils/deleteNodeFromTree'
import { renameNodeInTree } from '@/utils/TreeUtils/renameNodeInTree'
import React, { useState, useImperativeHandle, forwardRef,useRef  } from 'react'


//定義 TreeClient 暴露給外部的 Interface
export interface TreeClientHandle {
  addSubtasksFromAI: (tasks: string[]) => void;
  getTreeData: () => TreeNode;
  handleAction: (action: 'add' | 'rename' | 'delete' | 'toggleView') => void;
  handleCutNode: () => void;
  handlePasteNode: () => void;
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

interface TreeClientProps { //子component 為 RenderTreePanel，只回報SVG互動點擊事件
  onNodeSelect: (id: string, name: string) => void;
}

export interface TreeClientHandle {
  addSubtasksFromAI: (tasks: string[]) => void;
  getTreeData: () => TreeNode;
}

const TreeClient = forwardRef<TreeClientHandle, TreeClientProps>(
  ({ onNodeSelect }, ref) => {
    const [selectedId, setSelectedId] = useState<string | null>(null)
  const [treeData, setTreeData] = useState<TreeNode>(initialTreeData);
  const [clipboardNode, setClipboardNode] = useState<TreeNode | null>(null)
 
//定義Interface暴露的操作  
useImperativeHandle(ref, () => ({
  addSubtasksFromAI: (tasks: string[]) => {
    if (!selectedId) return;
    const updatedTree = addNodeToTree(treeData, selectedId, tasks);
    setTreeData(updatedTree);
  },
  getTreeData: () => treeData,
  handleAction: (action) => {
    if (!selectedId) return;

    if (action === 'rename') {
      setTreeData(renameNodeInTree(treeData, selectedId));
    } else if (action === 'delete') {
      const result = deleteNodeFromTree(treeData, selectedId);
      if (result) setTreeData(result);
    } else if (action === 'add') {
      setTreeData(addNodeToTree(treeData, selectedId));
    } else if (action === 'toggleView') {
      const toggle = (tree: TreeNode): TreeNode => {
        if (tree.id === selectedId) {
          return {
            ...tree,
            displayMode: tree.displayMode === 'list' ? 'tree' : 'list',
          };
        }
        return {
          ...tree,
          children: tree.children?.map(toggle),
        };
      };
      setTreeData(toggle(treeData));
    }
  },
  handleCutNode: () => {
    if (!selectedId || selectedId === 'root') return;
    const found = findNodeById(treeData, selectedId);
    if (!found) return;
    const updatedTree = removeNodeById(treeData, selectedId);
    setTreeData(updatedTree);
    setClipboardNode(found);
  },
  handlePasteNode: () => {
    if (!selectedId || !clipboardNode) return;
    const updatedTree = addNodeToTree(treeData, selectedId, [clipboardNode.name]);
    setTreeData(updatedTree);
    setClipboardNode(null);
  }
}));


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
    return {
      ...tree,
      children: tree.children?.map(updateTextOffset),
    }
  }


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
  onNodeSelect(id, name); // ✅ 呼叫 props，讓 TaskGenPage 控制
};




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
  <div className="w-full h-full">
    <RenderTreePanel
      treeData={treeData}
      selectedId={selectedId}
      onUpdateTree={setTreeData}
      onNodeSelect={(id, name) => {
        setSelectedId(id)
        onNodeSelect(id, name)
      }}
      clipboardNode={clipboardNode}
      setClipboardNode={setClipboardNode}
    />
  </div>
)
});
export default TreeClient
