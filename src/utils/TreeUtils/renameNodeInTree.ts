import type { TreeNode } from '@/type/Tree'

export function renameNodeInTree(tree: TreeNode, selectedId: string): TreeNode {
  if (tree.id === selectedId) {
    const name = prompt('重新命名節點', tree.name)
    if (name) return { ...tree, name }
    return tree
  }

  return {
    ...tree,
    children: tree.children?.map((child) => renameNodeInTree(child, selectedId)),
  }
}
