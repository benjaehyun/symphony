import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Music2, Info } from 'lucide-react';
import { spotifyAPI } from '../../services/spotify/SpotifyAPIInstance';

const AUDIO_FEATURE_DESCRIPTIONS = {
  danceability: "How suitable the track is for dancing",
  energy: "The intensity and activity level of the track",
  valence: "The musical positiveness conveyed by the track",
  acousticness: "Whether the track is acoustic",
  instrumentalness: "Whether the track contains no vocals"
};

const MUSIC_DIMENSIONS = {
  mellow: {
    label: "Mellow",
    description: "Romantic, relaxing, unaggressive music",
    weights: {
      acousticness: 0.8,
      instrumentalness: 0.6,
      energy: -0.7,
      valence: 0.3,
      danceability: -0.4
    }
  },
  unpretentious: {
    label: "Unpretentious",
    description: "Sincere, conventional, easy-going music",
    weights: {
      acousticness: 0.6,
      energy: 0.4
    }
  },
  sophisticated: {
    label: "Sophisticated",
    description: "Complex, creative, abstract music",
    weights: {
      instrumentalness: 0.8,
      acousticness: 0.5
    }
  },
  intense: {
    label: "Intense",
    description: "Forceful, aggressive, energetic music",
    weights: {
      energy: 0.9,
      valence: -0.4,
      acousticness: -0.7
    }
  },
  contemporary: {
    label: "Contemporary",
    description: "Rhythmic, popular, happy music",
    weights: {
      danceability: 0.8,
      energy: 0.6,
      valence: 0.5
    }
  }
};

const PLAYLISTS_PER_PAGE = 20;

const MusicTaste = ({ formData, onValidSubmit, onDataChange }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [error, setError] = useState(null);
  const [playlistPagination, setPlaylistPagination] = useState({
    total: 0,
    currentPage: 1,
    hasMore: true,
    loading: false
  });

  useEffect(() => {
    initializeAndLoadPlaylists();
  }, []);

  const initializeAndLoadPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting Spotify API initialization...');
      
      const api = await spotifyAPI.initialize();
      console.log('Spotify API initialized, fetching initial playlists...');
      
      const response = await api.fetchPlaylists(PLAYLISTS_PER_PAGE, 0);
      console.log('Initial playlists fetched:', response);
      
      const filteredPlaylists = response.items.filter(playlist => playlist?.tracks?.total > 0);
      console.log('Filtered playlists:', filteredPlaylists);
      
      setPlaylists(filteredPlaylists);
      setPlaylistPagination({
        total: response.total,
        currentPage: 1,
        hasMore: filteredPlaylists.length < response.total,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load playlists:', error);
      
      if (error.message.includes('No access token available')) {
        setError('Please connect your Spotify account to continue.');
      } else if (error.response?.status === 401) {
        setError('Your Spotify session has expired. Please reconnect your account.');
      } else {
        setError('Unable to load playlists. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoadMore = async () => {
    if (playlistPagination.loading) return;
  
    setPlaylistPagination(prev => ({ ...prev, loading: true }));
    try {
      const offset = playlists.length;
      const api = spotifyAPI.getInstance();
      console.log('Fetching more playlists with offset:', offset);
      
      const response = await api.fetchPlaylists(PLAYLISTS_PER_PAGE, offset);
      const filteredPlaylists = response.items.filter(playlist => playlist?.tracks?.total > 0);
      
      setPlaylists(prev => [...prev, ...filteredPlaylists]);
      setPlaylistPagination(prev => ({
        ...prev,
        total: response.total,
        currentPage: prev.currentPage + 1,
        hasMore: offset + filteredPlaylists.length < response.total,
        loading: false
      }));
    } catch (error) {
      console.error('Failed to load more playlists:', error);
      setError('Failed to load additional playlists. Please try again.');
      setPlaylistPagination(prev => ({ ...prev, loading: false }));
    }
  };

  const calculateAverageFeatures = (tracks) => {
    const sum = tracks.reduce((acc, track) => ({
      danceability: acc.danceability + track.features.danceability,
      energy: acc.energy + track.features.energy,
      acousticness: acc.acousticness + track.features.acousticness,
      instrumentalness: acc.instrumentalness + track.features.instrumentalness,
      valence: acc.valence + track.features.valence
    }), {
      danceability: 0,
      energy: 0,
      acousticness: 0,
      instrumentalness: 0,
      valence: 0
    });

    return Object.keys(sum).reduce((acc, key) => ({
      ...acc,
      [key]: sum[key] / tracks.length
    }), {});
  };

  const calculateGenreDistribution = (artists) => {
    const genreFrequency = {};
    let totalGenres = 0;
  
    // Count all genres
    artists.forEach(artist => {
      artist.genres.forEach(genre => {
        genreFrequency[genre] = (genreFrequency[genre] || 0) + 1;
        totalGenres++;
      });
    });
  
    // Convert to normalized distribution (0-1)
    const distribution = Object.entries(genreFrequency).reduce((acc, [genre, count]) => ({
      ...acc,
      [genre]: count / totalGenres
    }), {});
  
    // Sort by frequency and take top genres
    return Object.fromEntries(
      Object.entries(distribution)
        .sort(([,a], [,b]) => b - a)
    );
  };

  const calculateMusicDimensions = (features) => {
    return Object.entries(MUSIC_DIMENSIONS).reduce((dimensions, [dimension, { weights }]) => {
      const score = Object.entries(weights).reduce((sum, [feature, weight]) => {
        return sum + (features[feature] * weight);
      }, 0);

      return {
        ...dimensions,
        [dimension]: Math.max(0, Math.min(1, score))
      };
    }, {});
  };

  // Modified playlist selection handler
  const handleTopSongsSelect = async () => {
    console.log('Top songs selected');
    if (selectedPlaylist === 'top_tracks' && formData?.tracks) {
      return;
    }
  
    setSelectedPlaylist('top_tracks');
    setAnalyzing(true);
    setError(null);
  
    try {
      const api = spotifyAPI.getInstance();
      console.log('Got Spotify API instance');
      
      // Get top 50 songs
      console.log('Fetching top songs');
      const topSongs = await api.fetchTopSongs('medium_term', 50);
      console.log('Received top songs:', topSongs);

      // Get audio features for all tracks
      const trackIds = topSongs.items.map(track => track.id);
      console.log('Fetching audio features for tracks:', trackIds); 
      const features = await api.fetchSongFeatures(trackIds);
      console.log('Received audio features:', features); 
  
      // Get artist information for genres
      const artistIds = [...new Set(topSongs.items.flatMap(
        item => item.artists.map(artist => artist.id)
      ))];
      const artistsResponse = await api.getArtists(artistIds);
      const artistsData = artistsResponse.artists;
  
      // Process tracks with full artist data
      const analyzedTracks = topSongs.items.map((track, index) => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => {
          const fullArtistData = artistsData.find(a => a.id === artist.id);
          return {
            id: artist.id,
            name: artist.name,
            genres: fullArtistData?.genres || []
          };
        }),
        features: features[index]
      }));
  
      const averageFeatures = calculateAverageFeatures(analyzedTracks);
      const genreDistribution = calculateGenreDistribution(artistsData);
      const musicDimensions = calculateMusicDimensions(averageFeatures);
  
      const updatedData = {
        sourceType: 'top_tracks',
        sourceId: 'user_top_tracks',
        tracks: analyzedTracks,
        analysis: {
          averageFeatures,
          genreDistribution,
          musicDimensions
        },
        lastUpdated: new Date()
      };
  
      onDataChange(updatedData);
  
    } catch (error) {
      setError('Failed to analyze top songs. Please try again.');
      console.error('Top songs analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };
  
  const handlePlaylistSelect = async (playlist) => {
    if (selectedPlaylist?.id === playlist.id && formData?.tracks) {
      return;
    }
  
    setSelectedPlaylist(playlist);
    setAnalyzing(true);
    setError(null);
    
    try {
      const api = spotifyAPI.getInstance();
      
      // Get playlist tracks (up to 50)
      const tracksResponse = await api.fetchPlaylistSongs(
        playlist.id, 
        Math.min(50, playlist.tracks.total)
      );
      console.log('Playlist tracks response:', tracksResponse);
      
      if (!tracksResponse.items.length) {
        throw new Error('Selected playlist has no available tracks');
      }

      console.log('Sample track:', tracksResponse.items[0]);
  
      // Get track features
      const trackIds = tracksResponse.items
        .map(item => item.track?.id)
        .filter(Boolean);
  
      const features = await api.fetchSongFeatures(trackIds);
  
      // Get artist information with genres
      const artistIds = [...new Set(tracksResponse.items.flatMap(item => {
        console.log('Processing item for artists:', item);
        if (!item.track || !item.track.artists) {
          console.log('Missing track or artists for item:', item);
          return [];
        }
        return item.track.artists.map(artist => {
          console.log('Artist data:', artist);
          return artist.id;
        });
      }))];
      console.log('Extracted artist IDs:', artistIds);
      const artistsResponse = await api.getArtists(artistIds);
      const artistsData = artistsResponse.artists;
  
      // Prepare analyzed data with full artist information
      const analyzedTracks = tracksResponse.items.map((item, index) => ({
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map(artist => {
          const fullArtistData = artistsData.find(a => a.id === artist.id);
          return {
            id: artist.id,
            name: artist.name,
            genres: fullArtistData?.genres || []
          };
        }),
        features: features[index]
      }));
  
      const averageFeatures = calculateAverageFeatures(analyzedTracks);
      const genreDistribution = calculateGenreDistribution(artistsData);
      const musicDimensions = calculateMusicDimensions(averageFeatures);
  
      const updatedData = {
        sourceType: 'playlist',
        sourceId: playlist.id,
        tracks: analyzedTracks,
        analysis: {
          averageFeatures,
          genreDistribution,
          musicDimensions
        },
        lastUpdated: new Date()
      };
  
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
          onClick={initializeAndLoadPlaylists}
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
        {/* Top Songs Card */}
        <Card
            className={`cursor-pointer transition-all hover:bg-background-highlight group ${
              selectedPlaylist === 'top_tracks' ? 'ring-2 ring-spotify-green' : ''
            }`}
            onClick={() => !analyzing && handleTopSongsSelect()}
          >
            <CardContent className="p-4">
              <div className="aspect-square relative mb-3">
                <div className="w-full h-full bg-background-elevated rounded-md flex items-center justify-center">
                  <Music2 className="h-16 w-16 text-muted-foreground" />
                </div>
                {analyzing && selectedPlaylist === 'top_tracks' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                    <Loader2 className="h-8 w-8 animate-spin text-spotify-green" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Your Top Songs</h3>
                <p className="text-sm text-muted-foreground">
                  Based on your most played tracks
                </p>
              </div>
            </CardContent>
          </Card>
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
                  {/* Add null check for images array */}
                  <img
                    src={playlist.images?.[0]?.url || '/default-playlist.png'}
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
                      {/* Add null check for tracks */}
                      {playlist.tracks?.total || 0} tracks
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold line-clamp-1">{playlist.name}</h3>
                  {/* Add null check for description */}
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

        {/* Add after the playlist grid */}
        {!loading && (
          <div className="space-y-4">
            {/* Pagination Controls */}
            {playlistPagination.hasMore && (
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={playlistPagination.loading}
                className="w-full max-w-sm mx-auto"
              >
                {playlistPagination.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading more playlists...
                  </>
                ) : (
                  <>Show More Playlists</>
                )}
              </Button>
            )}

            {/* Playlist Count Indicator */}
            {playlistPagination.total > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Showing {playlists.length} of {playlistPagination.total} playlists
              </p>
            )}
          </div>
        )}

        {/* Analysis Results */}
        {selectedPlaylist && formData?.analysis && (
          <div className="space-y-6 rounded-lg border border-border p-6">
            {/* Audio Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Audio Features</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(AUDIO_FEATURE_DESCRIPTIONS).map(([feature, description]) => (
                  <div key={feature} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{description}</span>
                      <span>{Math.round(formData.analysis.averageFeatures[feature] * 100)}%</span>
                    </div>
                    <div className="h-2 bg-background-elevated rounded-full">
                      <div
                        className="h-full bg-spotify-green rounded-full transition-all"
                        style={{ width: `${formData.analysis.averageFeatures[feature] * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Music Dimensions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Music2 className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Music Dimensions</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(MUSIC_DIMENSIONS).map(([dimension, { label, description }]) => (
                  <div key={dimension} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{label}</span>
                        <p className="text-muted-foreground text-xs">{description}</p>
                      </div>
                      <span>{Math.round(formData.analysis.musicDimensions[dimension] * 100)}%</span>
                    </div>
                    <div className="h-2 bg-background-elevated rounded-full">
                      <div
                        className="h-full bg-spotify-green rounded-full transition-all"
                        style={{ width: `${formData.analysis.musicDimensions[dimension] * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Genre Distribution */}
            {Object.keys(formData.analysis.genreDistribution).length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium">Top Genres</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(formData.analysis.genreDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([genre, weight]) => (
                      <span
                        key={genre}
                        className="px-2 py-1 rounded-full bg-background-elevated text-sm"
                      >
                        {genre} ({Math.round(weight * 100)}%)
                      </span>
                    ))}
                </div>
              </div>
            )}
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