/**
 * VM Event Log
 *
 * Tracks VM runs and events in memory.
 */

/**
 * VM event types
 */
export type VMEventType =
  | 'run_start'
  | 'run_success'
  | 'run_error'
  | 'runs_cleared'
  | 'vm_error';

/**
 * VM event entry
 */
export interface VMEvent {
  id: string;
  timestamp: Date;
  type: VMEventType;
  data: Record<string, unknown>;
}

/**
 * VMEventLog class
 *
 * Manages a log of VM events.
 */
export class VMEventLog {
  private events: VMEvent[];
  private maxEvents: number;

  constructor(maxEvents: number = 500) {
    this.events = [];
    this.maxEvents = maxEvents;
  }

  /**
   * Add event to log
   */
  addEvent(type: VMEventType, data: Record<string, unknown>): VMEvent {
    const event: VMEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      type,
      data,
    };

    this.events.push(event);

    // Trim old events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    return event;
  }

  /**
   * Get all events
   */
  getEvents(): VMEvent[] {
    return [...this.events];
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 50): VMEvent[] {
    return [...this.events].reverse().slice(0, limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: VMEventType): VMEvent[] {
    return this.events.filter(e => e.type === type);
  }

  /**
   * Get events since a timestamp
   */
  getEventsSince(since: Date): VMEvent[] {
    return this.events.filter(e => e.timestamp >= since);
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Get event count
   */
  getCount(): number {
    return this.events.length;
  }

  /**
   * Get stats
   */
  getStats(): {
    total: number;
    byType: Record<VMEventType, number>;
    oldestEvent: Date | null;
    newestEvent: Date | null;
  } {
    const byType: Record<VMEventType, number> = {
      run_start: 0,
      run_success: 0,
      run_error: 0,
      runs_cleared: 0,
      vm_error: 0,
    };

    for (const event of this.events) {
      byType[event.type]++;
    }

    return {
      total: this.events.length,
      byType,
      oldestEvent: this.events.length > 0 ? this.events[0].timestamp : null,
      newestEvent: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : null,
    };
  }
}

/**
 * Singleton instance
 */
export const vmEventLog = new VMEventLog();
