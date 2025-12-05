/**
 * TerminalPanel Component
 *
 * xterm.js based terminal emulator for running commands within the VM sandbox.
 */

import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import './TerminalPanel.css';

interface TerminalPanelProps {
  onCommand?: (command: string) => Promise<string>;
  welcomeMessage?: string;
  prompt?: string;
}

export function TerminalPanel({
  onCommand,
  welcomeMessage = 'AI-Builds Terminal v1.0\nType "help" for available commands.\n',
  prompt = '$ ',
}: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const commandBufferRef = useRef<string>('');
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const writePrompt = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.write(`\r\n${prompt}`);
    }
  }, [prompt]);

  const handleCommand = useCallback(async (command: string) => {
    if (!terminalRef.current) return;
    const term = terminalRef.current;

    const trimmed = command.trim();
    if (!trimmed) {
      writePrompt();
      return;
    }

    // Add to history
    historyRef.current.push(trimmed);
    historyIndexRef.current = historyRef.current.length;

    // Built-in commands
    if (trimmed === 'clear') {
      term.clear();
      writePrompt();
      return;
    }

    if (trimmed === 'help') {
      term.write('\r\n');
      term.write('Available commands:\r\n');
      term.write('  clear    - Clear terminal\r\n');
      term.write('  help     - Show this help\r\n');
      term.write('  history  - Show command history\r\n');
      term.write('  reset    - Reset terminal\r\n');
      term.write('\r\nCommands are executed in the VM sandbox.');
      writePrompt();
      return;
    }

    if (trimmed === 'history') {
      term.write('\r\n');
      historyRef.current.forEach((cmd, i) => {
        term.write(`  ${i + 1}: ${cmd}\r\n`);
      });
      writePrompt();
      return;
    }

    if (trimmed === 'reset') {
      term.reset();
      term.write(welcomeMessage);
      writePrompt();
      return;
    }

    // External command execution
    if (onCommand) {
      term.write('\r\n');
      try {
        const result = await onCommand(trimmed);
        if (result) {
          term.write(result.replace(/\n/g, '\r\n'));
        }
      } catch (err) {
        term.write(`\x1b[31mError: ${err instanceof Error ? err.message : 'Unknown error'}\x1b[0m`);
      }
    } else {
      term.write('\r\n\x1b[33mNo command handler configured\x1b[0m');
    }

    writePrompt();
  }, [onCommand, welcomeMessage, writePrompt]);

  useEffect(() => {
    if (!containerRef.current) return;

    const terminal = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        cursorAccent: '#1e1e1e',
        selectionBackground: 'rgba(255, 255, 255, 0.3)',
        black: '#1e1e1e',
        red: '#f44747',
        green: '#6a9955',
        yellow: '#dcdcaa',
        blue: '#569cd6',
        magenta: '#c586c0',
        cyan: '#4ec9b0',
        white: '#d4d4d4',
        brightBlack: '#808080',
        brightRed: '#f44747',
        brightGreen: '#6a9955',
        brightYellow: '#dcdcaa',
        brightBlue: '#569cd6',
        brightMagenta: '#c586c0',
        brightCyan: '#4ec9b0',
        brightWhite: '#ffffff',
      },
      fontFamily: '"Cascadia Code", "Fira Code", Consolas, Monaco, monospace',
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(containerRef.current);
    fitAddon.fit();

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Write welcome message
    terminal.write(welcomeMessage);
    terminal.write(prompt);

    // Handle input
    terminal.onKey(({ key, domEvent }) => {
      const term = terminalRef.current;
      if (!term) return;

      const isCtrl = domEvent.ctrlKey;
      const keyCode = domEvent.keyCode;

      // Ctrl+C - cancel current input
      if (isCtrl && keyCode === 67) {
        commandBufferRef.current = '';
        term.write('^C');
        writePrompt();
        return;
      }

      // Ctrl+L - clear screen
      if (isCtrl && keyCode === 76) {
        term.clear();
        term.write(prompt + commandBufferRef.current);
        return;
      }

      // Enter - execute command
      if (keyCode === 13) {
        const command = commandBufferRef.current;
        commandBufferRef.current = '';
        handleCommand(command);
        return;
      }

      // Backspace
      if (keyCode === 8) {
        if (commandBufferRef.current.length > 0) {
          commandBufferRef.current = commandBufferRef.current.slice(0, -1);
          term.write('\b \b');
        }
        return;
      }

      // Arrow Up - history previous
      if (keyCode === 38) {
        if (historyRef.current.length > 0 && historyIndexRef.current > 0) {
          historyIndexRef.current--;
          const cmd = historyRef.current[historyIndexRef.current];
          // Clear current line
          term.write('\r' + prompt + ' '.repeat(commandBufferRef.current.length));
          term.write('\r' + prompt + cmd);
          commandBufferRef.current = cmd;
        }
        return;
      }

      // Arrow Down - history next
      if (keyCode === 40) {
        if (historyIndexRef.current < historyRef.current.length - 1) {
          historyIndexRef.current++;
          const cmd = historyRef.current[historyIndexRef.current];
          term.write('\r' + prompt + ' '.repeat(commandBufferRef.current.length));
          term.write('\r' + prompt + cmd);
          commandBufferRef.current = cmd;
        } else {
          historyIndexRef.current = historyRef.current.length;
          term.write('\r' + prompt + ' '.repeat(commandBufferRef.current.length));
          term.write('\r' + prompt);
          commandBufferRef.current = '';
        }
        return;
      }

      // Regular character input
      if (key.length === 1 && !isCtrl) {
        commandBufferRef.current += key;
        term.write(key);
      }
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch {
        // Ignore fit errors during resize
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [welcomeMessage, prompt, handleCommand, writePrompt]);

  return (
    <div className="terminal-panel" ref={containerRef} />
  );
}
