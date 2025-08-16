import { TreeNode } from '@/type/Tree'
import { pushHistory } from '@/utils/TreeUtils/History/historyManager'

//TODO:之後匯出/匯入邏輯記得要移到後端
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
 * 匯入樹：直接用檔案選擇器選檔
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
        onImport(json)
        if (pushHistoryFn) pushHistoryFn(json)
      } catch {
        alert('匯入失敗：檔案格式錯誤')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}
