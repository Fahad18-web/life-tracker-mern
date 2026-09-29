import { getAvatarUrl } from '../config/avatarPresets';

/**
 * DiceBear human avatar or initials fallback.
 * `avatar` = preset id from AVATAR_PRESETS (e.g. "alex"), or null.
 */
export default function Avatar({
  avatar,
  name = 'U',
  size = 36,
  className = ''
}) {
  const url = getAvatarUrl(avatar);

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const base =
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-brand-500)] bg-[var(--color-brand-600)]/15';

  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className={`${base} object-cover ${className}`}
        style={{ width: size, height: size }}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span
      className={`${base} font-bold text-[var(--color-brand-400)] ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.35) }}
      aria-hidden
    >
      {initials}
    </span>
  );
}