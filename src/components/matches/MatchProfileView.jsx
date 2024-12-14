import React from 'react';
import { Sheet, SheetContent } from '../ui/sheet';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { useDispatch } from 'react-redux';
import { unmatchProfile } from '../../store/slices/matchesSlice';
import useMediaQuery from '../../hooks/useMediaQuery';
import { X } from 'lucide-react';
import MatchProfile from './MatchProfile';
import MatchPhotos from './MatchPhotos';
import MatchInfo from './MatchInfo';
import MatchActions from './MatchActions';
import { useNavigate } from 'react-router-dom';

const MatchProfileView = ({ match, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery('(max-width: 768px)') ?? true;

  const handleUnmatch = () => {
    dispatch(unmatchProfile(match._id));
    onClose();
  };

  const handleClose = () => {
    onClose();
    navigate('/matches', { replace: true });
  };

  if (typeof isMobile !== 'boolean') return null;
  
  return isMobile ? (
      <Sheet 
        open={!!match} 
        onOpenChange={handleClose}
      >
        <SheetContent 
          side="bottom"
          className="h-[90vh] p-0"
          hideClose={true}
        >
          <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-6 py-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
            <MatchActions 
              onUnmatch={handleUnmatch} 
              isMobile={true}
            />
          </div>
          <MatchProfile 
            match={match}
            onClose={handleClose}
            showTopBar={false}
          />
        </SheetContent>
      </Sheet>
    ) : (
    <Dialog 
      open={!!match} 
      onOpenChange={handleClose}
      hideClose
    >
      <DialogContent className="max-w-6xl p-0 gap-0">
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-6 py-4 bg-background border-b border-border">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </Button>
          <MatchActions onUnmatch={handleUnmatch} />
        </div>

        <div className="flex h-[85vh] pt-14">
          <div className="w-1/2 relative border-r border-border">
            <MatchPhotos match={match} />
          </div>
          
          <div className="w-1/2">
            <MatchInfo 
              match={match} 
              onClose={handleClose}
              showTopBar={false}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchProfileView;