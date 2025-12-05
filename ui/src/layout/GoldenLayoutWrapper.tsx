/**
 * GoldenLayoutWrapper Component
 *
 * React wrapper for GoldenLayout 2.x providing dockable panel system.
 * Manages component registration and layout state persistence.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  GoldenLayout,
  LayoutConfig,
  ComponentContainer,
  JsonValue,
  ResolvedLayoutConfig,
} from 'golden-layout';
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';
import './GoldenLayoutWrapper.css';

export type ComponentType =
  | 'ideation-chat'
  | 'agent-console'
  | 'file-explorer'
  | 'file-viewer'
  | 'validation'
  | 'vm-console'
  | 'log-stream'
  | 'terminal';

export interface PanelComponentProps {
  container: ComponentContainer;
  state?: JsonValue;
}

export interface GoldenLayoutWrapperProps {
  onComponentMount: (type: ComponentType, container: HTMLElement) => void;
  onComponentUnmount: (type: ComponentType, container: HTMLElement) => void;
  onLayoutChange?: (config: ResolvedLayoutConfig) => void;
  savedConfig?: LayoutConfig;
}

const STORAGE_KEY = 'aibuilds-layout-config';

const DEFAULT_CONFIG: LayoutConfig = {
  root: {
    type: 'row',
    content: [
      {
        type: 'column',
        width: 28,
        content: [
          {
            type: 'component',
            componentType: 'ideation-chat',
            title: 'ChatGPT Ideation',
          },
        ],
      },
      {
        type: 'column',
        width: 44,
        content: [
          {
            type: 'component',
            componentType: 'agent-console',
            title: 'Agent Console',
            height: 55,
          },
          {
            type: 'row',
            height: 45,
            content: [
              {
                type: 'component',
                componentType: 'file-explorer',
                title: 'Explorer',
                width: 40,
              },
              {
                type: 'component',
                componentType: 'file-viewer',
                title: 'Editor',
                width: 60,
              },
            ],
          },
        ],
      },
      {
        type: 'column',
        width: 28,
        content: [
          {
            type: 'stack',
            content: [
              {
                type: 'component',
                componentType: 'validation',
                title: 'Validation',
              },
              {
                type: 'component',
                componentType: 'vm-console',
                title: 'VM Console',
              },
              {
                type: 'component',
                componentType: 'terminal',
                title: 'Terminal',
              },
            ],
          },
          {
            type: 'component',
            componentType: 'log-stream',
            title: 'Logs',
            height: 30,
          },
        ],
      },
    ],
  },
};

export function GoldenLayoutWrapper({
  onComponentMount,
  onComponentUnmount,
  onLayoutChange,
  savedConfig,
}: GoldenLayoutWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<GoldenLayout | null>(null);
  const [isReady, setIsReady] = useState(false);

  const createComponentCallback = useCallback(
    (componentType: ComponentType) => {
      return (container: ComponentContainer) => {
        const element = container.element;
        element.classList.add('gl-panel', `gl-panel--${componentType}`);
        onComponentMount(componentType, element);

        container.on('beforeComponentRelease', () => {
          onComponentUnmount(componentType, element);
        });
      };
    },
    [onComponentMount, onComponentUnmount]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const loadConfig = (): LayoutConfig => {
      if (savedConfig) return savedConfig;

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored) as LayoutConfig;
        }
      } catch {
        console.warn('Failed to load saved layout, using default');
      }
      return DEFAULT_CONFIG;
    };

    const config = loadConfig();
    const layout = new GoldenLayout(containerRef.current);
    layoutRef.current = layout;

    // Register all component types
    const componentTypes: ComponentType[] = [
      'ideation-chat',
      'agent-console',
      'file-explorer',
      'file-viewer',
      'validation',
      'vm-console',
      'log-stream',
      'terminal',
    ];

    componentTypes.forEach((type) => {
      layout.registerComponentFactoryFunction(type, createComponentCallback(type));
    });

    // Handle layout state changes
    layout.on('stateChanged', () => {
      if (onLayoutChange && layout.isInitialised) {
        const resolvedConfig = layout.saveLayout();
        onLayoutChange(resolvedConfig);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(resolvedConfig));
        } catch {
          console.warn('Failed to save layout state');
        }
      }
    });

    // Load layout
    layout.loadLayout(config);
    setIsReady(true);

    // Handle window resize
    const handleResize = () => {
      if (layout.isInitialised) {
        layout.setSize(containerRef.current!.offsetWidth, containerRef.current!.offsetHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (layout.isInitialised) {
        layout.destroy();
      }
      layoutRef.current = null;
    };
  }, [createComponentCallback, onLayoutChange, savedConfig]);

  return (
    <div className="golden-layout-wrapper" ref={containerRef}>
      {!isReady && (
        <div className="golden-layout-wrapper__loading">
          Initializing layout...
        </div>
      )}
    </div>
  );
}

export function resetLayout(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}
