import type { TreeNode } from "@/type/Tree";
import { findNodeById } from "@/utils/TreeUtils/findNodeById";

/**
 * 取得「某節點的深拷貝子樹」。
 * 用途：TaskGenPage / TreeClient 可用這個把任意區域取下，供分析或另存。
 */
export function getSubtree(root: TreeNode, nodeId: string): TreeNode | null {
  const node = findNodeById(root, nodeId);
  if (!node) return null;
  return deepCloneNode(node);
}

/** 深拷貝 TreeNode（保留自訂欄位，如 progress / schedule / displayMode 等） */
export function deepCloneNode(node: TreeNode): TreeNode {
  return {
    ...node,
    textOffset: node.textOffset ? { ...node.textOffset } : undefined as any,
    children: node.children?.map((c) => deepCloneNode(c)),
  } as TreeNode;
}

/** 走訪所有後代（含自己=false） */
export function collectDescendants(node: TreeNode): TreeNode[] {
  const out: TreeNode[] = [];
  const dfs = (n: TreeNode) => {
    n.children?.forEach((c) => {
      out.push(c);
      dfs(c);
    });
  };
  dfs(node);
  return out;
}

/** 只取葉節點（沒有 children 的節點） */
export function collectLeaves(node: TreeNode): TreeNode[] {
  const out: TreeNode[] = [];
  const dfs = (n: TreeNode) => {
    if (!n.children || n.children.length === 0) {
      out.push(n);
      return;
    }
    n.children.forEach(dfs);
  };
  dfs(node);
  return out;
}

/**
 * 從某節點的「直接子節點」做雷達圖資料
 * 每個 child 產生一個軸，值為 child.progress（0~100）
 */
export function radarItemsFromChildren(node: TreeNode, progressKey: keyof TreeNode | "progress" = "progress") {
  return (node.children ?? []).map((c) => ({
    subject: c.name,
    progress: clamp(Number((c as any)[progressKey]) || 0, 0, 100),
  }));
}

/**
 * 以「子樹聚合」產生雷達圖資料：
 * - 對於當前節點的每個 child，計算其子樹葉節點的平均 progress
 * - 適合把每個大區塊（child）視為一個維度，代表其下任務的整體完成度
 */
export function radarItemsFromChildrenLeafAvg(
  node: TreeNode,
  progressKey: keyof TreeNode | "progress" = "progress"
) {
  return (node.children ?? []).map((child) => {
    const leaves = collectLeaves(child);
    const vals = leaves.length ? leaves : [child];
    const sum = vals.reduce((acc, n) => acc + (Number((n as any)[progressKey]) || 0), 0);
    const avg = sum / vals.length;
    return { subject: child.name, progress: clamp(avg, 0, 100) };
  });
}

/** 可自訂深度的平均（depth=1 等同於 Children）*/
export function radarItemsAvgByDepth(
  node: TreeNode,
  depth: number,
  progressKey: keyof TreeNode | "progress" = "progress"
) {
  const items: { subject: string; progress: number }[] = [];
  const walk = (n: TreeNode, d: number, label: string) => {
    if (d === 0) {
      const leaves = collectLeaves(n);
      const vals = leaves.length ? leaves : [n];
      const sum = vals.reduce((acc, z) => acc + (Number((z as any)[progressKey]) || 0), 0);
      items.push({ subject: label, progress: sum / vals.length });
      return;
    }
    (n.children ?? []).forEach((c) => walk(c, d - 1, c.name));
  };
  (node.children ?? []).forEach((c) => walk(c, depth - 1, c.name));
  return items.map((i) => ({ ...i, progress: clamp(i.progress, 0, 100) }));
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
