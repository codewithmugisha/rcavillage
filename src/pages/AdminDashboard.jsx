import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [pairings, setPairings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Admin — RCA Village";
    async function fetch() {
      try {
        const [sSnap, pSnap] = await Promise.all([
          getDocs(query(collection(db, "users"), orderBy("name"))),
          getDocs(collection(db, "pairings")),
        ]);
        setStudents(sSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setPairings(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="page-fade-in responsive-pad" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const byClass = { Y1: 0, Y2: 0, Y3: 0 };
  for (const s of students) {
    if (byClass[s.class] !== undefined) byClass[s.class]++;
  }

  const withPhoto = students.filter((s) => s.photoURL).length;
  const withFunFact = students.filter((s) => s.funFact).length;

  const uniquePairIds = new Set(pairings.filter((p) => !p.id?.endsWith("_extra")).map((p) => p.pairId));

  const weeks = [...new Set(pairings.map((p) => p.week))].sort().reverse();

  const cards = [
    { label: "Total students", value: students.length, color: "#1e293b" },
    { label: "Y1", value: byClass.Y1, color: "#475569" },
    { label: "Y2", value: byClass.Y2, color: "#166534" },
    { label: "Y3", value: byClass.Y3, color: "#854d0e" },
    { label: "With photo", value: withPhoto, total: students.length, color: "#3d3d3d" },
    { label: "With fun fact", value: withFunFact, total: students.length, color: "#3d3d3d" },
    { label: "Active pairings", value: uniquePairIds.size, color: "#3d3d3d" },
  ];

  return (
    <div className="page-fade-in responsive-pad-wide" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-display text-primary" style={{ marginBottom: 8 }}>Admin</h1>
        <p className="text-body text-secondary" style={{ marginBottom: 32 }}>Behind the scenes of our little community.</p>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 40 }}>
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            style={{
              backgroundColor: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: 10,
              padding: "20px 24px",
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              {card.label}
            </p>
            <p style={{ fontSize: 32, fontWeight: 700, color: card.color, lineHeight: 1 }}>
              {card.value}
              {card.total !== undefined && (
                <span style={{ fontSize: 14, fontWeight: 400, color: "#94a3b8", marginLeft: 4 }}>
                  / {card.total}
                </span>
              )}
            </p>
          </motion.div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 40 }}>
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          onClick={() => navigate("/admin/students")}
          style={{
            padding: "14px 24px",
            backgroundColor: "#3d3d3d",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background-color 150ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2d2d2d")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3d3d3d")}
        >
          Manage Students
        </motion.button>
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          onClick={() => navigate("/admin/pairings")}
          style={{
            padding: "14px 24px",
            backgroundColor: "#fff",
            color: "#3d3d3d",
            border: "1px solid #e5e5e5",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background-color 150ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
        >
          Manage Pairings
        </motion.button>
      </div>

      {weeks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, padding: 24 }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 16 }}>Recent Pairing Weeks</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {weeks.slice(0, 5).map((week) => {
              const weekPairs = pairings.filter((p) => p.week === week);
              const unique = new Set(weekPairs.filter((p) => !p.id?.endsWith("_extra")).map((p) => p.pairId));
              return (
                <div key={week} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>Week {week}</span>
                  <span style={{ fontSize: 14, color: "#64748b" }}>{unique.size} pairing{unique.size !== 1 ? "s" : ""}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
