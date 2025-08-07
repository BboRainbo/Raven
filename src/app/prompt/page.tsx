'use client'
import dynamic from 'next/dynamic'

const TaskGenPage = dynamic(() => import('@/components/TaskGenPage'), { ssr: false })

export default function PromptPage() {
  return (
    <div className="h-screen">
      <TaskGenPage />
    </div>
  )
}
