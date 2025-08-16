import type { TreeNode } from '@/type/Tree'

export function renameNodeInTree(
  tree: TreeNode,
  targetId: string,
  nextName: string
): TreeNode {
  const name = nextName?.trim()
  if (!name) return tree

  if (tree.id === targetId) {
    return { ...tree, name }
  }
  if (!tree.children?.length) return tree

  // 結構共享：只有有變動的分支才建立新物件
  let changed = false
  const children = tree.children.map((c) => {
    const n = renameNodeInTree(c, targetId, name)
    if (n !== c) changed = true
    return n
  })
  return changed ? { ...tree, children } : tree
}
