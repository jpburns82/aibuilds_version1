/**
 * IDEWorkbench Component
 *
 * Main IDE layout using GoldenLayout for dockable panels.
 * Replaces the SplitPane-based WorkbenchLayout with a full IDE experience.
 */

import { useCallback, useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { GoldenLayoutWrapper, ComponentType } from './GoldenLayoutWrapper';
import { IdeationChat } from '../components/IdeationChat';
import { AgentChatWindow } from '../components/AgentChatWindow';
import { ValidationPanel } from '../components/ValidationPanel';
import { VMConsole } from '../components/VMConsole';
import { LogStream } from '../components/LogStream';
import { ProjectFolderTree } from '../components/ProjectFolderTree';
import { FileViewer } from '../components/FileViewer';
import { TerminalPanel } from '../components/TerminalPanel';
import { usePipeline } from '../hooks/usePipeline';
import { useChat } from '../hooks/useChat';
import { useFS } from '../hooks/useFS';
import { useValidation } from '../hooks/useValidation';
import { useVM } from '../hooks/useVM';
import { useLogs } from '../hooks/useLogs';
import './IDEWorkbench.css';

export function IDEWorkbench() {
  const pipeline = usePipeline();
  const chat = useChat();
  const fs = useFS();
  const validation = useValidation();
  const vm = useVM();
  const logs = useLogs();
  const pollIntervalRef = useRef<number | null>(null);
  const rootsRef = useRef<Map<HTMLElement, Root>>(new Map());

  // Sync state on mount
  useEffect(() => {
    pipeline.refreshState();
    chat.refreshState();
  }, []);

  // Poll for pipeline updates
  useEffect(() => {
    if (pipeline.state.status === 'running') {
      pollIntervalRef.current = window.setInterval(() => {
        pipeline.refreshState();
      }, 1000);
    } else if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [pipeline.state.status]);

  const handleSendMessage = async (message: string) => {
    logs.info('ChatGPT', `User: ${message.substring(0, 50)}...`);
    try {
      await chat.sendMessage(message);
      logs.info('ChatGPT', 'Response received');
    } catch {
      logs.error('ChatGPT', 'Failed to send message');
    }
  };

  const handleTriggerBuild = async () => {
    logs.info('Pipeline', 'Build triggered from ChatGPT plan');
    try {
      await chat.triggerBuild();
      logs.info('Pipeline', 'Build started');
      await pipeline.refreshState();
    } catch {
      logs.error('Pipeline', 'Failed to trigger build');
    }
  };

  const handleChatReset = async () => {
    logs.info('ChatGPT', 'Conversation reset');
    await chat.reset();
  };

  const handleFileSelect = async (path: string) => {
    logs.debug('FS', `Selected file: ${path}`);
    await fs.selectFile(path);
  };

  const handleVMRun = async (code: string, language: 'js' | 'ts') => {
    logs.info('VM', `Executing ${language} code`);
    const result = await vm.runCode(code, language);
    if (result.error) {
      logs.error('VM', result.error);
    } else {
      logs.info('VM', 'Execution completed');
    }
  };

  const handleStop = async () => {
    logs.info('Pipeline', 'Stopping session...');
    await pipeline.stopSession();
    logs.info('Pipeline', 'Session stopped');
  };

  const handleTerminalCommand = async (command: string): Promise<string> => {
    logs.info('Terminal', `Command: ${command}`);
    return `[Command not connected to VM] ${command}`;
  };

  const renderComponent = useCallback((type: ComponentType, container: HTMLElement) => {
    const root = createRoot(container);
    rootsRef.current.set(container, root);

    switch (type) {
      case 'ideation-chat':
        root.render(
          <IdeationChat
            messages={chat.state.history}
            plan={chat.state.plan}
            readyToBuild={chat.state.readyToBuild}
            loading={chat.state.loading}
            error={chat.state.error}
            onSendMessage={handleSendMessage}
            onTriggerBuild={handleTriggerBuild}
            onReset={handleChatReset}
          />
        );
        break;
      case 'agent-console':
        root.render(
          <AgentChatWindow
            messages={pipeline.state.messages}
            currentAgent={pipeline.state.currentAgent}
            projectName={pipeline.state.projectName}
            projectMode={pipeline.state.projectMode}
            status={pipeline.state.status}
          />
        );
        break;
      case 'file-explorer':
        root.render(
          <ProjectFolderTree
            tree={fs.tree}
            selectedPath={fs.selectedPath}
            onSelectFile={handleFileSelect}
            loading={fs.loading}
          />
        );
        break;
      case 'file-viewer':
        root.render(
          <FileViewer
            path={fs.selectedPath}
            content={fs.content}
            loading={fs.loading}
          />
        );
        break;
      case 'validation':
        root.render(
          <ValidationPanel
            report={validation.report}
            loading={validation.loading}
            onFileClick={handleFileSelect}
          />
        );
        break;
      case 'vm-console':
        root.render(
          <VMConsole
            activeRun={vm.activeRun}
            recentRuns={vm.recentRuns}
            loading={vm.loading}
            stats={vm.stats}
            onRunCode={handleVMRun}
            onSelectRun={vm.selectRun}
          />
        );
        break;
      case 'log-stream':
        root.render(<LogStream entries={logs.recentEntries} onClear={logs.clear} />);
        break;
      case 'terminal':
        root.render(<TerminalPanel onCommand={handleTerminalCommand} />);
        break;
    }
  }, [chat, pipeline, fs, validation, vm, logs]);

  const handleComponentMount = useCallback((type: ComponentType, container: HTMLElement) => {
    renderComponent(type, container);
  }, [renderComponent]);

  const handleComponentUnmount = useCallback((_type: ComponentType, container: HTMLElement) => {
    const root = rootsRef.current.get(container);
    if (root) {
      root.unmount();
      rootsRef.current.delete(container);
    }
  }, []);

  // Re-render components when state changes
  useEffect(() => {
    rootsRef.current.forEach((_root, container) => {
      const type = Array.from(container.classList)
        .find(c => c.startsWith('gl-panel--'))
        ?.replace('gl-panel--', '') as ComponentType | undefined;
      if (type) {
        renderComponent(type, container);
      }
    });
  }, [chat.state, pipeline.state, fs, validation, vm, logs.recentEntries, renderComponent]);

  const isRunning = pipeline.state.status === 'running';
  const isBlocked = pipeline.state.status === 'blocked';
  const isCompleted = pipeline.state.status === 'completed';

  return (
    <div className="ide-workbench">
      <header className="ide-workbench__header">
        <div className="ide-workbench__logo">
          <span className="ide-workbench__logo-icon">AI</span>
          <span className="ide-workbench__logo-text">Builds IDE</span>
        </div>
        <div className="ide-workbench__status">
          {pipeline.state.status !== 'idle' && (
            <>
              <span className={`ide-workbench__status-dot ide-workbench__status-dot--${pipeline.state.status}`} />
              <span className="ide-workbench__status-text">
                {isRunning && `Building: ${pipeline.state.projectName}`}
                {isBlocked && `Review: ${pipeline.state.projectName}`}
                {isCompleted && `Complete: ${pipeline.state.projectName}`}
              </span>
              {(isRunning || isBlocked) && (
                <button className="ide-workbench__stop-btn" onClick={handleStop}>
                  {isBlocked ? 'Reset' : 'Stop'}
                </button>
              )}
            </>
          )}
        </div>
        <div className="ide-workbench__actions">
          <button
            className="ide-workbench__reset-layout"
            onClick={() => {
              localStorage.removeItem('aibuilds-layout-config');
              window.location.reload();
            }}
            title="Reset layout to default"
          >
            Reset Layout
          </button>
        </div>
      </header>
      <main className="ide-workbench__main">
        <GoldenLayoutWrapper
          onComponentMount={handleComponentMount}
          onComponentUnmount={handleComponentUnmount}
        />
      </main>
    </div>
  );
}
