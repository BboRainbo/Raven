// utils/tree/defaultNodeProps.ts
import type { TreeNode } from '@/type/Tree'
import { todayStr } from '@/utils/date/todayStr'

export function defaultNodeProps(): Partial<TreeNode> {
  const t = todayStr()
  return {
    progress: 0,
    textOffset: { x: 15, y: 5 },
    start: t,
    end: t,
  }
}
