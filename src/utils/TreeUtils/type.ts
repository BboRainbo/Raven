export interface TreeNode {
  id: string
  displayMode?: 'tree' | 'list'
  name: string
  progress?: number
  prompt?: string
  textOffset?: { x: number; y: number }
  children?: TreeNode[]
}
