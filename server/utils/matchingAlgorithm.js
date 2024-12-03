const MUSIC_DIMENSIONS = {
    mellow: {
        weights: {
            acousticness: 0.8,
            energy: -0.7,
            valence: 0.3,
            instrumentalness: 0.4,
            danceability: -0.2
        }
    },
    unpretentious: {
        weights: {
            danceability: 0.7,
            valence: 0.6,
            acousticness: 0.4,
            energy: 0.3
        }
    },
    sophisticated: {
        weights: {
            instrumentalness: 0.8,
            acousticness: 0.6,
            danceability: -0.3
        }
    },
    intense: {
        weights: {
            energy: 0.9,
            valence: -0.4,
            acousticness: -0.7,
            danceability: 0.3
        }
    },
    contemporary: {
        weights: {
            danceability: 0.8,
            energy: 0.6,
            valence: 0.5,
            acousticness: -0.3
        }
    }
};

const calculateGenreDistribution = (profile) => {
    const genreMap = new Map();
    const tracks = profile.music.tracks || [];
    const totalTracks = tracks.length;

    if (totalTracks === 0) {
    console.warn('No tracks found for genre distribution calculation');
    return new Map();
    }

    // Count tracks containing each genre
    tracks.forEach(track => {
    if (!track.artists || !Array.isArray(track.artists)) {
        console.warn(`Invalid artists data for track: ${track.id}`);
        return;
    }

    // Get unique genres from all artists of the track
    const trackGenres = new Set();
    track.artists.forEach(artist => {
        if (artist.genres && Array.isArray(artist.genres)) {
        artist.genres.forEach(genre => {
            if (genre && typeof genre === 'string') {
            trackGenres.add(genre.toLowerCase().trim());
            }
        });
        }
    });

    // Increment count for each unique genre in this track
    trackGenres.forEach(genre => {
        const currentCount = genreMap.get(genre) || 0;
        genreMap.set(genre, currentCount + 1);
    });
    });

    // Convert to frequencies relative to total tracks
    const genreFrequencies = new Map();
    genreMap.forEach((count, genre) => {
    genreFrequencies.set(genre, count / totalTracks);
    });

    return genreFrequencies;
};

const calculateGenreSimilarity = (profileA, profileB) => {
    try {
    const genreDistA = calculateGenreDistribution(profileA);
    const genreDistB = calculateGenreDistribution(profileB);

    if (genreDistA.size === 0 || genreDistB.size === 0) {
        console.warn('One or both profiles have no genre data');
        return 0;
    }

    const allGenres = new Set([
        ...genreDistA.keys(),
        ...genreDistB.keys()
    ]);

    let similarityScore = 0;
    allGenres.forEach(genre => {
        const freqA = genreDistA.get(genre) || 0;
        const freqB = genreDistB.get(genre) || 0;
        similarityScore += Math.min(freqA, freqB);
    });

    return similarityScore;
    } catch (error) {
    console.error('Error calculating genre similarity:', error);
    return 0;
    }
};

const calculateAudioFeaturesSimilarity = (featuresA, featuresB) => {
    try {
    const features = ['danceability', 'energy', 'valence', 'acousticness', 'instrumentalness'];
    let sumSquaredDiff = 0;
    let validFeatures = 0;

    for (const feature of features) {
        if (typeof featuresA[feature] === 'number' && typeof featuresB[feature] === 'number') {
        const diff = featuresA[feature] - featuresB[feature];
        sumSquaredDiff += Math.pow(diff, 2);
        validFeatures++;
        }
    }

    if (validFeatures === 0) {
        console.warn('No valid audio features found for comparison');
        return 0;
    }

    return 1 - Math.sqrt(sumSquaredDiff / validFeatures);
    } catch (error) {
    console.error('Error calculating audio features similarity:', error);
    return 0;
    }
};

const calculateMusicDimensionsSimilarity = (dimensionsA, dimensionsB) => {
    try {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    let validDimensions = 0;

    for (const dimension of Object.keys(MUSIC_DIMENSIONS)) {
        if (typeof dimensionsA[dimension] === 'number' && typeof dimensionsB[dimension] === 'number') {
        dotProduct += dimensionsA[dimension] * dimensionsB[dimension];
        normA += Math.pow(dimensionsA[dimension], 2);
        normB += Math.pow(dimensionsB[dimension], 2);
        validDimensions++;
        }
    }

    if (validDimensions === 0) {
        console.warn('No valid music dimensions found for comparison');
        return 0;
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (normA * normB);
    } catch (error) {
    console.error('Error calculating music dimensions similarity:', error);
    return 0;
    }
};

const calculateCompatibilityScore = async (profileA, profileB) => {
    const WEIGHTS = {
    musicDimensions: 0.4,
    audioFeatures: 0.3,
    genres: 0.3
    };

    try {
    // Validate profiles have necessary data
    if (!profileA?.music?.analysis || !profileB?.music?.analysis) {
        console.error('Missing music analysis data in profiles');
        return { total: 0, subscores: null };
    }

    const dimensionsSimilarity = calculateMusicDimensionsSimilarity(
        profileA.music.analysis.musicDimensions,
        profileB.music.analysis.musicDimensions
    );

    const featuresSimilarity = calculateAudioFeaturesSimilarity(
        profileA.music.analysis.averageFeatures,
        profileB.music.analysis.averageFeatures
    );

    const genreSimilarity = calculateGenreSimilarity(profileA, profileB);

    const finalScore = (
        dimensionsSimilarity * WEIGHTS.musicDimensions +
        featuresSimilarity * WEIGHTS.audioFeatures +
        genreSimilarity * WEIGHTS.genres
    );

    return {
        total: finalScore,
        subscores: {
        dimensions: dimensionsSimilarity,
        features: featuresSimilarity,
        genres: genreSimilarity
        }
    };
    } catch (error) {
    console.error('Error calculating compatibility:', error);
    return {
        total: 0,
        subscores: null,
        error: 'Failed to calculate compatibility score'
    };
    }
};

module.exports = {
    calculateCompatibilityScore,
};