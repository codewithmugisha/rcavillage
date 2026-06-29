import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { collection, getDocs, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import AvatarPlaceholder from "../components/AvatarPlaceholder";

export default function AdminStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    document.title = "Students — Admin — RCA Village";
    async function fetch() {
      try {
        const snap = await getDocs(query(collection(db, "users"), orderBy("name")));
        setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete ${student.name}? This removes their Firestore data. Auth account will need to be deleted manually from Firebase Console.`)) return;
    setDeleting(student.id);
    try {
      await deleteDoc(doc(db, "users", student.id));
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete. Check console.");
    } finally {
      setDeleting(null);
    }
  };

  const classes = ["All", "Y1", "Y2", "Y3"];

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.username?.toLowerCase().includes(q) || s.id?.toLowerCase().includes(q);
    const matchClass = classFilter === "All" || s.class === classFilter;
    return matchSearch && matchClass;
  });

  if (loading) {
    return (
      <div className="page-fade-in responsive-pad" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-fade-in responsive-pad-wide" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <button
            onClick={() => navigate("/admin")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, lineHeight: 0 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-display text-primary" style={{ marginBottom: 0 }}>Students</h1>
        </div>
        <p className="text-body text-secondary" style={{ marginBottom: 24 }}>{students.length} people in our community.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}
      >
        <input
          type="text"
          placeholder="Search by name, username, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
          style={{ flex: 1, minWidth: 200, maxWidth: 400, padding: "10px 14px", fontSize: 14, border: "1px solid #e2e8f0", borderRadius: 8 }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {classes.map((c) => (
            <button
              key={c}
              onClick={() => setClassFilter(c)}
              style={{
                padding: "8px 16px", border: "none", borderRadius: 8,
                backgroundColor: classFilter === c ? "#3d3d3d" : "#f0f0f0",
                color: classFilter === c ? "#fff" : "#444",
                fontSize: 14, fontWeight: 500, cursor: "pointer",
                transition: "background-color 150ms ease",
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <span className="text-small text-muted" style={{ marginLeft: "auto" }}>
          {filtered.length} of {students.length}
        </span>
      </motion.div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 48 }}>
          <p style={{ fontSize: 14, color: "#999" }}>Nobody matches what you're looking for.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.15 }}
          style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, overflow: "hidden" }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e5e5e5" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Student</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Class</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Fun Fact</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Social</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background-color 150ms ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {s.photoURL ? (
                          <img src={s.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          <AvatarPlaceholder name={s.name} size={32} />
                        )}
                        <div>
                          <button
                            onClick={() => navigate(`/students/${s.username || s.id}`)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600, color: "#0f172a", fontSize: 13, textAlign: "left" }}
                          >
                            {s.name}
                          </button>
                          {s.username && (
                            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>@{s.username}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 600,
                        backgroundColor: s.class === "Y1" ? "#f1f5f9" : s.class === "Y2" ? "#f0fdf4" : "#fefce8",
                        color: s.class === "Y1" ? "#475569" : s.class === "Y2" ? "#166534" : "#854d0e",
                      }}>
                        {s.class}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", color: "#64748b", fontSize: 12 }}>
                      {s.email || s.id}
                    </td>
                    <td style={{ padding: "10px 16px", color: "#64748b", fontSize: 12, maxWidth: 200 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {s.funFact || <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>None</span>}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        {s.github && <a href={s.github} target="_blank" rel="noopener noreferrer" style={{ color: "#cbd5e1", lineHeight: 0 }} title="GitHub"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg></a>}
                        {s.instagram && <a href={s.instagram} target="_blank" rel="noopener noreferrer" style={{ color: "#cbd5e1", lineHeight: 0 }} title="Instagram"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>}
                        {s.linkedin && <a href={s.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: "#cbd5e1", lineHeight: 0 }} title="LinkedIn"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>}
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => handleDelete(s)}
                        disabled={deleting === s.id}
                        style={{
                          background: "none", border: "1px solid #fecaca", borderRadius: 6,
                          padding: "4px 12px", fontSize: 12, fontWeight: 500,
                          color: deleting === s.id ? "#94a3b8" : "#dc2626",
                          cursor: deleting === s.id ? "not-allowed" : "pointer",
                          transition: "all 150ms ease",
                        }}
                        onMouseEnter={(e) => { if (deleting !== s.id) { e.currentTarget.style.backgroundColor = "#fef2f2"; e.currentTarget.style.borderColor = "#dc2626"; } }}
                        onMouseLeave={(e) => { if (deleting !== s.id) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "#fecaca"; } }}
                      >
                        {deleting === s.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
