// scripts/seedDatabase.js
const mongoose = require('mongoose');
const User = require('../server/models/user');
const Profile = require('../server/models/profile');
require('dotenv').config();

const seedData = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
  
      // Create test users if they don't exist
      const testUsers = [];
      
      const user1 = await User.findOne({ email: 'test1@example.com' });
      if (!user1) {
        const newUser1 = await User.create({
          name: 'Test User 1',
          email: 'test1@example.com',
          password: 'password123',
          isProfileComplete: true,
          spotify: {
            isConnected: true,
            scope: ['user-top-read', 'playlist-read-private']
          }
        });
        testUsers.push(newUser1);
        console.log('Created test user 1');
      } else {
        testUsers.push(user1);
        console.log('Test user 1 already exists');
      }
  
      const user2 = await User.findOne({ email: 'test2@example.com' });
      if (!user2) {
        const newUser2 = await User.create({
          name: 'Test User 2',
          email: 'test2@example.com',
          password: 'password123',
          isProfileComplete: true,
          spotify: {
            isConnected: true,
            scope: ['user-top-read', 'playlist-read-private']
          }
        });
        testUsers.push(newUser2);
        console.log('Created test user 2');
      } else {
        testUsers.push(user2);
        console.log('Test user 2 already exists');
      }
  
      // Check for existing profiles
      for (let i = 0; i < testUsers.length; i++) {
        const existingProfile = await Profile.findOne({ user: testUsers[i]._id });
        if (!existingProfile) {
          const newProfile = await Profile.create({
            user: testUsers[i]._id,
            name: i === 0 ? 'Alex' : 'Sam',
            age: i === 0 ? 25 : 28,
            gender: i === 0 ? 'non-binary' : 'woman',
            bio: i === 0 ? 'Music enthusiast and coffee lover' : 'Alternative rock fan, always looking for new bands',
            photos: i === 0 ? [
              {
                url: "https://symphony-user-photos.s3.us-west-2.amazonaws.com/profiles/67465",
                key: "profiles/674654ec99ea0e84ad14c7ac/42f20b4b-8852-43ed-b1c3-305ba322057c",
                order: 0
              },
              {
                url: "https://symphony-user-photos.s3.us-west-2.amazonaws.com/profiles/67465",
                key: "profiles/674654ec99ea0e84ad14c7ac/44f49d3e-c582-42e0-afef-724c4c6b174a",
                order: 1
              }
            ] : [
              {
                url: "https://symphony-user-photos.s3.us-west-2.amazonaws.com/profiles/67465",
                key: "profiles/674654ec99ea0e84ad14c7ac/42f20b4b-8852-43ed-b1c3-305ba322057c",
                order: 0
              }
            ],
            music: {
              sourceType: i === 0 ? 'playlist' : 'top_tracks',
              sourceId: i === 0 ? 'test_playlist_1' : 'user_top_tracks',
              tracks: [{
                id: `track${i + 1}`,
                name: `Test Track ${i + 1}`,
                artists: [{
                  id: `artist${i + 1}`,
                  name: `Test Artist ${i + 1}`,
                  genres: i === 0 ? ['indie', 'rock'] : ['alternative', 'indie']
                }],
                features: i === 0 ? {
                  danceability: 0.8,
                  energy: 0.7,
                  acousticness: 0.3,
                  instrumentalness: 0.1,
                  valence: 0.6
                } : {
                  danceability: 0.6,
                  energy: 0.8,
                  acousticness: 0.2,
                  instrumentalness: 0.3,
                  valence: 0.7
                }
              }],
              analysis: {
                averageFeatures: i === 0 ? {
                  danceability: 0.8,
                  energy: 0.7,
                  acousticness: 0.3,
                  instrumentalness: 0.1,
                  valence: 0.6
                } : {
                  danceability: 0.6,
                  energy: 0.8,
                  acousticness: 0.2,
                  instrumentalness: 0.3,
                  valence: 0.7
                },
                genreDistribution: new Map(
                  i === 0 ? 
                  [['indie', 0.6], ['rock', 0.4]] : 
                  [['alternative', 0.7], ['indie', 0.3]]
                ),
                musicDimensions: i === 0 ? {
                  mellow: 0.3,
                  unpretentious: 0.7,
                  sophisticated: 0.4,
                  intense: 0.6,
                  contemporary: 0.8
                } : {
                  mellow: 0.2,
                  unpretentious: 0.6,
                  sophisticated: 0.5,
                  intense: 0.8,
                  contemporary: 0.7
                }
              }
            },
            preferences: {
              genderPreference: i === 0 ? ['woman', 'non-binary'] : ['non-binary'],
              ageRange: {
                min: i === 0 ? 21 : 23,
                max: i === 0 ? 35 : 32
              },
              maxDistance: i === 0 ? 50 : 40
            },
            status: 'COMPLETED',
            location: {
              type: 'Point',
              coordinates: [-122.3321, 47.6062]
            }
          });
          console.log(`Created profile for test user ${i + 1}`);
        } else {
          console.log(`Profile already exists for test user ${i + 1}`);
        }
      }
  
      console.log('Finished seeding process');
      mongoose.connection.close();
    } catch (error) {
      console.error('Error seeding database:', error);
      mongoose.connection.close();
    }
  };
  
  seedData();