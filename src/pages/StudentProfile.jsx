import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../AuthContext";
import AvatarPlaceholder from "../components/AvatarPlaceholder";

export default function StudentProfile() {
  const { username } = useParams();
  const { profile: currentProfile } = useAuth();
  const navigate = useNavigate();
  const isOwnProfile = currentProfile?.username === username;
  const [student, setStudent] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizActive, setQuizActive] = useState(false);
  const [quizOptions, setQuizOptions] = useState([]);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizCorrect, setQuizCorrect] = useState(null);
  const [editingFunFact, setEditingFunFact] = useState(false);
  const [funFactDraft, setFunFactDraft] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    document.title = "Student — RCA Village";
    async function fetch() {
      try {
        const q = query(collection(db, "users"), where("username", "==", username));
        const snap = await getDocs(q);
        if (snap.empty) {
          setError("Student not found.");
          setLoading(false);
          return;
        }
        const docSnap = snap.docs[0];
        setStudent({ id: docSnap.id, ...docSnap.data() });

        const q2 = query(collection(db, "users"), where("name", "!=", docSnap.data().name));
        const snap2 = await getDocs(q2);
        const list = snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllStudents(list);
      } catch (err) {
        console.error(err);
        setError("Something went wrong. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [username]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setLightboxImage(null);
    };
    if (lightboxImage) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [lightboxImage]);

  const startQuiz = () => {
    if (!student) return;
    const withPhotos = allStudents.filter((s) => s.id !== student.id && s.photoURL);
    const shuffled = [...withPhotos].sort(() => Math.random() - 0.5).slice(0, 4);
    const options = [student, ...shuffled].sort(() => Math.random() - 0.5);
    setQuizOptions(options);
    setQuizAnswer(null);
    setQuizCorrect(null);
    setQuizActive(true);
  };

  const imageUrl = (url, size) => {
    if (!url) return null;
    if (url.includes("cloudinary")) {
      return url.replace("/upload/", `/upload/w_${size},c_fill,q_auto,f_auto/`);
    }
    return url;
  };

  const handleQuizAnswer = (name) => {
    if (quizAnswer !== null) return;
    setQuizAnswer(name);
    setQuizCorrect(name === student.name);
  };

  const handleSaveFunFact = async () => {
    if (!student) return;
    const val = funFactDraft.trim() || null;
    try {
      await updateDoc(doc(db, "users", student.id), { funFact: val });
      setStudent((prev) => ({ ...prev, funFact: val }));
      setEditingFunFact(false);
    } catch (err) {
      console.error(err);
    }
  };

  const startEditFunFact = () => {
    setFunFactDraft(student.funFact || "");
    setEditingFunFact(true);
  };

  const socialLinks = [
    { key: "GitHub", url: student?.github },
    { key: "Instagram", url: student?.instagram },
    { key: "LinkedIn", url: student?.linkedin },
  ].filter((s) => s.url);

  if (loading) {
    return (
      <div className="page-fade-in responsive-pad" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="page-fade-in responsive-pad" style={{ textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "#555" }}>{error || "Student not found."}</p>
        <button
          onClick={() => navigate("/directory")}
          style={{
            marginTop: 16,
            background: "none",
            border: "none",
            color: "#3d3d3d",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "underline",
            padding: 0,
          }}
        >
          Back to directory
        </button>
      </div>
    );
  }

  return (
    <div className="page-fade-in responsive-pad-wide" style={{ maxWidth: 960, margin: "0 auto" }}>
      <motion.button
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => navigate("/directory")}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 14,
          fontWeight: 500,
          color: "#555",
          padding: 0,
          marginBottom: 32,
          transition: "color 150ms ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#111")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Back to directory
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="student-profile-layout"
        style={{ display: "flex", gap: 48, flexWrap: "wrap" }}
      >
        <div className="student-profile-sidebar" style={{ flex: "0 0 240px", maxWidth: "100%" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            {student.photoURL ? (
              <img
                src={student.photoURL}
                alt={student.name}
                onClick={() => setLightboxImage(student.photoURL)}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1px solid #e5e5e5",
                  cursor: "pointer",
                  transition: "opacity 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.85)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
              />
            ) : (
              <AvatarPlaceholder name={student.name} size={120} />
            )}
          </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, marginBottom: 8 }}>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#111",
                  lineHeight: 1.2,
                }}
              >
                {student.name}
              </h1>
              {isOwnProfile && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#3d3d3d",
                    backgroundColor: "#f0f0f0",
                    padding: "2px 8px",
                    borderRadius: 100,
                    lineHeight: 1.4,
                  }}
                >
                  You
                </span>
              )}
            </div>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <span
              style={{
                display: "inline-block",
                padding: "5px 10px",
                borderRadius: 100,
                backgroundColor: "#f0f0f0",
                color: "#444",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {student.class}
            </span>
          </div>

          {socialLinks.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {socialLinks.map((s) => (
                <a
                  key={s.key}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    border: "1px solid #e5e5e5",
                    borderRadius: 8,
                    backgroundColor: "#fff",
                    color: "#555",
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "background-color 150ms ease, border-color 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9f9f9";
                    e.currentTarget.style.borderColor = "#3d3d3d";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#fff";
                    e.currentTarget.style.borderColor = "#e5e5e5";
                  }}
                >
                  {s.key === "GitHub" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#999">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
                    </svg>
                  ) : s.key === "Instagram" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#999">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#999">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  )}
                  {s.key} profile
                </a>
              ))}
            </div>
          )}

          {socialLinks.length === 0 && (
            <p style={{ fontSize: 13, color: "#999", textAlign: "center", marginBottom: 24 }}>
              Nothing shared here yet. Maybe next time.
            </p>
          )}

          {!isOwnProfile && (
            <button
              onClick={startQuiz}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "#3d3d3d",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                transition: "background-color 150ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2d2d2d")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3d3d3d")}
            >
              Do I know this face?
            </button>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: 10,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 16 }}>
              A little about them
            </h2>

            <div style={{ borderBottom: "1px solid #e5e5e5", padding: "12px 0", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#555" }}>Full name</span>
              <span style={{ fontSize: 14, fontWeight: 400, color: "#111" }}>{student.name}</span>
            </div>
            <div style={{ borderBottom: "1px solid #e5e5e5", padding: "12px 0", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#555" }}>Class</span>
              <span style={{ fontSize: 14, fontWeight: 400, color: "#111" }}>{student.class}</span>
            </div>
            {student.slackUsername && (
              <div style={{ borderBottom: "1px solid #e5e5e5", padding: "12px 0", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#555" }}>Slack</span>
                <span style={{ fontSize: 14, fontWeight: 400, color: "#111" }}>@{student.slackUsername}</span>
              </div>
            )}
            <div style={{ borderBottom: "1px solid #e5e5e5", padding: "12px 0", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#555" }}>Email</span>
              <span style={{ fontSize: 14, fontWeight: 400, color: "#111" }}>
                {student.email || student.id}
              </span>
            </div>
            <div style={{ padding: "12px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#555" }}>Fun fact</span>
              {editingFunFact ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", maxWidth: "70%" }}>
                  <input
                    type="text"
                    value={funFactDraft}
                    onChange={(e) => setFunFactDraft(e.target.value)}
                    placeholder="e.g. I once met the President of Rwanda"
                    className="input-field"
                    style={{ width: "100%", padding: "6px 10px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 6 }}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveFunFact(); if (e.key === "Escape") setEditingFunFact(false); }}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={handleSaveFunFact}
                      style={{ background: "#3d3d3d", color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingFunFact(false)}
                      style={{ background: "none", color: "#555", border: "1px solid #e5e5e5", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : student.funFact ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: "70%" }}>
                  <span style={{ fontSize: 14, fontWeight: 400, color: "#111", textAlign: "right" }}>
                    {student.funFact}
                  </span>
                  {isOwnProfile && (
                    <button onClick={startEditFunFact} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#999", flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>
                  )}
                </div>
              ) : isOwnProfile ? (
                <button onClick={startEditFunFact} style={{ background: "none", border: "none", color: "#3d3d3d", cursor: "pointer", fontSize: 13, fontWeight: 500, textDecoration: "underline", padding: 0 }}>
                  Add a fun fact
                </button>
              ) : (
                <span style={{ fontSize: 14, fontWeight: 400, color: "#999" }}>
                  Nothing yet — maybe ask them in person?
                </span>
              )}
            </div>
          </div>

          {student.secondaryPhotoURL && (
            <div
              style={{
                backgroundColor: "#fff",
                border: "1px solid #e5e5e5",
                borderRadius: 10,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 16 }}>
                Another angle
              </h2>
              <img
                src={student.secondaryPhotoURL}
                alt={`${student.name} secondary`}
                onClick={() => setLightboxImage(student.secondaryPhotoURL)}
                style={{
                  width: "100%",
                  maxHeight: 320,
                  objectFit: "cover",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "opacity 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.9)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
              />
            </div>
          )}

          {!isOwnProfile && quizActive && (
            <div
              style={{
                backgroundColor: "#fff",
                border: "1px solid #e5e5e5",
                borderRadius: 10,
                padding: 24,
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                {student.photoURL ? (
                  <img
                    src={student.photoURL}
                    alt=""
                    style={{ width: 140, height: 140, borderRadius: 12, objectFit: "cover", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
                  />
                ) : (
                  <AvatarPlaceholder name={student.name} size={80} />
                )}
              </div>

              <p style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 16 }}>
                Who is this?
              </p>

              {quizAnswer !== null && (
                <p style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: quizCorrect ? "#16a34a" : "#dc2626",
                  marginBottom: 16,
                }}>
                  {quizCorrect ? "Correct!" : "Wrong!"}
                </p>
              )}

              <div style={{ display: "flex", gap: 8, maxWidth: 500, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
                {quizOptions.map((opt) => {
                  const answered = quizAnswer !== null;
                  const isCorrect = opt.name === student.name;
                  const isSelected = opt.name === quizAnswer;
                  let cardStyle = {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px",
                    border: "2px solid #e5e5e5",
                    borderRadius: 10,
                    backgroundColor: "#fff",
                    cursor: answered ? "default" : "pointer",
                    transition: "background 150ms ease, border-color 150ms ease",
                    flex: "0 0 auto",
                    width: 90,
                  };
                  if (answered && isCorrect) {
                    cardStyle = { ...cardStyle, borderColor: "#16a34a", backgroundColor: "#f0fdf4" };
                  } else if (answered && isSelected && !isCorrect) {
                    cardStyle = { ...cardStyle, borderColor: "#dc2626", backgroundColor: "#fef2f2" };
                  } else if (answered) {
                    cardStyle = { ...cardStyle, opacity: 0.35 };
                  }
                  return (
                    <button
                      key={opt.id || opt.name}
                      onClick={() => handleQuizAnswer(opt.name)}
                      style={cardStyle}
                      onMouseEnter={(e) => {
                        if (!answered) {
                          e.currentTarget.style.backgroundColor = "#f8fafc";
                          e.currentTarget.style.borderColor = "#1e293b";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!answered) {
                          e.currentTarget.style.backgroundColor = "#fff";
                          e.currentTarget.style.borderColor = "#e5e5e5";
                        }
                      }}
                    >
                      <img
                        src={imageUrl(opt.photoURL, 120)}
                        alt=""
                        style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "1px solid #f1f5f9" }}
                      />
                      <span style={{ fontSize: 11, fontWeight: 500, color: "#0f172a", textAlign: "center", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                        {opt.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {quizAnswer !== null && (
                <button
                  onClick={startQuiz}
                  style={{
                    marginTop: 16,
                    padding: "8px 20px",
                    backgroundColor: "transparent",
                    border: "1px solid #e5e5e5",
                    borderRadius: 8,
                    color: "#555",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "background-color 150ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Try another
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <button
            onClick={() => setLightboxImage(null)}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              color: "#fff",
              cursor: "pointer",
              fontSize: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          >
            ✕
          </button>
          <img
            src={lightboxImage}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: 8,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}
          />
        </div>
      )}
    </div>
  );
}
