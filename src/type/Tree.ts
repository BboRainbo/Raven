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
  position?: { x: number; y: number }   // ✅ 專門存 SVG 上的座標
  children?: TreeNode[] 
  _children?: TreeNode[] //儲存收合的子樹
  parentId?: string | null; // root = null
  collapsed? : boolean
  //timeLine
  start? : string
  end? : string
  blockedBy? : string
  //
}
