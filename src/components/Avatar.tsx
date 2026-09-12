const PALETTE = [
  "bg-brand-100 text-brand-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function paletteFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

type AvatarProps = {
  name: string;
  photoUrl?: string | null;
  size?: number;
  className?: string;
};

export function Avatar({ name, photoUrl, size = 40, className = "" }: AvatarProps) {
  const style = { width: size, height: size, fontSize: Math.max(11, size * 0.36) };

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={style}
        className={`shrink-0 rounded-full object-cover ring-1 ring-slate-100 ${className}`}
      />
    );
  }

  return (
    <div
      style={style}
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${paletteFor(name)} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
