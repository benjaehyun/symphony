const TypingIndicator = ({ isTyping }) => {
    if (!isTyping) return null;
   
    return (
      <div className="flex items-center gap-1 px-4 py-2">
        <span className="text-xs text-muted-foreground">typing</span>
        <div className="flex gap-0.5">
          <span className="w-1 h-1 rounded-full bg-spotify-green animate-bounce" />
          <span className="w-1 h-1 rounded-full bg-spotify-green animate-bounce delay-75" />
          <span className="w-1 h-1 rounded-full bg-spotify-green animate-bounce delay-150" />
        </div>
      </div>
    );
   };
   
   export default TypingIndicator;