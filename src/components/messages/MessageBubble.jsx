import { formatDistanceToNow } from 'date-fns';
import { useSelector } from 'react-redux';
import { CheckIcon } from 'lucide-react';

const MessageBubble = ({ message }) => {
  const currentProfile = useSelector(state => state.profile.profile);
  const isSender = message.senderId === currentProfile._id;

  const renderMessageStatus = () => {
    if (isSender) {
      switch (message.status) {
        case 'sending':
          return <span className="text-gray-400">•</span>;
        case 'sent':
          return <CheckIcon className="h-3 w-3 text-gray-400" />;
        case 'delivered':
          return <div className="flex"><CheckIcon className="h-3 w-3 text-gray-400" /><CheckIcon className="h-3 w-3 -ml-1 text-gray-400" /></div>;
        case 'read':
          return <div className="flex"><CheckIcon className="h-3 w-3 text-spotify-green" /><CheckIcon className="h-3 w-3 -ml-1 text-spotify-green" /></div>;
        default:
          return null;
      }
    }
    return null;
  };

  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl
          ${isSender 
            ? 'bg-spotify-green text-white' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'}`}
      >
        <p className="break-words whitespace-pre-wrap">{message.content}</p>
        <div className={`flex items-center gap-1 text-xs mt-1 
          ${isSender 
            ? 'text-white/70' 
            : 'text-gray-500 dark:text-gray-400'}`}
        >
          <span>
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
          {renderMessageStatus()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;