import React from 'react';
// import { useSelector } from 'react-redux';

const Home = () => {
//   const { user } = useSelector((state) => state.auth);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {/* Welcome back{user?.name ? `, ${user.name}` : ''} */}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Content cards will go here */}
          <div className="bg-background-elevated p-4 rounded-lg">
            <h2 className="text-lg font-semibold">Your Top Matches</h2>
            {/* Match content will go here */}
          </div>
          
          <div className="bg-background-elevated p-4 rounded-lg">
            <h2 className="text-lg font-semibold">Recent Messages</h2>
            {/* Messages preview will go here */}
          </div>
          
          <div className="bg-background-elevated p-4 rounded-lg">
            <h2 className="text-lg font-semibold">Music Compatibility</h2>
            {/* Music stats will go here */}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;