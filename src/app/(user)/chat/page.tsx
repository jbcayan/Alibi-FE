"use client";
import React, { useState, useEffect, useRef } from "react";
import { Send, Plus, Loader2 } from "lucide-react";
import { useChatQueries } from "@/hooks/chat/useChatQueries";
import {
  CreateMessageRequest,
  Message,
  Thread,
} from "@/infrastructure/admin/chat/utils/types";

const Chat = () => {
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get hooks from useChatQueries
  const {
    useThreads,
    useThread,
    useMessages,
    useSendMessage,
    useCreateThread,
    useMarkAllRead,
  } = useChatQueries();

  // Fetch threads
  const {
    data: threadsData,
    isLoading: threadsLoading,
    error: threadsError,
  } = useThreads(currentPage);

  // Fetch selected thread details
  const { data: selectedThread, isLoading: threadLoading } = useThread(
    selectedThreadId!,
    {
      enabled: !!selectedThreadId,
    }
  );

  // Fetch messages for selected thread only
  const { data: messagesData, isLoading: messagesLoading } = useMessages(
    1,
    50,
    {
      enabled: !!selectedThreadId,
    }
  );

  // Mutations
  const sendMessageMutation = useSendMessage();
  const createThreadMutation = useCreateThread();
  const markAllReadMutation = useMarkAllRead();

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messagesData?.results?.length > 0) {
      scrollToBottom();
    }
  }, [messagesData?.results?.length]);

  // Set initial thread selection only once
  useEffect(() => {
    if (threadsData?.results?.length > 0 && selectedThreadId === null) {
      setSelectedThreadId(threadsData.results[0].id);
    }
  }, [threadsData?.results, selectedThreadId]);

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThreadId) return;

    const messageData: CreateMessageRequest = {
      thread: selectedThreadId,
      text: newMessage.trim(),
      is_read: false,
    };

    try {
      await sendMessageMutation.mutateAsync(messageData);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Handle thread selection
  const handleThreadSelect = (threadId: number) => {
    if (selectedThreadId !== threadId) {
      setSelectedThreadId(threadId);
      // Mark all messages as read when thread is selected
      markAllReadMutation.mutate(threadId);
    }
  };

  // Handle create new thread
  const handleCreateThread = async () => {
    try {
      const newThreadData = {
        thread: 0, // Will be set by backend
        sender_email: "user@example.com", // Replace with actual user email
        sender_kind: "user",
        text: "新しいチャットを開始します",
      };

      await createThreadMutation.mutateAsync(newThreadData);
    } catch (error) {
      console.error("Failed to create thread:", error);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );
      return `${diffInMinutes}分前`;
    } else if (diffInHours < 24) {
      return `${diffInHours}時間前`;
    } else {
      return date.toLocaleDateString("ja-JP", {
        month: "numeric",
        day: "numeric",
      });
    }
  };

  // Get current thread's messages
  const currentThreadMessages = selectedThread?.messages || [];

  // Error handling
  if (threadsError) {
    return (
      <div className="main_gradient_bg min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-lg text-center">
          <p className="text-red-400 mb-4">エラーが発生しました</p>
          <p className="text-gray-300">チャットデータを読み込めませんでした</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main_gradient_bg min-h-[calc(100vh-200px)] mt-16 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <div className="w-full lg:w-80 glass-user-sidebar border-r border-pri p-2 lg:p-4 flex flex-col max-h-96 lg:max-h-none overflow-y-auto lg:overflow-visible">
        {/* Header */}
        <div className="mb-4 lg:mb-6">
          <h1 className="text-xl lg:text-2xl font-bold text-white mb-2 lg:mb-4">
            チャット
          </h1>
          <button
            onClick={handleCreateThread}
            disabled={createThreadMutation.isPending}
            className="w-full bg-pri glass-card rounded-lg p-2 lg:p-3 text-white hover:bg-opacity-80 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 text-sm lg:text-base"
          >
            {createThreadMutation.isPending ? (
              <Loader2 size={16} className="animate-spin lg:w-5 lg:h-5" />
            ) : (
              <Plus size={16} className="lg:w-5 lg:h-5" />
            )}
            新しいチャットルーム
          </button>
        </div>

        {/* Thread Selection */}
        <div className="mb-2 lg:mb-4">
          <p className="text-gray-400 text-xs lg:text-sm mb-2 lg:mb-3">
            チャットルームを選択してください
          </p>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-48 lg:max-h-none">
          {threadsLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="animate-spin text-white" size={24} />
            </div>
          ) : (
            threadsData?.results?.map((thread: Thread) => {
              const lastMessage = thread.messages?.[thread.messages.length - 1];
              const unreadCount =
                thread.messages?.filter((msg) => !msg.is_read).length || 0;

              return (
                <div
                  key={thread.id}
                  onClick={() => handleThreadSelect(thread.id)}
                  className={`glass-card rounded-lg p-2 lg:p-4 cursor-pointer transition-all duration-300 hover:bg-opacity-80 ${
                    selectedThreadId === thread.id
                      ? "border-2 border-brand-400 bg-brand-500 bg-opacity-20"
                      : "border border-gray-600"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1 lg:mb-2">
                    <h3 className="text-white font-medium text-xs lg:text-sm truncate pr-2">
                      {thread.user_email || `スレッド ${thread.id}`}
                    </h3>
                    <span className="text-gray-400 text-xs flex-shrink-0">
                      {formatTimestamp(
                        lastMessage?.created_at || thread.created_at
                      )}
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs lg:text-sm truncate">
                    {lastMessage?.text || "新しいチャット"}
                  </p>
                  {unreadCount > 0 && (
                    <div className="flex justify-center  mt-1 glass w-8 lg:mt-2">
                      <span className="bg-brand-500 text-red-500 text-xs rounded-full px-2 py-1">
                        {unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat Header */}
        <div className="glass-card border-b border-pri p-2 lg:p-4 m-2 lg:m-4 mb-0 rounded-t-lg">
          <h2 className="text-lg lg:text-xl font-bold text-white">
            {selectedThread?.user_email || "チャット"}
          </h2>
          <p className="text-gray-400 text-xs lg:text-sm">
            最後の活動:{" "}
            {selectedThread?.created_at
              ? new Date(selectedThread.created_at).toLocaleString("ja-JP")
              : "不明"}
          </p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-2 lg:p-4 space-y-2 lg:space-y-4">
          {messagesLoading || threadLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="animate-spin text-white" size={24} />
            </div>
          ) : (
            currentThreadMessages.map((message: Message) => {
              const isAdmin = message.sender_kind === "SUPER_ADMIN";
              const isSupport = message.sender_kind === "support";
              const isEndUser = message.sender_kind === "END_USER";
              const timestamp = new Date(message.created_at).toLocaleTimeString(
                "ja-JP",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isAdmin || isSupport ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl ${
                      isAdmin || isSupport ? "order-1" : "order-2"
                    }`}
                  >
                    {(isAdmin || isSupport) && (
                      <div className="text-xs text-gray-400 mb-1 px-1">
                        {isAdmin ? "管理者" : "サポート"}
                      </div>
                    )}
                    <div
                      className={`glass-card rounded-lg p-2 lg:p-3 ${
                        isAdmin
                          ? "bg-green-600 bg-opacity-80 text-white"
                          : isSupport
                          ? "bg-glass-medium text-white"
                          : "bg-brand-500 text-white"
                      }`}
                    >
                      <p className="text-xs lg:text-sm break-words">
                        {message.text}
                      </p>
                      <div className="text-xs text-gray-300 mt-1">
                        {timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {sendMessageMutation.isPending && (
            <div className="flex justify-end">
              <div className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                <div className="glass-card bg-brand-500 rounded-lg p-2 lg:p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-2 lg:p-4 mb-4 lg:mb-20">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="メッセージを入力してください..."
              className="flex-1 glass-input p-2 lg:p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm lg:text-base"
              disabled={sendMessageMutation.isPending || !selectedThreadId}
            />
            <button
              type="submit"
              disabled={
                !newMessage.trim() ||
                sendMessageMutation.isPending ||
                !selectedThreadId
              }
              className="bg-brand-500 cursor-pointer hover:bg-brand-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 lg:p-3 rounded-lg transition-colors duration-200 flex items-center justify-center min-w-[40px] lg:min-w-[48px]"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 size={16} className="animate-spin lg:w-5 lg:h-5" />
              ) : (
                <Send size={16} className="lg:w-5 lg:h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
