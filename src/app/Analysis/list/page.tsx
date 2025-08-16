
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { TreeNode } from '@/type/Tree'
import SubtreeListView from '@/components/Chart/SubtreeListView'      // 放你剛剛做的列表元件
import TreeClient, { type TreeClientHandle } from '@/components/TreeClient'
import { findNodeById } from '@/utils/TreeUtils/findNodeById'

export default function ListModalPage() {
  const router = useRouter()
  const params = useSearchParams()
  const nodeId = params.get('id') ?? 'root'
  const src = params.get('src') // 'ss' 代表我們有放一份快照在 sessionStorage

  const treeRef = useRef<TreeClientHandle>(null)
  const [subtree, setSubtree] = useState<TreeNode | null>(null)
  const [loadedFrom, setLoadedFrom] = useState<'session'|'tree'|'none'>('none')

  // 1) 優先讀 sessionStorage 的快照（同分頁可即時取到）
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('raven:subtree')
      if (raw) {
        const parsed = JSON.parse(raw) as { nodeId: string; savedAt: number; subtree: TreeNode }
        if (parsed?.nodeId === nodeId && parsed?.subtree) {
          setSubtree(parsed.subtree)
          setLoadedFrom('session')
          return
        }
      }
    } catch {}
    setLoadedFrom('none')
  }, [nodeId])

  // 2) 若沒有快照，就用本頁的 TreeClient 取（會用初始樹，至少能顯示）
  useEffect(() => {
    if (loadedFrom !== 'none') return
    const t = setTimeout(() => {
      const sub = treeRef.current?.getSubtree(nodeId) ?? null
      setSubtree(sub)
      setLoadedFrom(sub ? 'tree' : 'none')
    }, 0)
    return () => clearTimeout(t)
  }, [nodeId, loadedFrom])

  // 關閉
  const close = () => router.back()

  // 這裡也可以即時回寫（優先透過 TreeClient API）
  const setPriority = (id: string, v: number) => {
    treeRef.current?.setNodePriority?.(id, v)
    // 若你想讓畫面立即反映，也可就地更新 subtree（可選）
    setSubtree(prev => {
      if (!prev) return prev
      const copy = structuredClone(prev) as TreeNode
      const target = findNodeById(copy, id)
      if (target) (target as any).priority = v
      return copy
    })
  }
  const setProgress = (id: string, v: number) => {
    treeRef.current?.setNodeProgress?.(id, v)
    setSubtree(prev => {
      if (!prev) return prev
      const copy = structuredClone(prev) as TreeNode
      const target = findNodeById(copy, id)
      if (target) (target as any).progress = v
      return copy
    })
  }

  return (
    <>
      {/* 無 UI 的 TreeClient：提供資料操作 API 與 fallback 取樹 */}
      <TreeClient ref={treeRef} selectedId={nodeId} onTreeChange={() => {}} />

      {/* Overlay 外層 */}
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/40" onClick={close} />
        <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl flex flex-col">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-black">列表視圖</h2>
              <p className="text-xs text-neutral-600">
                目標節點：<span className="font-medium">{nodeId}</span>
                {loadedFrom === 'session' ? '（來自暫存）' : loadedFrom === 'tree' ? '（由樹重建）' : '（載入中）'}
              </p>
            </div>
            <button
              onClick={close}
              className="px-3 py-1 rounded bg-gray-800 text-white hover:bg-black"
            >
              關閉
            </button>
          </div>

          <div className="p-4 flex-1 overflow-auto">
            {subtree ? (
              <SubtreeListView
                node={subtree}
                onSetPriority={setPriority}
                onSetProgress={setProgress}
                title="子任務（直屬）"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-500">
                沒有取得子樹資料（請回主頁重試）
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
