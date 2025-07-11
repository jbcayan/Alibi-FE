// queryKeys.ts - React Query এর জন্য keys
export const CHAT_KEYS = {
  // Messages keys
  messages: () => ["chat", "messages"] as const,
  messagesList: (params?: { page?: number; limit?: number }) =>
    [...CHAT_KEYS.messages(), "list", params] as const,
  messageDetail: (messageId: number) =>
    [...CHAT_KEYS.messages(), "detail", messageId] as const,

  // Threads keys
  threads: () => ["chat", "threads"] as const,
  threadsList: (params?: { page?: number }) =>
    [...CHAT_KEYS.threads(), "list", params] as const,
  threadDetail: (threadId: number) =>
    [...CHAT_KEYS.threads(), "detail", threadId] as const,
};
