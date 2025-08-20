"use client";

import React, { useMemo } from "react";
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
} from "@/utils/Tree-subtree-utils";
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
  contrast = "high",
}) => {
  const palette = useMemo(() => ({
    bg: "#ffffff",
    fg: "#000000", // ✅ 永遠黑色
    grid: "#E5E7EB",
    radarStroke: "#1D4ED8",
    radarFill: "#60A5FA",
    tooltipBg: "#ffffff",
    strokeWidth: contrast === "high" ? 3 : 2,
    fillOpacity: contrast === "high" ? 0.5 : 0.35,
    angleFontSize: contrast === "high" ? 13 : 12,
    radiusFontSize: contrast === "high" ? 12 : 11,
    tickWeight: contrast === "high" ? 600 : 500,
  }), [contrast]);

  const data = useMemo(() => {
    if (!node) return [];
    switch (mode) {
      case "children": return radarItemsFromChildren(node, progressKey);
      case "childrenLeafAvg": return radarItemsFromChildrenLeafAvg(node, progressKey);
      case "depth": return radarItemsAvgByDepth(node, depth, progressKey);
      default: return [];
    }
  }, [node, mode, depth, progressKey]);

  if (!data.length) {
    return (
      <div className="w-full text-black" style={{ height }}>
        <EmptyState hint="此區域沒有足夠資料可繪製雷達圖" />
      </div>
    );
  }

  return (
    <div className="w-full text-black" style={{ height }}>
      <div
        className="w-full rounded-xl border"
        style={{
          height,
          background: palette.bg,
          borderColor: "#E5E7EB",
        }}
      >
        {title && (
          <div className="px-3 pt-3">
            <h3 className="text-sm font-semibold" style={{ color: palette.fg }}>
              {title}
            </h3>
          </div>
        )}

        <div style={{ width: "100%", height: `calc(${typeof height === "number" ? `${height}px` : height} - 36px)` }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%">
              <PolarGrid gridType="polygon" stroke={palette.grid} />
              <PolarAngleAxis
                dataKey="subject"
                tick={({ payload, x, y, textAnchor, ...rest }) => {
                  const item = data.find((d) => d.subject === payload.value);
                  const value = item ? Math.round(item.progress) : 0;
                  return (
                    <text
                      x={x}
                      y={y}
                      textAnchor={textAnchor}
                      fill={palette.fg}
                      fontSize={palette.angleFontSize}
                      fontWeight={palette.tickWeight}
                      {...rest}
                    >
                      {`${payload.value} (${value}%)`}
                    </text>
                  );
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
    </div>
  );
};

export default SubtreeRadarChart;

function EmptyState({ hint }: { hint: string }) {
  return (
    <div className="h-full flex items-center justify-center text-black text-sm">
      {hint}
    </div>
  );
}
