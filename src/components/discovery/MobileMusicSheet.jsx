import React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '../ui/sheet';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Music2, Sparkles } from 'lucide-react';
import { 
  MusicDimensionsChart, 
  GenreDistribution, 
  AudioFeatures 
} from './MusicVisualization';

const MobileMusicSheet = ({ profile, isOpen, onOpenChange }) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] px-0">
        <SheetHeader className="px-6">
          <SheetTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-spotify-green" />
            Music Profile
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-full mt-4">
          <div className="px-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="genres">Genres</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-4">
                {/* Compatibility Score */}
                <div className="rounded-lg bg-background p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-spotify-green" />
                    <h3 className="font-semibold">Music Match</h3>
                  </div>
                  <div className="text-3xl font-bold text-spotify-green">
                    {Math.round(profile.compatibilityScore * 100)}%
                  </div>
                </div>

                {/* Music Dimensions */}
                <div className="rounded-lg bg-background p-4">
                  <h3 className="font-semibold mb-4">Music Style</h3>
                  <MusicDimensionsChart 
                    dimensions={profile.music.analysis.musicDimensions} 
                  />
                </div>
              </TabsContent>

              <TabsContent value="genres" className="mt-4">
                <div className="rounded-lg bg-background p-4">
                  <h3 className="font-semibold mb-4">Top Genres</h3>
                  <GenreDistribution 
                    genres={profile.music.analysis.genreDistribution} 
                  />
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="mt-4">
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
      </SheetContent>
    </Sheet>
  );
};

export default MobileMusicSheet;