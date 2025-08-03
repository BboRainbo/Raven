// utils/TreeUtils/removeNodeById.ts
import type { TreeNode } from '@/type/Tree'

export function removeNodeById(tree: TreeNode, targetId: string): TreeNode {
  if (!tree.children) return tree

  const filteredChildren = tree.children
    .filter(child => child.id !== targetId)
    .map(child => removeNodeById(child, targetId))

  return {
    ...tree,
    children: filteredChildren,
  }
}
