import { chatAPIClient } from "@/infrastructure/admin/chat/userMessageAPIClient";
import { CHAT_KEYS } from "@/infrastructure/admin/chat/utils/keys";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useChatQueries = () => {
  const queryClient = useQueryClient();

  return {
    // === MESSAGE QUERIES ===

    useMessages: (page = 1, limit = 20, p0: { enabled: boolean }) => {
      return useQuery({
        queryKey: CHAT_KEYS.messagesList({ page, limit }),
        queryFn: () => chatAPIClient.getMessages(page, limit),
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
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages() });
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
          queryClient.setQueryData(
            CHAT_KEYS.messageDetail(variables.messageId),
            data
          );

          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages() });
        },
      });
    },

    useDeleteMessage: () => {
      return useMutation({
        mutationFn: chatAPIClient.deleteMessage,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages() });
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.threads() });
        },
      });
    },

    // === THREAD QUERIES ===

    useThreads: (page = 1) => {
      return useQuery({
        queryKey: CHAT_KEYS.threadsList({ page }),
        queryFn: () => chatAPIClient.getThreads(page),
      });
    },

    useThread: (threadId: number, p0: { enabled: boolean }) => {
      return useQuery({
        queryKey: CHAT_KEYS.threadDetail(threadId),
        queryFn: () => chatAPIClient.getThread(threadId),
        enabled: !!threadId,
      });
    },

    useCreateThread: () => {
      return useMutation({
        mutationFn: chatAPIClient.createThread,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.threads() });
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
          queryClient.setQueryData(
            CHAT_KEYS.threadDetail(variables.threadId),
            data
          );
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.threads() });
        },
      });
    },

    useDeleteThread: () => {
      return useMutation({
        mutationFn: chatAPIClient.deleteThread,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.threads() });
        },
      });
    },

    useMarkAllRead: () => {
      return useMutation({
        mutationFn: chatAPIClient.markAllRead,
        onSuccess: (data, threadId) => {
          queryClient.setQueryData(CHAT_KEYS.threadDetail(threadId), data);
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.threads() });
        },
      });
    },
  };
};
