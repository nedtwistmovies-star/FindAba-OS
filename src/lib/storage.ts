import { supabase } from "./supabase";

export interface StorageResult {
  url: string;
  path: string;
}

const BUCKET_NAME = "findaba";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const storageService = {
  validateFile(
    file: File,
    allowedTypes: string[] = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]
  ) {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `Invalid file type. Allowed: ${allowedTypes.join(", ")}`
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File size exceeds 5MB limit.");
    }
  },

  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  async uploadAvatar(
    userId: string,
    file: File
  ): Promise<StorageResult> {
    this.validateFile(file);

    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `avatar_${Date.now()}.${extension}`;
    const path = `avatars/${userId}/${fileName}`;

    const { error, data } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) throw error;

    return {
      url: this.getPublicUrl(path),
      path: data.path,
    };
  },

  async uploadProductImage(
    userId: string,
    productId: string,
    file: File
  ): Promise<StorageResult> {
    this.validateFile(file);

    const extension = file.name.split(".").pop() || "jpg";
    const fileName =
      `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

    const path = `products/${userId}/${productId}/${fileName}`;

    const { error, data } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        contentType: file.type,
      });

    if (error) throw error;

    return {
      url: this.getPublicUrl(path),
      path: data.path,
    };
  },

  async uploadPostMedia(
    userId: string,
    postId: string,
    file: File
  ): Promise<StorageResult> {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/quicktime",
    ];

    this.validateFile(file, allowedTypes);

    const extension = file.name.split(".").pop() || "bin";
    const fileName = `${Date.now()}.${extension}`;
    const path = `posts/${userId}/${postId}/${fileName}`;

    const { error, data } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        contentType: file.type,
      });

    if (error) throw error;

    return {
      url: this.getPublicUrl(path),
      path: data.path,
    };
  },

  async deleteFile(path: string) {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) throw error;
  },
};

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const result = await storageService.uploadAvatar(userId, file);
  return result.url;
}

export async function uploadProductImage(
  userId: string,
  productId: string,
  file: File
): Promise<string> {
  const result = await storageService.uploadProductImage(
    userId,
    productId,
    file
  );

  return result.url;
}

export async function uploadPostMedia(
  userId: string,
  postId: string,
  file: File
): Promise<string> {
  const result = await storageService.uploadPostMedia(
    userId,
    postId,
    file
  );

  return result.url;
}
