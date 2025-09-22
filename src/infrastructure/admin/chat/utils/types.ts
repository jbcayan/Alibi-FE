// types.ts - সব ধরনের Type definitions
export type Message = {
  id: number;
  thread: number;
  sender_email: string;
  sender_kind: string;
  text: string;
  created_at: string;
  is_read: boolean;
  updated_at?: string;
};

export type Thread = {
  id: number;
  user_email: string;
  created_at: string;
  messages: Message[];
};

export type MessagesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Message[];
};

export type ThreadsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Thread[];
};

export type CreateMessageRequest = {
  thread: number;
  text: string;
  is_read?: boolean;
};

export type UpdateMessageRequest = {
  thread?: number;
  text?: string;
  is_read?: boolean;
};

export type CreateThreadRequest = {
  thread: number;
  sender_email: string;
  sender_kind: string;
  text: string;
};
