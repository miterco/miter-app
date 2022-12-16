/*
 * Item component for reorderable list. Pulled with minimal modifications from here:
 * https://codesandbox.io/s/framer-motion-2-drag-to-reorder-forked-illop?file=/src/dynamic.ts:0-3925
 *
 * TODO: Read through and understand in more detail, pare down, integrate better with the rest of
 * our code. I'm allowing myself to defer that effort on the theory that this is still less opaque
 * than the third-party module we'd have used instead.
 */

import React from "react";
import { motion, TargetAndTransition } from "framer-motion";
import {
  useReorderableListItem,
  ReorderableListItemHandlers,
  getDragStateZIndex
} from "./ReorderableListUtil";

interface ReorderableListItemProps {
  index: number;
  children: React.ReactNode;
  itemHandlers: ReorderableListItemHandlers;
  useMountAnimation?: boolean;
  hoverStyle?: TargetAndTransition;
  activeStyle?: TargetAndTransition;
  dragStyle?: TargetAndTransition;
}

const initialAnimStyle = {opacity: 0, height: 0, backgroundColor: 'rgba(255,255,255,0)'};
const baseAnimStyle: TargetAndTransition = {height: 'auto', opacity: 1, backgroundColor: 'rgba(255,255,255,0)'};
const defaultHoverStyle: TargetAndTransition = {
  scale: 1.01,
  backgroundColor: "rgba(255,255,255,1)",
  boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.12)',
};
const defaultActiveAndDragStyle: TargetAndTransition = {
  scale: 1.03,
  backgroundColor: "rgba(255,255,255,1)",
  boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.20)',
};

const ReorderableListItem: React.FC<ReorderableListItemProps> = props => {
  const [dragState, ref, eventHandlers] = useReorderableListItem<HTMLLIElement>(
    props.index,
    "y",
    props.itemHandlers
  );

  return (
    <motion.li
      layout
      drag="y"
      style={{
          // If we're dragging, we want to set the zIndex of that item to be on top of the other items.
          zIndex: getDragStateZIndex(dragState)
      }}
      ref={ref}
      transition={{duration:0.3}}
      initial={(props.useMountAnimation === undefined || props.useMountAnimation) ? initialAnimStyle : false}
      animate={baseAnimStyle}
      whileHover={{...defaultHoverStyle, ...props.hoverStyle}}
      whileDrag={{...defaultActiveAndDragStyle, ...props.dragStyle}}
      whileTap={{...defaultActiveAndDragStyle, ...props.activeStyle}}
      {...eventHandlers}
    >{props.children}
    </motion.li>
  );
}

export default ReorderableListItem;