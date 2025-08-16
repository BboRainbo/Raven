import type { TreeNode } from '@/type/Tree'

export function deleteNodeFromTree(tree: TreeNode, selectedId: string): TreeNode | null {
  if (tree.id === selectedId) return null

  const updatedChildren = tree.children
    ?.map((child) => deleteNodeFromTree(child, selectedId))
    .filter((child): child is TreeNode => child !== null)

  return {
    ...tree,
    children: updatedChildren,
  }
}
