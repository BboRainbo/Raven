import { generateUniqueId } from '@/utils/generateUniqueId'
import type { TreeNode } from '@/type/Tree'
import { defaultNodeProps } from '@/utils/date/defaultNodeProps'

/**
 * 在樹中指定 parentId 的節點下新增子節點
 * - newNodes 可以是：單個字串 / 單個 TreeNode / 字串陣列 / TreeNode 陣列 / 混合陣列
 */
export function addNodeToTree(
  tree: TreeNode,
  parentId: string,
  newNodes?: string | TreeNode | (string | TreeNode)[]
): TreeNode {
  const itemsArray: (string | TreeNode)[] =
    newNodes === undefined ? ['新節點']
    : Array.isArray(newNodes) ? newNodes
    : [newNodes]

  if (tree.id === parentId) {
    const newChildren: TreeNode[] = itemsArray.map(item =>
      typeof item === 'string'
        ? {
            id: generateUniqueId(),
            name: item,
            ...defaultNodeProps(),
          }
        : {
            ...defaultNodeProps(),
            ...item,
            id: generateUniqueId(),
            children: item.children ? [...item.children] : undefined,
          }
    )

    return {
      ...tree,
      children: [...(tree.children || []), ...newChildren],
    }
  }

  return {
    ...tree,
    children: (tree.children ?? []).map(child =>
      addNodeToTree(child, parentId, newNodes)
    ),
  }
}
