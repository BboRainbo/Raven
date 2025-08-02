// components/RenderNode.tsx
'use client'
import React from 'react'
import type { TreeNode } from './types'

interface RenderNodeProps {
  nodeDatum: TreeNode
  selectedId: string | null
  onSelect: (id: string, name: string) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  onDrop: (e: React.DragEvent, id: string) => void
  onMouseDown: (e: React.MouseEvent<SVGTextElement>, id: string, x: number, y: number) => void
}

const RenderNode: React.FC<RenderNodeProps> = ({
  nodeDatum,
  selectedId,
  onSelect,
  onDragStart,
  onDrop,
  onMouseDown,
}) => {
  const isSelected = nodeDatum.id === selectedId
  const offset = nodeDatum.textOffset ?? { x: 15, y: 5 }
  const progress = nodeDatum.progress ?? 0

  const handleClick = () => {
    onSelect(nodeDatum.id, nodeDatum.name)
  }

  // 條列模式
  if (nodeDatum.displayMode === 'list' && nodeDatum.children?.length) {
    return (
      <g onClick={handleClick}>
        <foreignObject x={-100} y={10} width={200} height={nodeDatum.children.length * 50}>
          <div xmlns="http://www.w3.org/1999/xhtml" className="bg-white border p-2 rounded shadow text-xs">
            <div className="font-bold mb-1">{nodeDatum.name}</div>
            {nodeDatum.children.map((child) => (
              <div key={child.id} className="mb-2">
                <div className="text-[13px]">{child.name}</div>
                <div className="w-full bg-gray-200 h-2 rounded">
                  <div
                    className="bg-blue-600 h-2 rounded"
                    style={{ width: `${child.progress ?? 0}%` }}
                  />
                </div>
                <div className="text-right text-gray-500 text-[11px]">{(child.progress ?? 0)}%</div>
              </div>
            ))}
          </div>
        </foreignObject>
      </g>
    )
  }

  return (
    <g
      onClick={handleClick}
      draggable
      onDragStart={(e) => onDragStart(e, nodeDatum.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, nodeDatum.id)}
      style={{ cursor: 'grab' }}
    >
      <circle
        r={10}
        fill={isSelected ? '#dbdb06ff' : '#ffffffff'}
        stroke="#000000ff"
        strokeWidth={2}
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
        onMouseDown={(e) => onMouseDown(e, nodeDatum.id, e.clientX, e.clientY)}
        pointerEvents="none"
      >
        {nodeDatum.name} {progress}%
      </text>
    </g>
  )
}

export default RenderNode
