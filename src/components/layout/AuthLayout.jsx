import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-spotify-green">Symphony</h1>
          <p className="text-muted-foreground mt-2">Find your musical match</p>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;