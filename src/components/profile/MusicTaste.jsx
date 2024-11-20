import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Music2, Info } from 'lucide-react';
import { SpotifyAPIService } from '../../services/spotify/SpotifyAPIService';

const AUDIO_FEATURE_DESCRIPTIONS = {
  danceability: "How suitable the track is for dancing",
  energy: "The intensity and activity level of the track",
  valence: "The musical positiveness conveyed by the track",
  acousticness: "Whether the track is acoustic",
  instrumentalness: "Whether the track contains no vocals"
};

const MusicTaste = ({ formData, onValidSubmit, onDataChange }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [error, setError] = useState(null);

  // Load existing selection if present
  useEffect(() => {
    if (formData?.sourceId && playlists.length > 0) {
      const existing = playlists.find(p => p.id === formData.sourceId);
      if (existing) {
        setSelectedPlaylist(existing);
      }
    }
  }, [formData?.sourceId, playlists]);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const response = await SpotifyAPIService.getPlaylists();
      setPlaylists(response.items.filter(playlist => 
        // Filter out playlists with no tracks
        playlist.tracks.total > 0
      ));
    } catch (error) {
      setError('Failed to load playlists. Please try again.');
      console.error('Playlist load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageFeatures = (tracks) => {
    const features = tracks.reduce((acc, track) => {
      Object.keys(AUDIO_FEATURE_DESCRIPTIONS).forEach(feature => {
        if (!acc[feature]) acc[feature] = 0;
        acc[feature] += track.features[feature] || 0;
      });
      return acc;
    }, {});

    // Calculate averages
    Object.keys(features).forEach(feature => {
      features[feature] = features[feature] / tracks.length;
    });

    return features;
  };

  const handlePlaylistSelect = async (playlist) => {
    // Don't reanalyze if it's the same playlist
    if (selectedPlaylist?.id === playlist.id && formData?.tracks) {
      return;
    }

    setAnalyzing(true);
    setError(null);
    
    try {
      // Get most recent 50 tracks from playlist
      const tracks = await SpotifyAPIService.getPlaylistTracks(
        playlist.id, 
        Math.min(50, playlist.tracks.total)
      );
      
      if (!tracks.items.length) {
        throw new Error('Selected playlist has no available tracks');
      }

      // Get audio features for tracks
      const trackIds = tracks.items
        .map(item => item.track?.id)
        .filter(Boolean);

      const features = await SpotifyAPIService.getSongFeatures(trackIds);

      // Map tracks with their features
      const analyzedTracks = tracks.items.map((item, index) => ({
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map(artist => artist.name),
        features: features[index]
      }));

      // Calculate aggregate features
      const analysis = calculateAverageFeatures(analyzedTracks);

      const updatedData = {
        sourceType: 'playlist',
        sourceId: playlist.id,
        tracks: analyzedTracks,
        analysis
      };

      setSelectedPlaylist(playlist);
      onDataChange(updatedData);

    } catch (error) {
      setError(
        error.message === 'Selected playlist has no available tracks'
          ? 'This playlist is empty. Please select another playlist.'
          : 'Failed to analyze playlist. Please try again.'
      );
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedPlaylist && formData?.tracks?.length) {
      onValidSubmit(formData);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-spotify-green" />
        <p className="mt-2 text-muted-foreground">Loading your playlists...</p>
      </div>
    );
  }

  if (!playlists.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Music2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Playlists Found</h3>
        <p className="text-muted-foreground mb-4">
          You'll need at least one playlist with songs to continue.
          Create a playlist in Spotify, then return here.
        </p>
        <Button
          variant="outline"
          onClick={loadPlaylists}
        >
          Refresh Playlists
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Choose Your Music</h2>
        <p className="text-muted-foreground">
          Select a playlist that best represents your music taste. We'll analyze it to help find your perfect match.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map(playlist => (
            <Card
              key={playlist.id}
              className={`cursor-pointer transition-all hover:bg-background-highlight group ${
                selectedPlaylist?.id === playlist.id ? 'ring-2 ring-spotify-green' : ''
              }`}
              onClick={() => !analyzing && handlePlaylistSelect(playlist)}
            >
              <CardContent className="p-4">
                <div className="aspect-square relative mb-3">
                  <img
                    src={playlist.images[0]?.url || '/default-playlist.png'}
                    alt={playlist.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                  {analyzing && selectedPlaylist?.id === playlist.id && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                      <Loader2 className="h-8 w-8 animate-spin text-spotify-green" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white truncate">
                      {playlist.tracks.total} tracks
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold line-clamp-1">{playlist.name}</h3>
                  {playlist.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {playlist.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Analysis Results */}
        {selectedPlaylist && formData?.analysis && (
          <div className="rounded-lg border border-border p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium">Playlist Analysis</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(AUDIO_FEATURE_DESCRIPTIONS).map(([feature, description]) => (
                <div key={feature} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{description}</span>
                    <span>{Math.round(formData.analysis[feature] * 100)}%</span>
                  </div>
                  <div className="h-2 bg-background-elevated rounded-full">
                    <div
                      className="h-full bg-spotify-green rounded-full transition-all"
                      style={{ width: `${formData.analysis[feature] * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {selectedPlaylist && formData?.tracks?.length > 0 && (
          <Button
            type="submit"
            className="w-full"
            disabled={analyzing}
          >
            Continue with Selected Playlist
          </Button>
        )}
      </form>
    </div>
  );
};

export default MusicTaste;