/*
 * Utilities supporting reorderable list components. Pulled with minimal modifications from here:
 * https://codesandbox.io/s/framer-motion-2-drag-to-reorder-forked-illop?file=/src/dynamic.ts:0-3925
 * 
 * TODO: Read through and understand in more detail, pare down, integrate better with the rest of
 * our code. I'm allowing myself to defer that effort on the theory that this is still less opaque
 * than the third-party module we'd have used instead.
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  RefObject
} from "react";
import { PanInfo, AxisBox2D, BoxDelta } from "framer-motion";

type SwapDistanceType = (sibling: number) => number;

export type ReorderableListItemInfo = {
  index: number;
  drag?: "x" | "y";
};

export const findIndex = (
  i: number,
  yOffset: number,
  sizes: number[],
  swapDistance: SwapDistanceType
) => {
  let target = i;

  // If moving down
  if (yOffset > 0) {
    const nextHeight = sizes[i + 1];
    if (nextHeight === undefined) return i;

    const swapOffset = swapDistance(nextHeight);
    if (yOffset > swapOffset) target = i + 1;

    // If moving up
  } else if (yOffset < 0) {
    const prevHeight = sizes[i - 1];
    if (prevHeight === undefined) return i;

    const swapOffset = swapDistance(prevHeight);
    if (yOffset < -swapOffset) target = i - 1;
  }

  return Math.min(Math.max(target, 0), sizes.length);
};

export type DynamicListProps<T> = {
  items: T[];
  swapDistance: SwapDistanceType;
  onPositionUpdate: (from: number, to: number) => void;
  onPositionChange?: (startIndex: number, endIndex: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

export type ReorderableListItemHandlers = {
  handleChange: (i: number, dragOffset: number) => void;
  handleDragStart: (index: number) => void;
  handleDragEnd: (endIndex: number) => void;
  handleMeasure: (index: number, size: number) => void;
};

export function useReorderableList<T>({
  items,
  swapDistance,
  onPositionUpdate,
  onPositionChange,
  onDragStart,
  onDragEnd
}: DynamicListProps<T>): ReorderableListItemHandlers {
  const sizes = useRef(new Array(items.length).fill(0)).current;
  const [startIndex, setStartIndex] = useState(-1);

  const handleDragStart = useCallback((index: number) => {
    setStartIndex(index);
    if (onDragStart) onDragStart();
  }, [onDragStart, setStartIndex]);

  const handleChange = useCallback(
    (i: number, dragOffset: number) => {
      const targetIndex = findIndex(i, dragOffset, sizes, swapDistance);
      if (targetIndex !== i) {
        const swapSize = sizes[targetIndex];
        sizes[targetIndex] = sizes[i];
        sizes[i] = swapSize;

        onPositionUpdate(i, targetIndex);
      }
    },
    [sizes, swapDistance, onPositionUpdate]
  );

  const handleDragEnd = useCallback(
    (endIndex: number) => {
      if (onPositionChange && startIndex !== endIndex)
        {onPositionChange(startIndex, endIndex);}
      setStartIndex(-1);
      if (onDragEnd) onDragEnd();
    },
    [startIndex, onPositionChange, onDragEnd]
  );

  const handleMeasure = useCallback(
    (index: number, size: number) => {
      sizes[index] = size;
    },
    [sizes]
  );

  return {
    handleChange,
    handleDragStart,
    handleDragEnd,
    handleMeasure
  };
}

type DragState = "idle" | "animating" | "dragging";

type DynamicListItemResult<T> = [
  DragState,
  RefObject<T>,
  {
    onDragStart(
      event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ): void;
    onDragEnd(
      event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ): void;
    onAnimationComplete(): void;
    onViewportBoxUpdate(box: AxisBox2D, delta: BoxDelta): void;
  }
];

export function useReorderableListItem<T extends HTMLElement>(
  index: number,
  drag: "x" | "y",
  {
    handleChange,
    handleDragStart,
    handleDragEnd,
    handleMeasure
  }: ReorderableListItemHandlers
): DynamicListItemResult<T> {
  const [state, setState] = useState<DragState>("idle");
  const ref = useRef<T>(null);

  useEffect(() => {
    if (ref && ref.current)
      {handleMeasure(
        index,
        drag === "y" ? ref.current.offsetHeight : ref.current.offsetWidth
      );}
  }, [ref, handleMeasure, index, drag]);

  return [
    state,
    ref,
    {
      onDragStart: () => {
        setState("dragging");
        handleDragStart(index);
      },
      onDragEnd: () => {
        setState("animating");
        handleDragEnd(index);
      },
      onAnimationComplete: () => {
        if (state === "animating") setState("idle");
      },
      onViewportBoxUpdate: (_viewportBox, delta) => {
        if (state === "dragging") handleChange(index, delta.y.translate);
      }
    }
  ];
}

export const getDragStateZIndex = (state: string, base = 0) => {
  switch (state) {
    case "dragging":
      return base + 99;
    case "animating":
      return base + 2;
    default:
      return base + 1;
  }
};
