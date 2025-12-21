// Mock for DICOM service during Jest tests
// This avoids the import.meta.url issue in CommonJS environment

export function isDicomFile(filePath: string): boolean {
  const ext = filePath.toLowerCase();
  return ext.endsWith('.dcm') || ext.endsWith('.dicom');
}

export function isDicomData(base64Data: string): boolean {
  try {
    const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const buffer = Buffer.from(base64, 'base64');
    
    if (buffer.length >= 132) {
      const magic = buffer.slice(128, 132).toString('ascii');
      return magic === 'DICM';
    }
    return false;
  } catch {
    return false;
  }
}

export async function convertDicomToImage(_inputPath: string, _outputPath: string): Promise<string> {
  throw new Error('Not implemented in test environment');
}

export async function convertDicomBase64ToImage(_base64Data: string, _outputPath: string): Promise<string> {
  throw new Error('Not implemented in test environment');
}
