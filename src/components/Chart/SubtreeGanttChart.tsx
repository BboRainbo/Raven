'use client';

import React, { useMemo } from 'react';
import type { TreeNode } from '@/type/Tree';

export interface SubtreeGanttChartProps {
  node: TreeNode | null | undefined;
  height?: number | string;
  title?: string;
  startKey?: string;
  endKey?: string;
  progressKey?: string;
  expectedSlack?: number;
  onBarClick?: (id: string, name: string) => void;
  onBack?: (parentId: string) => void; // 🔑 新增
}


/* ---------------------------------------------
   Utils
--------------------------------------------- */

// 接受 Date 或 'YYYY-M-D' / 'YYYY-MM-DD' / 完整 ISO，會自動補零
function toDate(x: any): Date | null {
  if (!x) return null;
  if (x instanceof Date && !isNaN(+x)) return x;

  if (typeof x === 'string') {
    const m = x.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(T.*)?$/);
    if (m) {
      const yyyy = m[1];
      const mm = m[2].padStart(2, '0');
      const dd = m[3].padStart(2, '0');
      const tail = m[4] ?? '';
      const iso = `${yyyy}-${mm}-${dd}${tail}`;
      const d = new Date(iso);
      return isNaN(+d) ? null : d;
    }
  }
  return null;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

type GanttItem = {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number; // 0~100
  status: 'behind' | 'ontrack' | 'done';
  isAggregated?: boolean; // 由子孫聚合而來
};

// 從節點子孫聚合最早 start / 最晚 end
function inferRangeFromDescendants(
  n: any,
  startKey: string,
  endKey: string
): { start: Date | null; end: Date | null } {
  if (!n?.children?.length) return { start: null, end: null };

  let minS: number | undefined;
  let maxE: number | undefined;
  const stack = [...n.children];

  while (stack.length) {
    const cur: any = stack.pop();
    const s = toDate(cur?.[startKey]);
    const e = toDate(cur?.[endKey]);
    if (s && e) {
      const S = +s, E = +e;
      if (minS === undefined || S < minS) minS = S;
      if (maxE === undefined || E > maxE) maxE = E;
    }
    if (cur?.children?.length) stack.push(...cur.children);
  }
  return {
    start: minS !== undefined ? new Date(minS) : null,
    end:   maxE !== undefined ? new Date(maxE) : null,
  };
}

/* ---------------------------------------------
   Component
--------------------------------------------- */

export default function SubtreeGanttChart({
  node,
  height = 420,
  title = '子樹甘特圖',
  startKey = 'start',
  endKey = 'end',
  progressKey = 'progress',
  expectedSlack = 0, // 依你的需求：嚴格對比，不加緩衝
  onBarClick,
  onBack, 
}: SubtreeGanttChartProps) {
  // 今天 00:00（避免時區小時影響）
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // 建構可視項目：無日期且無子孫日期者 → 直接過濾掉
  const items = useMemo<GanttItem[]>(() => {
    const children = node?.children ?? [];

    const rows: GanttItem[] = [];
    for (let i = 0; i < children.length; i++) {
      const c: any = children[i];

      // 自身日期
      const sOwn = toDate(c?.[startKey]);
      const eOwn = toDate(c?.[endKey]);

      // 若缺，嘗試子孫聚合
      const agg = (!sOwn || !eOwn)
        ? inferRangeFromDescendants(c, startKey, endKey)
        : { start: null, end: null };

      const start = sOwn ?? agg.start;
      const end   = eOwn ?? agg.end;

      // 沒有任何日期資訊 → 這列不顯示
      if (!start || !end) continue;

      // 進度與狀態
      const rawP = Number(c?.[progressKey]);
      const p = Number.isFinite(rawP) ? Math.max(0, Math.min(100, rawP)) : 0;

      const span = Math.max(1, +end - +start);
      const elapsed = clamp01((+today - +start) / span);         // (today-start)/(end-start)
      const expected = today >= end ? 1 : elapsed + expectedSlack;
      const actual = p / 100;

      let status: GanttItem['status'] = 'ontrack';
      if (actual >= 1) status = 'done';
      else if (actual + 1e-6 < expected) status = 'behind';

      rows.push({
        id: c.id,
        name: c.name,
        start,
        end: end > start ? end : new Date(+start + 1), // 避免 0 長度
        progress: p,
        status,
        isAggregated: !sOwn && !eOwn && !!agg.start && !!agg.end,
      });
    }
    return rows;
  }, [node, startKey, endKey, progressKey, expectedSlack, today]);

  if (!node) {
    return <div className="h-full flex items-center justify-center text-neutral-500">未選擇節點</div>;
  }
  if (items.length === 0) {
    return <div className="h-full flex items-center justify-center text-neutral-500">此節點的直屬子節點沒有可視日期</div>;
  }

  // 圖表範圍與刻度
  const min = new Date(Math.min(...items.map(i => +i.start)));
  const max = new Date(Math.max(...items.map(i => +i.end)));
  const span = Math.max(1, +max - +min);

  const days: Date[] = [];
  const dayMs = 86400000;
  const totalDays = Math.min(60, Math.ceil(span / dayMs));
  for (let k = 0; k <= totalDays; k++) days.push(new Date(+min + k * dayMs));

  const color = {
    ontrack: { border: '#1D4ED8', fill: '#60A5FA' }, // 藍
    behind:  { border: '#DC2626', fill: '#FCA5A5' }, // 紅
    done:    { border: '#6B7280', fill: '#9CA3AF' }, // 灰
    inner:   '#2563EB', // 內條
    text:    '#0B1220',
  };

return (
  <div className="w-full">
    {/* 標題 */}
    <div className="mb-3 flex items-center justify-between">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-neutral-600">
          父節點：<span className="font-medium">{node.name}</span>（僅顯示直屬子節點）
        </p>
      </div>

      {/* 🔙 回到父層 */}
      {node.parentId && (
        <button
          className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => {
            if (node.parentId) onBack?.(node.parentId);
            }}
        >
          回到父層
        </button>
      )}
    </div>

      {/* 時間軸頭 */}
      <div className="w-full border border-black rounded-t bg-gray-50">

        <div className="relative w-full" style={{ height: 36 }}>
          {days.map((d, idx) => {
            const left = ((+d - +min) / span) * 100;
            return (
              <div
                key={idx}
                className="absolute top-0 border-l text-[11px] text-black border-black"
                style={{ left: `${left}%`, height: '100%' }}
                title={d.toISOString().slice(0, 10)}
              >
                <div className="pl-1 pt-1">{d.getMonth() + 1}/{d.getDate()}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 甘特區 */}
      <div className="w-full border-x border-b border-black rounded-b overflow-hidden" style={{ height }}>
        {items.map(it => {
          const left = ((+it.start - +min) / span) * 100;
          const width = ((+it.end - +it.start) / span) * 100;
          const palette = color[it.status];
          const innerPct = Math.max(0, Math.min(100, it.progress)); // 相對任務條的%
          const borderStyle = it.isAggregated ? '2px dashed' : '2px solid';

          return (
            <div key={it.id} className="relative border-t first:border-t-0" style={{ height: 44 }}>
              {/* 左側名稱欄 */}
              <div
                className="absolute left-0 top-0 h-full flex items-center pl-2 pr-1 text-sm w-48 bg-white/70 backdrop-blur z-10 text-black cursor-pointer hover:bg-blue-100"
                onClick={() => onBarClick?.(it.id, it.name)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onBarClick?.(it.id, it.name)}
              >
                <span className="truncate" title={it.name}>{it.name}</span>
              </div>


              {/* 右側走道 */}
              <div className="absolute inset-0 ml-48">
                {/* 背景格線（每日） */}
                {days.map((d, idx) => {
                  const x = ((+d - +min) / span) * 100;
                  return <div key={idx} className="absolute top-0 bottom-0 border-l border-black" style={{ left: `${x}%` }} />;
                })}

                {/* 外層時程條 */}
                <div
                  className="absolute top-2 bottom-2 rounded cursor-pointer hover:ring-2 hover:ring-black/30 transition"
                  style={{
                    left: `${left}%`,
                    width: `${Math.max(0.5, width)}%`,
                    background: palette.fill,
                    border: `${borderStyle} ${palette.border}`,
                  }}
                  role="button"
                  tabIndex={0}
                  title={`${it.name}: ${it.start.toISOString().slice(0,10)} → ${it.end.toISOString().slice(0,10)}（進度 ${it.progress}%）`}
                >
                  {/* 內層完成進度條（相對父層 %） */}
                  <div
                    className="absolute top-[18%] bottom-[18%] rounded-sm"
                    style={{ left: 0, width: `${innerPct}%`, background: color.inner, opacity: 0.9 }}
                  />
                  {/* 文字百分比 */}
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold" style={{ color: color.text }}>
                    {it.progress}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 圖例 */}
      <div className="flex gap-4 text-xs text-neutral-600 mt-2">
        <LegendDot color={color.ontrack.border} label="準時/進行中" />
        <LegendDot color={color.behind.border} label="落後" />
        <LegendDot color={color.done.border} label="完成" />
        <span className="text-neutral-400">（虛線＝由子孫聚合日期）</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   Small helper
--------------------------------------------- */
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
