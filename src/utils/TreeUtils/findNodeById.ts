// utils/TreeUtils/findNodeById.ts
import type { TreeNode } from '@/type/Tree'

export function findNodeById(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id)
      if (found) return found
    }
  }
  return null
}
