import { useState, useCallback } from 'react';
import { fetchAPI } from '../../../services/api';

interface UseImageUploadResult {
  uploadImage: (file: File) => Promise<string>;
  uploading: boolean;
  error: string | null;
}

/**
 * Hook for uploading images to the server
 * Returns the image URL after successful upload
 */
export function useImageUpload(): UseImageUploadResult {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    setUploading(true);
    setError(null);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('image', file);

      // Upload to server
      const response = await fetchAPI<{ imageUrl: string }>('/upload', {
        method: 'POST',
        body: formData,
      });

      return response.imageUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    uploadImage,
    uploading,
    error,
  };
}

