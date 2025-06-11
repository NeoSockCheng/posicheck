import React from 'react';

type HeaderProps = {
  title: string;
  subtitle?: string;
};

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="flex items-center gap-4 mb-6 px-4 py-4 bg-white rounded shadow">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-violet-600">{title}</h2>
        {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
      </div>
    </div>
  );
};

export default Header;
