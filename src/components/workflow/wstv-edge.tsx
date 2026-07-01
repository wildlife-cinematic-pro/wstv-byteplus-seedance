"use client";

import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import type { WstvEdge } from "@/lib/workflow/types";

function WstvEdgeView({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<WstvEdge>) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const color = data?.color ?? "#64748b";
  return (
    <>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
        opacity={0.12}
      />
      <BaseEdge path={path} markerEnd={markerEnd} style={{ stroke: color, strokeWidth: 2.4 }} />
    </>
  );
}

export const WstvEdgeComponent = memo(WstvEdgeView);
export default WstvEdgeComponent;
