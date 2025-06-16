type AvatarProps = {
  imageUrl: string;
  size?: number; // Optional size in pixels, default to 48px
  alt?: string;
};

export default function Avatar({ imageUrl, size = 48, alt = 'Profile Avatar' }: AvatarProps) {
  return (
    <img
      src={imageUrl}
      alt={alt}
      className="rounded-full border-2 border-indigo-500 shadow"
      style={{ width: size, height: size, objectFit: 'cover' }}
    />
  );
}
