import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendMessage } from '../../store/slices/messagesSlice';
import { Button } from '../ui/button';
import { SendHorizontal } from 'lucide-react';
import useMediaQuery from '../../hooks/useMediaQuery';

const ChatInput = ({ matchId, roomId }) => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const currentProfile = useSelector(state => state.profile.profile);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !roomId || isSending) return;

    try {
      setIsSending(true);
      // Send message with matchId for routing and roomId for socket rooms
      await dispatch(sendMessage({ 
        content: trimmedMessage,
        matchId,
        roomId,
        senderId: currentProfile._id
      })).unwrap();
      
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      // Could add toast notification here for error
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="flex items-center gap-3 max-w-screen-md mx-auto"
    >
      <div className="relative flex-1">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={isSending}
          className="w-full bg-white dark:bg-gray-800 rounded-full px-4 py-3
                    focus:outline-none
                    text-gray-900 dark:text-white placeholder:text-gray-500
                    border-none
                    disabled:opacity-50 disabled:cursor-not-allowed
                    resize-none" // Prevent resizing
          style={{ 
            minHeight: '44px',
            maxHeight: '100px'
          }}
        />
      </div>

      <Button 
        type="submit" 
        size={isMobile ? "default" : "lg"}
        disabled={!message.trim() || !roomId || isSending}
        className="flex-none rounded-full aspect-square p-0"
        style={{ 
          width: isMobile ? '44px' : '48px',
          height: isMobile ? '44px' : '48px'
        }}
      >
        <SendHorizontal className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
      </Button>
    </form>
  );
};

export default ChatInput;