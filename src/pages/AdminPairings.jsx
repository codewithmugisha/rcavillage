import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { collection, getDocs, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import AvatarPlaceholder from "../components/AvatarPlaceholder";

export default function AdminPairings() {
  const navigate = useNavigate();
  const [pairings, setPairings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekFilter, setWeekFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");

  useEffect(() => {
    document.title = "Pairings — Admin — RCA Village";
    async function fetch() {
      try {
        const [pSnap, uSnap] = await Promise.all([
          getDocs(collection(db, "pairings")),
          getDocs(query(collection(db, "users"), orderBy("name"))),
        ]);
        setPairings(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setUsers(uSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const userMap = {};
  for (const u of users) {
    userMap[u.id] = u;
    if (u.username) userMap[u.username] = u;
  }

  const weeks = ["All", ...new Set(pairings.map((p) => p.week).filter(Boolean))].sort((a, b) => a === "All" ? -1 : b === "All" ? 1 : b.localeCompare(a));
  const classes = ["All", "Y1", "Y2", "Y3"];

  const filtered = pairings.filter((p) => {
    if (p.id?.endsWith("_extra")) return false;
    if (weekFilter !== "All" && p.week !== weekFilter) return false;
    if (classFilter !== "All" && p.class !== classFilter) return false;
    return true;
  });

  const groups = {};
  for (const p of filtered) {
    const key = p.pairId;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }

  const handleDeletePairing = async (pairId) => {
    if (!window.confirm(`Delete pairing group ${pairId}?`)) return;
    const toDelete = pairings.filter((p) => p.pairId === pairId);
    try {
      await Promise.all(toDelete.map((p) => deleteDoc(doc(db, "pairings", p.id))));
      setPairings((prev) => prev.filter((p) => p.pairId !== pairId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete. Check console.");
    }
  };

  const getUserDisplay = (uid) => {
    const u = userMap[uid];
    if (!u) return { name: uid, photoURL: null };
    return { name: u.name, photoURL: u.photoURL, username: u.username };
  };

  const getConfirmationStatus = (member) => {
    if (member.met) return "both";
    if (member.confirmedBy?.length > 0) return "partial";
    return "none";
  };

  const copyCommand = () => {
    navigator.clipboard.writeText("node scripts/pair.mjs <path-to-service-account.json>");
  };

  const handleDeleteAllWeek = async (week) => {
    if (!window.confirm(`Delete ALL pairings for week ${week}? This cannot be undone.`)) return;
    const toDelete = pairings.filter((p) => p.week === week);
    try {
      await Promise.all(toDelete.map((p) => deleteDoc(doc(db, "pairings", p.id))));
      setPairings((prev) => prev.filter((p) => p.week !== week));
    } catch (err) {
      console.error(err);
      alert("Failed to delete. Check console.");
    }
  };

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
          <h1 className="text-display text-primary" style={{ marginBottom: 0 }}>Pairings</h1>
        </div>
        <p className="text-body text-secondary" style={{ marginBottom: 24 }}>
          {Object.keys(groups).length} connections happening right now.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}
      >
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>Week</span>
          <select
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
            className="select-field"
            style={{ padding: "6px 10px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 6 }}
          >
            {weeks.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {classes.map((c) => (
            <button
              key={c}
              onClick={() => setClassFilter(c)}
              style={{
                padding: "6px 14px", border: "none", borderRadius: 6,
                backgroundColor: classFilter === c ? "#3d3d3d" : "#f0f0f0",
                color: classFilter === c ? "#fff" : "#444",
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                transition: "background-color 150ms ease",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
        style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, padding: 24, marginBottom: 24 }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 12 }}>Create New Connections</h2>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
          Ready to bring more people together? Pairings are generated from the command line. Run this in your terminal:
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <code style={{
            flex: 1, padding: "10px 14px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0",
            borderRadius: 8, fontSize: 13, color: "#0f172a", minWidth: 200, fontFamily: "monospace",
          }}>
            node scripts/pair.mjs &lt;path-to-service-account.json&gt;
          </code>
          <button
            onClick={copyCommand}
            style={{
              padding: "8px 16px", backgroundColor: "#3d3d3d", color: "#fff", border: "none",
              borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer",
              transition: "background-color 150ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2d2d2d")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3d3d3d")}
          >
            Copy Command
          </button>
        </div>
      </motion.div>

      {Object.keys(groups).length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 48 }}>
          <p style={{ fontSize: 14, color: "#999" }}>No connections yet for this view.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Object.entries(groups).map(([pairId, members]) => {
            const groupWeek = members[0]?.week || "—";
            const groupClass = members[0]?.class || "—";
            return (
              <motion.div
                key={pairId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, padding: "16px 20px",
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  {members.map((m, i) => {
                    const u = getUserDisplay(m.buddy);
                    const status = getConfirmationStatus(m);
                    return (
                      <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          <AvatarPlaceholder name={u.name} size={28} />
                        )}
                        <button
                          onClick={() => u.username && navigate(`/students/${u.username}`)}
                          style={{
                            background: "none", border: "none", cursor: u.username ? "pointer" : "default",
                            padding: 0, fontWeight: 500, fontSize: 13, color: "#0f172a",
                          }}
                        >
                          {u.name}
                        </button>
                        {status === "both" && (
                          <span title="Both confirmed" style={{ color: "#16a34a", fontSize: 12, lineHeight: 1 }}>✓✓</span>
                        )}
                        {status === "partial" && (
                          <span title="One side confirmed" style={{ color: "#d97706", fontSize: 12, lineHeight: 1 }}>✓</span>
                        )}
                        {i < members.length - 1 && (
                          <span style={{ color: "#cbd5e1", fontSize: 13 }}>↔</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 600,
                    backgroundColor: groupClass === "Y1" ? "#f1f5f9" : groupClass === "Y2" ? "#f0fdf4" : "#fefce8",
                    color: groupClass === "Y1" ? "#475569" : groupClass === "Y2" ? "#166534" : "#854d0e",
                  }}>
                    {groupClass} · W{groupWeek}
                  </span>
                  <button
                    onClick={() => handleDeletePairing(pairId)}
                    style={{
                      background: "none", border: "1px solid #fecaca", borderRadius: 6,
                      padding: "4px 10px", fontSize: 11, fontWeight: 500, color: "#dc2626",
                      cursor: "pointer", transition: "all 150ms ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fef2f2"; e.currentTarget.style.borderColor = "#dc2626"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "#fecaca"; }}
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {Object.keys(groups).length > 0 && weekFilter !== "All" && (
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button
            onClick={() => handleDeleteAllWeek(weekFilter)}
            style={{
              padding: "10px 20px", backgroundColor: "#fef2f2", color: "#dc2626",
              border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, fontWeight: 500,
              cursor: "pointer", transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fee2e2"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fef2f2"; }}
          >
            Delete All Pairings for Week {weekFilter}
          </button>
        </div>
      )}
    </div>
  );
}
