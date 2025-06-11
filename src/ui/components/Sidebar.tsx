import { FaHome, FaSearch, FaHistory, FaComment, FaUser, FaSignOutAlt } from 'react-icons/fa';

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
  const renderNavButton = (item: { id: string; icon: React.ElementType }) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => onSelect(item.id)}
        className="flex items-center justify-center w-15 h-10 transition"
      >
        <Icon size={20} className={selected === item.id ? 'text-purple-600' : 'text-gray-400'} />
      </button>
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-20 bg-white border-r border-gray-200 shadow items-center py-4 text-purple-600">
      {/* App Logo or Home */}
      <div className="mb-6">
        <FaHome size={24} />
      </div>

      {/* Top Navigation */}
      <nav className="flex flex-col gap-6 flex-1">
        {navItemsTop.map(renderNavButton)}
      </nav>

      {/* Bottom Navigation */}
      <div className="flex flex-col gap-4 mb-4">
        {navItemsBottom.map(renderNavButton)}
      </div>
    </aside>
  );
}
