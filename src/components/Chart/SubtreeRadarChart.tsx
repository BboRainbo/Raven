"use client";

import React, { useMemo, useEffect, useState } from "react";
import type { TreeNode } from "@/type/Tree";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  Radar,
  Tooltip,
} from "recharts";
import {
  radarItemsFromChildren,
  radarItemsFromChildrenLeafAvg,
  radarItemsAvgByDepth,
} from "@/utils/tree-subtree-utils"

type Mode = "children" | "childrenLeafAvg" | "depth";

export interface SubtreeRadarChartProps {
  node: TreeNode | null | undefined;
  mode?: Mode;
  depth?: number;
  max?: number;
  height?: number | string;
  showLegend?: boolean;
  title?: string;
  progressKey?: keyof TreeNode | "progress";
  /** 自動偵測 / 強制主題 */
  theme?: "auto" | "light" | "dark";
  /** 高對比模式 */
  contrast?: "normal" | "high";
}

const SubtreeRadarChart: React.FC<SubtreeRadarChartProps> = ({
  node,
  mode = "children",
  depth = 2,
  max = 100,
  height = 360,
  showLegend = true,
  title,
  progressKey = "progress",
  theme = "auto",
  contrast = "high",
}) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (theme === "dark") setIsDark(true);
    else if (theme === "light") setIsDark(false);
    else setIsDark(document.documentElement.classList.contains("dark"));
  }, [theme]);

  const palette = useMemo(() => {
    // Tailwind 類色票
    const light = {
      bg: "#ffffff",
      fg: "#111827", // slate-900
      grid: "#E5E7EB", // gray-200
      radarStroke: "#1D4ED8", // blue-700
      radarFill: "#60A5FA", // blue-400
      tooltipBg: "#ffffff",
    };
    const dark = {
      bg: "#0B1220",   // 深一點，護眼
      fg: "#E5E7EB",   // gray-200
      grid: "#334155", // slate-700
      radarStroke: "#93C5FD", // blue-300
      radarFill: "#1D4ED8",   // blue-700
      tooltipBg: "#111827",
    };
    const base = isDark ? dark : light;

    return {
      ...base,
      // 高對比：加粗描邊、提高填色不透明度
      strokeWidth: contrast === "high" ? 3 : 2,
      fillOpacity: contrast === "high" ? 0.5 : 0.35,
      angleFontSize: contrast === "high" ? 13 : 12,
      radiusFontSize: contrast === "high" ? 12 : 11,
      tickWeight: contrast === "high" ? 600 : 500,
    };
  }, [isDark, contrast]);

  const data = useMemo(() => {
    if (!node) return [];
    switch (mode) {
      case "children":
        return radarItemsFromChildren(node, progressKey);
      case "childrenLeafAvg":
        return radarItemsFromChildrenLeafAvg(node, progressKey);
      case "depth":
        return radarItemsAvgByDepth(node, depth, progressKey);
      default:
        return [];
    }
  }, [node, mode, depth, progressKey]);

  if (!data.length) {
    return (
      <div className="w-full" style={{ height }}>
        <EmptyState hint="此區域沒有足夠資料可繪製雷達圖" />
      </div>
    );
  }

  return (
    <div
      className="w-full rounded-xl border"
      style={{
        height,
        background: palette.bg,
        borderColor: isDark ? "#1F2937" : "#E5E7EB", // gray-800 / gray-200
      }}
    >
      {title && (
        <div className="px-3 pt-3">
          <h3
            className="text-sm font-semibold"
            style={{ color: palette.fg }}
          >
            {title}
          </h3>
        </div>
      )}

      <div style={{ width: "100%", height: `calc(${typeof height === "number" ? `${height}px` : height} - 36px)` }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid gridType="polygon" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{
                fill: palette.fg,
                fontSize: palette.angleFontSize,
                fontWeight: palette.tickWeight,
              }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, max]}
              tick={{
                fill: palette.fg,
                fontSize: palette.radiusFontSize,
                fontWeight: 500,
              }}
            />
            <Radar
              name="Progress"
              dataKey="progress"
              stroke={palette.radarStroke}
              strokeWidth={palette.strokeWidth}
              fill={palette.radarFill}
              fillOpacity={palette.fillOpacity}
              dot
            />
            {showLegend && (
              <Legend
                wrapperStyle={{ color: palette.fg, paddingTop: 6 }}
                iconType="circle"
              />
            )}
            <Tooltip
              contentStyle={{
                background: palette.tooltipBg,
                borderColor: palette.grid,
                color: palette.fg,
              }}
              labelStyle={{ color: palette.fg, fontWeight: 600 }}
              formatter={(v) => [`${v} / ${max}`, "Progress"]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SubtreeRadarChart;

function EmptyState({ hint }: { hint: string }) {
  return (
    <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
      {hint}
    </div>
  );
}
