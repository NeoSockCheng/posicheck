import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from '../Sidebar';

// Mock logo import
jest.mock('../../assets/assets.ts', () => ({
  logo: 'mock-logo.png'
}));

// Mock window.electron
const mockExitApp = jest.fn();
(global as any).window = {
  electron: {
    exitApp: mockExitApp
  }
};

describe('Sidebar Component', () => {
  const mockOnSelect = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Rendering', () => {
    test('renders logo and brand name', () => {
      render(<Sidebar selected="home" onSelect={mockOnSelect} />);
      
      const logo = screen.getByAltText('PosiCheck');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'mock-logo.png');
      expect(screen.getByText('PosiCheck')).toBeInTheDocument();
    });
    
    test('renders all navigation items', () => {
      render(<Sidebar selected="home" onSelect={mockOnSelect} />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Detection')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Feedback')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Exit')).toBeInTheDocument();
    });
  });
  
  describe('Navigation', () => {
    test('highlights selected item', () => {
      render(<Sidebar selected="home" onSelect={mockOnSelect} />);
      
      const homeButton = screen.getByText('Home').closest('button');
      expect(homeButton).toHaveClass('from-violet-500');
    });
    
    test('calls onSelect when item is clicked', async () => {
      render(<Sidebar selected="detection" onSelect={mockOnSelect} />);
      
      const homeButton = screen.getByText('Home').closest('button');
      await userEvent.click(homeButton!);
      
      expect(mockOnSelect).toHaveBeenCalledWith('home');
    });
  });
  
  describe('Exit Modal', () => {
    test('shows modal when exit is clicked', async () => {
      render(<Sidebar selected="home" onSelect={mockOnSelect} />);
      
      const exitButton = screen.getByText('Exit').closest('button');
      await userEvent.click(exitButton!);
      
      expect(screen.getByText('Confirm Exit')).toBeInTheDocument();
    });
  });
});
