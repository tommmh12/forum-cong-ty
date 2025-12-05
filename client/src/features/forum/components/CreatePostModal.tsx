import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useImageUpload } from '../hooks/useImageUpload';
import { useForum } from '../hooks/useForum';
import { ForumSpace, CreatePostRequest } from '../../../../shared/types/forum.types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaces: ForumSpace[];
}

/**
 * CreatePostModal component
 * Flow: User selects images -> Preview -> Upload -> Save URLs -> Submit post with URLs
 */
export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  spaces,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { uploadImage } = useImageUpload();
  const { createPost } = useForum();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default space if available
  useEffect(() => {
    if (spaces.length > 0 && !spaceId) {
      setSpaceId(spaces[0].id);
    }
  }, [spaces, spaceId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setContent('');
      setSpaceId('');
      setTags([]);
      setNewTag('');
      setSelectedFiles([]);
      setImageUrls([]);
      setError(null);
    }
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    setError(null);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) return;

    setUploadingImages(true);
    setError(null);

    try {
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const url = await uploadImage(file);
        uploadedUrls.push(url);
      }
      setImageUrls(uploadedUrls);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload images';
      setError(errorMessage);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim() || !spaceId) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    // Upload images if not already uploaded
    let finalImageUrls = imageUrls;
    if (selectedFiles.length > 0 && imageUrls.length !== selectedFiles.length) {
      setIsSubmitting(true);
      try {
        const uploadedUrls: string[] = [];
        for (const file of selectedFiles) {
          const url = await uploadImage(file);
          uploadedUrls.push(url);
        }
        finalImageUrls = uploadedUrls;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload images';
        setError(errorMessage);
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const postData: CreatePostRequest = {
        spaceId,
        title: title.trim(),
        content: content.trim(),
        tags: tags.length > 0 ? tags : undefined,
        imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
      };

      await createPost(postData);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Tạo bài viết mới</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Space selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Chọn không gian
            </label>
            <select
              value={spaceId}
              onChange={(e) => setSpaceId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            >
              {spaces.map(space => (
                <option key={space.id} value={space.id}>
                  {space.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tiêu đề *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài viết"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nội dung *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung bài viết"
              rows={6}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Hình ảnh
            </label>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
              >
                <Upload className="w-4 h-4" />
                Chọn ảnh
              </button>

              {/* Preview selected files */}
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button (optional - images will be uploaded on submit) */}
              {selectedFiles.length > 0 && imageUrls.length !== selectedFiles.length && (
                <button
                  type="button"
                  onClick={handleUploadImages}
                  disabled={uploadingImages}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-700 text-white rounded-md hover:bg-brand-800 disabled:opacity-50"
                >
                  {uploadingImages ? 'Đang tải lên...' : 'Tải ảnh lên'}
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Thêm tag"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Button onClick={handleAddTag} type="button" variant="outline">
                Thêm
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting || uploadingImages}
              disabled={isSubmitting || uploadingImages}
            >
              Đăng bài
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

