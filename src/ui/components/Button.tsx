import React from 'react';

type ButtonProps = {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string; // Allows for extending classes
};

const Button: React.FC<ButtonProps> = ({ onClick, children, className }) => {
  return (
    <button
      onClick={onClick}
      className={`mt-6 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2 rounded-full transition ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
