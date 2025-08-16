
'use client';

import React, { useMemo, useState } from 'react';
import type { TreeNode } from '@/type/Tree';

type SortKey = 'name' | 'progress' | 'priority';
type SortDir = 'asc' | 'desc';

export interface SubtreeListViewProps {
  node: TreeNode | null | undefined;
  onSetPriority: (id: string, value: number) => void;
  onSetProgress?: (id: string, value: number) => void; // 可選：要不要也支援改進度
  title?: string;
}

export default function SubtreeListView({
  node,
  onSetPriority,
  onSetProgress,
  title = '任務列表',
}: SubtreeListViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const rows = useMemo(() => {
    const children = node?.children ?? [];
    const safeNum = (v: any, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
    const items = children.map((c) => ({
      id: c.id,
      name: c.name,
      progress: Math.max(0, Math.min(100, safeNum((c as any).progress, 0))),
      priority: Math.max(1, Math.min(5, safeNum((c as any).priority, 3))),
    }));
    const cmp = (a: any, b: any) => {
      const va = a[sortKey], vb = b[sortKey];
      if (va === vb) return a.name.localeCompare(b.name);
      const res = va < vb ? -1 : 1;
      return sortDir === 'asc' ? res : -res;
    };
    return [...items].sort(cmp);
  }, [node, sortKey, sortDir]);

  if (!node) {
    return <div className="h-full flex items-center justify-center text-neutral-500">未選擇節點</div>;
  }
  if (!rows.length) {
    return <div className="h-full flex items-center justify-center text-neutral-500">此節點沒有直屬子任務</div>;
  }

  return (
    <div className="w-full h-full text-black">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-neutral-600">父節點：<span className="font-medium">{node.name}</span>（僅顯示直屬子節點）</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">排序：</label>
          <select
            className="border rounded px-2 py-1"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="priority">重要度</option>
            <option value="progress">進度</option>
            <option value="name">名稱</option>
          </select>
          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="border rounded px-2 py-1 hover:bg-gray-50"
            title="切換升降序"
          >
            {sortDir === 'asc' ? '升序 ↑' : '降序 ↓'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
              <th style={{width: '40%'}}>名稱</th>
              <th style={{width: '30%'}}>進度</th>
              <th style={{width: '20%'}}>重要度</th>
              <th style={{width: '10%'}}>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t [&>td]:px-3 [&>td]:py-2">
                <td className="font-medium">{r.name}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded">
                      <div className="h-2 bg-blue-600 rounded" style={{ width: `${r.progress}%` }} />
                    </div>
                    <span className="w-10 text-right tabular-nums">{r.progress}%</span>
                    {onSetProgress && (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={r.progress}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v)) onSetProgress(r.id, v);
                        }}
                        className="w-16 border rounded px-2 py-1"
                        title="修改進度後離開輸入框即套用"
                      />
                    )}
                  </div>
                </td>
                <td>
                  <StarRating
                    value={r.priority}
                    onChange={(v) => onSetPriority(r.id, v)}
                  />
                </td>
                <td className="text-right text-neutral-500">
                  {/* 預留：更多操作（改名、刪除…） */}
                  —
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** 簡易星等元件（1–5），黑白高對比 */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className="text-xl leading-none"
          aria-label={`set priority ${n}`}
          title={`重要度：${n}`}
        >
          <span style={{ color: n <= value ? '#111827' : '#D1D5DB' }}>
            {n <= value ? '★' : '☆'}
          </span>
        </button>
      ))}
    </div>
  );
}
