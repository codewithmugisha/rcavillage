import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AvatarPlaceholder from "./AvatarPlaceholder";

const socialIcons = {
  github: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
    </svg>
  ),
  instagram: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  linkedin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
};

const CLASS_STYLES = {
  Y1: { backgroundColor: "#f1f5f9", color: "#475569" },
  Y2: { backgroundColor: "#f0fdf4", color: "#166534" },
  Y3: { backgroundColor: "#fefce8", color: "#854d0e" },
};

export default function ProfileCard({ student }) {
  const navigate = useNavigate();

  const socialLinks = [
    { key: "github", url: student.github },
    { key: "instagram", url: student.instagram },
    { key: "linkedin", url: student.linkedin },
  ].filter((s) => s.url);

  const classStyle = CLASS_STYLES[student.class] || { backgroundColor: "#f1f5f9", color: "#475569" };

  return (
    <motion.div
      onClick={() => navigate(`/students/${student.username || student.id}`)}
      className="card"
      whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.04)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        padding: "28px 20px 24px",
        textAlign: "center",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        {student.photoURL ? (
          <img
            src={student.photoURL}
            alt={student.name}
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid #f8fafc",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
          />
        ) : (
          <div style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)", borderRadius: "50%" }}>
            <AvatarPlaceholder name={student.name} size={72} />
          </div>
        )}
      </div>

      <div
        style={{
          fontWeight: 700,
          fontSize: 15,
          color: "#0f172a",
          letterSpacing: "-0.01em",
          marginBottom: 8,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {student.name}
      </div>

      <div style={{ marginBottom: 16 }}>
        <span
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: 9999,
            ...classStyle,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {student.class}
        </span>
      </div>

      {socialLinks.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          {socialLinks.map((s) => (
            <a
              key={s.key}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#cbd5e1",
                textDecoration: "none",
                transition: "color 200ms ease",
                lineHeight: 0,
                padding: 6,
                borderRadius: 6,
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1e293b")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
            >
              {socialIcons[s.key]}
            </a>
          ))}
        </div>
      )}
    </motion.div>
  );
}
