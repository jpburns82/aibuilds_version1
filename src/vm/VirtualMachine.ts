/**
 * Virtual Machine
 *
 * Sandboxed code execution for JavaScript/TypeScript snippets.
 * Uses Node.js vm module for isolation.
 */

import * as vm from 'vm';

/**
 * VM execution result
 */
export interface VMRunResult {
  id: string;
  success: boolean;
  output: string;
  error: string | null;
  startedAt: Date;
  completedAt: Date;
  executionTime: number;
}

/**
 * Captured console output
 */
interface CapturedOutput {
  logs: string[];
  errors: string[];
}

/**
 * VirtualMachine class
 *
 * Executes JavaScript code in a sandboxed environment.
 */
export class VirtualMachine {
  private timeout: number;
  private maxOutputLength: number;

  constructor(timeout: number = 5000, maxOutputLength: number = 10000) {
    this.timeout = timeout;
    this.maxOutputLength = maxOutputLength;
  }

  /**
   * Execute JavaScript code
   */
  async run(code: string): Promise<VMRunResult> {
    const id = `vm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const startedAt = new Date();
    const captured = this.createOutputCapture();

    try {
      const sandbox = this.createSandbox(captured);
      const context = vm.createContext(sandbox);

      // Wrap code to capture return value
      const wrappedCode = `
        (function() {
          ${code}
        })();
      `;

      const script = new vm.Script(wrappedCode);
      const result = script.runInContext(context, { timeout: this.timeout });

      // If there's a return value, log it
      if (result !== undefined) {
        captured.logs.push(String(result));
      }

      const completedAt = new Date();
      return {
        id,
        success: true,
        output: this.formatOutput(captured.logs),
        error: captured.errors.length > 0 ? this.formatOutput(captured.errors) : null,
        startedAt,
        completedAt,
        executionTime: completedAt.getTime() - startedAt.getTime(),
      };
    } catch (error) {
      const completedAt = new Date();
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        id,
        success: false,
        output: this.formatOutput(captured.logs),
        error: errorMessage,
        startedAt,
        completedAt,
        executionTime: completedAt.getTime() - startedAt.getTime(),
      };
    }
  }

  /**
   * Create output capture object
   */
  private createOutputCapture(): CapturedOutput {
    return {
      logs: [],
      errors: [],
    };
  }

  /**
   * Create sandboxed environment
   */
  private createSandbox(captured: CapturedOutput): vm.Context {
    return {
      console: {
        log: (...args: unknown[]) => {
          captured.logs.push(args.map(String).join(' '));
        },
        info: (...args: unknown[]) => {
          captured.logs.push('[INFO] ' + args.map(String).join(' '));
        },
        warn: (...args: unknown[]) => {
          captured.logs.push('[WARN] ' + args.map(String).join(' '));
        },
        error: (...args: unknown[]) => {
          captured.errors.push(args.map(String).join(' '));
        },
        debug: (...args: unknown[]) => {
          captured.logs.push('[DEBUG] ' + args.map(String).join(' '));
        },
      },
      setTimeout: undefined,
      setInterval: undefined,
      setImmediate: undefined,
      clearTimeout: undefined,
      clearInterval: undefined,
      clearImmediate: undefined,
      process: undefined,
      require: undefined,
      __dirname: undefined,
      __filename: undefined,
      module: undefined,
      exports: undefined,
      global: undefined,
      // Safe built-ins
      Math,
      Date,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Error,
      Map,
      Set,
      Promise,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      encodeURI,
      decodeURI,
      encodeURIComponent,
      decodeURIComponent,
    };
  }

  /**
   * Format captured output
   */
  private formatOutput(lines: string[]): string {
    const joined = lines.join('\n');
    if (joined.length > this.maxOutputLength) {
      return joined.substring(0, this.maxOutputLength) + '\n...[output truncated]';
    }
    return joined;
  }
}

/**
 * Singleton instance
 */
export const virtualMachine = new VirtualMachine();
