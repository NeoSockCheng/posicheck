import { useState } from 'react';
import { FaHome, FaSearch, FaHistory, FaComment, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { logo } from '../assets/assets.ts';
import Modal from './Modal';

const navItemsTop = [
  { id: 'home', icon: FaHome, label: 'Home' },
  { id: 'detection', icon: FaSearch, label: 'Detection' },
  { id: 'history', icon: FaHistory, label: 'History' },
  { id: 'feedback', icon: FaComment, label: 'Feedback' },
];

const navItemsBottom = [
  { id: 'profile', icon: FaUser, label: 'Profile' },
  { id: 'logout', icon: FaSignOutAlt, label: 'Exit' },
];

type SidebarProps = {
  selected: string;
  onSelect: (page: string) => void;
};

export default function Sidebar({ selected, onSelect }: SidebarProps) {
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  
  const handleExitClick = () => {
    setShowExitConfirmation(true);
  };
  
  const confirmExit = () => {
    window.electron.exitApp();
  };
  
  const cancelExit = () => {
    setShowExitConfirmation(false);
  };

  const handleNavClick = (id: string) => {
    if (id === 'logout') {
      handleExitClick();
    } else {
      onSelect(id);
    }
  };

  return (
    <>
      {/* Expandable Sidebar */}
      <aside className="hidden md:flex flex-col w-20 hover:w-56 bg-white border-r border-gray-200 shadow-sm items-start py-6 px-3 transition-all duration-300 ease-in-out group">
        
        {/* Logo + Brand */}
        <div className="mb-8 flex items-center gap-3 w-full">
          <div className="min-w-[56px] h-14 flex items-center justify-center bg-gradient-to-br from-violet-100 to-indigo-100 rounded-xl">
            <img src={logo} alt="PosiCheck" className="w-10 h-10" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            PosiCheck
          </span>
        </div>

        {/* Top Navigation */}
        <nav className="flex flex-col gap-2 flex-1 w-full">
          {navItemsTop.map((item) => {
            const Icon = item.icon;
            const isSelected = selected === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 w-full ${
                  isSelected
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} className="min-w-[20px]" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="w-full border-t border-gray-200 my-4" />

        {/* Bottom Navigation */}
        <div className="flex flex-col gap-2 w-full">
          {navItemsBottom.map((item) => {
            const Icon = item.icon;
            const isSelected = selected === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 w-full ${
                  isSelected
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} className="min-w-[20px]" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}
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
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={confirmExit}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Exit Application
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center py-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <FaSignOutAlt size={32} className="text-red-500" />
          </div>
          <p className="text-gray-700 mb-2 text-center font-medium">Are you sure you want to exit PosiCheck?</p>
          <p className="text-gray-500 text-sm text-center">Any unsaved changes will be lost.</p>
        </div>
      </Modal>
    </>
  );
}
