import { initials } from '../../utils/formatters';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost/ems/backend';

export default function Avatar({ name, imageFilename, folder = 'profiles', color = 'var(--accent)', size = 40 }) {
  const imageUrl = imageFilename ? `${API_BASE}/uploads/${folder}/${imageFilename}` : null;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        className="flex-none rounded-full object-cover"
        style={{ width: size, height: size, border: `2px solid ${color}` }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }

  return (
    <div
      className="flex flex-none items-center justify-center rounded-full font-display font-semibold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  );
}
