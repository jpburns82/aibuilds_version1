export class Logger {
  private static formatTimestamp(): string {
    return new Date().toISOString();
  }

  static info(message: string, data?: any): void {
    console.log(`[${this.formatTimestamp()}] INFO: ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  static error(message: string, error?: any): void {
    console.error(`[${this.formatTimestamp()}] ERROR: ${message}`);
    if (error) {
      console.error(error);
    }
  }

  static warn(message: string, data?: any): void {
    console.warn(`[${this.formatTimestamp()}] WARN: ${message}`);
    if (data) {
      console.warn(JSON.stringify(data, null, 2));
    }
  }

  static debug(message: string, data?: any): void {
    console.debug(`[${this.formatTimestamp()}] DEBUG: ${message}`);
    if (data) {
      console.debug(JSON.stringify(data, null, 2));
    }
  }

  static step(stepName: string, agentName?: string): void {
    const prefix = agentName ? `[${agentName}]` : '';
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${prefix} ${stepName}`);
    console.log(`${'='.repeat(60)}\n`);
  }
}
