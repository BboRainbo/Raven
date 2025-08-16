'use client';
import React, { useEffect, useState } from 'react';

export type SideDrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** 0~1 表示視窗寬比例；>1 表示 px。預設 0.5 (=50vw) */
  initialWidth?: number;
  /** 是否允許拖曳改寬（左緣把手） */
  resizable?: boolean;
  /** 最小寬(px)，預設 360 */
  minWidth?: number;
  /** 最大寬/視窗寬 比例，預設 0.9 (=90vw) */
  maxWidthRatio?: number;
  /** Drawer 內層容器的 className（常用來加 padding/滾動） */
  bodyClassName?: string;
  children: React.ReactNode;
};

export default function SideDrawer({
  open,
  onClose,
  title,
  initialWidth = 0.5,
  resizable = true,
  minWidth = 360,
  maxWidthRatio = 0.9,
  bodyClassName = 'p-4 overflow-auto flex-1',
  children,
}: SideDrawerProps) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const initPx =
    initialWidth > 1 ? initialWidth : Math.max(minWidth, Math.min(vw * maxWidthRatio, vw * initialWidth));
  const [widthPx, setWidthPx] = useState(initPx);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !resizable) return;
    let dragging = false;
    const onMouseDown = (e: MouseEvent) => { dragging = true; e.preventDefault(); };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const vw = window.innerWidth;
      const maxPx = vw * maxWidthRatio;
      const next = Math.min(Math.max(minWidth, vw - e.clientX), maxPx); // 以右側為基準
      setWidthPx(next);
    };
    const onMouseUp = () => { dragging = false; };

    const handle = document.getElementById('sidedrawer-resizer');
    handle?.addEventListener('mousedown', onMouseDown as any);
    window.addEventListener('mousemove', onMouseMove as any);
    window.addEventListener('mouseup', onMouseUp as any);
    return () => {
      handle?.removeEventListener('mousedown', onMouseDown as any);
      window.removeEventListener('mousemove', onMouseMove as any);
      window.removeEventListener('mouseup', onMouseUp as any);
    };
  }, [open, resizable, minWidth, maxWidthRatio]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="absolute right-0 top-0 h-full bg-white shadow-xl flex flex-col"
        style={{ width: widthPx, maxWidth: `calc(100vw * ${maxWidthRatio})` }}
        role="dialog" aria-modal="true" aria-label={title || 'Side panel'}
      >
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">關閉</button>
        </div>

        <div className={bodyClassName}>{children}</div>

        {resizable && (
          <div
            id="sidedrawer-resizer"
            className="absolute left-0 top-0 h-full w-1 cursor-col-resize"
            title="拖曳以調整寬度"
          />
        )}
      </div>
    </div>
  );
}
