import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MatchPhotos = ({ match }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const profile = match.matchedProfile;

  return (
    <div className="relative w-full h-full">
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
      
      {/* Photo navigation dots */}
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

      {/* Navigation areas */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
        onClick={() => currentPhotoIndex > 0 && setCurrentPhotoIndex(prev => prev - 1)}
      />
      <div 
        className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
        onClick={() => currentPhotoIndex < profile.photos.length - 1 && setCurrentPhotoIndex(prev => prev + 1)}
      />

      {/* Profile info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <h2 className="text-2xl font-bold text-white">
          {profile.name}, {profile.age}
        </h2>
        <p className="text-white/80 mt-2">{profile.bio}</p>
      </div>
    </div>
  );
};

export default MatchPhotos;