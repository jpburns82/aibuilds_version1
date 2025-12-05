/**
 * useAgents Hook
 *
 * Manages agent messages and chat-style presentation.
 */

import { useMemo } from 'react';
import { AgentMessage, AgentRole, AGENT_LABELS } from '../types';

interface GroupedMessages {
  agentRole: AgentRole;
  label: string;
  messages: AgentMessage[];
}

export function useAgents(messages: AgentMessage[]) {
  // Group messages by agent for sectioned display
  const groupedByAgent = useMemo((): GroupedMessages[] => {
    const groups: Map<AgentRole, AgentMessage[]> = new Map();

    for (const message of messages) {
      const existing = groups.get(message.agentRole) || [];
      groups.set(message.agentRole, [...existing, message]);
    }

    return Array.from(groups.entries()).map(([agentRole, msgs]) => ({
      agentRole,
      label: AGENT_LABELS[agentRole],
      messages: msgs,
    }));
  }, [messages]);

  // Get messages in chronological order
  const chronologicalMessages = useMemo(() => {
    return [...messages].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [messages]);

  // Get the last message from each agent
  const latestByAgent = useMemo((): Map<AgentRole, AgentMessage> => {
    const latest = new Map<AgentRole, AgentMessage>();

    for (const message of messages) {
      const existing = latest.get(message.agentRole);
      if (!existing || new Date(message.timestamp) > new Date(existing.timestamp)) {
        latest.set(message.agentRole, message);
      }
    }

    return latest;
  }, [messages]);

  // Count messages per agent
  const messageCounts = useMemo((): Record<AgentRole, number> => {
    const counts: Record<AgentRole, number> = {
      analyst: 0,
      architect: 0,
      coder: 0,
      qa: 0,
      leadArchitect: 0,
    };

    for (const message of messages) {
      counts[message.agentRole]++;
    }

    return counts;
  }, [messages]);

  // Get the currently active agent (last one to send a message)
  const activeAgent = useMemo((): AgentRole | null => {
    if (messages.length === 0) return null;

    const sorted = [...messages].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return sorted[0]?.agentRole || null;
  }, [messages]);

  return {
    groupedByAgent,
    chronologicalMessages,
    latestByAgent,
    messageCounts,
    activeAgent,
    totalMessages: messages.length,
  };
}
