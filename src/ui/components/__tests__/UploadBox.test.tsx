import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadBox, { type UploadBoxHandle } from '../UploadBox';

describe('UploadBox Component', () => {
  const mockOnFileSelect = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Rendering', () => {
    test('renders upload prompt when no file is selected', () => {
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} />);
      
      expect(screen.getByText(/Upload or Drag and Drop your Panoramic Radiographs/i)).toBeInTheDocument();
      expect(screen.getByText(/Max File Size: 20MB/i)).toBeInTheDocument();
    });
    
    test('shows correct file type restrictions', () => {
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} />);
      
      expect(screen.getByText(/Supported: .jpeg, .png, .dcm/i)).toBeInTheDocument();
    });
    
    test('displays upload icon', () => {
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} />);
      
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
    
    test('displays image preview for regular images', () => {
      const testFile = {
        name: 'test.jpg',
        data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
      };
      
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} selectedFile={testFile} />);
      
      const img = screen.getByAltText('Preview');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', testFile.data);
    });
    
    test('shows DICOM icon for .dcm files', () => {
      const testFile = {
        name: 'test.dcm',
        data: 'data:application/dicom;base64,ABC123=='
      };
      
      render(<UploadBox usage="feedback" onFileSelect={mockOnFileSelect} selectedFile={testFile} />);
      
      expect(screen.getByText('DICOM File Selected')).toBeInTheDocument();
      expect(screen.getByText('test.dcm')).toBeInTheDocument();
    });
    
    test('displays filename below preview', () => {
      const testFile = {
        name: 'my-image.jpg',
        data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
      };
      
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} selectedFile={testFile} />);
      
      expect(screen.getByText('my-image.jpg')).toBeInTheDocument();
    });
  });
  
  describe('File Upload', () => {
    test('accepts .jpg files', async () => {
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} />);
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await userEvent.upload(input, file);
      
      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalled();
      });
    });
    
    test('accepts .png files', async () => {
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} />);
      
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await userEvent.upload(input, file);
      
      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalled();
      });
    });
    
    test('accepts .dcm files', async () => {
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} />);
      
      const file = new File(['test'], 'test.dcm', { type: 'application/dicom' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await userEvent.upload(input, file);
      
      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalled();
      });
    });
    
    test('handles uppercase extensions (.JPG)', async () => {
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} />);
      
      const file = new File(['test'], 'TEST.JPG', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await userEvent.upload(input, file);
      
      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalled();
      });
    });
    
    test('handles files with special characters', async () => {
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} />);
      
      const file = new File(['test'], 'test-file_123.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await userEvent.upload(input, file);
      
      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalled();
        const callArg = mockOnFileSelect.mock.calls[0][0];
        expect(callArg.name).toBe('test-file_123.jpg');
      });
    });
  });
  
  describe('updatePreview Method', () => {
    test('updates preview with new image data', () => {
      const ref = React.createRef<UploadBoxHandle>();
      
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} ref={ref} />);
      
      const newImageData = 'data:image/png;base64,iVBORw0KGgo=';
      ref.current?.updatePreview(newImageData, 'new-image.png');
      
      expect(screen.getByAltText('Preview')).toHaveAttribute('src', newImageData);
      expect(screen.getByText('new-image.png')).toBeInTheDocument();
    });
    
    test('updates filename', () => {
      const ref = React.createRef<UploadBoxHandle>();
      
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} ref={ref} />);
      
      ref.current?.updatePreview('data:image/png;base64,ABC==', 'test-name.png');
      
      expect(screen.getByText('test-name.png')).toBeInTheDocument();
    });
    
    test('handles base64 data URLs', () => {
      const ref = React.createRef<UploadBoxHandle>();
      
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} ref={ref} />);
      
      const dataUrl = 'data:image/jpeg;base64,/9j/4AAQ==';
      ref.current?.updatePreview(dataUrl, 'image.jpg');
      
      const img = screen.getByAltText('Preview');
      expect(img).toHaveAttribute('src', dataUrl);
    });
  });
  
  describe('selectedFile Prop', () => {
    test('initializes with selectedFile data', () => {
      const testFile = {
        name: 'initial.jpg',
        data: 'data:image/jpeg;base64,/9j/=='
      };
      
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} selectedFile={testFile} />);
      
      expect(screen.getByAltText('Preview')).toBeInTheDocument();
      expect(screen.getByText('initial.jpg')).toBeInTheDocument();
    });
    
    test('updates when selectedFile prop changes', () => {
      const testFile1 = {
        name: 'first.jpg',
        data: 'data:image/jpeg;base64,FIRST=='
      };
      
      const testFile2 = {
        name: 'second.jpg',
        data: 'data:image/jpeg;base64,SECOND=='
      };
      
      const { rerender } = render(
        <UploadBox usage="inference" onFileSelect={mockOnFileSelect} selectedFile={testFile1} />
      );
      
      expect(screen.getByText('first.jpg')).toBeInTheDocument();
      
      rerender(
        <UploadBox usage="inference" onFileSelect={mockOnFileSelect} selectedFile={testFile2} />
      );
      
      expect(screen.getByText('second.jpg')).toBeInTheDocument();
    });
  });
  
  describe('clearPreview Method', () => {
    test('clears preview state', () => {
      const ref = React.createRef<UploadBoxHandle>();
      const testFile = {
        name: 'test.jpg',
        data: 'data:image/jpeg;base64,/9j/=='
      };
      
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} selectedFile={testFile} ref={ref} />);
      
      expect(screen.getByAltText('Preview')).toBeInTheDocument();
      
      ref.current?.clearPreview();
      
      expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
      expect(screen.getByText(/Upload or Drag and Drop/i)).toBeInTheDocument();
    });
    
    test('clears filename', () => {
      const ref = React.createRef<UploadBoxHandle>();
      const testFile = {
        name: 'test.jpg',
        data: 'data:image/jpeg;base64,/9j/=='
      };
      
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} selectedFile={testFile} ref={ref} />);
      
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
      
      ref.current?.clearPreview();
      
      expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
    });
  });
  
  describe('triggerUpload Method', () => {
    test('opens file dialog', () => {
      const ref = React.createRef<UploadBoxHandle>();
      
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} ref={ref} />);
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = jest.spyOn(input, 'click');
      
      ref.current?.triggerUpload();
      
      expect(clickSpy).toHaveBeenCalled();
    });
  });
  
  describe('Inference vs Feedback Mode', () => {
    test('inference mode: allows file selection', async () => {
      render(<UploadBox usage="inference" onFileSelect={mockOnFileSelect} />);
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await userEvent.upload(input, file);
      
      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalled();
      });
    });
    
    test('feedback mode: allows file selection', async () => {
      render(<UploadBox usage="feedback" onFileSelect={mockOnFileSelect} />);
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await userEvent.upload(input, file);
      
      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalled();
      });
    });
  });
});
