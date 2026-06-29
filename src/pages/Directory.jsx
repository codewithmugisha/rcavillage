import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import ProfileCard from "../components/ProfileCard";
import AvatarPlaceholder from "../components/AvatarPlaceholder";

const classes = ["All", "Y1", "Y2", "Y3"];

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

const PER_PAGE = 12;

export default function Directory() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("directoryView") || "grid");

  useEffect(() => {
    localStorage.setItem("directoryView", viewMode);
  }, [viewMode]);

  useEffect(() => {
    document.title = "Directory — RCA Village";
    async function fetch() {
      try {
        const q = query(collection(db, "users"), orderBy("name"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setStudents(list);
      } catch (err) {
        console.error(err);
        setError("Something went wrong. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const filtered = students.filter((s) => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter === "All" || s.class === classFilter;
    return matchSearch && matchClass;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const start = (page - 1) * PER_PAGE;
  const paginated = filtered.slice(start, start + PER_PAGE);

  useEffect(() => { setPage(1); }, [search, classFilter]);

  if (loading) {
    return (
      <div className="page-fade-in responsive-pad" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-fade-in responsive-pad" style={{ textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "#555" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="page-fade-in responsive-pad-wide" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="directory-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 40,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h1 className="text-display text-primary" style={{ marginBottom: 8 }}>
            Directory
          </h1>
          <p className="text-body text-secondary">
            Every face, every name — all the people who make this campus feel like home.
          </p>
        </motion.div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-small text-muted"
          style={{ whiteSpace: "nowrap", alignSelf: "flex-end", paddingBottom: 4 }}
        >
          {students.length} student{students.length !== 1 ? "s" : ""}
        </motion.span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 320 }}>
          <div
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              lineHeight: 0,
            }}
          >
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 14px 11px 38px",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              fontSize: 14,
              color: "#0f172a",
              backgroundColor: "#fff",
              boxSizing: "border-box",
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            }}
          />
        </div>

        <div className="directory-pills" style={{ display: "flex", gap: 6 }}>
          {classes.map((c) => (
            <button
              key={c}
              onClick={() => setClassFilter(c)}
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: 8,
                backgroundColor: classFilter === c ? "#3d3d3d" : "#f0f0f0",
                color: classFilter === c ? "#fff" : "#444",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                transition: "background-color 150ms ease, color 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (classFilter !== c) e.currentTarget.style.backgroundColor = "#e5e5e5";
              }}
              onMouseLeave={(e) => {
                if (classFilter !== c) e.currentTarget.style.backgroundColor = "#f0f0f0";
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          <button
            onClick={() => setViewMode("grid")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              border: "none",
              borderRadius: 8,
              backgroundColor: viewMode === "grid" ? "#3d3d3d" : "#f0f0f0",
              color: viewMode === "grid" ? "#fff" : "#444",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            title="Grid view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("list")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              border: "none",
              borderRadius: 8,
              backgroundColor: viewMode === "list" ? "#3d3d3d" : "#f0f0f0",
              color: viewMode === "list" ? "#fff" : "#444",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            title="List view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </motion.div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 48 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 4 }}>
            Hmm, nobody here yet
          </h2>
          <p style={{ fontSize: 14, color: "#999" }}>
            Try a different search or filter.
          </p>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div
              className="directory-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              {paginated.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04, ease: "easeOut" }}
                >
                  <ProfileCard student={s} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {paginated.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03, ease: "easeOut" }}
                  className="card"
                  onClick={() => navigate(`/students/${s.username || s.id}`)}
                  whileHover={{ backgroundColor: "#fafafa" }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 20px",
                    cursor: "pointer",
                    transition: "background-color 150ms ease",
                  }}
                >
                  <div style={{ flexShrink: 0 }}>
                    {s.photoURL ? (
                      <img
                        src={s.photoURL}
                        alt={s.name}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <AvatarPlaceholder name={s.name} size={44} />
                    )}
                  </div>

                  <div style={{ minWidth: 0, marginRight: "auto" }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: "#0f172a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.name}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        backgroundColor: (() => {
                          const styles = {
                            Y1: "#f1f5f9",
                            Y2: "#f0fdf4",
                            Y3: "#fefce8",
                          };
                          return styles[s.class] || "#f1f5f9";
                        })(),
                        color: (() => {
                          const colors = {
                            Y1: "#475569",
                            Y2: "#166534",
                            Y3: "#854d0e",
                          };
                          return colors[s.class] || "#475569";
                        })(),
                      }}
                    >
                      {s.class}
                    </span>

                    <div style={{ display: "flex", gap: 8, width: 64, justifyContent: "flex-start" }}>
                      {s.github && (
                      <a
                        href={s.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#cbd5e1", lineHeight: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#1e293b")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
                        </svg>
                      </a>
                    )}
                    {s.instagram && (
                      <a
                        href={s.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#cbd5e1", lineHeight: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#1e293b")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                      </a>
                    )}
                    {s.linkedin && (
                      <a
                        href={s.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#cbd5e1", lineHeight: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#1e293b")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                    )}
                  </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                marginTop: 32,
              }}
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e5e5e5",
                  borderRadius: 8,
                  backgroundColor: "#fff",
                  color: page === 1 ? "#d1d5db" : "#3d3d3d",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {(() => {
                const pages = [];
                const sibling = 1;
                const range = sibling + 2;
                const dots = (k) => <span key={k} style={{ padding: "0 4px", color: "#94a3b8", fontSize: 13 }}>...</span>;

                if (totalPages <= 6) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  if (page <= range) {
                    for (let i = 1; i <= range + 2; i++) pages.push(i);
                    pages.push("...");
                    pages.push(totalPages);
                  } else if (page >= totalPages - range) {
                    pages.push(1);
                    pages.push("...");
                    for (let i = totalPages - range - 2; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    pages.push("...");
                    for (let i = page - sibling; i <= page + sibling; i++) pages.push(i);
                    pages.push("...");
                    pages.push(totalPages);
                  }
                }

                return pages.map((p) =>
                  p === "..." ? (
                    dots(p)
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        minWidth: 36,
                        height: 36,
                        border: "none",
                        borderRadius: 8,
                        backgroundColor: p === page ? "#3d3d3d" : "transparent",
                        color: p === page ? "#fff" : "#64748b",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 150ms ease",
                      }}
                      onMouseEnter={(e) => {
                        if (p !== page) e.currentTarget.style.backgroundColor = "#f1f5f9";
                      }}
                      onMouseLeave={(e) => {
                        if (p !== page) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {p}
                    </button>
                  )
                );
              })()}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e5e5e5",
                  borderRadius: 8,
                  backgroundColor: "#fff",
                  color: page === totalPages ? "#d1d5db" : "#3d3d3d",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

