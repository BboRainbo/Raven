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

  // 條列模式
  if (nodeDatum.displayMode === 'list' && nodeDatum.children?.length) {
    // <foreignObject 是把 HTML => SVG的翻譯義器，可讓你在SVG畫布 用HTML語法去畫圖
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
