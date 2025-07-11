import { chatAPIClient } from "@/infrastructure/admin/chat/userMessageAPIClient";
import { CHAT_KEYS } from "@/infrastructure/admin/chat/utils/keys";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useChatQueries = () => {
  const queryClient = useQueryClient();

  return {
    // === MESSAGE QUERIES ===

    // সব messages নিয়ে আসা
    useMessages: (page = 1, limit = 20) => {
      return useQuery({
        queryKey: CHAT_KEYS.messagesList({ page, limit }),
        queryFn: () => chatAPIClient.getMessages(page, limit),
      });
    },

    // specific message নিয়ে আসা
    useMessage: (messageId: number) => {
      return useQuery({
        queryKey: CHAT_KEYS.messageDetail(messageId),
        queryFn: () => chatAPIClient.getMessage(messageId),
        enabled: !!messageId,
      });
    },

    // নতুন message পাঠানো
    useSendMessage: () => {
      return useMutation({
        mutationFn: chatAPIClient.sendMessage,
        onSuccess: () => {
          // Messages list update করা
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages() });
          // Threads list update করা (কারণ নতুন message thread এও প্রভাব ফেলবে)
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.threads() });
        },
      });
    },

    // message update করা
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
          // Specific message update করা
          queryClient.setQueryData(
            CHAT_KEYS.messageDetail(variables.messageId),
            data
          );
          // Messages list update করা
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages() });
        },
      });
    },

    // message delete করা
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

    // সব threads নিয়ে আসা
    useThreads: (page = 1) => {
      return useQuery({
        queryKey: CHAT_KEYS.threadsList({ page }),
        queryFn: () => chatAPIClient.getThreads(page),
      });
    },

    // specific thread নিয়ে আসা
    useThread: (threadId: number) => {
      return useQuery({
        queryKey: CHAT_KEYS.threadDetail(threadId),
        queryFn: () => chatAPIClient.getThread(threadId),
        enabled: !!threadId,
      });
    },

    // নতুন thread তৈরি করা
    useCreateThread: () => {
      return useMutation({
        mutationFn: chatAPIClient.createThread,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.threads() });
        },
      });
    },

    // thread update করা
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

    // thread delete করা
    useDeleteThread: () => {
      return useMutation({
        mutationFn: chatAPIClient.deleteThread,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.threads() });
        },
      });
    },

    // সব messages read করা
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
