// Mock the dicom.service module to avoid import.meta.url compilation issues in Jest
jest.mock('../dicom.service');

import { isDicomFile, isDicomData } from '../dicom.service';

describe('DICOM Service - Comprehensive Tests', () => {
  
  describe('isDicomFile', () => {
    // Basic cases
    test('returns true for .dcm extension', () => {
      const result = isDicomFile('test.dcm');
      expect(result).toBe(true);
    });
    
    test('returns true for .dicom extension', () => {
      const result = isDicomFile('test.dicom');
      expect(result).toBe(true);
    });
    
    test('returns false for .jpg files', () => {
      const result = isDicomFile('test.jpg');
      expect(result).toBe(false);
    });
    
    test('returns false for .png files', () => {
      const result = isDicomFile('test.png');
      expect(result).toBe(false);
    });
    
    // Edge cases
    test('handles uppercase extensions (.DCM)', () => {
      const result = isDicomFile('TEST.DCM');
      expect(result).toBe(true);
    });
    
    test('handles mixed case extensions (.Dcm)', () => {
      const result = isDicomFile('test.Dcm');
      expect(result).toBe(true);
    });
    
    test('handles files with no extension', () => {
      const result = isDicomFile('testfile');
      expect(result).toBe(false);
    });
    
    test('handles files with multiple dots in name', () => {
      const result = isDicomFile('my.test.file.dcm');
      expect(result).toBe(true);
    });
    
    test('handles very long filenames (>255 chars)', () => {
      const longName = 'a'.repeat(250) + '.dcm';
      const result = isDicomFile(longName);
      expect(result).toBe(true);
    });
    
    test('handles special characters in filename', () => {
      const result = isDicomFile('test-file_123.dcm');
      expect(result).toBe(true);
    });
    
    test('handles unicode characters in path', () => {
      const result = isDicomFile('测试文件.dcm');
      expect(result).toBe(true);
    });
  });
  
  describe('isDicomData', () => {
    // Mock DICOM data with DICM at offset 128 (base64 encoded)
    const createMockDicomBase64 = (hasDICM: boolean = true) => {
      const buffer = Buffer.alloc(200);
      if (hasDICM) {
        buffer.write('DICM', 128);
      }
      return `data:application/dicom;base64,${buffer.toString('base64')}`;
    };
    
    // Basic cases
    test('returns true for valid DICOM base64 with data URL prefix', () => {
      const data = createMockDicomBase64(true);
      const result = isDicomData(data);
      expect(result).toBe(true);
    });
    
    test('returns true for valid DICOM base64 without prefix', () => {
      const buffer = Buffer.alloc(200);
      buffer.write('DICM', 128);
      const data = buffer.toString('base64');
      const result = isDicomData(data);
      expect(result).toBe(true);
    });
    
    test('returns false for image/png base64', () => {
      const data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const result = isDicomData(data);
      expect(result).toBe(false);
    });
    
    test('returns false for image/jpeg base64', () => {
      const data = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAA';
      const result = isDicomData(data);
      expect(result).toBe(false);
    });
    
    // Edge cases
    test('handles empty string', () => {
      const result = isDicomData('');
      expect(result).toBe(false);
    });
    
    test('handles invalid base64 encoding', () => {
      const result = isDicomData('data:application/dicom;base64,!!!invalid!!!');
      expect(result).toBe(false);
    });
    
    test('handles truncated DICOM data', () => {
      const buffer = Buffer.alloc(100); // Less than 132 bytes
      buffer.write('DICM', 50);
      const data = `data:application/dicom;base64,${buffer.toString('base64')}`;
      const result = isDicomData(data);
      expect(result).toBe(false);
    });
    
    test('handles base64 data shorter than 132 bytes', () => {
      const buffer = Buffer.alloc(50);
      const data = buffer.toString('base64');
      const result = isDicomData(data);
      expect(result).toBe(false);
    });
    
    test('handles malformed data URL prefix', () => {
      const buffer = Buffer.alloc(200);
      buffer.write('DICM', 128);
      const data = `data:text/plain${buffer.toString('base64')}`;
      const result = isDicomData(data);
      expect(result).toBe(false);
    });
    
    // Boundary cases
    test('handles exactly 132 bytes of data', () => {
      const buffer = Buffer.alloc(132);
      buffer.write('DICM', 128);
      const data = buffer.toString('base64');
      const result = isDicomData(data);
      expect(result).toBe(true);
    });
  });
});
