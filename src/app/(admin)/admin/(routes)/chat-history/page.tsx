"use client";
import {
  Menu,
  X,
  Search,
  MessageCircle,
  AlertCircle,
  Send,
  Loader2,
  User,
  Shield,
} from "lucide-react";
import Button from "@/components/admin/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { useChatQueries } from "@/hooks/chat/useChatQueries";

import React, {
  useState,
  ChangeEvent,
  FormEvent,
  FC,
  useMemo,
  useEffect,
  useRef,
} from "react";

interface ChatThread {
  id: number;
  user_email: string;
  created_at: string;
  messages: ChatMessage[];
}

interface ChatMessage {
  id: number;
  thread: number;
  sender_email: string;
  sender_kind: "END_USER" | "SUPER_ADMIN";
  text: string;
  created_at: string;
  is_read: boolean;
}

const MainComponent: FC = () => {
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [messageText, setMessageText] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { useThreads, useSendMessage } = useChatQueries();
  const {
    data: threadsData,
    isLoading,
    error,
    refetch,
  } = useThreads(currentPage);
  const sendMessageMutation = useSendMessage();

  const threads = threadsData?.results || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [selectedThread?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Filter threads based on search term
  const filteredThreads = useMemo(() => {
    if (!searchTerm) return threads;

    return threads.filter(
      (thread: ChatThread) =>
        thread.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.id.toString().includes(searchTerm)
    );
  }, [threads, searchTerm]);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!messageText.trim() || !selectedThread || isSending) return;

    setIsSending(true);

    try {
      const newMessage = await sendMessageMutation.mutateAsync({
        thread: selectedThread.id,
        text: messageText.trim(),
        sender_kind: "SUPER_ADMIN",
      });

      // Update the selected thread with the new message
      const updatedThread = {
        ...selectedThread,
        messages: [
          ...selectedThread.messages,
          {
            id: newMessage.id || Date.now(), // fallback ID
            thread: selectedThread.id,
            sender_email: "admin@system.com", // or get from auth context
            sender_kind: "SUPER_ADMIN" as const,
            text: messageText.trim(),
            created_at: new Date().toISOString(),
            is_read: true,
          },
        ],
      };

      setSelectedThread(updatedThread);
      setMessageText("");

      // Refetch threads to update the sidebar
      refetch();

      // Close mobile menu after sending
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleThreadSelect = (thread: ChatThread) => {
    setSelectedThread(thread);
    setIsMobileMenuOpen(false); // Close mobile menu when selecting thread
  };

  const getLastMessageTime = (thread: ChatThread) => {
    if (thread.messages.length === 0) return thread.created_at;
    const lastMessage = thread.messages[thread.messages.length - 1];
    return lastMessage.created_at;
  };

  const getUnreadCount = (thread: ChatThread) => {
    return thread.messages.filter(
      (msg) => !msg.is_read && msg.sender_kind === "END_USER"
    ).length;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP");
  };

  const formatTimeOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getUserInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen mt-10 lg:mt-0 bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
        fixed md:relative
        w-80 lg:w-96 
        h-full
        bg-white 
        border-r border-gray-200 
        flex flex-col
        z-40
        transition-transform duration-300 ease-in-out
      `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <Breadcrumbs
                items={[{ label: "チャット履歴", href: "/admin/chat-history" }]}
                homeHref="/admin"
              />
            </div>
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <h1 className="text-lg font-semibold text-gray-900 mb-4">
            チャット履歴管理
          </h1>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                placeholder="ユーザー検索..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </form>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-600">読み込み中...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
                <p className="text-sm text-gray-600">エラーが発生しました</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredThreads.map((thread: ChatThread) => {
                const unreadCount = getUnreadCount(thread);
                const lastMessageTime = getLastMessageTime(thread);
                const isSelected = selectedThread?.id === thread.id;
                const lastMessage = thread.messages[thread.messages.length - 1];

                return (
                  <button
                    key={thread.id}
                    onClick={() => handleThreadSelect(thread)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors duration-150 ${
                      isSelected ? "bg-blue-50 border-r-2 border-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Avatar */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white ${
                          isSelected ? "bg-blue-500" : "bg-gray-400"
                        }`}
                      >
                        {getUserInitials(thread.user_email)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {thread.user_email.split("@")[0]}
                          </p>
                          <div className="flex items-center space-x-2">
                            {unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[18px] text-center">
                                {unreadCount}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {isToday(lastMessageTime)
                                ? formatTimeOnly(lastMessageTime)
                                : formatDate(lastMessageTime)}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          {thread.user_email}
                        </p>

                        {lastMessage && (
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {lastMessage.sender_kind === "SUPER_ADMIN"
                              ? "あなた: "
                              : ""}
                            {lastMessage.text}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredThreads.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    {searchTerm
                      ? "検索結果が見つかりません"
                      : "チャットスレッドがありません"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {threadsData && threadsData.count > 0 && (
          <div className="border-t border-gray-200 px-4 py-3 bg-white">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                総数: <span className="font-medium">{threadsData.count}</span>
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={!threadsData.previous}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={!threadsData.next}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white md:ml-0">
        {selectedThread ? (
          <>
            {/* Chat Header */}
            <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 md:w-10 h-8 md:h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {getUserInitials(selectedThread.user_email)}
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-gray-900">
                      {selectedThread.user_email.split("@")[0]}
                    </h2>
                    <p className="text-xs md:text-sm text-gray-500">
                      {selectedThread.user_email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 md:space-x-4 text-xs md:text-sm text-gray-500">
                    <span className="hidden sm:inline">
                      スレッドID: {selectedThread.id}
                    </span>
                    <span>メッセージ: {selectedThread.messages.length}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 hidden md:block">
                    開始: {formatDateTime(selectedThread.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
              {selectedThread.messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 md:w-16 h-12 md:h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">まだメッセージがありません</p>
                  <p className="text-sm text-gray-400 mt-2">
                    最初のメッセージを送信してください
                  </p>
                </div>
              ) : (
                selectedThread.messages.map((message, index) => {
                  const isAdmin = message.sender_kind === "SUPER_ADMIN";
                  const showAvatar =
                    index === 0 ||
                    selectedThread.messages[index - 1].sender_kind !==
                      message.sender_kind;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isAdmin ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex max-w-[85%] sm:max-w-xs lg:max-w-md xl:max-w-lg ${
                          isAdmin ? "flex-row-reverse" : "flex-row"
                        } items-end space-x-2`}
                      >
                        {/* Avatar */}
                        {showAvatar && (
                          <div
                            className={`flex-shrink-0 w-6 md:w-8 h-6 md:h-8 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                              isAdmin ? "bg-blue-500 ml-2" : "bg-gray-400 mr-2"
                            }`}
                          >
                            {isAdmin ? (
                              <Shield className="w-3 md:w-4 h-3 md:h-4" />
                            ) : (
                              <User className="w-3 md:w-4 h-3 md:h-4" />
                            )}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`px-3 md:px-4 py-2 rounded-2xl ${
                            isAdmin
                              ? "bg-blue-500 text-white rounded-br-md"
                              : "bg-gray-100 text-gray-900 rounded-bl-md"
                          } ${
                            !showAvatar
                              ? isAdmin
                                ? "mr-8 md:mr-10"
                                : "ml-8 md:ml-10"
                              : ""
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.text}
                          </p>

                          {/* Message Info */}
                          <div
                            className={`flex items-center mt-1 space-x-2 ${
                              isAdmin ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span
                              className={`text-xs ${
                                isAdmin ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {formatTimeOnly(message.created_at)}
                            </span>
                            {/* Removed unread indicator for user messages */}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 px-4 md:px-6 py-4 bg-white">
              <form
                onSubmit={handleSendMessage}
                className="flex items-end space-x-2 md:space-x-4"
              >
                <div className="flex-1">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="メッセージを入力..."
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                    rows={1}
                    disabled={isSending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (messageText.trim()) {
                          handleSendMessage(e as any);
                        }
                      }
                    }}
                    style={{ minHeight: "40px", maxHeight: "120px" }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      Enter で送信 • Shift+Enter で改行
                    </p>
                    <p className="text-xs text-gray-400">
                      {messageText.length}/1000
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!messageText.trim() || isSending}
                  className="flex items-center justify-center w-10 md:w-12 h-10 md:h-12 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isSending ? (
                    <Loader2 className="w-4 md:w-5 h-4 md:h-5 animate-spin" />
                  ) : (
                    <Send className="w-4 md:w-5 h-4 md:h-5" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center px-4">
              <MessageCircle className="w-16 md:w-20 h-16 md:h-20 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                チャットを選択
              </h3>
              <p className="text-gray-500 text-sm md:text-base">
                左側のリストからチャットスレッドを選択してください
              </p>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                チャットリストを表示
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainComponent;
