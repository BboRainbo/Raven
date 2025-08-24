'use client'
//接收router跳轉時傳遞資訊
import SubtreeGanttChart from '@/components/Chart/SubtreeGanttChart'
import SubtreeRadarChart from '@/components/Chart/SubtreeRadarChart'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import RenderTreePanel from '../../components/RenderTreePanel'
import AIPanel from '../../components/AIPanel'
import React, { useState, useRef, useMemo, useEffect } from 'react'
import type { TreeNode } from '@/type/Tree'

import TreeClient, { type TreeClientHandle } from '../../components/TreeClient'
import { findNodeById } from '@/utils/TreeUtils/findNodeById'


//Import History Snapshot Utils
import { createHistory, pushHistory, undo, redo, current } from '@/utils/TreeUtils/History/historyManager'
//樹的輸入/輸出
import { exportTree, importTree } from '@/utils/TreeUtils/IO/TreeIO'
//引入Drawer
import EvaluationDrawer from '../../components/Drawer/EvaluationDrawer'
import RadarDrawer from '../../components/Drawer/RadarDrawer'
import GanttDrawer from '../../components/Drawer/GanttDrawer'
import NodeEditDrawer from '../../components/Drawer/NodeEditorDrawer'

//引入收合
import { expandAllChildren } from '@/utils/TreeUtils/expandtree'

export default function TaskGenPage() {  

const treeContainerRef = useRef<HTMLDivElement>(null);

const initialTreeData: TreeNode = {
  id: 'root',
  name: '轉職計畫',
  progress: 30,
  textOffset: { x: 15, y: 5 },
  children: [
    {
      id: 'SideProject',
      name: '專案',
      progress: 30,
      textOffset: { x: 15, y: 5 },
      start: "2025-07-10",
      end: "2025-09-01",
      children: [
        { id: 'task1', name: 'GanttChart', progress: 100, start: "2025-08-14", end: "2025-08-15" }
      ]
    },
    {
      id: 'LeetCode', name: 'LeetCode', progress: 50, textOffset: { x: 15, y: 5 },
      start: "2025-08-14", end: "2025-09-01"
    },
    {
      id: 'Resume', name: 'Resume', progress: 60, textOffset: { x: 15, y: 5 },
      start: "2025-09-01", end: "2025-09-07"
    },
    { id: 'ColdReach', name: 'ColdReach', progress: 80, textOffset: { x: 15, y: 5 } }
  ]
};
const router = useRouter()
//Tree單一資料來源(在這裡主控而非TC)、UI 選取狀態（與資料解耦）
const [tree, setTree] = useState<TreeNode>(initialTreeData)  
const [selectedNodeId, setSelectedNodeId] = useState<string>('')   // 未選取時為空字串/你也可用 null
const [selectedNodeName, setSelectedNodeName] = useState<string>('')

//搜尋功能
const [highlightIndex, setHighlightIndex] = useState<number>(-1);
const [showSearch, setShowSearch] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
function searchNodes(node: TreeNode, query: string): {id:string, name:string}[] {
  let results: {id:string, name:string}[] = [];
  if (node.name.toLowerCase().includes(query.toLowerCase())) {
    results.push({ id: node.id!, name: node.name });
  }
  if (node.children) {
    node.children.forEach(c => results = results.concat(searchNodes(c, query)));
  }
  return results;
}

//快照功能狀態
const [treeHistory, setTreeHistory] = useState(() => createHistory(initialTreeData))

//快照功能 : 把TC的 recall 新增一個動作 : 推入 treeHistory[]
function handleTreeChange(newTree: TreeNode) {
  setTree(newTree)
  setTreeHistory(prev => pushHistory(prev, newTree))
}
function handleUndo() {
  setTreeHistory(prev => {
    const updated = undo(prev)
    setTree(current(updated)) // 同步 UI
    return updated
  })
}
function handleRedo() {
  setTreeHistory(prev => {
    const updated = redo(prev)
    setTree(current(updated)) // 同步 UI
    return updated
  })
}

  //TreeClient(TC) 命令式 API，引進 TC 的 CRUD 操作
  const treeClientRef = useRef<TreeClientHandle>(null)
  //作業上傳頁面的狀態
  const [showEvaluate, setShowEvaluate] = useState(false);
  // 甘特圖的狀態
  const [showGantt, setShowGantt] = useState(false);
  //節點編輯器(debug用)
  const [showEdit, setShowEdit] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  // TODO: Radar 圖的 state 不應該讓這裡持有 而是 radar page持有
  const [showRadar, setShowRadar] = useState(false)
  const [radarMode, setRadarMode] = useState<'children' | 'childrenLeafAvg' | 'depth'>('childrenLeafAvg')
  const [radarDepth, setRadarDepth] = useState<number>(2)

  const sp = useSearchParams()
  useEffect(() => {
    const insertSubtreeStr = sp.get('insertSubtree')
    const parentId = sp.get('parentId')

    if (insertSubtreeStr && parentId && treeClientRef.current) {
      try {
        const subtree = JSON.parse(insertSubtreeStr)
        treeClientRef.current.insertSubtree(parentId, subtree)
        router.replace('/')
      } catch (e) {
        console.error('JSON 解析錯誤', e)
      }
    }
  }, [sp])

  //快捷鍵設定
  //Undo/Redo快捷鍵
const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

  const key = e.key.toLowerCase();

  switch (key) {
    case 'r': // 開啟雷達圖
      if (selectedNodeId) setShowRadar(true);
      break;

    case 'g': // 開啟甘特圖
      if (selectedNodeId) setShowGantt(true);
      break;

    case 's': // 評分
      if (selectedNodeId) setShowEvaluate(true);
      break;

    case 'a': // 新增子節點
      if (selectedNodeId) {
        const name = window.prompt('輸入任務名稱', '');
        if (name?.trim()) {
          treeClientRef.current?.appendChildren(selectedNodeId, name.trim());
        }
      }
      break;



    case 'c': // 收合/展開切換
      if (selectedNodeId) {
        treeClientRef.current?.toggleSubtree(selectedNodeId)
      }
      break;




    case 'e': // 編輯
      if (selectedNodeId) {
        setEditingNodeId(selectedNodeId);
        setShowEdit(true);
      }
      break;

    case 'f': // 搜尋
      e.preventDefault();
      setShowSearch(true);
      break;

    case 'd': // 刪除
      if (selectedNodeId && selectedNodeId !== 'root') {
        treeClientRef.current?.remove(selectedNodeId);
      }
      break;

    case 'x': // 剪下
      if (e.ctrlKey && selectedNodeId) {
        e.preventDefault();
        treeClientRef.current?.cut(selectedNodeId);
      }
      break;

    case 'v': // 貼上
      if (e.ctrlKey && selectedNodeId) {
        e.preventDefault();
        treeClientRef.current?.paste(selectedNodeId);
      }
      break;

    case 'z': // Undo
      if (e.ctrlKey) {
        e.preventDefault();
        handleUndo();
      }
      break;

    case 'y': // Redo
      if (e.ctrlKey) {
        e.preventDefault();
        handleRedo();
      }
      break;
  }
};





  // ✅ 依最新 tree 和選取節點計算「活的子樹」
const regionNode = useMemo(() => {
  if (!tree || !selectedNodeId) return null
  const raw = findNodeById(tree, selectedNodeId)
  return raw ? expandAllChildren(raw) : null
}, [tree, selectedNodeId])

  // ✅ 工具列可用性
  const canOperate = !!selectedNodeId
  const canDelete = canOperate && selectedNodeId !== 'root'
  const canPaste = canOperate // 貼上時由 TreeClient 內部自行檢查剪貼簿

  // ✅ 打開雷達圖
  const openRadarForSelected = () => {
    if (!selectedNodeId) return
    setShowRadar(true)
  }

  return (
    <div className="flex h-screen">
      {/* 左半：工具列 + Tree */}
      <div className="w-2/3 h-full p-4 flex flex-col">
        {/* 工具列（對應 TreeClient 受控 API） */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <button
            onClick={() => {
              if (!canOperate) return
              const name = window.prompt('輸入任務名稱', '')
              if (name && name.trim()) {
                treeClientRef.current?.appendChildren(selectedNodeId, name.trim())
              }
              // 若取消或空字串：不動作
            }}
            className="bg-green-500 text-white px-2 py-1 disabled:opacity-50"
            disabled={!canOperate}
          >
          新增(a)
          </button>


          <button
            onClick={() => {
              if (!canOperate) return
              const nextName = window.prompt('輸入新名稱', selectedNodeName || '')
              if (nextName && nextName.trim()) {
                treeClientRef.current?.rename(selectedNodeId, nextName.trim())
              }
            }}
            className="bg-yellow-500 text-white px-2 py-1 disabled:opacity-50"
            disabled={!canOperate}
          >
            改名(r)
          </button>

          <button
            onClick={() => canDelete && treeClientRef.current?.remove(selectedNodeId)}
            className="bg-red-500 text-white px-2 py-1 disabled:opacity-50"
            disabled={!canDelete}
            title={selectedNodeId === 'root' ? '不能刪除 root' : ''}
          >
            刪除(d)
          </button>

          <button
            onClick={() => canOperate && treeClientRef.current?.cut(selectedNodeId)}
            className="bg-purple-500 text-white px-2 py-1 disabled:opacity-50"
            disabled={!canOperate}
          >
            剪下(ctr+x)
          </button>

          <button
            onClick={() => canPaste && treeClientRef.current?.paste(selectedNodeId)}
            className="bg-blue-500 text-white px-2 py-1 disabled:opacity-50"
            disabled={!canPaste}
          >
            貼上(ctr+v)
          </button>

          <button
            onClick={openRadarForSelected}
            className="bg-indigo-600 text-white px-2 py-1 disabled:opacity-50"
            disabled={!selectedNodeId}
          >
            Radar Chart(r)
          </button>

          <button
            onClick={() => setShowGantt(true)}                
            className="bg-teal-600 text-white px-2 py-1 disabled:opacity-50"
            disabled={!selectedNodeId}
          >
            Gant Chart(g)
          </button>
          <button
            onClick={() => setShowEvaluate(true)}
            className="bg-indigo-600 text-white px-2 py-1 disabled:opacity-50"
            disabled={!selectedNodeId}
          >
            提交作業(s)
          </button>
          
          <button onClick={() => exportTree(tree)}
            className="bg-pink-500 text-white px-2 py-1 disabled:opacity-50">
            匯出樹
          </button>

          <button
            onClick={() =>
              importTree(
                (newTree) => setTree(newTree),
                (newTree) => setTreeHistory(prev => pushHistory(prev, newTree))
              )
            }
            className="bg-pink-500 text-white px-2 py-1 disabled:opacity-50"
          >
            匯入樹
          </button>
                    <button
            onClick={() => {
              if (!selectedNodeId) return
              router.push(
                `/ai-discuss?nodeId=${selectedNodeId}&nodeName=${encodeURIComponent(selectedNodeName)}`
              )
            }}
            className="bg-lime-500 text-black px-3 py-1 rounded disabled:opacity-50"
            disabled={!selectedNodeId}
          >
            與AI討論子任務
          </button>
          <button
            disabled={!selectedNodeId}
            onClick={() => selectedNodeId && treeClientRef.current?.collapseSubtree(selectedNodeId)}
          >
            收合此節點以下 (C)
          </button>

          <button
            disabled={!selectedNodeId}
            onClick={() => selectedNodeId && treeClientRef.current?.expandSubtree(selectedNodeId)}
          >
            展開此節點以下
          </button>


          <button
          onClick={() => {
          if (selectedNodeId) {
          setEditingNodeId(selectedNodeId);
          setShowEdit(true);
          }     
          }}
          >
            編輯節點(e)
          </button>
        </div>

        {/* Tree 視圖 */}
<div
  ref={treeContainerRef}
  tabIndex={0} 
  className="flex-1 min-h-0 outline-none"
  onKeyDownCapture={handleKeyDown} // 用 Capture 確保事件在冒泡前就吃到
>
          <RenderTreePanel
            treeData={tree}
            selectedId={selectedNodeId}
            onNodeSelect={(id, name) => {
              setSelectedNodeId(id);
              setSelectedNodeName(name);
            }}
            onImportTree={(newTree) => {
              setTree(newTree);
              setTreeHistory(prev => pushHistory(prev, newTree));
            }}
          />


        </div>

        {/* 
        TreeClient 無 UI：受控資料中樞
        父=>子 : treedata
        子=>父 : treeClientRef、onchange={setTree}代表更新整棵樹回傳，若tree有改變會觸發重新渲染
         */}
        
        <TreeClient ref={treeClientRef} value={tree} onChange={handleTreeChange} />
      </div>

      {/* 右半：雷達 + 甘特圖 */}
      <div className="w-1/3 h-full flex flex-col bg-white">
        {/* 上半：雷達圖 */}
        <div className="h-1/2 border-b border-gray-300 p-2">
          <SubtreeRadarChart
            node={regionNode}
            title="子樹雷達圖"
            mode="childrenLeafAvg"   // 依需求可切換 "children" | "depth"
            depth={2}
            height="100%"            
          />
        </div>

        {/* 下半：甘特圖 */}
        <div className="h-1/2 p-2">
          <SubtreeGanttChart
            node={regionNode}
            title="子樹甘特圖"
            height="100%"
            
            onBarClick={(id, name) => {
                            console.log("回到父層");
              setSelectedNodeId(id);
              setSelectedNodeName(name);
              treeContainerRef.current?.focus();
            }}
            onBack={(parentId) => {
              console.log("回到父層:", parentId);
              if (!parentId) return;
              setSelectedNodeId(parentId);
              treeContainerRef.current?.focus();
            }}
          />
        </div>
      </div>

      {/* 右側滑出子頁（Drawer） */}


<EvaluationDrawer
  open={showEvaluate}
  onClose={() => setShowEvaluate(false)}
  onSubmit={(text: string, code: string) => {
    // TODO: 待補回傳作業後的評量邏輯
    console.log("submit", text, code);
  }}
/>

<NodeEditDrawer
  open={showEdit}
  nodeId={selectedNodeId}
  treeClientRef={treeClientRef}
  onClose={() => setShowEdit(false)}
/>
{showSearch && (
  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white p-4 rounded shadow w-96 text-black">
      <input
        className="w-full border p-2 mb-2"
        placeholder="輸入節點名稱片段"
        autoFocus
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setHighlightIndex(-1); // 重置選中狀態
        }}
        onKeyDown={(e) => {
          const results = searchNodes(tree, searchQuery);
          if (!results.length) return;

          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIndex((prev) =>
              prev < results.length - 1 ? prev + 1 : 0
            );
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((prev) =>
              prev > 0 ? prev - 1 : results.length - 1
            );
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (highlightIndex >= 0) {
              const target = results[highlightIndex];
              setSelectedNodeId(target.id);
              setSelectedNodeName(target.name);
              setShowSearch(false);
              setSearchQuery("");
              setHighlightIndex(-1);
            }
          }
        }}
      />

      <div className="max-h-60 overflow-y-auto">
        {searchQuery &&
          searchNodes(tree, searchQuery).map((n, idx) => (
            <div
              key={n.id}
              className={`p-2 cursor-pointer text-black ${
                idx === highlightIndex ? "bg-blue-200" : "hover:bg-blue-100"
              }`}
              onClick={() => {
                setSelectedNodeId(n.id);
                setSelectedNodeName(n.name);
                setShowSearch(false);
                setSearchQuery("");
                setHighlightIndex(-1);
              }}
            >
              {n.name}
            </div>
          ))}
      </div>
      <button
        className="mt-2 px-4 py-1 bg-gray-300"
        onClick={() => setShowSearch(false)}
      >
        關閉
      </button>
    </div>
  </div>
)}
</div>
)
}
