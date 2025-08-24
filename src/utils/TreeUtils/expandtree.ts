// src/utils/TreeUtils/expandAllChildren.ts
import type { TreeNode } from '@/type/Tree'

export function expandAllChildren(node: TreeNode): TreeNode {
  return {
    ...node,
    children: [
      ...(node.children?.map(expandAllChildren) ?? []),
      ...(node._children?.map(expandAllChildren) ?? []),
    ],
  }
}
