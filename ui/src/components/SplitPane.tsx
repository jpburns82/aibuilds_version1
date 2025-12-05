/**
 * SplitPane Component
 *
 * Simple resizable split pane layout component.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import './SplitPane.css';

interface SplitPaneProps {
  direction: 'horizontal' | 'vertical';
  defaultSizes?: number[];
  minSizes?: number[];
  children: React.ReactNode[];
  className?: string;
}

export function SplitPane({
  direction,
  defaultSizes,
  minSizes,
  children,
  className,
}: SplitPaneProps) {
  const childArray = React.Children.toArray(children);
  const numPanes = childArray.length;

  const getDefaultSizes = () => {
    if (defaultSizes && defaultSizes.length === numPanes) {
      return defaultSizes;
    }
    return Array(numPanes).fill(100 / numPanes);
  };

  const [sizes, setSizes] = useState<number[]>(getDefaultSizes());
  const containerRef = useRef<HTMLDivElement>(null);
  const dragIndexRef = useRef<number | null>(null);
  const startPosRef = useRef<number>(0);
  const startSizesRef = useRef<number[]>([]);

  const handleMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    dragIndexRef.current = index;
    startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
    startSizesRef.current = [...sizes];
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
  }, [direction, sizes]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragIndexRef.current === null || !containerRef.current) return;

      const container = containerRef.current;
      const containerSize = direction === 'horizontal'
        ? container.offsetWidth
        : container.offsetHeight;

      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;
      const deltaPercent = (delta / containerSize) * 100;

      const idx = dragIndexRef.current;
      const newSizes = [...startSizesRef.current];
      const minSize = minSizes?.[idx] ?? 10;
      const nextMinSize = minSizes?.[idx + 1] ?? 10;

      let newSize1 = startSizesRef.current[idx] + deltaPercent;
      let newSize2 = startSizesRef.current[idx + 1] - deltaPercent;

      if (newSize1 < minSize) {
        newSize1 = minSize;
        newSize2 = startSizesRef.current[idx] + startSizesRef.current[idx + 1] - minSize;
      }
      if (newSize2 < nextMinSize) {
        newSize2 = nextMinSize;
        newSize1 = startSizesRef.current[idx] + startSizesRef.current[idx + 1] - nextMinSize;
      }

      newSizes[idx] = newSize1;
      newSizes[idx + 1] = newSize2;
      setSizes(newSizes);
    };

    const handleMouseUp = () => {
      dragIndexRef.current = null;
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [direction, minSizes]);

  return (
    <div
      ref={containerRef}
      className={clsx('split-pane', `split-pane--${direction}`, className)}
    >
      {childArray.map((child, index) => (
        <React.Fragment key={index}>
          <div
            className="split-pane__pane"
            style={{
              [direction === 'horizontal' ? 'width' : 'height']: `${sizes[index]}%`,
            }}
          >
            {child}
          </div>
          {index < numPanes - 1 && (
            <div
              className={clsx('split-pane__resizer', `split-pane__resizer--${direction}`)}
              onMouseDown={(e) => handleMouseDown(index, e)}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
