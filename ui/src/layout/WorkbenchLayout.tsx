/**
 * WorkbenchLayout Component
 *
 * Main 3-pane layout for the AI-Builds workbench.
 * Two distinct communication threads:
 * 1. Left: ChatGPT Ideation (Human <-> ChatGPT Architect)
 * 2. Middle: Agent Console (Internal team execution)
 */

import { useEffect, useRef } from 'react';
import { SplitPane } from '../components/SplitPane';
import { IdeationChat } from '../components/IdeationChat';
import { AgentChatWindow } from '../components/AgentChatWindow';
import { ValidationPanel } from '../components/ValidationPanel';
import { VMConsole } from '../components/VMConsole';
import { LogStream } from '../components/LogStream';
import { ProjectFolderTree } from '../components/ProjectFolderTree';
import { FileViewer } from '../components/FileViewer';
import { usePipeline } from '../hooks/usePipeline';
import { useChat } from '../hooks/useChat';
import { useFS } from '../hooks/useFS';
import { useValidation } from '../hooks/useValidation';
import { useVM } from '../hooks/useVM';
import { useLogs } from '../hooks/useLogs';
import './WorkbenchLayout.css';

export function WorkbenchLayout() {
  const pipeline = usePipeline();
  const chat = useChat();
  const fs = useFS();
  const validation = useValidation();
  const vm = useVM();
  const logs = useLogs();
  const pollIntervalRef = useRef<number | null>(null);

  // Sync state on initial mount
  useEffect(() => {
    pipeline.refreshState();
    chat.refreshState();
  }, []);

  // Poll for pipeline state updates when running
  useEffect(() => {
    if (pipeline.state.status === 'running') {
      pollIntervalRef.current = window.setInterval(async () => {
        await pipeline.refreshState();
      }, 1000);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
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
      // Refresh pipeline state
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

  const handleValidationFileClick = (path: string) => {
    handleFileSelect(path);
  };

  const handleStop = async () => {
    logs.info('Pipeline', 'Stopping session...');
    await pipeline.stopSession();
    logs.info('Pipeline', 'Session stopped');
  };

  const isRunning = pipeline.state.status === 'running';
  const isBlocked = pipeline.state.status === 'blocked';
  const isCompleted = pipeline.state.status === 'completed';

  return (
    <div className="workbench-layout">
      {/* Status Bar */}
      <div className="workbench-layout__status-bar">
        <div className="workbench-layout__logo">
          <span className="workbench-layout__logo-icon">AI</span>
          <span className="workbench-layout__logo-text">Builds Workbench</span>
        </div>
        <div className="workbench-layout__status">
          {pipeline.state.status !== 'idle' && (
            <>
              <span className={`workbench-layout__status-indicator workbench-layout__status-indicator--${pipeline.state.status}`} />
              <span>
                {isRunning && `Building: ${pipeline.state.projectName}`}
                {isBlocked && `Review: ${pipeline.state.projectName}`}
                {isCompleted && `Complete: ${pipeline.state.projectName}`}
              </span>
              {(isRunning || isBlocked) && (
                <button className="workbench-layout__stop-btn" onClick={handleStop}>
                  {isBlocked ? 'Reset' : 'Stop'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="workbench-layout__content">
        <SplitPane
          direction="horizontal"
          defaultSizes={[30, 40, 30]}
          minSizes={[20, 25, 20]}
        >
          {/* Left Pane: ChatGPT Ideation */}
          <div className="workbench-pane workbench-pane--ideation">
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
          </div>

          {/* Middle Pane: Agent Console + Project Explorer */}
          <div className="workbench-pane workbench-pane--agents">
            <SplitPane direction="vertical" defaultSizes={[55, 45]}>
              <div className="panel">
                <div className="panel-header">
                  Agent Console
                  {pipeline.state.currentAgent && (
                    <span className="panel-header__badge">
                      {pipeline.state.currentAgent}
                    </span>
                  )}
                </div>
                <AgentChatWindow
                  messages={pipeline.state.messages}
                  currentAgent={pipeline.state.currentAgent}
                  projectName={pipeline.state.projectName}
                  projectMode={pipeline.state.projectMode}
                  status={pipeline.state.status}
                />
              </div>
              <div className="panel">
                <SplitPane direction="horizontal" defaultSizes={[50, 50]}>
                  <div className="panel">
                    <div className="panel-header">Project Explorer</div>
                    <div className="panel-content">
                      <ProjectFolderTree
                        tree={fs.tree}
                        selectedPath={fs.selectedPath}
                        onSelectFile={handleFileSelect}
                        loading={fs.loading}
                      />
                    </div>
                  </div>
                  <div className="panel">
                    <FileViewer
                      path={fs.selectedPath}
                      content={fs.content}
                      loading={fs.loading}
                    />
                  </div>
                </SplitPane>
              </div>
            </SplitPane>
          </div>

          {/* Right Pane: Validation + VM + Logs */}
          <div className="workbench-pane workbench-pane--tools">
            <SplitPane direction="vertical" defaultSizes={[35, 35, 30]}>
              <div className="panel">
                <div className="panel-header">Validation</div>
                <ValidationPanel
                  report={validation.report}
                  loading={validation.loading}
                  onFileClick={handleValidationFileClick}
                />
              </div>
              <div className="panel">
                <VMConsole
                  activeRun={vm.activeRun}
                  recentRuns={vm.recentRuns}
                  loading={vm.loading}
                  stats={vm.stats}
                  onRunCode={handleVMRun}
                  onSelectRun={vm.selectRun}
                />
              </div>
              <div className="panel">
                <LogStream entries={logs.recentEntries} onClear={logs.clear} />
              </div>
            </SplitPane>
          </div>
        </SplitPane>
      </div>
    </div>
  );
}
