import { chatAPIClient } from "@/infrastructure/admin/chat/userMessageAPIClient";
import { CHAT_KEYS } from "@/infrastructure/admin/chat/utils/keys";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useChatQueries = () => {
  const queryClient = useQueryClient();

  return {
    // === MESSAGE QUERIES ===

    useMessages: (
      page = 1,
      limit = 20,
      options?: { enabled: boolean },
      threadId?: number
    ) => {
      return useQuery({
        queryKey: CHAT_KEYS.messagesList({ page, limit, thread: threadId }),
        queryFn: () => chatAPIClient.getMessages(page, limit, threadId),
        enabled: options?.enabled ?? true,
        refetchInterval: 2000, // every 1 seconds
      });
    },
    useMessage: (messageId: number) => {
      return useQuery({
        queryKey: CHAT_KEYS.messageDetail(messageId),
        queryFn: () => chatAPIClient.getMessage(messageId),
        enabled: !!messageId,
      });
    },

    useSendMessage: () => {
      return useMutation({
        mutationFn: chatAPIClient.sendMessage,
        onSuccess: () => {
          // Invalidate all message queries to refresh the list
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages() });
          // Invalidate all thread queries to update unread counts
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.threads() });
        },
      });
    },

    useUpdateMessage: () => {
      return useMutation({
        mutationFn: ({
          messageId,
          updateData,
        }: {
          messageId: number;
          updateData: any;
        }) => chatAPIClient.updateMessage(messageId, updateData),
        onSuccess: (data, variables) => {
          // Update the specific message in cache
          queryClient.setQueryData(
            CHAT_KEYS.messageDetail(variables.messageId),
            data
          );

          // Invalidate all message queries to refresh the list
          queryClient.invalidateQueries({
            queryKey: CHAT_KEYS.messages(),
            exact: false,
          });

          // Invalidate all thread queries to update last message
          queryClient.invalidateQueries({
            queryKey: CHAT_KEYS.threads(),
            exact: false,
          });
        },
        onError: (error) => {
          console.error("Failed to update message:", error);
        },
      });
    },

    useDeleteMessage: () => {
      return useMutation({
        mutationFn: chatAPIClient.deleteMessage,
        onSuccess: (data, messageId) => {
          // Remove the message from cache
          queryClient.removeQueries({
            queryKey: CHAT_KEYS.messageDetail(messageId),
          });

          // Invalidate all message queries to refresh the list
          queryClient.invalidateQueries({
            queryKey: CHAT_KEYS.messages(),
            exact: false,
          });

          // Invalidate all thread queries to update last message and counts
          queryClient.invalidateQueries({
            queryKey: CHAT_KEYS.threads(),
            exact: false,
          });
        },
        onError: (error) => {
          console.error("Failed to delete message:", error);
        },
      });
    },

    // === THREAD QUERIES ===

    useThreads: (page = 1) => {
      return useQuery({
        queryKey: CHAT_KEYS.threadsList({ page }),
        queryFn: () => chatAPIClient.getThreads(page),
        refetchInterval: 2000,
      });
    },

    useThread: (threadId: number, options?: { enabled: boolean }) => {
      return useQuery({
        queryKey: CHAT_KEYS.threadDetail(threadId),
        queryFn: () => chatAPIClient.getThread(threadId),
        enabled: options?.enabled ?? !!threadId,
      });
    },

    useCreateThread: () => {
      return useMutation({
        mutationFn: chatAPIClient.createThread,
        onSuccess: () => {
          // Invalidate all thread queries to refresh the list
          queryClient.invalidateQueries({
            queryKey: CHAT_KEYS.threads(),
            exact: false,
          });
        },
        onError: (error) => {
          console.error("Failed to create thread:", error);
        },
      });
    },

    useUpdateThread: () => {
      return useMutation({
        mutationFn: ({
          threadId,
          updateData,
        }: {
          threadId: number;
          updateData: any;
        }) => chatAPIClient.updateThread(threadId, updateData),
        onSuccess: (data, variables) => {
          // Update the specific thread in cache
          queryClient.setQueryData(
            CHAT_KEYS.threadDetail(variables.threadId),
            data
          );

          // Invalidate all thread queries to refresh the list
          queryClient.invalidateQueries({
            queryKey: CHAT_KEYS.threads(),
            exact: false,
          });
        },
        onError: (error) => {
          console.error("Failed to update thread:", error);
        },
      });
    },

    useDeleteThread: () => {
      return useMutation({
        mutationFn: chatAPIClient.deleteThread,
        onSuccess: (data, threadId) => {
          // Remove the thread from cache
          queryClient.removeQueries({
            queryKey: CHAT_KEYS.threadDetail(threadId),
          });

          // Invalidate all thread queries to refresh the list
          queryClient.invalidateQueries({
            queryKey: CHAT_KEYS.threads(),
            exact: false,
          });
        },
        onError: (error) => {
          console.error("Failed to delete thread:", error);
        },
      });
    },

    useMarkAllRead: () => {
      return useMutation({
        mutationFn: chatAPIClient.markAllRead,
        onSuccess: (data, threadId) => {
          // Update the specific thread in cache
          queryClient.setQueryData(CHAT_KEYS.threadDetail(threadId), data);

          // Invalidate all thread queries to refresh unread counts
          queryClient.invalidateQueries({
            queryKey: CHAT_KEYS.threads(),
            exact: false,
          });

          // Invalidate message queries to update read status
          queryClient.invalidateQueries({
            queryKey: CHAT_KEYS.messages(),
            exact: false,
          });
        },
        onError: (error) => {
          console.error("Failed to mark messages as read:", error);
        },
      });
    },
  };
};
