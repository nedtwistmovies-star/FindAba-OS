import { supabase } from './supabaseClient';

export interface StorageResult {
  url: string;
  path: string;
}

const BUCKET_NAME = 'findaba';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB to match UI limits

export const storageService = {
  validateFile(file: File, allowedTypes: string[] = ['image/jpeg','image/png','image/webp','image/gif','video/mp4']) {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 20MB limit.');
    }
  },

  getPublicUrl(path: string) {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
  },

  async uploadAvatar(userId: string, file: File): Promise<StorageResult> {
    this.validateFile(file, ['image/jpeg','image/png','image/webp','image/gif']);
    const extension = file.name.split('.').pop();
    const fileName = `avatar_${Date.now()}.${extension}`;
    const path = `avatars/${userId}/${fileName}`;

    const { error, data } = await supabase.storage.from(BUCKET_NAME).upload(path, file, { upsert: true, contentType: file.type });

    if (error) throw error;

    return { url: this.getPublicUrl(path), path: data.path };
  },

  async uploadProductImage(userId: string, productId: string, file: File): Promise<StorageResult> {
    this.validateFile(file);
    const extension = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
    const path = `products/${userId}/${productId}/${fileName}`;

    const { error, data } = await supabase.storage.from(BUCKET_NAME).upload(path, file, { contentType: file.type });
    if (error) throw error;
    return { url: this.getPublicUrl(path), path: data.path };
  },

  async uploadPostMedia(userId: string, postId: string, file: File): Promise<StorageResult> {
    this.validateFile(file, ['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime']);
    const extension = file.name.split('.').pop();
    const fileName = `${Date.now()}.${extension}`;
    const path = `posts/${userId}/${postId}/${fileName}`;

    const { error, data } = await supabase.storage.from(BUCKET_NAME).upload(path, file, { contentType: file.type });
    if (error) throw error;
    return { url: this.getPublicUrl(path), path: data.path };
  },

  async deleteFile(path: string) {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
    if (error) throw error;
  }
};
