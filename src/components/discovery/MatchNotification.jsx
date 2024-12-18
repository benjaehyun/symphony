import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent } from '../ui/sheet';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { MessageCircle, X, Music2 } from 'lucide-react';
import useMediaQuery from '../../hooks/useMediaQuery';
import { selectProfile } from '../../store/slices/profileSlice';
import { useSelector } from 'react-redux';

const MatchContent = ({ match, onClose, onMessage }) => {
  const navigate = useNavigate();
  const profile = useSelector(selectProfile)

  const handleViewProfile = () => {
    navigate(`/matches/${match._id}`);
    onClose();
  };
  
  return (
    <Card className="bg-background border-0 shadow-none">
      <CardContent className="p-6 flex flex-col items-center">
        {/* Close Button */}
        <div className="w-full flex justify-end mb-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Match Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">It's a Match!</h2>
          <p className="text-muted-foreground">
            You and {match?.name} both liked each other
          </p>
        </div>

        {/* Profile Pictures */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-background-elevated">
              <AvatarImage src={profile?.photos?.[0]?.url} alt="Your profile" />
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background-elevated 
                          px-2 py-1 rounded-full text-xs text-muted-foreground">
              You
            </div>
          </div>
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-background-elevated">
              <AvatarImage src={match?.photos?.[0]?.url} alt={match?.name} />
              <AvatarFallback>{match?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background-elevated 
                          px-2 py-1 rounded-full text-xs text-muted-foreground">
              {match?.name}
            </div>
          </div>
        </div>

        {/* Music Info */}
        <div className="flex items-center gap-2 text-muted-foreground mb-8">
          <Music2 className="w-4 h-4" />
          <span className="text-sm">
            {match?.music?.sourceType === 'playlist' ? 'Playlist' : 'Top Tracks'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <Button 
            className="w-full"
            onClick={onMessage}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Send Message
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleViewProfile}
          >
            View Profile
          </Button>
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={onClose}
          >
            Keep Swiping
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const MatchNotification = ({ isOpen, onClose, match }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const navigate = useNavigate();

  const handleMessage = () => {
    navigate(`/messages/${match.matchId}`);
    onClose();
  };

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="bottom" 
          className="h-[90vh] sm:h-[85vh] bg-background p-0"
          hideClose
        >
          <MatchContent 
            match={match} 
            onClose={onClose} 
            onMessage={handleMessage}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 bg-background" hideClose>
        <MatchContent 
          match={match} 
          onClose={onClose} 
          onMessage={handleMessage}
        />
      </DialogContent>
    </Dialog>
  );
};

export default MatchNotification;