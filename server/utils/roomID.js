const generateRoomId = (profileId1, profileId2) => {
    // Sort IDs to ensure alphabetically for consistency
    const sortedIds = [profileId1, profileId2].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`;
  };
  
  module.exports = { generateRoomId };