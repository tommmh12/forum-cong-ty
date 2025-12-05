import { ResourceType, VALID_FILE_FORMATS } from '../../../shared/types';

/**
 * Resource Validation Service
 * Validates file formats and URLs for project resources
 */

/**
 * Extract file extension from filename or path
 */
export function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Validate file format for a given resource type
 */
export function validateFileFormat(
  resourceType: ResourceType,
  filename: string
): { valid: boolean; error?: string; allowedFormats?: string[] } {
  const allowedFormats = VALID_FILE_FORMATS[resourceType];
  
  // Types that don't require file validation
  if (allowedFormats.length === 0) {
    if (resourceType === 'FIGMA_LINK') {
      return { valid: true }; // URL validation handled separately
    }
    if (resourceType === 'CREDENTIAL') {
      return { valid: true }; // Encrypted data, no file validation
    }
  }
  
  const extension = getFileExtension(filename);
  
  if (!extension) {
    return {
      valid: false,
      error: 'File must have an extension',
      allowedFormats,
    };
  }
  
  if (!allowedFormats.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file format '.${extension}' for ${resourceType}`,
      allowedFormats,
    };
  }
  
  return { valid: true };
}


/**
 * Validate Figma URL format
 */
export function validateFigmaUrl(url: string): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: 'URL is required for Figma links' };
  }
  
  // Figma URL patterns:
  // https://www.figma.com/file/{fileKey}/{fileName}
  // https://www.figma.com/design/{fileKey}/{fileName}
  // https://figma.com/file/{fileKey}/{fileName}
  const figmaPattern = /^https?:\/\/(www\.)?figma\.com\/(file|design|proto)\/[a-zA-Z0-9]+/i;
  
  if (!figmaPattern.test(url)) {
    return {
      valid: false,
      error: 'Invalid Figma URL format. Expected: https://figma.com/file/{fileKey}/...',
    };
  }
  
  return { valid: true };
}

/**
 * Validate generic URL format
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: 'URL is required' };
  }
  
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate resource based on type
 */
export function validateResource(
  resourceType: ResourceType,
  data: { filename?: string; url?: string; encryptedData?: string }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  switch (resourceType) {
    case 'FIGMA_LINK':
      if (!data.url) {
        errors.push('URL is required for Figma links');
      } else {
        const figmaValidation = validateFigmaUrl(data.url);
        if (!figmaValidation.valid) {
          errors.push(figmaValidation.error!);
        }
      }
      break;
      
    case 'CREDENTIAL':
      if (!data.encryptedData) {
        errors.push('Encrypted data is required for credentials');
      }
      break;
      
    default:
      // File-based resources
      if (!data.filename && !data.url) {
        errors.push('Either filename or URL is required');
      }
      if (data.filename) {
        const fileValidation = validateFileFormat(resourceType, data.filename);
        if (!fileValidation.valid) {
          errors.push(fileValidation.error!);
        }
      }
      if (data.url) {
        const urlValidation = validateUrl(data.url);
        if (!urlValidation.valid) {
          errors.push(urlValidation.error!);
        }
      }
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get allowed file formats for a resource type
 */
export function getAllowedFormats(resourceType: ResourceType): string[] {
  return VALID_FILE_FORMATS[resourceType] || [];
}

/**
 * Check if a resource type requires file upload
 */
export function requiresFileUpload(resourceType: ResourceType): boolean {
  return !['FIGMA_LINK', 'CREDENTIAL'].includes(resourceType);
}

/**
 * Get resource type display name
 */
export function getResourceTypeDisplayName(resourceType: ResourceType): string {
  const displayNames: Record<ResourceType, string> = {
    SITEMAP: 'Sitemap',
    SRS: 'SRS/Feature List',
    WIREFRAME: 'Wireframe',
    MOCKUP: 'Mockup',
    FIGMA_LINK: 'Figma Link',
    ASSET: 'Design Asset',
    CREDENTIAL: 'Access Credential',
  };
  return displayNames[resourceType] || resourceType;
}

export default {
  getFileExtension,
  validateFileFormat,
  validateFigmaUrl,
  validateUrl,
  validateResource,
  getAllowedFormats,
  requiresFileUpload,
  getResourceTypeDisplayName,
};
