import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorCategory from '../ErrorCategory';

describe('ErrorCategory Component', () => {
  const mockOnChange = jest.fn();
  const mockOnSelect = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Rendering', () => {
    test('renders title', () => {
      render(
        <ErrorCategory
          title="Chin Position"
          options={['Chin Normal', 'Chin Too High', 'Chin Too Low']}
          onChange={mockOnChange}
        />
      );
      
      expect(screen.getByText('Chin Position')).toBeInTheDocument();
    });
    
    test('renders all option buttons', () => {
      const options = ['Option 1', 'Option 2', 'Option 3'];
      
      render(
        <ErrorCategory
          title="Test Category"
          options={options}
          onChange={mockOnChange}
        />
      );
      
      options.forEach(option => {
        expect(screen.getByText(option)).toBeInTheDocument();
      });
    });
    
    test('buttons are in correct order', () => {
      const options = ['First', 'Second', 'Third'];
      
      render(
        <ErrorCategory
          title="Order Test"
          options={options}
          onChange={mockOnChange}
        />
      );
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveTextContent('First');
      expect(buttons[1]).toHaveTextContent('Second');
      expect(buttons[2]).toHaveTextContent('Third');
    });
    
    test('handles single option', () => {
      render(
        <ErrorCategory
          title="Single"
          options={['Only Option']}
          onChange={mockOnChange}
        />
      );
      
      expect(screen.getByText('Only Option')).toBeInTheDocument();
    });
    
    test('handles many options (10+)', () => {
      const manyOptions = Array.from({ length: 15 }, (_, i) => `Option ${i + 1}`);
      
      render(
        <ErrorCategory
          title="Many Options"
          options={manyOptions}
          onChange={mockOnChange}
        />
      );
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(15);
    });
  });
  
  describe('Color Logic', () => {
    test('first option shows purple when selected', () => {
      render(
        <ErrorCategory
          title="Color Test"
          options={['Normal', 'Error 1', 'Error 2']}
          value="Normal"
          onChange={mockOnChange}
        />
      );
      
      const normalButton = screen.getByText('Normal');
      expect(normalButton).toHaveClass('bg-violet-500');
      expect(normalButton).toHaveClass('text-white');
    });
    
    test('first option shows gray when not selected', () => {
      render(
        <ErrorCategory
          title="Color Test"
          options={['Normal', 'Error 1', 'Error 2']}
          value="Error 1"
          onChange={mockOnChange}
        />
      );
      
      const normalButton = screen.getByText('Normal');
      expect(normalButton).toHaveClass('bg-slate-50');
      expect(normalButton).toHaveClass('text-slate-600');
    });
    
    test('second option shows red when selected', () => {
      render(
        <ErrorCategory
          title="Color Test"
          options={['Normal', 'Error 1', 'Error 2']}
          value="Error 1"
          onChange={mockOnChange}
        />
      );
      
      const errorButton = screen.getByText('Error 1');
      expect(errorButton).toHaveClass('bg-red-500');
      expect(errorButton).toHaveClass('text-white');
    });
    
    test('third option shows red when selected', () => {
      render(
        <ErrorCategory
          title="Color Test"
          options={['Normal', 'Error 1', 'Error 2']}
          value="Error 2"
          onChange={mockOnChange}
        />
      );
      
      const errorButton = screen.getByText('Error 2');
      expect(errorButton).toHaveClass('bg-red-500');
      expect(errorButton).toHaveClass('text-white');
    });
    
    test('error options show gray when not selected', () => {
      render(
        <ErrorCategory
          title="Color Test"
          options={['Normal', 'Error 1', 'Error 2']}
          value="Normal"
          onChange={mockOnChange}
        />
      );
      
      const error1Button = screen.getByText('Error 1');
      const error2Button = screen.getByText('Error 2');
      
      expect(error1Button).toHaveClass('bg-slate-50');
      expect(error2Button).toHaveClass('bg-slate-50');
    });
    
    test('maintains color on re-render', () => {
      const { rerender } = render(
        <ErrorCategory
          title="Color Test"
          options={['Normal', 'Error 1']}
          value="Error 1"
          onChange={mockOnChange}
        />
      );
      
      const errorButton = screen.getByText('Error 1');
      expect(errorButton).toHaveClass('bg-red-500');
      
      rerender(
        <ErrorCategory
          title="Color Test"
          options={['Normal', 'Error 1']}
          value="Error 1"
          onChange={mockOnChange}
        />
      );
      
      expect(errorButton).toHaveClass('bg-red-500');
    });
  });
  
  describe('Selection Behavior', () => {
    test('calls onChange with selected option', () => {
      render(
        <ErrorCategory
          title="Selection Test"
          options={['Option 1', 'Option 2']}
          onChange={mockOnChange}
        />
      );
      
      fireEvent.click(screen.getByText('Option 2'));
      
      expect(mockOnChange).toHaveBeenCalledWith('Option 2');
    });
    
    test('calls onSelect with selected option', () => {
      render(
        <ErrorCategory
          title="Selection Test"
          options={['Option 1', 'Option 2']}
          onSelect={mockOnSelect}
        />
      );
      
      fireEvent.click(screen.getByText('Option 1'));
      
      expect(mockOnSelect).toHaveBeenCalledWith('Option 1');
    });
    
    test('calls both handlers when both provided', () => {
      render(
        <ErrorCategory
          title="Selection Test"
          options={['Option 1', 'Option 2']}
          onChange={mockOnChange}
          onSelect={mockOnSelect}
        />
      );
      
      fireEvent.click(screen.getByText('Option 2'));
      
      expect(mockOnChange).toHaveBeenCalledWith('Option 2');
      expect(mockOnSelect).toHaveBeenCalledWith('Option 2');
    });
    
    test('handles only onChange provided', () => {
      render(
        <ErrorCategory
          title="Selection Test"
          options={['Option 1', 'Option 2']}
          onChange={mockOnChange}
        />
      );
      
      fireEvent.click(screen.getByText('Option 1'));
      
      expect(mockOnChange).toHaveBeenCalledWith('Option 1');
    });
    
    test('handles neither handler provided', () => {
      render(
        <ErrorCategory
          title="Selection Test"
          options={['Option 1', 'Option 2']}
        />
      );
      
      // Should not throw error
      expect(() => {
        fireEvent.click(screen.getByText('Option 1'));
      }).not.toThrow();
    });
  });
  
  describe('Controlled vs Uncontrolled', () => {
    test('works as controlled with value prop', () => {
      const { rerender } = render(
        <ErrorCategory
          title="Controlled"
          options={['Option 1', 'Option 2']}
          value="Option 1"
          onChange={mockOnChange}
        />
      );
      
      expect(screen.getByText('Option 1')).toHaveClass('bg-violet-500');
      
      rerender(
        <ErrorCategory
          title="Controlled"
          options={['Option 1', 'Option 2']}
          value="Option 2"
          onChange={mockOnChange}
        />
      );
      
      expect(screen.getByText('Option 2')).toHaveClass('bg-red-500');
    });
    
    test('works as uncontrolled with selected prop', () => {
      render(
        <ErrorCategory
          title="Uncontrolled"
          options={['Option 1', 'Option 2']}
          selected="Option 2"
          onSelect={mockOnSelect}
        />
      );
      
      expect(screen.getByText('Option 2')).toHaveClass('bg-red-500');
    });
    
    test('value prop takes precedence over selected', () => {
      render(
        <ErrorCategory
          title="Precedence"
          options={['Option 1', 'Option 2']}
          value="Option 1"
          selected="Option 2"
          onChange={mockOnChange}
        />
      );
      
      expect(screen.getByText('Option 1')).toHaveClass('bg-violet-500');
      expect(screen.getByText('Option 2')).not.toHaveClass('bg-red-500');
    });
  });
  
  describe('User Interaction', () => {
    test('responds to click events', () => {
      render(
        <ErrorCategory
          title="Click Test"
          options={['Option 1', 'Option 2']}
          onChange={mockOnChange}
        />
      );
      
      fireEvent.click(screen.getByText('Option 1'));
      fireEvent.click(screen.getByText('Option 2'));
      
      expect(mockOnChange).toHaveBeenCalledTimes(2);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 'Option 1');
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 'Option 2');
    });
    
    test('handles rapid clicking', () => {
      render(
        <ErrorCategory
          title="Rapid Click"
          options={['Option 1']}
          onChange={mockOnChange}
        />
      );
      
      const button = screen.getByText('Option 1');
      
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });
    
    test('handles double-clicking same option', () => {
      render(
        <ErrorCategory
          title="Double Click"
          options={['Option 1', 'Option 2']}
          onChange={mockOnChange}
        />
      );
      
      const button = screen.getByText('Option 1');
      
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(mockOnChange).toHaveBeenCalledTimes(2);
      expect(mockOnChange).toHaveBeenCalledWith('Option 1');
    });
  });
  
  describe('Edge Cases', () => {
    test('handles very long option text', () => {
      const longText = 'This is a very long option text that might wrap to multiple lines in the UI';
      
      render(
        <ErrorCategory
          title="Long Text"
          options={['Short', longText]}
          onChange={mockOnChange}
        />
      );
      
      expect(screen.getByText(longText)).toBeInTheDocument();
    });
    
    test('handles special characters in options', () => {
      const specialText = 'Option with @#$% special !@# characters';
      
      render(
        <ErrorCategory
          title="Special"
          options={[specialText]}
          onChange={mockOnChange}
        />
      );
      
      expect(screen.getByText(specialText)).toBeInTheDocument();
    });
    
    test('handles unicode text', () => {
      const unicodeText = '选项 中文测试';
      
      render(
        <ErrorCategory
          title="Unicode"
          options={[unicodeText]}
          onChange={mockOnChange}
        />
      );
      
      expect(screen.getByText(unicodeText)).toBeInTheDocument();
    });
  });
});
