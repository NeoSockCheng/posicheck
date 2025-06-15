import React from 'react';

type ButtonProps = {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string; // Allows for extending classes
  disabled?: boolean; // Allow disabled state
};

const Button: React.FC<ButtonProps> = ({ onClick, children, className, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`mt-6 font-semibold px-6 py-2 rounded-full transition ${
        disabled
          ? 'bg-gray-400 cursor-not-allowed text-gray-200'
          : 'bg-violet-600 hover:bg-violet-700 text-white'
      } ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
