'use client';
import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import Tree, { CustomNodeElementProps } from 'react-d3-tree';
import RenderNode from './Tree/RenderNode';
import type { TreeNode } from '@/type/Tree';
import * as d3 from "d3";

interface RenderTreePanelProps {
  treeData: TreeNode;
  selectedId: string | null;
  onNodeSelect: (id: string, name: string,node:TreeNode) => void;
  onImportTree?: (tree: TreeNode) => void; // 監聽拖移JSON事件
}

const RenderTreePanel: React.FC<RenderTreePanelProps> = ({
  treeData,
  selectedId,
  onNodeSelect,
  onImportTree,
}) => {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState<{ x: number; y: number }>({ x: 300, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  //監聽畫布大小，調整鎖定設定
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);
  //計算畫布中心
    useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    setTranslate({
      x: dimensions.width / 2,
      y: dimensions.height / 3,
    });
  }, [dimensions]);
    //設定副作用 => selected ID 改變時，儲存座標，呼叫 setTranslate
  useEffect(() => {
    if (!selectedId) return;
    const pos = nodePosRef.current.get(selectedId);
    if (!pos || dimensions.width === 0 || dimensions.height === 0) return;

    const { x: nx, y: ny } = pos;
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 3;
    const s = 1;

    const tx = cx - nx * s;
    const ty = cy - ny * s;

    // 用 d3 transition 平滑移動外層 <g>
    d3.select(".rd3t-g")
      .transition()
      .duration(750)      // 動畫時間 (ms)
      .attr("transform", `translate(${tx},${ty}) scale(${s})`);

    // 注意：這裡就不要再呼叫 setTranslate 了，否則會被 React 覆蓋
  }, [selectedId, dimensions,JSON.stringify(treeData)]);
  //監聽拖放事件（掛在畫布容器） => 新增拖放JSON 檔案功能 
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const stop = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };

    const onDragEnter = (e: DragEvent) => {
      stop(e);
      dragCounterRef.current += 1;
      setIsDragging(true);
    };
    const onDragOver = (e: DragEvent) => {
      stop(e);
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };
    const onDragLeave = (e: DragEvent) => {
      stop(e);
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) setIsDragging(false);
    };
    const onDrop = async (e: DragEvent) => {
      stop(e);
      dragCounterRef.current = 0;
      setIsDragging(false);

      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // 允許兩種常見格式：直接是 TreeNode，或包在 { tree } / { nodes }
        const maybeTree =
          (data && typeof data === 'object' && 'id' in data && 'name' in data)
            ? data
            : data?.tree ?? data?.nodes;

        if (!maybeTree) throw new Error('不是有效的樹 JSON 格式');
        onImportTree?.(maybeTree as TreeNode);
      } catch (err) {
        alert('JSON 解析失敗或格式不符');
      }
    };

    el.addEventListener('dragenter', onDragEnter);
    el.addEventListener('dragover', onDragOver);
    el.addEventListener('dragleave', onDragLeave);
    el.addEventListener('drop', onDrop);
    return () => {
      el.removeEventListener('dragenter', onDragEnter);
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('dragleave', onDragLeave);
      el.removeEventListener('drop', onDrop);
    };
  }, [onImportTree]);

const nodePosRef = useRef(new Map<string, { x: number; y: number }>());

const renderNode = (rd: any) => {
  const id = rd.nodeDatum.id;
  nodePosRef.current.set(id, {
    x: rd.hierarchyPointNode.x,
    y: rd.hierarchyPointNode.y,
  });

  return (
    <RenderNode
      nodeDatum={rd.nodeDatum}
      selectedId={selectedId}
      onSelect={(id, name,node) =>{
        console.log(rd.nodeDatum)
      // node._collapsed = !node._collapsed;

        onNodeSelect(id, name,node)
      } }
    />
  );
};

  // 遞迴過濾：如果節點被收合，就清空 children
const applyCollapse = (node: TreeNode): TreeNode => {
  if (node._collapsed) {
    return { ...node, children: [] };  // 收合狀態 → 清空 children
  }
  return {
    ...node,
    children: node.children?.map(applyCollapse) ?? []
  };
};

// 建立可見樹 (每次 treeData 改變都重新計算)
const visibleTree = useMemo(() => applyCollapse(treeData), [treeData]);


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
      onNodeSelect(rootId, n.name,n);
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
        if (t) onNodeSelect(targetId, t.name,t);
      }
    },
    [byId, selectedId, rootId, onNodeSelect]
  );

  //keydown:按鈕按下去的瞬間(畫面並沒有被渲染)
  //keypress:按鈕已經按壓下去
  //keyup:整個按鈕事件結束(畫面UI已經更新了)
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
  //temp.hierarchyPointNode.x
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
      {/* 拖放遮罩 */}
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center
                          bg-black/50 border-4 border-dashed border-white
                          pointer-events-none">
            <div className="rounded-xl bg-white/90 px-6 py-4 text-gray-900 text-center">
              <div className="font-semibold">拖曳 .json 到此匯入樹</div>
              <div className="text-xs opacity-70 mt-1">支援 Raven 匯出或相容格式</div>
            </div>
          </div>
        )}
        <Tree

          data={visibleTree}
          orientation="vertical"
          zoomable
          translate={translate}   
          renderCustomNodeElement={renderNode}
          enableLegacyTransitions={true}
          transitionDuration={500}    // ← 加上這個 (毫秒)

        />

      </div>
    </div>
  );
};

export default RenderTreePanel;
