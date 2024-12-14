export const generateRoomId = (profileId1, profileId2) => {
    // Sort IDs to ensure consistent order regardless of which profile is the current user
    const sortedIds = [profileId1, profileId2].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`;
  };
  
  // Helper to get room ID from a match object
  export const getRoomIdFromMatch = (currentProfileId, match) => {
    return generateRoomId(
      currentProfileId,
      match.matchedProfile
    );
  };
  
  export default {
    generateRoomId,
    getRoomIdFromMatch
  };