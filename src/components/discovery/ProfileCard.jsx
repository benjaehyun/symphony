import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Music2 } from 'lucide-react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';

const SWIPE_THRESHOLD = 200;
const SWIPE_VELOCITY = 500;

const ProfileCard = ({ 
  profile, 
  onLike, 
  onDislike, 
  isTop = false 
}) => {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const controls = useAnimation();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    // Transform values
    const rotate = useTransform(x, [-200, 200], [-20, 20]);
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const dislikeOpacity = useTransform(x, [-100, 0], [1, 0]);
    const scale = useTransform(
        x,
        [-200, 0, 200],
        [0.9, 1, 0.9]
    );

    const handleDragEnd = async (event, info) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        if (Math.abs(velocity) >= SWIPE_VELOCITY || Math.abs(offset) > SWIPE_THRESHOLD) {
        const direction = offset > 0;
        
        await controls.start({
            x: direction ? 1000 : -1000,
            y: 0,
            scale: 0.8,
            transition: { duration: 0.4 }
        });
        
        if (direction) {
            onLike?.();
        } else {
            onDislike?.();
        }
        } else {
        controls.start({
            x: 0,
            y: 0,
            scale: 1,
            transition: { type: 'spring', stiffness: 300, damping: 20 }
        });
        }
    };

    // Card appearance/exit animations
    const cardVariants = {
        enter: {
        scale: 0.9,
        opacity: 0,
        y: 100
        },
        center: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3
        }
        },
        exit: {
        scale: 0.9,
        opacity: 0,
        transition: {
            duration: 0.2
        }
        }
    };

    const nextPhoto = (e) => {
        e.stopPropagation(); // Prevent triggering parent click handlers
        if (currentPhotoIndex < profile.photos.length - 1) {
          setCurrentPhotoIndex(prev => prev + 1);
        }
    };
    
    const prevPhoto = (e) => {
        e.stopPropagation();
        if (currentPhotoIndex > 0) {
            setCurrentPhotoIndex(prev => prev - 1);
        }
    };

    return (
        <motion.div
        className="absolute inset-0 w-full h-full touch-none"
        style={{ x, y, scale, rotate }}
        drag={isTop ? "x" : false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={false}
        >
            <Card className="relative w-full h-full overflow-hidden bg-background">
                <div className="absolute inset-0">
                {/* Photos Container */}
                <div className="relative w-full h-full">
                    {/* Photo Navigation Areas */}
                    <div 
                    className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
                    onClick={prevPhoto}
                    />
                    <div 
                    className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
                    onClick={nextPhoto}
                    />

                    {/* Current Photo */}
                    <motion.img 
                    key={currentPhotoIndex}
                    src={profile.photos[currentPhotoIndex]?.url}
                    alt={`${profile.name}'s photo ${currentPhotoIndex + 1}`}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    />

                    {/* Photo Navigation Dots */}
                    <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                    {profile.photos.map((_, index) => (
                        <button
                        key={index}
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentPhotoIndex(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-colors 
                            ${index === currentPhotoIndex 
                            ? 'bg-white' 
                            : 'bg-white/50 hover:bg-white/75'}`}
                        aria-label={`Go to photo ${index + 1}`}
                        />
                    ))}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                {/* Like/Dislike Indicators remain the same */}
                {isTop && (
                    <>
                    <motion.div
                        className="absolute top-6 right-6 z-20 text-spotify-green border-4 
                                border-spotify-green rounded-md px-4 py-2 font-bold text-2xl 
                                transform rotate-12"
                        style={{ opacity: likeOpacity }}
                    >
                        LIKE
                    </motion.div>
                    <motion.div
                        className="absolute top-6 left-6 z-20 text-rose-500 border-4 
                                border-rose-500 rounded-md px-4 py-2 font-bold text-2xl 
                                transform -rotate-12"
                        style={{ opacity: dislikeOpacity }}
                    >
                        NOPE
                    </motion.div>
                    </>
                )}

                {/* Profile Info remains the same */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <h2 className="text-2xl font-bold text-white">
                    {profile.name}, {profile.age}
                    </h2>
                    <p className="text-white/80 mt-2 line-clamp-3">{profile.bio}</p>
                    
                    <div className="mt-4 flex items-center gap-2 text-white/60">
                    <Music2 className="w-4 h-4" />
                    <span className="text-sm">
                        {profile.music.sourceType === 'playlist' ? 'Playlist' : 'Top Tracks'}
                    </span>
                    </div>
                </div>
                </div>
            </Card>
        </motion.div>
    );
};

const NoMoreProfiles = () => (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center p-4">
        <div className="w-16 h-16 mb-6 rounded-full bg-background-elevated flex items-center justify-center">
            <Music2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No More Profiles</h2>
        <p className="text-muted-foreground">
            Check back later for new music matches
        </p>
    </div>
);

export { ProfileCard, NoMoreProfiles };