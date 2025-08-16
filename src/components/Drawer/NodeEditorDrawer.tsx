import { useState, useEffect } from 'react';
import SideDrawer from './ui/SideDrawer';
import type { TreeNode } from '@/type/Tree';

interface NodeEditDrawerProps {
  open: boolean;
  nodeId: string | null;
  treeClientRef: React.RefObject<any>;
  onClose: () => void;
}

export default function NodeEditDrawer({
  open,
  nodeId,
  treeClientRef,
  onClose
}: NodeEditDrawerProps) {
  const [name, setName] = useState('');
  const [progress, setProgress] = useState(0);
  const [priority, setPriority] = useState(1);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [description, setDescription] = useState('');
  const [blockedBy, setBlockedBy] = useState<string>('');

  // 當 nodeId 或 Drawer 開關變化時，同步最新資料到表單
  useEffect(() => {
    if (nodeId && treeClientRef.current) {
      const latestNode = treeClientRef.current.getSubtree(nodeId) as TreeNode;
      if (latestNode) {
        setName(latestNode.name || '');
        setProgress(latestNode.progress ?? 0);
        setPriority(latestNode.priority ?? 1);
        setStart(latestNode.start ?? '');
        setDescription(latestNode.description ?? '');
        setEnd(latestNode.end ?? '');
        setBlockedBy(latestNode.blockedby??'');
      }
    }
}, [nodeId, open, treeClientRef]);

const handleSave = () => {
  if (!nodeId || !treeClientRef.current) return;

  treeClientRef.current.updateNode(nodeId, {
    name,
    progress,
    priority,
    start,
    end,
    description,
    blockedBy,
  });

  onClose();
};

//管理輸入快捷鍵(Enter)
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    const active = document.activeElement;

    // 🔹 如果在 textarea，允許換行，不要攔截 Enter
    if (active?.tagName === 'TEXTAREA') return;

    // 🔹 只有在 input 才攔截 Enter，避免跳頁
    if (active?.tagName === 'INPUT' && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [handleSave]);



  if (!nodeId) return null;

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={`編輯節點：${name}`}
      initialWidth={0.4}
    >
<div className="p-4 space-y-4 text-gray-800">
  <div>
    <label className="block mb-1 font-semibold text-gray-800">名稱</label>
    <input
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      className="border p-2 w-full text-black rounded"
    />
  </div>

  <div>
    <label className="block mb-1 font-semibold text-gray-800">進度 (%)</label>
    <input
      type="number"
      min={0}
      max={100}
      value={progress}
      onChange={(e) => setProgress(Number(e.target.value))}
      className="border p-2 w-full text-black rounded"
    />
  </div>

  <div>
    <label className="block mb-1 font-semibold text-gray-800">優先度 (1~5)</label>
    <input
      type="number"
      min={1}
      max={5}
      value={priority}
      onChange={(e) => setPriority(Number(e.target.value))}
      className="border p-2 w-full text-black rounded"
    />
  </div>

  <div>
    <label className="block mb-1 font-semibold text-gray-800">開始日期</label>
    <input
      type="date"
      value={start}
      onChange={(e) => setStart(e.target.value)}
      className="border p-2 w-full text-black rounded"
    />
  </div>

  <div>
    <label className="block mb-1 font-semibold text-gray-800">結束日期</label>
    <input
      type="date"
      value={end}
      onChange={(e) => setEnd(e.target.value)}
      className="border p-2 w-full text-black rounded"
    />
  </div>

  <div>
    <label className="block mb-1 font-semibold text-gray-800">依賴的節點</label>
    <input
      type="text"
      value={blockedBy}
      onChange={(e) => setBlockedBy(e.target.value)}
      className="border p-2 w-full text-black rounded"
    />
  </div>

  <div>
    <label className="block mb-1 font-semibold text-gray-800">節點資訊</label>
    <textarea
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      className="border p-2 w-full text-black h-32 resize-y rounded"
      placeholder="請輸入節點詳細描述..."
    />
  </div>

  <div className="flex justify-end gap-2">
    <button onClick={onClose} className="px-3 py-1 border rounded text-gray-600 hover:bg-gray-100">
      取消
    </button>
    <button
      onClick={handleSave}
      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      儲存
    </button>
  </div>
</div>

    </SideDrawer>
  );
}
