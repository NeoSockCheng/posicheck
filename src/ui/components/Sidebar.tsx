import { FaHome, FaSearch, FaHistory, FaComment, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { logo } from '../assets/assets.ts';
import NavItemButton from './NavItemButton'; // ✅ Import the new component

const navItemsTop = [
  { id: 'home', icon: FaHome },
  { id: 'detection', icon: FaSearch },
  { id: 'history', icon: FaHistory },
  { id: 'feedback', icon: FaComment },
];

const navItemsBottom = [
  { id: 'profile', icon: FaUser },
  { id: 'logout', icon: FaSignOutAlt },
];

type SidebarProps = {
  selected: string;
  onSelect: (page: string) => void;
};

export default function Sidebar({ selected, onSelect }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-20 bg-white border-r border-gray-200 shadow items-center py-4 text-indigo-600">
      {/* App Logo */}
      <div className="mb-6">
        <img src={logo} alt="Logo" sizes='24'/>
      </div>

      {/* Top Navigation */}
      <nav className="flex flex-col gap-6 flex-1">
        {navItemsTop.map((item) => (
          <NavItemButton
            key={item.id}
            icon={item.icon}
            isSelected={selected === item.id}
            onClick={() => onSelect(item.id)}
          />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="flex flex-col gap-4 mb-4">
        {navItemsBottom.map((item) => (
          <NavItemButton
            key={item.id}
            icon={item.icon}
            isSelected={selected === item.id}
            onClick={() => onSelect(item.id)}
          />
        ))}
      </div>
    </aside>
  );
}
