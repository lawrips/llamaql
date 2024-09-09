import React from 'react';

const LoadingOverlay = ({ loading }) => {
  if (!loading) return null;

  return (
    <div className="overlay">
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingOverlay;