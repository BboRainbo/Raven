'use client'
import dynamic from 'next/dynamic'

const TreeClient = dynamic(() => import('@/components/TreeClient'), { ssr: false })

export default function PromptPage() {
  return (
    <div className="h-screen">
      <TreeClient />
    </div>
  )
}
