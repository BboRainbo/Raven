import { generateUniqueId } from '@/utils/generateUniqueId'
import type { TreeNode } from '@/type/Tree'
import { defaultNodeProps } from '@/utils/date/defaultNodeProps'

// 🧠 多載宣告
export function addNodeToTree(tree: TreeNode, parentId: string): TreeNode
export function addNodeToTree(tree: TreeNode, parentId: string, newNode: string): TreeNode
export function addNodeToTree(tree: TreeNode, parentId: string, newNode: TreeNode): TreeNode
export function addNodeToTree(tree: TreeNode, parentId: string, newNodes: string[]): TreeNode
export function addNodeToTree(tree: TreeNode, parentId: string, newNodes: TreeNode[]): TreeNode

// 🧠 實作
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
    const newChildren: TreeNode[] = itemsArray.map(item => {
      if (typeof item === 'string') {
        // ✅ 新建字串節點 → 自動套用 defaultNodeProps
        return {
          id: generateUniqueId(),
          name: item,
          ...defaultNodeProps(),
        }
      } else {
        // ✅ 如果是物件 → 不覆蓋原本有的值，缺的才補 defaultNodeProps
        return {
          ...defaultNodeProps(),
          ...item,
          id: generateUniqueId(),
          children: item.children ? [...item.children] : undefined,
        }
      }
    })

    return {
      ...tree,
      children: [...(tree.children || []), ...newChildren],
    }
  }

  return {
    ...tree,
    children: tree.children?.map(child =>
      addNodeToTree(child, parentId, newNodes)
    ),
  }
}
