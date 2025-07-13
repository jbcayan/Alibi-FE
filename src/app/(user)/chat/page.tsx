"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  Check,
  X,
  MoreVertical,
  ArrowLeft,
  Menu,
} from "lucide-react";
import { useChatQueries } from "@/hooks/chat/useChatQueries";
import {
  CreateMessageRequest,
  Message,
  Thread,
  UpdateMessageRequest,
} from "@/infrastructure/admin/chat/utils/types";
import { motion, AnimatePresence } from "framer-motion";
import MessageSkeleton from "@/components/admin/MessageSkeleton";

const ThreadSkeleton = () => (
  <div className="glass-card rounded-lg p-3 sm:p-4 animate-pulse border border-gray-600">
    <div className="flex justify-between items-start mb-2">
      <div className="h-3 sm:h-4 bg-gray-600 rounded w-2/3"></div>
      <div className="h-2 sm:h-3 bg-gray-600 rounded w-1/4"></div>
    </div>
    <div className="h-2 sm:h-3 bg-gray-600 rounded w-full"></div>
  </div>
);

const Chat = () => {
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showDropdown, setShowDropdown] = useState<{
    messageId: number;
    top: number;
    right: number;
  } | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat hooks
  const {
    useThreads,
    useThread,
    useMessages,
    useSendMessage,
    useCreateThread,
    useMarkAllRead,
    useUpdateMessage,
    useDeleteMessage,
  } = useChatQueries();

  const {
    data: threadsData,
    isLoading: threadsLoading,
    error: threadsError,
  } = useThreads(currentPage);

  const { data: selectedThread, isLoading: threadLoading } = useThread(
    selectedThreadId!,
    { enabled: !!selectedThreadId }
  );

  const { data: messagesData, isLoading: messagesLoading } = useMessages(
    1,
    50,
    { enabled: !!selectedThreadId }
  );

  const sendMessageMutation = useSendMessage();
  const createThreadMutation = useCreateThread();
  const markAllReadMutation = useMarkAllRead();
  const updateMessageMutation = useUpdateMessage();
  const deleteMessageMutation = useDeleteMessage();

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setShowSidebar(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesData?.results?.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesData?.results?.length]);

  // Set initial thread
  useEffect(() => {
    if (threadsData?.results?.length > 0 && selectedThreadId === null) {
      setSelectedThreadId(threadsData.results[0].id);
    }
  }, [threadsData?.results, selectedThreadId]);

  // Close sidebar when thread is selected on mobile
  useEffect(() => {
    if (isMobile && selectedThreadId) {
      setShowSidebar(false);
    }
  }, [selectedThreadId, isMobile]);

  // Dropdown close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isDropdownButton = target.closest("[data-dropdown-trigger]");
      const isDropdownMenu = target.closest("[data-dropdown-menu]");

      if (!isDropdownButton && !isDropdownMenu) {
        setShowDropdown(null);
      }
    };

    if (showDropdown !== null) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => document.removeEventListener("click", handleClickOutside);
  }, [showDropdown]);

  // Close sidebar on outside click (mobile)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const sidebar = document.getElementById("sidebar");
      const menuButton = document.getElementById("menu-button");

      if (
        showSidebar &&
        sidebar &&
        !sidebar.contains(target) &&
        !menuButton?.contains(target)
      ) {
        setShowSidebar(false);
      }
    };

    if (showSidebar && isMobile) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => document.removeEventListener("click", handleClickOutside);
  }, [showSidebar, isMobile]);

  // Send message
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

  // Thread select
  const handleThreadSelect = (threadId: number) => {
    if (selectedThreadId !== threadId) {
      setSelectedThreadId(threadId);
      setEditingMessageId(null);
      setShowDropdown(null);
      markAllReadMutation.mutate(threadId);
    }
  };

  // Create thread
  const handleCreateThread = async () => {
    try {
      const newThreadData = {
        thread: 0,
        sender_email: "user@example.com",
        sender_kind: "user",
        text: "新しいチャットを開始します",
      };
      await createThreadMutation.mutateAsync(newThreadData);
    } catch (error) {
      console.error("Failed to create thread:", error);
    }
  };

  // Edit message
  const handleStartEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingText(message.text);
    setShowDropdown(null);
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingText.trim()) return;
    const updateData: UpdateMessageRequest = { text: editingText.trim() };
    try {
      await updateMessageMutation.mutateAsync({
        messageId: editingMessageId,
        updateData,
      });
      setEditingMessageId(null);
      setEditingText("");
    } catch (error) {
      console.error("Failed to update message:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  // Delete message
  const handleDeleteMessage = async (messageId: number) => {
    if (window.confirm("このメッセージを削除しますか？")) {
      try {
        await deleteMessageMutation.mutateAsync(messageId);
        setShowDropdown(null);
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    }
  };

  // Dropdown toggle
  const handleDropdownToggle = (messageId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDropdown?.messageId === messageId) {
      setShowDropdown(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setShowDropdown({
        messageId: messageId,
        top: rect.bottom + window.scrollY,
        right: window.innerWidth - rect.right,
      });
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

  const currentThreadMessages = messagesData?.results || [];
  const canEditMessage = (message: Message) =>
    message.sender_kind === "END_USER";

  if (threadsError) {
    return (
      <div className="main_gradient_bg min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-6 sm:p-8 rounded-lg text-center max-w-md w-full">
          <p className="text-red-400 mb-4 text-sm sm:text-base">
            エラーが発生しました
          </p>
          <p className="text-gray-300 text-sm sm:text-base">
            チャットデータを読み込めませんでした
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="main_gradient_bg pt-16  h-screen flex flex-col lg:flex-row overflow-hidden relative">
      {/* Mobile Overlay */}
      {isMobile && showSidebar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" />
      )}

      {/* Sidebar */}
      <div
        id="sidebar"
        className={`
          ${isMobile ? "fixed" : "relative"} 
          ${isMobile && !showSidebar ? "-translate-x-full" : "translate-x-0"}
          ${isMobile ? "w-80 max-w-[85vw]" : "w-full lg:w-80"}
          glass-user-sidebar border-r border-pri flex flex-col h-full 
          ${isMobile ? "z-50" : ""} 
          transition-transform duration-300 ease-in-out
          ${isMobile ? "left-0 top-0" : ""}
        `}
      >
        {/* Fixed Header */}
        <div className="p-3 sm:p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
              チャット
            </h1>
            {isMobile && (
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
          <button
            onClick={handleCreateThread}
            disabled={createThreadMutation.isPending}
            className="w-full bg-pri glass-card rounded-lg p-2.5 sm:p-3 text-white hover:bg-opacity-80 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
          >
            {createThreadMutation.isPending ? (
              <Loader2 size={16} className="animate-spin sm:w-5 sm:h-5" />
            ) : (
              <Plus size={16} className="sm:w-5 sm:h-5" />
            )}
            新しいチャットルーム
          </button>
        </div>

        {/* Fixed Thread Selection Header */}
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 flex-shrink-0">
          <p className="text-gray-400 text-xs sm:text-sm">
            チャットルームを選択してください
          </p>
        </div>

        {/* Scrollable Threads List */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 min-h-0">
          {threadsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <ThreadSkeleton key={i} />
              ))}
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
                  className={`glass-card rounded-lg p-3 sm:p-4 cursor-pointer transition-all duration-300 hover:bg-opacity-80 ${
                    selectedThreadId === thread.id
                      ? "border-2 border-brand-400 bg-brand-500 bg-opacity-20"
                      : "border border-gray-600"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1 sm:mb-2">
                    <h3 className="text-white font-medium text-xs sm:text-sm lg:text-base truncate pr-2 flex-1">
                      {thread.user_email || `スレッド ${thread.id}`}
                    </h3>
                    <span className="text-gray-400 text-xs flex-shrink-0">
                      {formatTimestamp(
                        lastMessage?.created_at || thread.created_at
                      )}
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs sm:text-sm truncate">
                    {lastMessage?.text || "新しいチャット"}
                  </p>
                  {unreadCount > 0 && (
                    <div className="flex justify-start mt-1 sm:mt-2">
                      <span className="bg-brand-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.5rem] text-center">
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
      <div className="flex-1 flex flex-col h-full min-h-0">
        {/* Fixed Chat Header */}
        <div className="glass-card border-b border-pri p-3 sm:p-4 m-2 sm:m-3 lg:m-4 mb-0 rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                id="menu-button"
                onClick={() => setShowSidebar(true)}
                className="p-1 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white truncate">
                {selectedThread?.user_email || "チャット"}
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm truncate">
                最後の活動:{" "}
                {selectedThread?.created_at
                  ? new Date(selectedThread.created_at).toLocaleString("ja-JP")
                  : "不明"}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 space-y-3 sm:space-y-4 min-h-0 pb-2">
          {messagesLoading || threadLoading ? (
            <div className="space-y-4 sm:space-y-6">
              {[...Array(5)].map((_, i) => (
                <MessageSkeleton key={i} />
              ))}
            </div>
          ) : (
            <AnimatePresence>
              {currentThreadMessages.map((message: Message) => {
                const isAdmin = message.sender_kind === "SUPER_ADMIN";
                const isSupport = message.sender_kind === "support";
                const isEndUser = message.sender_kind === "END_USER";
                const isEditing = editingMessageId === message.id;
                const canEdit = canEditMessage(message);
                const timestamp = new Date(
                  message.created_at
                ).toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <motion.div
                    key={message.id}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    transition={{ type: "spring", duration: 0.3 }}
                    className={`flex ${
                      isAdmin || isSupport ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`
                        max-w-[85%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%] xl:max-w-[50%]
                        relative ${isAdmin || isSupport ? "order-1" : "order-2"}
                      `}
                    >
                      {(isAdmin || isSupport) && (
                        <div className="text-xs text-gray-400 mb-1 px-1">
                          {isAdmin ? "管理者" : "サポート"}
                        </div>
                      )}
                      <div
                        className={`glass-card rounded-lg p-2.5 sm:p-3 ${
                          isAdmin
                            ? "bg-green-600 bg-opacity-80 text-white"
                            : isSupport
                            ? "bg-glass-medium text-white"
                            : "bg-brand-500 text-white"
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full bg-transparent border border-gray-300 rounded p-2 text-xs sm:text-sm resize-none min-h-[60px]"
                              rows={3}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEdit();
                                }
                                if (e.key === "Escape") {
                                  handleCancelEdit();
                                }
                              }}
                              autoFocus
                            />
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={handleSaveEdit}
                                disabled={updateMessageMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-xs flex items-center gap-1 disabled:opacity-50"
                              >
                                {updateMessageMutation.isPending ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Check size={12} />
                                )}
                                保存
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="bg-gray-600 hover:bg-gray-700 px-3 py-1.5 rounded text-xs flex items-center gap-1"
                              >
                                <X size={12} />
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start gap-2">
                              <p className="text-xs sm:text-sm break-words flex-1 leading-relaxed">
                                {message.text}
                              </p>
                              {canEdit && (
                                <div className="relative flex-shrink-0">
                                  <button
                                    data-dropdown-trigger
                                    onClick={(e) =>
                                      handleDropdownToggle(message.id, e)
                                    }
                                    className="text-gray-300 hover:text-white p-1 rounded transition-colors"
                                  >
                                    <MoreVertical size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-300 mt-1.5 sm:mt-2">
                              {timestamp}
                              {message.updated_at &&
                                message.updated_at !== message.created_at && (
                                  <span className="text-gray-400 ml-1">
                                    (編集済み)
                                  </span>
                                )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          {sendMessageMutation.isPending && (
            <div className="flex justify-end">
              <div className="max-w-[85%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%] xl:max-w-[50%]">
                <div className="glass-card bg-brand-500 rounded-lg p-2.5 sm:p-3">
                  <div className="flex space-x-1 justify-center">
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

        {/* Dropdown Menu */}
        {showDropdown && (
          <div
            data-dropdown-menu
            className="fixed bg-gray-800 rounded-lg shadow-lg z-[9999] min-w-[120px] border border-gray-700"
            style={{
              top: `${showDropdown.top}px`,
              right: `${showDropdown.right}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                const message = currentThreadMessages.find(
                  (m) => m.id === showDropdown.messageId
                );
                if (message) handleStartEdit(message);
              }}
              className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-700 flex items-center gap-2 text-white border-b border-gray-700"
            >
              <Edit2 size={14} />
              編集
            </button>
            <button
              onClick={() => handleDeleteMessage(showDropdown.messageId)}
              disabled={deleteMessageMutation.isPending}
              className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-700 flex items-center gap-2 text-red-400 disabled:opacity-50"
            >
              {deleteMessageMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              削除
            </button>
          </div>
        )}

        {/* Fixed Message Input */}
        <div className="p-3 sm:p-4 lg:p-6 flex-shrink-0 bg-transparent">
          <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="メッセージを入力してください..."
              className="flex-1 glass-input p-2.5 sm:p-3 lg:p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm sm:text-base transition-all duration-200"
              disabled={sendMessageMutation.isPending || !selectedThreadId}
            />
            <button
              type="submit"
              disabled={
                !newMessage.trim() ||
                sendMessageMutation.isPending ||
                !selectedThreadId
              }
              className="bg-brand-500 hover:bg-brand-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2.5 sm:p-3 lg:p-4 rounded-lg transition-all duration-200 flex items-center justify-center min-w-[44px] sm:min-w-[48px] lg:min-w-[52px]"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 size={16} className="animate-spin sm:w-5 sm:h-5" />
              ) : (
                <Send size={16} className="sm:w-5 sm:h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
