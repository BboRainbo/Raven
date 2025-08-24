'use client'
import React from 'react'
import type { TreeNode } from '@/type/Tree'

interface RenderNodeProps {
  nodeDatum: TreeNode
  selectedId: string | null
  onSelect: (id: string, name: string) => void
}

const RenderNode: React.FC<RenderNodeProps> = ({
  nodeDatum,
  selectedId,
  onSelect,
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
      data-id={nodeDatum.id}
      onClick={handleClick}
      style={{ cursor: 'grab', pointerEvents: 'visiblePainted' }}
      data-node-id={nodeDatum.id}
    >
      {/* 節點圓圈 */}
      <circle
        r={10}
        fill={isSelected ? '#dbdb06ff' : '#ffffffff'}
        stroke="#000000ff"
        strokeWidth={2}
        pointerEvents="all"
      />

      {/* 進度條背景 */}
      <rect
        x={-40}
        y={-30}
        width={80}
        height={8}
        fill="#ccc"
        rx={4}
        ry={4}
      />
      {/* 進度條前景 */}
      <rect
        x={-40}
        y={-30}
        width={(progress / 100) * 80}
        height={8}
        fill="#4f46e5"
        rx={4}
        ry={4}
      />

      {/* 收合/展開按鈕 */}
      {(nodeDatum.children || nodeDatum._children) && (
        <g transform="translate(-20,0)" style={{ cursor: 'pointer' }}>
          <circle r={7} fill="#f0f0f0" stroke="#555" />
          {nodeDatum._children ? (
            // ▶ 收合
            <polygon points="-2,-3 3,0 -2,3" fill="black" />
          ) : (
            // ▼ 展開
            <polygon points="-3,-2 3,-2 0,3" fill="black" />
          )}
        </g>
      )}

      {/* 節點名稱與進度 */}
      <text
        fill="#000"
        x={offset.x}
        y={offset.y}
        fontFamily="Arial, sans-serif"
        fontSize={14}
        pointerEvents="all"
      >
        {nodeDatum.name} {progress}%
      </text>
    </g>
  )
}

export default RenderNode
