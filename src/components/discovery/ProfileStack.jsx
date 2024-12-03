import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {ProfileCard} from './ProfileCard';

const ProfileStack = ({ 
  profiles, 
  currentIndex,
  onLike, 
  onDislike 
}) => {
  // Show at most 2 cards at a time (current and next)
  const visibleProfiles = profiles.slice(currentIndex, currentIndex + 2);

  return (
    <div className="relative w-full h-full border-2 border-red-500">
      <AnimatePresence>
        {visibleProfiles.map((profile, index) => (
          <div
            key={profile._id}
            className="absolute inset-0 border-2 border-blue-500"
            style={{
              zIndex: visibleProfiles.length - index
            }}
          >
            <ProfileCard
              profile={profile}
              onLike={index === 0 ? onLike : undefined}
              onDislike={index === 0 ? onDislike : undefined}
              isTop={index === 0}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ProfileStack;