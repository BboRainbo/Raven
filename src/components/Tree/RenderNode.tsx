'use client'
import React from 'react'
import type { TreeNode } from '@/type/Tree'

interface RenderNodeProps {
  nodeDatum: TreeNode
  selectedId: string | null
  onSelect: (id: string, name: string) => void
  onMouseEnter: (id: string) => void
}

const RenderNode: React.FC<RenderNodeProps> = ({
  nodeDatum,
  selectedId,
  onSelect,
  onMouseEnter,          // ✅ 加上這行
}) => {

  const isSelected = nodeDatum.id === selectedId
  const offset = nodeDatum.textOffset ?? { x: 15, y: 5 }
  const progress = nodeDatum.progress ?? 0

  //Props 的最底層點擊事件被監聽
  const handleClick = (e: React.MouseEvent) => {
    onSelect(nodeDatum.id, nodeDatum.name)
  }


  return (
<g

  data-location = "720,190"
  onClick={handleClick}
  onMouseEnter={() => onMouseEnter(nodeDatum.id)}
  onMouseDown={() => {}}
  style={{ cursor: 'grab', pointerEvents: 'visiblePainted' }}
  data-node-id={nodeDatum.id}
>


      <circle
        r={10}
        fill={isSelected ? '#dbdb06ff' : '#ffffffff'}
        stroke="#000000ff"
        strokeWidth={2}
        onMouseDown={(e) => {
        e.stopPropagation();                      // ✅ 避免畫布拖曳事件觸發  
        }}
        onMouseEnter={() => onMouseEnter(nodeDatum.id)}
        pointerEvents="all"
      />
      <rect
        x={-40}
        y={-30}
        width={80}
        height={8}
        fill="#ccc"
        rx={4}
        ry={4}
      />
      <rect
        x={-40}
        y={-30}
        width={(progress / 100) * 80}
        height={8}
        fill="#4f46e5"
        rx={4}
        ry={4}
      />
      <text
        fill="#000"
        x={offset.x}
        y={offset.y}
        fontFamily="Arial, sans-serif"
        fontSize={16}
        onMouseEnter={() => onMouseEnter(nodeDatum.id)}
        onMouseDown={()=>{}}
        pointerEvents="all" // ✅ 改成 all，讓它真的能接到事件
      >
        {nodeDatum.name} {progress}%
      </text>
    </g>
  )
}

export default RenderNode
