'use client';

import type { TreeNode } from '@/type/Tree';
import { findNodeById, removeNodeById, addNodeToTree, deleteNodeFromTree, renameNodeInTree } from '@/utils/TreeUtils';
import { useState, useImperativeHandle, forwardRef } from 'react';

//TODO:為了支援 utils 多載的定義 放在這裡好嗎?
type ChildInput = string | TreeNode;



// ===== Public interface (給父層呼叫的命令式 API，不修改可見資料流) =====
// 這段僅僅是暴露API格式

export interface TreeClientHandle {
  // ✅ 多載：支援單個或多個子節點
  appendChildren(parentId: string, child: ChildInput): void;
  appendChildren(parentId: string, children: ChildInput[]): void;
  rename: (nodeId: string, nextName?: string) => void;
  remove: (nodeId: string) => void;
  cut: (nodeId: string) => void;
  paste: (targetParentId: string) => void;
  insertSubtree: (parentId: string, subtree: TreeNode) => void
  setNodeProgress: (nodeId: string, value: number) => void;
  setNodePriority: (nodeId: string, value: number) => void;
  getSubtree: (nodeId: string) => TreeNode | null;
  getTree: () => TreeNode;
  collapseSubtree: (id: string) => void;
  expandSubtree: (id: string) => void;
  toggleSubtree: (id: string) => void;
}


// ===== Controlled props：父層是單一真相 =====
interface TreeClientProps {
  value : TreeNode;                          // 單一真相（由父層傳入）
  onChange: (next:TreeNode) => void;         // 唯一更新通道，Void在此是代表呼叫 callback 後不用回復任何東西給子層
}

const TreeClient = forwardRef<TreeClientHandle, TreeClientProps>(
  ({ value, onChange }, ref) => {    
        const collapseNode = (node: TreeNode) => {
      if (node.children) {
        node._children = node.children;
        node._children.forEach(collapseNode);
        delete node.children;
      }
    };

    const expandNode = (node: TreeNode) => {
      if (node._children) {
        node.children = node._children;
        node.children.forEach(expandNode);
        delete node._children;
      }
    };
    // 只保留「不影響外部資料真相」的內部狀態，例如剪貼簿
    const [clipboardNode, setClipboardNode] = useState<TreeNode | null>(null);
    // 受控：任何資料變更只呼叫 onChange
    const emit = (next: TreeNode) => onChange(next);
    // ---- CRUD ----

    function setNodeProgress(nodeId: string, v: number) {
      const clamp = Math.max(0, Math.min(100, v));
      console.log('%c[TreeClient] setNodeProgress', 'color: green; font-weight: bold;', nodeId, clamp);
      function walk(root: TreeNode): TreeNode {
        if (root.id === nodeId) {
          console.log('找到目標節點:', root);
          return { ...root, progress: clamp };
        }
        if (!root.children?.length) return root;

        return { ...root, children: root.children.map(walk) };
      }
      const nextTree = walk(value);
      console.log('value === nextTree ?', value === nextTree);
      console.log('更新後樹:', nextTree);
      emit(nextTree);
    }
    function setNodePriority(nodeId: string, v: number) {
      const clamp = Math.max(1, Math.min(5, Math.round(v)));
      console.log('%c[TreeClient] setNodePriority', 'color: blue; font-weight: bold;', nodeId, clamp);

      function walk(root: TreeNode): TreeNode {
        if (root.id === nodeId) {
         console.log('找到目標節點:', root);
          return { ...root, priority: clamp };
        }
        if (!root.children?.length) return root;

        return { ...root, children: root.children.map(walk) };
      }

  const nextTree = walk(value);

  console.log('value === nextTree ?', value === nextTree);
  console.log('更新後樹:', nextTree);

  emit(nextTree);
    }
    function updateNode(nodeId: string, updates: Partial<TreeNode>) {
      function walk(root: TreeNode): TreeNode {
        if (root.id === nodeId) {
          return { ...root, ...updates };
        }
        if (!root.children?.length) return root;
        return { ...root, children: root.children.map(walk) };
      }
      emit(walk(value));
    }    
    function appendChildren(parentId: string, childOrChildren: ChildInput | ChildInput[]) {
      const arr = Array.isArray(childOrChildren) ? childOrChildren : [childOrChildren];
      const next = addNodeToTree(value, parentId, arr);
      emit(next);
    }
    const rename = (nodeId: string, nextName?: string) => {
      if (!nextName || !nextName.trim()) return
      const next = renameNodeInTree(value, nodeId, nextName.trim())
      emit(next)
    };
    const remove = (nodeId: string) => {
      if (nodeId === 'root') return;
      const next = deleteNodeFromTree(value, nodeId);
      if (next) emit(next);
    };
    const cut = (nodeId: string) => {
      if (nodeId === 'root') return;
      const found = findNodeById(value, nodeId);
      if (!found) return;
      const next = removeNodeById(value, nodeId);
      emit(next);
      // 深拷貝確保後續互不影響
      setClipboardNode(typeof structuredClone === 'function' ? structuredClone(found) : JSON.parse(JSON.stringify(found)));
    };
    const paste = (targetParentId: string) => {
      if (!clipboardNode) return;
      // 遞迴重生 ID，避免子孫節點 ID 碰撞
      const reIdSubtree = (n: TreeNode): TreeNode => ({
        ...n,
        id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString(),
        children: n.children?.map(reIdSubtree),
      });
      appendChildren(targetParentId, reIdSubtree(clipboardNode)); // 直接丟單個 TreeNode
      setClipboardNode(null);
    };

const insertSubtree = (parentId: string, subtree: TreeNode) => {
  const next = structuredClone(value) // value 是父層傳下來的 tree
  const parent = findNodeById(next, parentId)
  if (parent) {
    parent.children = [...(parent.children ?? []), subtree]
  }
  emit(next) // ✅ 回傳給父層，交由 TaskGenPage 更新狀態
}



    // ---- 暴露命令式 API（僅包裝上述純函式，不繞過受控資料流）----
    useImperativeHandle(ref, () => ({
      appendChildren,              
      rename,
      remove,
      cut,
      paste,
      insertSubtree,
      setNodeProgress,
      setNodePriority,
      updateNode,
      getSubtree: (nodeId) => findNodeById(value, nodeId) ?? null,
      getTree: () => value,

      collapseSubtree: (id: string) => {
      const clone = structuredClone(value);     // ✅ 從父層傳下來的 value
      const target = findNodeById(clone, id);        
        if (target) {
          target.collapsed = true;
          collapseNode(target);
          emit(clone);                            // ✅ 交回父層，更新狀態
        }

      },
      expandSubtree: (id: string) => {
        const clone = structuredClone(value);
        const target = findNodeById(clone, id);
        if (target) {
          target.collapsed = false;
          expandNode(target);
          emit(clone);
        }
      },

      toggleSubtree: (id: string) => {
        const clone = structuredClone(value)
        const target = findNodeById(clone, id)
        if (target) {
          if (target.children) {
            // 如果目前是展開的 → 收合
            collapseNode(target)
          } else if (target._children) {
            // 如果目前是收合的 → 展開
            expandNode(target)
          }
          emit(clone)
        }
        }
    }))


    // 這個元件不負責渲染 UI，只負責資料編輯命令
    return null;
  }
);

TreeClient.displayName = 'TreeClient';
export default TreeClient;
