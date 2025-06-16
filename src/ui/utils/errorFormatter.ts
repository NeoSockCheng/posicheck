// This utility provides consistent error name mapping across the application
export const errorNamesMapping: Record<string, string> = {
  'chin_high': 'Chin Too High',
  'chin_low': 'Chin Too Low',
  'pos_forward': 'Position Too Forward',
  'pos_backward': 'Position Too Backward',
  'head_tilt': 'Head Tilt',
  'head_rotate': 'Head Rotation',
  'tongue_fail': 'Tongue Not Against Palate',
  'slumped_pos': 'Slumped Position',
  'movement': 'Patient Movement',
  'no_bite_block': 'Missing Bite Block'
};

/**
 * Converts a technical error key to a user-friendly error name
 * @param errorKey The technical error key (e.g., "chin_high")
 * @returns A user-friendly error name (e.g., "Chin Too High")
 */
export function getFriendlyErrorName(errorKey: string): string {
  return errorNamesMapping[errorKey] || 
    errorKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Formats prediction data into a user-friendly error string
 * @param predictionData Object containing error keys and confidence values
 * @param threshold Optional confidence threshold (default: 0.5)
 * @returns Comma-separated string of user-friendly error names
 */
export function formatErrorString(predictionData: Record<string, number>, threshold = 0.5): string {
  const significantErrors = Object.entries(predictionData)
    .filter(([_, value]) => value > threshold)
    .map(([key]) => getFriendlyErrorName(key))
    .join(', ');
  
  return significantErrors || 'No significant errors detected';
}
