// Maximum file size: 1MB
export const MAX_FILE_SIZE = 1024 * 1024; // 1MB in bytes

// Allowed file types for resumes
export const ALLOWED_RESUME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
];

// File extension mapping
export const FILE_EXTENSIONS = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
};

/**
 * Validate a resume file
 */
export async function validateResumeFile(file) {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(MAX_FILE_SIZE)})`,
    };
  }

  // Check file type
  if (!ALLOWED_RESUME_TYPES.includes(file.type)) {
    return {
      code: 'INVALID_FILE_TYPE',
      message: `File type "${file.type}" is not supported. Please upload a PDF or Word document.`,
    };
  }

  // Check file extension as additional validation
  const extension = getFileExtension(file.name);
  const expectedExtension = FILE_EXTENSIONS[file.type];
  
  if (extension !== expectedExtension) {
    return {
      code: 'EXTENSION_MISMATCH',
      message: `File extension "${extension}" doesn't match the file type. Expected "${expectedExtension}".`,
    };
  }

  // Additional content validation could be added here
  // For now, we'll trust the MIME type validation

  return null; // File is valid
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
 * Generate a unique filename for uploaded files
 */
export function generateUniqueFilename(originalFilename, userId) {
  const timestamp = Date.now();
  const extension = getFileExtension(originalFilename);
  const baseName = originalFilename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_');
  
  return `resumes/${userId}/${timestamp}_${baseName}.${extension}`;
}