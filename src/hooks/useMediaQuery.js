import { useState, useEffect } from 'react';

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const updateMatch = (e) => setMatches(e.matches);
    
    // Set initial value
    setMatches(media.matches);

    // Setup listener
    media.addEventListener('change', updateMatch);
    
    // Cleanup
    return () => media.removeEventListener('change', updateMatch);
  }, [query]);

  return matches;
};

export default useMediaQuery;