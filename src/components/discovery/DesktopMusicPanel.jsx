import React from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Music2, Sparkles, Disc, BarChart3 } from 'lucide-react';
import { 
  MusicDimensionsChart, 
  GenreDistribution, 
  AudioFeatures 
} from './MusicVisualization';

const DesktopMusicPanel = ({ profile }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Music2 className="w-5 h-5 text-spotify-green" />
          Music Profile
        </h2>
      </div>

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
                  {Math.round(profile.compatibilityScore * 100)}%
                </div>
              </div>

              {/* Music Selection */}
              <div className="rounded-lg bg-background p-4">
                <h3 className="font-semibold mb-2">Music Selection</h3>
                <p className="text-sm text-muted-foreground">
                  Based on their {profile.music.sourceType === 'playlist' ? 'playlist' : 'top tracks'}
                </p>
              </div>

              {/* Music Dimensions */}
              <div className="rounded-lg bg-background p-4">
                <h3 className="font-semibold mb-4">Music Style</h3>
                <MusicDimensionsChart 
                  dimensions={profile.music.analysis.musicDimensions} 
                />
              </div>

              {/* Preview of Top Genres */}
              <div className="rounded-lg bg-background p-4">
                <h3 className="font-semibold mb-4">Top Genres</h3>
                <div className="flex gap-2 flex-wrap">
                  {Array.from(profile.music.analysis.genreDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([genre]) => (
                      <span 
                        key={genre}
                        className="px-3 py-1 bg-background-highlight rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))
                  }
                </div>
              </div>
            </TabsContent>

            <TabsContent value="genres" className="space-y-6">
              <div className="rounded-lg bg-background p-4">
                <h3 className="font-semibold mb-4">Genre Distribution</h3>
                <GenreDistribution 
                  genres={profile.music.analysis.genreDistribution} 
                />
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
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

export default DesktopMusicPanel;