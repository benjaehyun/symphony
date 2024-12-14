import { MessageSquare } from 'lucide-react';

const EmptyChat = () => (
 <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-background">
   <div className="w-16 h-16 mb-6 rounded-full bg-background-elevated flex items-center justify-center">
     <MessageSquare className="w-8 h-8 text-muted-foreground" />
   </div>
   <h2 className="text-xl font-semibold mb-2">Select a Conversation</h2>
   <p className="text-muted-foreground">
     Choose a match to start chatting
   </p>
 </div>
);

export default EmptyChat;