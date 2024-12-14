import React, { useState } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Sheet, SheetContent } from '../ui/sheet';
import { Button } from '../ui/button';
import { MoreVertical } from 'lucide-react';

const MatchActions = ({ onUnmatch, isMobile = false }) => {
  const [showUnmatchAlert, setShowUnmatchAlert] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className={
              isMobile && "bg-background/20 hover:bg-background/40 text-white"
            }
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end"
          className="z-[60] bg-background"
        >
          <DropdownMenuItem 
            onSelect={() => setShowUnmatchAlert(true)}
            className="text-destructive focus:text-destructive cursor-pointer hover:bg-accent"
          >
            Unmatch
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showUnmatchAlert} onOpenChange={setShowUnmatchAlert}>
        <AlertDialogContent className="z-[70]">
          <AlertDialogHeader>
            <AlertDialogTitle>Unmatch with this person?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove them from your matches and delete your conversation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onUnmatch();
                setShowUnmatchAlert(false);
              }}
              variant="destructive"
            >
              Unmatch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MatchActions;