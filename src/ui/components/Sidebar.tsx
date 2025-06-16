import { useState } from 'react';
import { FaHome, FaSearch, FaHistory, FaComment, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { logo } from '../assets/assets.ts';
import NavItemButton from './NavItemButton'; // ✅ Import the new component
import Modal from './Modal';

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
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  
  // Handle exit app button click
  const handleExitClick = () => {
    setShowExitConfirmation(true);
  };
  
  // Handle actual exit
  const confirmExit = () => {
    window.electron.exitApp();
  };
  
  // Close modal without exiting
  const cancelExit = () => {
    setShowExitConfirmation(false);
  };

  // Handle nav item clicks
  const handleNavClick = (id: string) => {
    if (id === 'logout') {
      handleExitClick();
    } else {
      onSelect(id);
    }
  };  return (
    <>
      <aside className="hidden md:flex flex-col w-20 bg-white border-r border-gray-200 shadow items-center py-4 text-indigo-600">
        {/* Logo */}
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
              onClick={() => handleNavClick(item.id)}
            />
          ))}
        </nav>        {/* Bottom Navigation */}
        <div className="flex flex-col gap-4 mb-4">
          {navItemsBottom.map((item) => (
            <NavItemButton
              key={item.id}
              icon={item.icon}
              isSelected={selected === item.id}
              onClick={() => handleNavClick(item.id)}
            />
          ))}
        </div>
      </aside>

      {/* Exit Confirmation Modal */}
      <Modal 
        isOpen={showExitConfirmation}
        onClose={cancelExit}
        title="Confirm Exit"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              onClick={cancelExit}
              className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmExit}
              className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Exit Application
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center py-4">
          <div className="text-red-500 mb-4">
            <FaSignOutAlt size={32} />
          </div>
          <p className="text-gray-700 mb-2 text-center">Are you sure you want to exit PosiCheck?</p>
          <p className="text-gray-500 text-sm text-center">Any unsaved changes will be lost.</p>
        </div>
      </Modal>
    </>
  );
}
