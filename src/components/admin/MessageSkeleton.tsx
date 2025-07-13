const MessageSkeleton = ({ isOwnMessage = true, showAvatar = true }) => {
  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4`}
    >
      {/* Avatar for other users */}
      {!isOwnMessage && showAvatar && (
        <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse mr-3 flex-shrink-0"></div>
      )}

      {/* Message bubble */}
      <div
        className={`w-[200px] lg:w-[300px] px-4 py-2 rounded-lg ${
          isOwnMessage ? "glass text-white" : "bg-gray-700 text-white"
        } relative`}
      >
        {/* Message content skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-400 bg-opacity-30 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-400 bg-opacity-30 rounded animate-pulse w-3/4"></div>
        </div>

        {/* Time skeleton */}
        <div className="mt-2 flex justify-end">
          <div className="h-3 w-8 bg-gray-400 bg-opacity-30 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Avatar for own messages */}
      {isOwnMessage && showAvatar && (
        <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse ml-3 flex-shrink-0"></div>
      )}
    </div>
  );
};
export default MessageSkeleton;
