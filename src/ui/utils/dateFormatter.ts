/**
 * Format a timestamp to a human-readable date string
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted date string (e.g., "June 15, 2025 10:34 AM")
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a timestamp to a short date string
 * @param timestamp Unix timestamp in milliseconds
 * @returns Short formatted date string (e.g., "06/15/2025")
 */
export function formatShortDate(timestamp: number): string {
  const date = new Date(timestamp);
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format a timestamp to a time string
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted time string (e.g., "10:34 AM")
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Calculate how long ago a timestamp was
 * @param timestamp Unix timestamp in milliseconds
 * @returns Human-readable relative time (e.g., "2 hours ago")
 */
export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  let interval = Math.floor(seconds / 31536000); // years
  if (interval >= 1) {
    return interval === 1 ? '1 year ago' : `${interval} years ago`;
  }
  
  interval = Math.floor(seconds / 2592000); // months
  if (interval >= 1) {
    return interval === 1 ? '1 month ago' : `${interval} months ago`;
  }
  
  interval = Math.floor(seconds / 86400); // days
  if (interval >= 1) {
    return interval === 1 ? '1 day ago' : `${interval} days ago`;
  }
  
  interval = Math.floor(seconds / 3600); // hours
  if (interval >= 1) {
    return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  }
  
  interval = Math.floor(seconds / 60); // minutes
  if (interval >= 1) {
    return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
  }
  
  return seconds < 10 ? 'just now' : `${seconds} seconds ago`;
}
