'use client';
import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import Tree, { CustomNodeElementProps } from 'react-d3-tree';
import RenderNode from './Tree/RenderNode';
import type { TreeNode } from '@/type/Tree';

interface RenderTreePanelProps {
  treeData: TreeNode;
  selectedId: string | null;
  onNodeSelect: (id: string, name: string) => void;
}

const RenderTreePanel: React.FC<RenderTreePanelProps> = ({
  treeData,
  selectedId,
  onNodeSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState<{ x: number; y: number }>({ x: 300, y: 100 });

  const renderNode = (rd: any) => {
    console.log(rd)
    console.log("座標:", rd.x, rd.y, "原始資料:", rd.nodeDatum)
    return (
      <RenderNode
        nodeDatum={rd.nodeDatum}
        selectedId={selectedId}
        onSelect={(id, name) => onNodeSelect(id, name)}
        onMouseEnter={() => {}}
      />
    )
  }
  const visibleTree = treeData

  /** 建索引：id -> { parentId, childrenIds, name } */
  type IndexNode = { id: string; name: string; parentId: string | null; childrenIds: string[] };
  const { byId, rootId } = useMemo(() => {
    const byId = new Map<string, IndexNode>();
    let rootId: string | null = null;
    const walk = (n: TreeNode, parentId: string | null) => {
      const id = n.id!;
      const name = (n as any).name ?? '';
      const children = (n.children ?? []) as TreeNode[];
      if (!rootId) rootId = id;
      byId.set(id, { id, name, parentId, childrenIds: children.map((c) => c.id!) });
      children.forEach((c) => walk(c, id));
    };
    walk(visibleTree, null);

    return { byId, rootId: rootId! };
  }, [visibleTree]);

  /** 沒選取時預設 root */
  useEffect(() => {
    if (!selectedId && rootId) {
      const n = byId.get(rootId)!;
      onNodeSelect(rootId, n.name);
    }
  }, [selectedId, rootId, byId, onNodeSelect]);

  /** 方向鍵：↑ parent，↓ first child，← 上一個兄弟，→ 下一個兄弟 */
  const selectByArrow = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      const curId = selectedId ?? rootId;
      if (!curId) return;
      const cur = byId.get(curId);
      if (!cur) return;

      let targetId: string | null = null;

      if (dir === 'up') {
        targetId = cur.parentId; // 父節點
      } else if (dir === 'down') {
        targetId = cur.childrenIds[0] ?? null; // 第一個子節點
      } else if (dir === 'left' || dir === 'right') {
        if (!cur.parentId) return; // root 沒兄弟
        const parent = byId.get(cur.parentId);
        if (!parent) return;
        const sibs = parent.childrenIds;
        const i = sibs.indexOf(curId);
        if (dir === 'left' && i > 0) targetId = sibs[i - 1];        // 上一個兄弟
        if (dir === 'right' && i >= 0 && i < sibs.length - 1) targetId = sibs[i + 1]; // 下一個兄弟
      }

      if (targetId) {
        const t = byId.get(targetId);
        if (t) onNodeSelect(targetId, t.name);
      }
    },
    [byId, selectedId, rootId, onNodeSelect]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); selectByArrow('up'); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); selectByArrow('down'); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); selectByArrow('left'); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); selectByArrow('right'); }
    },
    [selectByArrow]
  );

  useEffect(() => { containerRef.current?.focus(); }, []);
  const refocus = () => containerRef.current?.focus();
  //如何追查 d3 座標到底是怎麼分配的?
  //0.先查找 RenderNode 怎麼被渲染的? 
  //1.我看到RenderNode 是怎麼被<Tree> 呼叫的?
  //2.看到了CustomNodeElementProps
  //3.嘗試定義一個變數為這


  //let temp:CustomNodeElementProps;
  //temp.hierarchyPointNode.y
  return (
    <div className="w-full h-full p-4">
      <div
        ref={containerRef}
        tabIndex={0}
        role="tree"
        aria-label="Raven Tree"
        onKeyDown={onKeyDown}
        onMouseDown={refocus}
        className="border h-[90%] bg-white outline-none focus:ring-2 focus:ring-blue-500"
      >
      
        <Tree
          data={visibleTree}
          orientation="vertical"
          zoomable
          translate={{ x: 300, y: 100 }}
          onNodeClick={(nodeData: any) => {
            const id = nodeData.data.id as string;
            const name = nodeData.data.name as string;
            onNodeSelect(id, name);
          }}
          renderCustomNodeElement={renderNode}
          enableLegacyTransitions={false}
          styles={{ links: { stroke: '#000000ff', strokeWidth: 2 } }}
        />
      </div>
    </div>
  );
};

export default RenderTreePanel;
