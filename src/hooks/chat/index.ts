// Add this to your useChatQueries hook file

import { useMutation } from "@tanstack/react-query";

// Add this interface if not already defined
interface MarkAllReadResponse {
  message: string;
  thread_id: number;
  marked_count: number;
}

// Add this function to your API service file or within useChatQueries
const markAllReadAPI = async (
  threadId: number
): Promise<MarkAllReadResponse> => {
  const token = localStorage.getItem("accessToken"); // Or however you get your auth token

  const response = await fetch(`/api/chat/threads/${threadId}/mark_all_read/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      // Add CSRF token if needed
      // 'X-CSRFTOKEN': getCsrfToken(),
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Failed to mark messages as read: ${response.statusText}`);
  }

  return response.json();
};

// Add this hook to your useChatQueries
export const useMarkAllRead = () => {
  return useMutation({
    mutationFn: markAllReadAPI,
    onSuccess: (data) => {
      console.log(
        `Marked ${data.marked_count} messages as read for thread ${data.thread_id}`
      );
    },
    onError: (error) => {
      console.error("Error marking messages as read:", error);
    },
  });
};

// Update your main useChatQueries function to include the new hook
export const useChatQueries = () => {
  return {
    useMarkAllRead, // Add this line
  };
};
