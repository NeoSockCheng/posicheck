import React from 'react';

type NavItemButtonProps = {
  icon: React.ElementType;
  isSelected: boolean;
  onClick: () => void;
};

const NavItemButton: React.FC<NavItemButtonProps> = ({ icon: Icon, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-15 h-10 transition"
    >
      <Icon size={20} className={isSelected ? 'text-violet-500' : 'text-slate-400'} />
    </button>
  );
};

export default NavItemButton;
