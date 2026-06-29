const AVATAR_COLORS = [
  "#1e293b",
  "#334155",
  "#475569",
  "#0f172a",
  "#374151",
  "#1f2937",
  "#111827",
  "#27272a",
];

function getColorForName(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function AvatarPlaceholder({ name, size = 80 }) {
  const letter = name ? name.trim().charAt(0).toUpperCase() : "?";
  const bg = getColorForName(name);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          color: "#fff",
          fontSize: size * 0.38,
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {letter}
      </span>
    </div>
  );
}
