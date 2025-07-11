import { axiosInstance } from "@/utils/api";
import {
  MessagesResponse,
  ThreadsResponse,
  Message,
  Thread,
  CreateMessageRequest,
  UpdateMessageRequest,
  CreateThreadRequest,
} from "./utils/types";
import { baseUrl } from "@/constants/baseApi";

export const chatAPIClient = {
  // === MESSAGE API CALLS ===

  // সব messages নিয়ে আসা (pagination সহ)
  getMessages: async (page = 1, limit = 20): Promise<MessagesResponse> => {
    const response = await axiosInstance.get<MessagesResponse>(
      `${baseUrl}/chat/messages/`,
      {
        params: { page, limit },
      }
    );
    return response.data;
  },

  // নতুন message পাঠানো
  sendMessage: async (messageData: CreateMessageRequest): Promise<Message> => {
    const response = await axiosInstance.post<Message>(
      `${baseUrl}/chat/messages/`,
      messageData
    );
    return response.data;
  },

  // specific message নিয়ে আসা
  getMessage: async (messageId: number): Promise<Message> => {
    const response = await axiosInstance.get<Message>(
      `${baseUrl}/chat/messages/${messageId}/`
    );
    return response.data;
  },

  // message update করা
  updateMessage: async (
    messageId: number,
    updateData: UpdateMessageRequest
  ): Promise<Message> => {
    const response = await axiosInstance.patch<Message>(
      `${baseUrl}/chat/messages/${messageId}/`,
      updateData
    );
    return response.data;
  },

  // message delete করা
  deleteMessage: async (messageId: number): Promise<void> => {
    await axiosInstance.delete(`${baseUrl}/chat/messages/${messageId}/`);
  },

  // === THREAD API CALLS ===

  // সব threads নিয়ে আসা (pagination সহ)
  getThreads: async (page = 1): Promise<ThreadsResponse> => {
    const response = await axiosInstance.get<ThreadsResponse>(
      `${baseUrl}/chat/threads/`,
      {
        params: { page },
      }
    );
    return response.data;
  },

  // নতুন thread তৈরি করা
  createThread: async (
    threadData: CreateThreadRequest
  ): Promise<ThreadsResponse> => {
    const response = await axiosInstance.post<ThreadsResponse>(
      `${baseUrl}/chat/threads/`,
      threadData
    );
    return response.data;
  },

  // specific thread নিয়ে আসা
  getThread: async (threadId: number): Promise<Thread> => {
    const response = await axiosInstance.get<Thread>(
      `${baseUrl}/chat/threads/${threadId}/`
    );
    return response.data;
  },

  // thread update করা
  updateThread: async (threadId: number, updateData: any): Promise<Thread> => {
    const response = await axiosInstance.patch<Thread>(
      `${baseUrl}/chat/threads/${threadId}/`,
      updateData
    );
    return response.data;
  },

  // thread delete করা
  deleteThread: async (threadId: number): Promise<void> => {
    await axiosInstance.delete(`${baseUrl}/chat/threads/${threadId}/`);
  },

  // thread এর সব messages read করা
  markAllRead: async (threadId: number): Promise<Thread> => {
    const response = await axiosInstance.post<Thread>(
      `${baseUrl}/chat/threads/${threadId}/mark_all_read/`
    );
    return response.data;
  },
};
