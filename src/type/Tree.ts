// src/types/tree.ts
export interface TreeNode {
  id: string
  name: string
  displayMode?: 'tree' | 'list'
  progress?: number
  prompt?: string
  textOffset?: { x: number; y: number }
  children?: TreeNode[]
}
