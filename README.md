# Symphony: Music-Based Dating App
## Note
- On November 2024, Spotify discontinued support for the audio features and analysis, making new users unable to sign up for the application when being run. Fortunately, during the development
and testing phase of this application, I was able to create test users which are able to be used for demo purposes. I am currently exploring alternative options.
[Read more about it here.](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api)

- For a preview of the project, I have app media and demos on my portfolio as well as additional information about the project on my
[portfolio project page.](https://www.benjaelee.com/projects/symphony) 


## Overview
Symphony was developed as a Progressive Web App (PWA) that rethinks online dating by creating meaningful connections through musical compatibility. By leveraging Spotify's robust data analytics on music and musical analysis algorithms rooted in Psychology research, Symphony matches users based on their musical preferences, listening patterns, and shared musical dimensions.


## Technical Stack

### Frontend
- React.js with modern hooks and patterns
- Redux Toolkit for state management with Redux Persist
- TailwindCSS with custom Spotify-inspired theme
- shadcn/ui component library
- Socket.IO client for real-time features

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- Socket.IO for real-time communication
- JWT and Spotify OAuth Flow with PKCE authentication
- AWS S3 for media storage

## Core Features

### Music Analysis & Matching Algorithm
Symphony implements a music analysis system based on Rentfrow's MUSIC model dimensions [which can be found here](https://pmc.ncbi.nlm.nih.gov/articles/PMC3138530/), incorporating detailed audio feature analysis and multi-dimensional compatibility scoring.

#### Musical Dimensions Analysis
The system analyzes five key musical dimensions, each characterized by specific audio feature weights:

**Mellow** (Romantic and relaxing music)
- High acousticness (0.8)
- Negative correlation with energy (-0.7)
- Moderate valence (0.3)
- Moderate instrumentalness (0.4)
- Slight negative correlation with danceability (-0.2)
- Common genres: jazz, classical, folk, ambient

**Unpretentious** (Sincere and conventional music)
- High danceability (0.7)
- Strong valence correlation (0.6)
- Moderate acousticness (0.4)
- Moderate energy correlation (0.3)
- Common genres: country, pop, folk, rock

**Sophisticated** (Complex and creative music)
- High instrumentalness (0.8)
- Strong acousticness (0.6)
- Moderate negative correlation with danceability (-0.3)
- Common genres: classical, jazz, avant-garde, world

**Intense** (Forceful and energetic music)
- Very high energy correlation (0.9)
- Negative valence correlation (-0.4)
- Strong negative correlation with acousticness (-0.7)
- Moderate positive correlation with danceability (0.3)
- Common genres: rock, metal, punk, electronic

**Contemporary** (Rhythmic and popular music)
- High danceability (0.8)
- Strong energy presence (0.6)
- Positive valence (0.5)
- Moderate negative correlation with acousticness (-0.3)
- Common genres: pop, rap, electronic, r&b

#### Multi-dimensional Scoring System
The matching algorithm employs a three-component weighted analysis system with comprehensive error handling and validation:

1. **MUSIC Dimensions Similarity (40%)**
- Implements cosine similarity calculation between users' dimension profiles
- Handles missing dimension data gracefully
- Validates input dimensions before calculation
- Returns 0 for invalid or missing dimension data
- Normalizes dimension scores between 0 and 1

2. **Audio Features Similarity (30%)**
- Analyzes five key audio features:
  - Danceability
  - Energy
  - Valence
  - Acousticness
  - Instrumentalness
- Calculates similarity using squared difference approach
- Normalizes differences to produce similarity score between 0 and 1
- Handles partial feature availability (calculates based on available features)
- Returns 0 for completely invalid feature sets

3. **Genre Distribution Similarity (30%)**
- Implements sophisticated genre distribution analysis:
  - Case-insensitive genre matching
  - Handles multi-genre artists
  - Normalizes genre frequencies
  - Accounts for genre overlap between profiles
- Features include:
  - Track-level genre aggregation from artists
  - Frequency-based distribution calculation
  - Normalization of genre weights
  - Minimum frequency overlap calculation
- Error handling for:
  - Missing genre data
  - Empty track lists
  - Invalid artist data

## Implementation Details

### Genre Processing
- Processes genres case-insensitively
- Removes duplicates within track context
- Normalizes genre frequencies across entire profile
- Handles edge cases:
  - Missing genre data
  - Empty artist lists
  - Invalid genre formats

### Audio Feature Analysis
- Calculates average features across all tracks
- Validates feature availability for each track
- Normalizes feature values to 0-1 range
- Handles missing or invalid feature data

### Compatibility Score Calculation
- Validates input profiles for required data
- Processes each similarity component independently
- Applies weight factors to each component
- Returns detailed subscores along with total score
- Includes error information when calculation fails

### Error Handling
- Comprehensive validation of input data
- Handles missing or invalid data
- Detailed error logging for debugging
- Fallback values for invalid calculations

## Score Interpretation

The final compatibility score is a weighted sum of the three components, normalized to a 0-1 range, where:
- 0.8-1.0: Extremely high compatibility
- 0.6-0.8: High compatibility
- 0.4-0.6: Moderate compatibility
- 0.2-0.4: Low compatibility
- 0.0-0.2: Minimal compatibility

Each subscore provides additional insight into specific aspects of musical compatibility between users.

#### Feature Normalization
Spotify audio features are normalized within specific ranges:
```javascript
const FEATURE_RANGES = {
    acousticness: { min: 0, max: 1 },
    danceability: { min: 0, max: 1 },
    energy: { min: 0, max: 1 },
    instrumentalness: { min: 0, max: 1 },
    valence: { min: 0, max: 1 },
    tempo: { min: 0, max: 250 },
    loudness: { min: -60, max: 0 }
};
```


### Authentication System
- Multi-layer authentication combining JWT and Spotify OAuth2
- Secure token management with automatic refresh
- HTTP-only cookies for enhanced security

### Profile Management
#### Multi-step Profile Creation
1. Basic Information Collection
2. Photo Management & Upload
3. Music Taste Analysis
4. Preference Configuration
5. Profile Review & Completion

#### Photo Upload Management
- Client-side image processing and validation
- Automatic image cropping with aspect ratio enforcement
- Drag-and-drop photo reordering
- AWS S3 integration for secure storage
- Progress tracking and optimization

### Real-time Communication System

#### Message Delivery Architecture
- Bidirectional real-time communication using Socket.IO
- Room-based message routing for private conversations
- Message deduplication using clientId system
- Optimistic updates for instant UI feedback

#### Message State Management
- Message status tracking (sending → sent → delivered → read)
- Real-time delivery confirmations
- Batch read status updates
- Conversation-based unread counting
- Persistent message storage in MongoDB

#### Conversation Management
- Real-time conversation previews with latest message prioritization
- Efficient room connection management at application initialization
- Unread message indicators with MongoDB aggregation
- User-specific socket rooms for targeted notifications
- Automatic chat room creation for new matches

#### Message Loading
- Cursor-based pagination for message history
- Efficient MongoDB queries with compound indexing
- Optimized preview fetching using aggregation
- Message ordering preservation

### Discovery Interface
- Gesture-based swipe interface using Framer Motion
- Profile card stack implementation
- Efficient profile caching and prefetching
- Responsive design adapting to device size
- Touch-optimized controls for mobile

## Technical Implementation Details

### State Management Architecture

#### Redux Implementation
- Feature-based Redux slice organization
- Normalized state structure for efficient data access
- Socket middleware for real-time event handling
- Cross-tab state persistence with Redux Persist

#### Message State Handling
- Centralized Redux store with socket middleware
- Temporary message handling with deduplication
- Real-time status updates via Socket.IO

#### Database Optimization
- Optimized MongoDB schema with compound indexing
- Efficient aggregation pipelines for unread counts
- Message status tracking with timestamp management
- Room-based message organization


### API Integration
- Spotify API integration with rate limiting
- Batch processing for API calls
- Comprehensive error handling
- Automatic retry mechanism

### Security Features
- CSRF protection
- XSS prevention
- Secure file upload validation

### Performance Optimizations
- Image optimization pipeline
- Database query optimization

## Getting Started

### Prerequisites
- Node.js 
- MongoDB 
- Spotify Developer Account
- AWS Account for S3
- NPM 


---

Developed by Benjamin Lee
