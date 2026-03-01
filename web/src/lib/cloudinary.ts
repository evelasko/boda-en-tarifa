const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'bodaentarifa';

export function cloudinaryUrl(publicId: string, width = 1080): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},c_limit,q_auto,f_auto/${publicId}`;
}

export function cloudinaryThumbnailUrl(publicId: string, size = 400): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${size},h_${size},c_fill,g_auto,q_auto,f_auto/${publicId}`;
}
