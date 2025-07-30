'use client'
import { cn } from "@/lib/utils";
import Image from "next/image";

interface SlideImageProps {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Original image width in pixels - used for aspect ratio and mask calculations */
  originalWidth: number;
  /** Original image height in pixels - used for aspect ratio and mask calculations */
  originalHeight: number;
  /** 
   * Height of the gradient mask in original image proportions (pixels).
   * This will be automatically scaled to match the current display size of the image.
   * For example, if your original image is 1920x800 and you want a 200px mask,
   * the mask will scale proportionally when the image is displayed at different sizes.
   */
  maskHeight: number;
}

export function SlideImage({ 
  src, 
  alt, 
  originalWidth, 
  originalHeight, 
  maskHeight 
}: SlideImageProps) {
  // Calculate the mask height as a percentage of the image height
  // This ensures the mask scales proportionally with the image
  const calculatedMaskHeight = Math.round((maskHeight / originalHeight) * 100);
 
  return (
    <div className="relative w-full">
      {/* Image container with proper aspect ratio */}
      <div 
        className="relative w-full"
        style={{
          aspectRatio: `${originalWidth} / ${originalHeight}`
        }}
      >
        <Image 
          src={src} 
          alt={alt} 
          fill
          style={{ "--fadeStop": calculatedMaskHeight + "%" } as React.CSSProperties}
          className={cn(
            "object-contain",
            "[mask-image:linear-gradient(to_bottom,transparent_0%,black_var(--fadeStop),black_100%)]",
            "[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_var(--fadeStop),black_100%)]",
            "[mask-size:100%_100%]",
            "[-webkit-mask-size:100%_100%]",
            "[mask-repeat:no-repeat]",
            "[-webkit-mask-repeat:no-repeat]"
          )}
          sizes="100vw"
          priority
        />
      </div>
    </div>
  )
}