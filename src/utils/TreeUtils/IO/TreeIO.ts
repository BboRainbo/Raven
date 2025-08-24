import { TreeNode } from '@/type/Tree'
import { pushHistory } from '@/utils/TreeUtils/History/historyManager'

// 🔑 Migration: 自動補上 parentId
function addParentIds(node: TreeNode, parentId: string | null = null): TreeNode {
  const withParent: TreeNode = { ...node, parentId };

  if (node.children && node.children.length > 0) {
    withParent.children = node.children.map(c => addParentIds(c, node.id));
  }
  return withParent;
}

/**
 * 匯出樹：會彈出 prompt 輸入檔名
 */
export function exportTree(tree: TreeNode, defaultName = 'tree-data.json') {
  const filename = 'newTree'

  const blob = new Blob([JSON.stringify(tree, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 匯入樹：直接用檔案選擇器選檔，並自動補 parentId
 */
export function importTree(
  onImport: (tree: TreeNode) => void,
  pushHistoryFn?: (tree: TreeNode) => void
) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)

        // ✅ 自動補上 parentId
        const upgraded = addParentIds(json)

        onImport(upgraded)
        if (pushHistoryFn) pushHistoryFn(upgraded)
      } catch {
        alert('匯入失敗：檔案格式錯誤')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}
