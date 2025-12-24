import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InputField from '../InputField';

describe('InputField Component', () => {
  const mockOnChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Text Input', () => {
    test('renders label', () => {
      render(<InputField label="Username" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Username')).toBeInTheDocument();
    });
    
    test('displays current value', () => {
      render(<InputField label="Name" value="John Doe" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('John Doe');
    });
    
    test('calls onChange when user types', async () => {
      render(<InputField label="Name" value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'A');
      expect(mockOnChange).toHaveBeenCalled();
    });
  });
  
  describe('Textarea', () => {
    test('renders textarea when textarea=true', () => {
      render(<InputField label="Comments" value="" onChange={mockOnChange} textarea={true} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.tagName).toBe('TEXTAREA');
    });
  });
});
