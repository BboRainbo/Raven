"use client";

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSessionStorage } from "@/utils/useSessionStorage"
import type { TreeNode } from "@/type/Tree"


export default function AIDiscussStep1() {
  const router = useRouter()
  const sp = useSearchParams()
  const nodeId = sp.get('nodeId') ?? ''
  const nodeName = sp.get('nodeName') ?? ''
  const [brief, setBrief] = useState('')

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        router.back()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!brief.trim()) return
    router.push(
  `/ai-discuss/step2?brief=${encodeURIComponent(brief)}&nodeId=${nodeId}&nodeName=${encodeURIComponent(nodeName)}`
)

  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-lg p-8 relative">
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded"
        >
          退出
        </button>

        <h1 className="text-3xl font-bold text-center text-indigo-400">
          STEP1（視窗1）
        </h1>

        {(nodeId || nodeName) && (
          <p className="mt-6 text-center text-gray-300">
            針對節點：
            <span className="font-semibold text-white">{nodeName || '(未命名)'}</span>
            {nodeId ? `（${nodeId}）` : null}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-10">
          <label className="block text-lg mb-2 text-gray-200">初始資訊</label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="輸入背景與期望"
            className="w-full h-48 bg-gray-700 border border-gray-600 rounded-lg p-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="mt-8 flex justify-center">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-lg px-8 py-2 rounded-lg shadow transition"
            >
              送出
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
