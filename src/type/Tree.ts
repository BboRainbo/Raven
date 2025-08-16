// src/types/tree.ts
export interface TreeNode {
  id: string
  name: string
  description? : string

  displayMode?: 'tree' | 'list'
  progress?: number
  priority? :number
  prompt?: string
  textOffset?: { x: number; y: number }
  children?: TreeNode[]

  //timeLine
  start? : string
  end? : string
  blockedBy? : string
  //
}
