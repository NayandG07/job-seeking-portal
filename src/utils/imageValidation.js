// Maximum file size: 5MB (more generous for images than resumes)
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Recommended image size for optimal display: 200KB
export const RECOMMENDED_IMAGE_SIZE = 200 * 1024; // 200KB in bytes

// Allowed image types for logos
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/svg+xml',
  'image/webp',
];

// File extension mapping
export const IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
};

// Minimum and maximum dimensions
export const MIN_DIMENSIONS = { width: 100, height: 100 };
export const MAX_DIMENSIONS = { width: 2000, height: 2000 };

/**
 * Validate a logo image file
 */
export async function validateLogoImage(file) {
  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(MAX_IMAGE_SIZE)})`,
    };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      code: 'INVALID_FILE_TYPE',
      message: `File type "${file.type}" is not supported. Please upload a JPG, PNG, SVG, or WebP image.`,
    };
  }

  // Check file extension as additional validation
  const extension = getFileExtension(file.name);
  const expectedExtension = IMAGE_EXTENSIONS[file.type];
  
  if (extension !== expectedExtension && !(extension === 'jpeg' && expectedExtension === 'jpg')) {
    return {
      code: 'EXTENSION_MISMATCH',
      message: `File extension "${extension}" doesn't match the file type. Expected "${expectedExtension}".`,
    };
  }

  // For non-SVG images, validate dimensions
  if (file.type !== 'image/svg+xml') {
    try {
      const dimensions = await getImageDimensions(file);
      
      if (dimensions.width < MIN_DIMENSIONS.width || dimensions.height < MIN_DIMENSIONS.height) {
        return {
          code: 'IMAGE_TOO_SMALL',
          message: `Image is too small. Minimum size is ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height} pixels.`,
        };
      }
      
      if (dimensions.width > MAX_DIMENSIONS.width || dimensions.height > MAX_DIMENSIONS.height) {
        return {
          code: 'IMAGE_TOO_LARGE',
          message: `Image is too large. Maximum size is ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height} pixels.`,
        };
      }
    } catch {
      return {
        code: 'INVALID_IMAGE',
        message: 'Unable to read image file. Please ensure it\'s a valid image.',
      };
    }
  }

  return null; // File is valid
}

/**
 * Get image dimensions from a file
 */
export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename) {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if image size is recommended (for UI warnings)
 */
export function isRecommendedSize(file) {
  return file.size <= RECOMMENDED_IMAGE_SIZE;
}

/**
 * Generate a unique filename for uploaded images
 */
export function generateUniqueImageFilename(originalFilename, companyId) {
  const timestamp = Date.now();
  const extension = getFileExtension(originalFilename);
  const baseName = originalFilename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_');
  
  return `logos/${companyId}/${timestamp}_${baseName}.${extension}`;
}

/**
 * Create a preview URL for an image file
 */
export function createImagePreview(file) {
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL to free memory
 */
export function revokeImagePreview(url) {
  URL.revokeObjectURL(url);
}