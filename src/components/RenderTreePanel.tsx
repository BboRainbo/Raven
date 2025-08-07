import React, { useState } from 'react'
import Tree from 'react-d3-tree'
import RenderNode from './RenderNode';
import type { TreeNode } from '@/type/Tree'

interface RenderTreePanelProps {
  treeData: TreeNode
  selectedId: string | null
  onNodeSelect: (id: string, name: string) => void
  onUpdateTree: (newTree: TreeNode) => void
  clipboardNode: TreeNode | null
  setClipboardNode: (node: TreeNode | null) => void
}


const RenderTreePanel: React.FC<RenderTreePanelProps> = ({
  treeData,
  selectedId,
  onNodeSelect,
  onUpdateTree,
  clipboardNode,
  setClipboardNode
}) => {

const renderNode = ({ nodeDatum }: any) => (
  <RenderNode
    nodeDatum={nodeDatum}
    selectedId={selectedId}
    onSelect={(id, name) => {
      onNodeSelect(id, name)
    }}
    onMouseEnter={() => {}}        // 🔧 加這個作為 placeholder
    onMouseDown={() => {}}         // 🔧 同理，加這個
    onMouseDownStart={() => {}}    // 🔧 也是
  />
)




const getVisibleTreeData = (node: TreeNode, isAncestorListMode = false): TreeNode => {
  const inListMode = isAncestorListMode || node.displayMode === 'list'

  return {
    ...node,
    children: !inListMode && node.children
      ? node.children.map(child => getVisibleTreeData(child, inListMode))
      : undefined,
  }
}

return (
  <div className="w-full h-full p-4">
    <div className="border h-[90%] bg-white">
      <Tree
        data={getVisibleTreeData(treeData)}
        orientation="vertical"
        zoomable
        translate={{ x: 300, y: 100 }}
        onNodeClick={(nodeData: any) => {
          const id = nodeData.data.id;
          const name = nodeData.data.name;
          onNodeSelect(id, name);
        }}
        renderCustomNodeElement={renderNode}
        enableLegacyTransitions={false}
        styles={{
          links: {
            stroke: '#000000ff',
            strokeWidth: 2,
          },
        }}
      />
    </div>
  </div>
)
}
export default RenderTreePanel
