import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  X, Music2, MessageCircle, MoreVertical, 
  Sparkles, Disc, BarChart3 
} from 'lucide-react';
import { 
  MusicDimensionsChart, 
  GenreDistribution, 
  AudioFeatures 
} from '../discovery/MusicVisualization';

const MatchInfo = ({ match, onClose, onUnmatch, showTopBar = true }) => {
  const navigate = useNavigate();
  const profile = match.matchedProfile;

  const handleMessage = () => {
    navigate(`/messages/${match._id}`);
    // onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar - Only show in mobile */}
      {showTopBar && (
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onUnmatch}
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Actions Bar */}
      <div className="px-6 py-4 border-b border-border">
        <Button 
          className="w-full"
          onClick={handleMessage}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Message
        </Button>
      </div>

      {/* Music Profile Section */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="overview" className="flex-1">
                <Sparkles className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="genres" className="flex-1">
                <Disc className="w-4 h-4 mr-2" />
                Genres
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex-1">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Compatibility Score */}
              <div className="rounded-lg bg-background p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-spotify-green" />
                  <h3 className="font-semibold">Music Match</h3>
                </div>
                <div className="text-3xl font-bold text-spotify-green">
                  {Math.round(match.compatibilityScore * 100)}%
                </div>
              </div>

              {/* Music Style */}
              <div className="rounded-lg bg-background p-4">
                <h3 className="font-semibold mb-4">Music Style</h3>
                <MusicDimensionsChart 
                  dimensions={profile.music.analysis.musicDimensions} 
                />
              </div>
            </TabsContent>

            <TabsContent value="genres">
              <div className="rounded-lg bg-background p-4">
                <h3 className="font-semibold mb-4">Top Genres</h3>
                <GenreDistribution 
                  genres={profile.music.analysis.genreDistribution} 
                />
              </div>
            </TabsContent>

            <TabsContent value="analysis">
              <div className="rounded-lg bg-background p-4">
                <h3 className="font-semibold mb-4">Audio Features</h3>
                <AudioFeatures 
                  features={profile.music.analysis.averageFeatures} 
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};

export default MatchInfo;