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
    selectedThreadId!
  );

  // Fetch messages
  const { data: messagesData, isLoading: messagesLoading } = useMessages(1, 50);

  // Mutations
  const sendMessageMutation = useSendMessage();
  const createThreadMutation = useCreateThread();
  const markAllReadMutation = useMarkAllRead();

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesData, selectedThread]);

  // Set initial thread selection
  useEffect(() => {
    if (threadsData?.results?.length > 0 && !selectedThreadId) {
      setSelectedThreadId(threadsData.results[0].id);
    }
  }, [threadsData, selectedThreadId]);

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
    setSelectedThreadId(threadId);
    // Mark all messages as read when thread is selected
    markAllReadMutation.mutate(threadId);
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
    <div className="main_gradient_bg min-h-[calc(100vh-200px)]  mt-16 flex">
      {/* Sidebar */}
      <div className="w-80 glass-user-sidebar border-r border-pri p-4 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-4">チャット</h1>
          <button
            onClick={handleCreateThread}
            disabled={createThreadMutation.isPending}
            className="w-full bg-pri glass-card rounded-lg p-3 text-white hover:bg-opacity-80 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {createThreadMutation.isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Plus size={20} />
            )}
            新しいチャットルーム
          </button>
        </div>

        {/* Thread Selection */}
        <div className="mb-4">
          <p className="text-gray-400 text-sm mb-3">
            チャットルームを選択してください
          </p>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto space-y-2">
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
                  className={`glass-card rounded-lg p-4 cursor-pointer transition-all duration-300 hover:bg-opacity-80 ${
                    selectedThreadId === thread.id ? "border-brand-400" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-medium text-sm">
                      {thread.user_email || `スレッド ${thread.id}`}
                    </h3>
                    <span className="text-gray-400 text-xs">
                      {formatTimestamp(
                        lastMessage?.created_at || thread.created_at
                      )}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm truncate">
                    {lastMessage?.text || "新しいチャット"}
                  </p>
                  {unreadCount > 0 && (
                    <div className="flex justify-end mt-2">
                      <span className="bg-brand-500 text-white text-xs rounded-full px-2 py-1">
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
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="glass-card border-b border-pri p-4 m-4 mb-0 rounded-t-lg">
          <h2 className="text-xl font-bold text-white">
            {selectedThread?.user_email || "チャット"}
          </h2>
          <p className="text-gray-400 text-sm">
            最後の活動:{" "}
            {selectedThread?.created_at
              ? new Date(selectedThread.created_at).toLocaleString("ja-JP")
              : "不明"}
          </p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messagesLoading || threadLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="animate-spin text-white" size={24} />
            </div>
          ) : (
            currentThreadMessages.map((message: Message) => {
              const isSupport = message.sender_kind === "support";
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
                    isSupport ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md ${
                      isSupport ? "order-1" : "order-2"
                    }`}
                  >
                    {isSupport && (
                      <div className="text-xs text-gray-400 mb-1">サポート</div>
                    )}
                    <div
                      className={`glass-card rounded-lg p-3 ${
                        isSupport
                          ? "bg-glass-medium text-white"
                          : "bg-brand-500 text-white"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
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
              <div className="max-w-xs lg:max-w-md">
                <div className="glass-card bg-brand-500 rounded-lg p-3">
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
        <div className="p-4 mb-20">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="メッセージを入力してください..."
              className="flex-1 glass-input p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
              disabled={sendMessageMutation.isPending || !selectedThreadId}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage(e);
                }
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={
                !newMessage.trim() ||
                sendMessageMutation.isPending ||
                !selectedThreadId
              }
              className="bg-brand-500 cursor-pointer hover:bg-brand-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors duration-200 flex items-center justify-center min-w-[48px]"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 size={20} className="animate-spin " />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
