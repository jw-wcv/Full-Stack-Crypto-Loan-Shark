import React from 'react';

type CardProps = {
  children: React.ReactNode; // This type is for any valid React child
};

const Card: React.FC<CardProps> = ({ children }) => {
  return (
    <div className="card">
      {children}
    </div>
  );
};

export default Card;
