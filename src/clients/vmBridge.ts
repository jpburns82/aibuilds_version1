/**
 * VM Bridge
 *
 * Bridge between UI server and the VM system.
 */

import { VMController } from '../vm/VMController';
import { VMRunResult } from '../vm/VirtualMachine';

/**
 * VM Bridge class
 */
export class VMBridge {
  private vmController: VMController;

  constructor() {
    this.vmController = new VMController();
  }

  /**
   * Execute code via VM
   */
  async runCode(code: string, language: 'js' | 'ts' = 'js'): Promise<VMRunResult> {
    return this.vmController.runCode(code, language);
  }

  /**
   * Get all VM runs
   */
  getRuns() {
    return this.vmController.getRuns();
  }

  /**
   * Get a specific run by ID
   */
  getRun(runId: string) {
    return this.vmController.getRun(runId);
  }

  /**
   * Get recent runs
   */
  getRecentRuns(limit: number = 10) {
    return this.vmController.getRecentRuns(limit);
  }

  /**
   * Clear run history
   */
  clearRuns() {
    this.vmController.clearRuns();
  }

  /**
   * Get VM stats
   */
  getStats() {
    return this.vmController.getStats();
  }
}

/**
 * Singleton instance
 */
export const vmBridge = new VMBridge();
