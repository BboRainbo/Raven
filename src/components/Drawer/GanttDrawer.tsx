// GanttDrawer.tsx
import SideDrawer from '../Drawer/ui/SideDrawer';
import SubtreeGanttChart from '../Chart/SubtreeGanttChart';
import type { TreeNode } from '@/type/Tree'

interface GanttDrawerProps {
  open: boolean;
  node: TreeNode | null;
  onClose: () => void;
  onBarClick?: (id: string, name: string) => void;
}

export default function GanttDrawer({ open, node, onClose, onBarClick }: GanttDrawerProps) {
  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={`甘特圖：${node?.name || node?.id || ''}`}
      initialWidth={0.5}
      resizable
    >
      <div className="h-[520px] overflow-x-auto">
        <SubtreeGanttChart
          node={node}
          height={500}
          onBarClick={onBarClick}
        />
      </div>
    </SideDrawer>
  );
}
