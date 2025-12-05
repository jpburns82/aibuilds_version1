/**
 * VM Controller
 *
 * High-level VM orchestration and run management.
 */

import { VirtualMachine, VMRunResult, virtualMachine } from './VirtualMachine';
import { VMEventLog, vmEventLog } from './VMEventLog';

/**
 * Stored VM run with metadata
 */
export interface StoredRun extends VMRunResult {
  language: 'js' | 'ts';
  code: string;
}

/**
 * VM Controller class
 *
 * Manages VM execution and stores run history.
 */
export class VMController {
  private vm: VirtualMachine;
  private eventLog: VMEventLog;
  private runs: Map<string, StoredRun>;
  private runOrder: string[];

  constructor(vm: VirtualMachine = virtualMachine, eventLog: VMEventLog = vmEventLog) {
    this.vm = vm;
    this.eventLog = eventLog;
    this.runs = new Map();
    this.runOrder = [];
  }

  /**
   * Run code and store result
   */
  async runCode(code: string, language: 'js' | 'ts' = 'js'): Promise<VMRunResult> {
    this.eventLog.addEvent('run_start', { language, codeLength: code.length });

    // For TypeScript, we'd need a transpiler - for now, treat as JS
    const executableCode = language === 'ts' ? this.transpileTS(code) : code;

    const result = await this.vm.run(executableCode);

    const storedRun: StoredRun = {
      ...result,
      language,
      code,
    };

    this.runs.set(result.id, storedRun);
    this.runOrder.push(result.id);

    // Keep only last 100 runs
    if (this.runOrder.length > 100) {
      const oldId = this.runOrder.shift()!;
      this.runs.delete(oldId);
    }

    this.eventLog.addEvent(
      result.success ? 'run_success' : 'run_error',
      { runId: result.id, executionTime: result.executionTime }
    );

    return result;
  }

  /**
   * Basic TypeScript to JavaScript "transpilation"
   * Note: This is a simplified version - real transpilation would use ts compiler
   */
  private transpileTS(code: string): string {
    // Remove type annotations (very basic)
    let js = code;

    // Remove type annotations from variables
    js = js.replace(/:\s*(string|number|boolean|any|void|object|unknown)\b/g, '');

    // Remove interface/type definitions
    js = js.replace(/interface\s+\w+\s*\{[^}]*\}/g, '');
    js = js.replace(/type\s+\w+\s*=\s*[^;]+;/g, '');

    // Remove generic type parameters
    js = js.replace(/<[^>]+>/g, '');

    // Remove 'as' type assertions
    js = js.replace(/\s+as\s+\w+/g, '');

    return js;
  }

  /**
   * Get all runs
   */
  getRuns(): StoredRun[] {
    return this.runOrder.map(id => this.runs.get(id)!);
  }

  /**
   * Get a specific run
   */
  getRun(runId: string): StoredRun | undefined {
    return this.runs.get(runId);
  }

  /**
   * Get recent runs
   */
  getRecentRuns(limit: number = 10): StoredRun[] {
    return [...this.runOrder]
      .reverse()
      .slice(0, limit)
      .map(id => this.runs.get(id)!);
  }

  /**
   * Clear run history
   */
  clearRuns(): void {
    this.runs.clear();
    this.runOrder = [];
    this.eventLog.addEvent('runs_cleared', {});
  }

  /**
   * Get stats
   */
  getStats(): {
    total: number;
    success: number;
    failed: number;
    avgExecutionTime: number;
  } {
    const runs = this.getRuns();
    const successful = runs.filter(r => r.success);
    const totalTime = runs.reduce((sum, r) => sum + r.executionTime, 0);

    return {
      total: runs.length,
      success: successful.length,
      failed: runs.length - successful.length,
      avgExecutionTime: runs.length > 0 ? Math.round(totalTime / runs.length) : 0,
    };
  }
}

/**
 * Singleton instance
 */
export const vmController = new VMController();
