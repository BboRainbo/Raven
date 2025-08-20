'use client'
//接收router跳轉時傳遞資訊
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

export default function TaskGenPage() {


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

//接收其他 page 的"插入子樹指令

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
  useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      handleUndo()
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'y') {
      e.preventDefault()
      handleRedo()
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [treeHistory])
  useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    // 如果焦點在輸入框，不觸發快捷鍵
    if (
      document.activeElement?.tagName === 'INPUT' ||
      document.activeElement?.tagName === 'TEXTAREA'
    ) {
      return;
    }
    const key = e.key.toLowerCase();

    switch (key) {
      case 'r': // 雷達圖
        if (selectedNodeId) setShowRadar(true);
        break;
      case 'g': // 甘特圖
        if (selectedNodeId) setShowGantt(true);
        break;
      case 's': // 評分
        if (selectedNodeId) setShowEvaluate(true);
        break;
      case 'a': // 新增  TODO:我為了增加快捷鍵但需要重複定義呼叫函數?
        if (selectedNodeId) {
          const name = window.prompt('輸入任務名稱', '');
          if (name && name.trim()) {
            treeClientRef.current?.appendChildren(selectedNodeId, name.trim());
          }          
        }
        break;

      case 'e': // 編輯 node 資訊快捷鍵
        if (selectedNodeId) {
          setEditingNodeId(selectedNodeId);
          setShowEdit(true);
        }
        break;

      case 'd': // 刪除
        if (selectedNodeId && selectedNodeId !== 'root') {
          treeClientRef.current?.remove(selectedNodeId);
        }
        break;
      case 'x':
        if (e.ctrlKey && selectedNodeId) {
          e.preventDefault();
          treeClientRef.current?.cut(selectedNodeId);
        }
        break;

      // === 新增貼上快捷鍵 (Ctrl+V) ===
      case 'v':
        if (e.ctrlKey && selectedNodeId) {
          e.preventDefault();
          treeClientRef.current?.paste(selectedNodeId);
        }
        break;
      default:
        break;               
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [selectedNodeId]);


  // ✅ 依最新 tree 和選取節點計算「活的子樹」
  const regionNode = useMemo(() => {
    if (!tree || !selectedNodeId) return null
    return findNodeById(tree, selectedNodeId) ?? null
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
      <div className="w-1/2 h-full p-4 flex flex-col">
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
          <button onClick={() => exportTree(tree)}>
            匯出樹
          </button>

          <button
            onClick={() =>
              importTree(
                (newTree) => setTree(newTree),
                (newTree) => setTreeHistory(prev => pushHistory(prev, newTree))
              )
            }
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
        <div className="flex-1 min-h-0">
          <RenderTreePanel
            //傳入樹的資訊提供渲染 ，父=>子傳遞
            treeData={tree}
            selectedId={selectedNodeId}
            //偵測並回傳被點選目標 ，子=>父傳遞
            onNodeSelect={(id, name) => {
              setSelectedNodeId(id)
              setSelectedNodeName(name)
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

      {/* 右半：AI 討論區 */}
      <div className="w-1/2 h-full p-4 bg-gray-900 text-white overflow-auto">
        {selectedNodeId && (
          <AIPanel
            selectedNodeName={selectedNodeName}
            onAddSubtasks={(tasks) => {
              if (!selectedNodeId || tasks.length === 0) return
              // ✅ 直接呼叫受控 API，多載支援單個/多個
              treeClientRef.current?.appendChildren(selectedNodeId, tasks)
            }}
          />
        )}
      </div>

      {/* 右側滑出子頁（Drawer） */}

<RadarDrawer
  open={showRadar}
  node={regionNode}
  onClose={() => setShowRadar(false)}
  onPointClick={(id, name) => {
    setSelectedNodeId(id);
    setSelectedNodeName(name);
  }}
/>

<GanttDrawer
  open={showGantt}
  node={regionNode}
  onClose={() => setShowGantt(false)}
  onBarClick={(id, name) => {
    setSelectedNodeId(id);
    setSelectedNodeName(name);
  }}
/>
<EvaluationDrawer
  open={showEvaluate}
  onClose={() => setShowEvaluate(false)}
  onSubmit={(text, code) => {  }}//TODO:待補回傳作業後的評量邏輯
/>


<NodeEditDrawer
  open={showEdit}
  nodeId={selectedNodeId}
  treeClientRef={treeClientRef}
  onClose={() => setShowEdit(false)}
/>

</div>
)


  
}

//評分頁面 Drawer




