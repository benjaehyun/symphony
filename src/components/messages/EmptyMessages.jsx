import { Music2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

const EmptyMessages = () => {
 const navigate = useNavigate();

 return (
   <div className="flex flex-col items-center justify-center h-full text-center p-4">
     <div className="w-16 h-16 mb-6 rounded-full bg-background-elevated flex items-center justify-center">
       <Music2 className="w-8 h-8 text-muted-foreground" />
     </div>
     <h2 className="text-xl font-semibold mb-2">No Matches Yet</h2>
     <p className="text-muted-foreground mb-6">
       Start discovering profiles to find your musical matches
     </p>
     <Button onClick={() => navigate('/discover')}>
       Discover Matches
     </Button>
   </div>
 );
};

export default EmptyMessages;