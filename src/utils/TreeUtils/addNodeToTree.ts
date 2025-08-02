// utils/TreeUtils/addNodeToTree.ts
import { generateUniqueId } from '../generateUniqueId'
import type { TreeNode } from '@/type/Tree'

// 🧠 函數多載宣告
export function addNodeToTree(tree: TreeNode, parentId: string): TreeNode
export function addNodeToTree(tree: TreeNode, parentId: string, newNames: string[]): TreeNode

// 🧠 實作：用 newNames 判斷多型邏輯
export function addNodeToTree(
  tree: TreeNode,
  parentId: string,
  newNames?: string[]
): TreeNode {
  const namesToAdd = newNames ?? ['新節點']  // ✅ 預設為一個名稱

  if (tree.id === parentId) {
    const newChildren: TreeNode[] = namesToAdd.map(name => ({
      id: generateUniqueId(),
      name,
      textOffset: { x: 15, y: 5 },
      progress: 0,
    }))
    return {
      ...tree,
      children: [...(tree.children || []), ...newChildren],
    }
  }

  return {
    ...tree,
    children: tree.children?.map(child =>
      addNodeToTree(child, parentId, newNames)
    ),
  }
}
