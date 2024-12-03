import React from 'react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar, 
  ResponsiveContainer 
} from 'recharts';

const MusicDimensionsChart = ({ dimensions }) => {
  const data = [
    { dimension: 'Mellow', value: dimensions.mellow },
    { dimension: 'Unpretentious', value: dimensions.unpretentious },
    { dimension: 'Sophisticated', value: dimensions.sophisticated },
    { dimension: 'Intense', value: dimensions.intense },
    { dimension: 'Contemporary', value: dimensions.contemporary }
  ];

  return (
    <div className="w-full h-64 -ml-6"> {/* Negative margin to align with Spotify's style */}
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart outerRadius={90} data={data}>
          <PolarGrid stroke="#2a2a2a" />
          <PolarAngleAxis 
            dataKey="dimension" 
            tick={{ fill: '#a3a3a3', fontSize: 12 }} 
          />
          <Radar
            name="Music Style"
            dataKey="value"
            stroke="#1DB954"
            fill="#1DB954"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

const GenreDistribution = ({ genres }) => {
  // Convert genre map to array and sort by frequency
  const genreData = Array.from(genres).map(([genre, frequency]) => ({
    genre,
    frequency
  })).sort((a, b) => b.frequency - a.frequency).slice(0, 5);

  return (
    <div className="space-y-3">
      {genreData.map(({ genre, frequency }) => (
        <div key={genre}>
          <div className="flex justify-between text-sm mb-1">
            <span>{genre}</span>
            <span className="text-muted-foreground">
              {Math.round(frequency * 100)}%
            </span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div 
              className="h-full bg-spotify-green rounded-full"
              style={{ width: `${frequency * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const AudioFeatures = ({ features }) => {
  const featureDefinitions = {
    danceability: "How suitable for dancing",
    energy: "Intensity and activity level",
    valence: "Musical positiveness",
    acousticness: "Amount of acoustic sound",
    instrumentalness: "Likelihood of no vocals"
  };

  return (
    <div className="space-y-4">
      {Object.entries(features).map(([feature, value]) => {
        if (!featureDefinitions[feature]) return null;
        
        return (
          <div key={feature} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="capitalize">{feature}</span>
              <span className="text-muted-foreground">
                {Math.round(value * 100)}%
              </span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-spotify-green rounded-full transition-all duration-500"
                style={{ width: `${value * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {featureDefinitions[feature]}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export { MusicDimensionsChart, GenreDistribution, AudioFeatures };