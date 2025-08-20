// RadarDrawer.tsx
import SideDrawer from '../Drawer/ui/SideDrawer';
import RadarChart from '../Chart/SubtreeRadarChart'; // 假設你有這個元件
import type { TreeNode } from '@/type/Tree';

interface RadarDrawerProps {
  open: boolean;
  node: TreeNode | null;
  onClose: () => void;
  // 如果雷達圖點擊或互動需要事件，可以額外加
  onPointClick?: (id: string, name: string) => void;
}

export default function RadarDrawer({
  open,
  node,
  onClose,
  onPointClick
}: RadarDrawerProps) {
  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={`雷達圖：${node?.name || node?.id || ''}`}
      initialWidth={0.5}
      resizable
    >
      <div className="h-[520px] overflow-x-auto">
        <RadarChart
          node={node}
          height={500}
        />
      </div>
    </SideDrawer>
  );
}
