import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { 
  X, Music2, MessageCircle, MoreVertical, 
  Sparkles, Disc, BarChart3 
} from 'lucide-react';
import { 
  MusicDimensionsChart, 
  GenreDistribution, 
  AudioFeatures 
} from '../discovery/MusicVisualization';

const MatchProfile = ({ match, onClose, onUnmatch }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const navigate = useNavigate();
  const profile = match.matchedProfile;

  const handleMessage = () => {
    navigate(`/messages/${match._id}`);
    // onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Photos Section */}
      <div className="relative w-full aspect-square">
        <AnimatePresence initial={false}>
          <motion.img
            key={currentPhotoIndex}
            src={profile.photos[currentPhotoIndex]?.url}
            alt={`${profile.name}'s photo ${currentPhotoIndex + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>

        {/* Photo Navigation */}
        <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 z-10">
          {profile.photos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPhotoIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors
                ${index === currentPhotoIndex 
                  ? 'bg-white' 
                  : 'bg-white/50 hover:bg-white/75'}`}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation Areas */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
          onClick={() => currentPhotoIndex > 0 && setCurrentPhotoIndex(prev => prev - 1)}
        />
        <div 
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
          onClick={() => currentPhotoIndex < profile.photos.length - 1 && setCurrentPhotoIndex(prev => prev + 1)}
        />


        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <h2 className="text-2xl font-bold text-white">
            {profile.name}, {profile.age}
          </h2>
          <p className="text-white/80 mt-2">{profile.bio}</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="p-4 border-b border-border flex gap-2">
        <Button 
          className="flex-1"
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
              {/* <div className="rounded-lg bg-background p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-spotify-green" />
                  <h3 className="font-semibold">Music Match</h3>
                </div>
                <div className="text-3xl font-bold text-spotify-green">
                  {Math.round(match.compatibilityScore * 100)}%
                </div>
              </div> */}

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

export default MatchProfile;