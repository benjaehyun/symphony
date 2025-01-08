# Symphony: Music-Based Dating Application

## Overview
Symphony is an innovative Progressive Web Application (PWA) that revolutionizes online dating by creating meaningful connections through musical compatibility. By leveraging deep Spotify integration and sophisticated musical analysis algorithms, Symphony matches users based on their musical preferences, listening patterns, and shared musical dimensions.

## Technical Stack

### Frontend
- React.js 18.2.0 with modern hooks and patterns
- Redux Toolkit for state management with Redux Persist
- TailwindCSS with custom Spotify-inspired theme
- shadcn/ui component library
- Socket.IO client for real-time features
- Progressive Web App capabilities with Service Workers

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- Socket.IO for real-time communication
- JWT and Spotify OAuth2 authentication
- AWS S3 for media storage
- Redis for caching

## Core Features

### Music Analysis & Matching Algorithm
Symphony implements a sophisticated music analysis system based on Rentfrow's MUSIC model dimensions, incorporating detailed audio feature analysis and multi-dimensional compatibility scoring.

#### Musical Dimensions Analysis
- **Mellow** (Romantic and relaxing music)
  - High acousticness (0.8) and instrumentalness (0.6)
  - Negative correlation with energy (-0.7)
  - Moderate valence (0.3)
  - Common genres: jazz, classical, folk, ambient
  
- **Unpretentious** (Sincere and conventional music)
  - Moderate acousticness (0.6)
  - Negative complexity correlation (-0.7)
  - Moderate energy (0.4)
  - Common genres: country, pop, folk, rock
  
- **Sophisticated** (Complex and creative music)
  - High instrumentalness (0.8)
  - High complexity correlation (0.7)
  - Moderate acousticness (0.5)
  - Common genres: classical, jazz, avant-garde, world
  
- **Intense** (Forceful and energetic music)
  - High energy correlation (0.9)
  - Negative valence correlation (-0.4)
  - Negative acousticness (-0.7)
  - Common genres: rock, metal, punk, electronic
  
- **Contemporary** (Rhythmic and popular music)
  - High danceability (0.8)
  - Strong energy presence (0.6)
  - Positive valence (0.5)
  - Common genres: pop, rap, electronic, r&b

#### Multi-dimensional Scoring System
The matching algorithm employs a sophisticated three-component analysis:

1. **MUSIC Dimensions Similarity (40%)**
   - Cosine similarity calculation between users' dimension profiles
   - Dimension-specific feature weights:
     - Mellow: High acousticness (0.8), negative energy (-0.7), moderate valence (0.3)
     - Unpretentious: High danceability (0.7), strong valence (0.6)
     - Sophisticated: High instrumentalness (0.8), high acousticness (0.6)
     - Intense: Very high energy (0.9), negative valence (-0.4)
     - Contemporary: High danceability (0.8), positive energy (0.6)

2. **Audio Features Similarity (30%)**
   - Euclidean distance calculation for key audio features:
     - Danceability
     - Energy
     - Valence
     - Acousticness
     - Instrumentalness
   - Normalized similarity score (1 - normalized distance)

3. **Genre Distribution Similarity (30%)**
   - Frequency-based genre distribution analysis
   - Track-level genre aggregation from artists
   - Minimum frequency overlap calculation
   - Normalized genre similarity scoring
   - Handles multi-genre artists effectively

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
- Protected route system with role-based access

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
- Advanced profile card stack implementation
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
- Proper cleanup protocols


### API Integration
- Sophisticated Spotify API integration with rate limiting
- Batch processing for API calls
- Comprehensive error handling
- Automatic retry mechanism

### Security Features
- CSRF protection
- XSS prevention
- Secure file upload validation

### Performance Optimizations
- Lazy loading implementation
- Image optimization pipeline
- Efficient caching strategies
- Bundle size optimization
- Database query optimization

## Getting Started

### Prerequisites
- Node.js >= 18.x
- MongoDB >= 5.x
- Spotify Developer Account
- AWS Account for S3
- NPM 

### Installation
```bash
# Clone repository
git clone [https://github.com/benjaehyun/symphony]

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```



---

Developed by Benjamin Lee