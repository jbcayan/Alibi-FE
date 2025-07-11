// hooks/chat/keys.ts

export const CHAT_KEYS = {
  // Base keys
  threads: () => ["chat", "threads"] as const,
  messages: () => ["chat", "messages"] as const,

  // Thread specific keys
  threadsList: (params?: { page?: number; limit?: number }) =>
    [...CHAT_KEYS.threads(), "list", params] as const,

  threadDetail: (threadId: number) =>
    [...CHAT_KEYS.threads(), "detail", threadId] as const,

  // Message specific keys
  messagesList: (params?: { page?: number; limit?: number; thread?: number }) =>
    [...CHAT_KEYS.messages(), "list", params] as const,

  messageDetail: (messageId: number) =>
    [...CHAT_KEYS.messages(), "detail", messageId] as const,

  // Thread এর messages
  threadMessages: (
    threadId: number,
    params?: { page?: number; limit?: number }
  ) => [...CHAT_KEYS.threads(), threadId, "messages", params] as const,
};
