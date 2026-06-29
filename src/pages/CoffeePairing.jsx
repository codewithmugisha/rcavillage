import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../AuthContext";
import AvatarPlaceholder from "../components/AvatarPlaceholder";
import { getTodaysIcebreaker } from "../data/icebreakers";

function getCurrentWeekKey() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - start) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-${String(week).padStart(2, "0")}`;
}

export default function CoffeePairing() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [pairing, setPairing] = useState(null);
  const [buddyPairing, setBuddyPairing] = useState(null);
  const [allPairs, setAllPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publicLoading, setPublicLoading] = useState(false);
  const [showPublic, setShowPublic] = useState(false);
  const [metLoading, setMetLoading] = useState(false);
  const [step, setStep] = useState(null);
  const [error, setError] = useState(null);
  const weekKey = getCurrentWeekKey();
  const question = getTodaysIcebreaker();

  useEffect(() => {
    document.title = "Coffee Pairing — RCA Village";
    async function fetch() {
      if (!user) return;
      try {
        const mySnap = await getDoc(doc(db, "pairings", user.uid));
        if (mySnap.exists() && mySnap.data().week === weekKey) {
          const myData = { id: mySnap.id, ...mySnap.data() };
          setPairing(myData);
          const buddySnap = await getDoc(doc(db, "pairings", myData.buddy));
          if (buddySnap.exists() && buddySnap.data().week === weekKey) {
            setBuddyPairing({ id: buddySnap.id, ...buddySnap.data() });
          } else {
            setBuddyPairing(null);
          }
        } else {
          setPairing(null);
          setBuddyPairing(null);
        }
      } catch (err) {
        console.error("pairing fetch error:", err);
        setError("Something went wrong. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [user, weekKey]);

  const userConfirmed = pairing?.confirmedBy?.includes(user?.uid) || false;
  const buddyConfirmed = buddyPairing?.confirmedBy?.includes(pairing?.buddy) || false;
  const bothConfirmed = userConfirmed && buddyConfirmed;

  useEffect(() => {
    if (pairing === null) return;
    const seen = localStorage.getItem(`coffeeReveal_${weekKey}`);
    if (bothConfirmed || pairing.met || seen === "all") {
      setStep("question-revealed");
    } else if (seen === "buddy") {
      setStep("buddy-revealed");
    } else {
      setStep("buddy-hidden");
    }
  }, [pairing, buddyPairing, weekKey, bothConfirmed]);

  const handleShowPublic = async () => {
    if (allPairs.length > 0) {
      setShowPublic(true);
      return;
    }
    setPublicLoading(true);
    try {
      const allSnap = await getDocs(query(collection(db, "pairings"), where("week", "==", weekKey)));
      const byPairId = {};
      for (const d of allSnap.docs) {
        const data = d.data();
        if (!data.pairId) continue;
        if (!byPairId[data.pairId]) byPairId[data.pairId] = [];
        byPairId[data.pairId].push({ docId: d.id, ...data });
      }

      const pairList = [];
      for (const pairId in byPairId) {
        const sides = byPairId[pairId];
        if (sides.length < 2) continue;

        pairList.push({
          pairId,
          class: sides[0].class,
          classB: sides[1].class,
          userA: {
            uid: sides[0].docId,
            name: sides[1].buddyName,
            username: sides[1].buddyUsername || null,
            photo: sides[1].buddyPhoto,
            class: sides[0].class,
            met: sides[0].met || false,
          },
          userB: {
            uid: sides[1].docId,
            name: sides[0].buddyName,
            username: sides[0].buddyUsername || null,
            photo: sides[0].buddyPhoto,
            class: sides[1].class,
            met: sides[1].met || false,
          },
        });
      }
      setAllPairs(pairList);
      setShowPublic(true);
    } catch (err) {
      console.error("public pairings fetch error:", err);
    } finally {
      setPublicLoading(false);
    }
  };

  const handleMarkMet = async () => {
    if (!user || metLoading) return;
    setMetLoading(true);
    try {
      await updateDoc(doc(db, "pairings", user.uid), {
        confirmedBy: arrayUnion(user.uid),
        metAt: serverTimestamp(),
      });
      const buddySnap = await getDoc(doc(db, "pairings", pairing.buddy));
      const buddyData = buddySnap.exists() && buddySnap.data().week === weekKey
        ? { id: buddySnap.id, ...buddySnap.data() }
        : null;
      setBuddyPairing(buddyData);
      setPairing((prev) => ({
        ...prev,
        confirmedBy: [...(prev.confirmedBy || []), user.uid],
      }));
      const buddyHasConfirmed = buddyData?.confirmedBy?.includes(pairing.buddy) || false;
      if (buddyHasConfirmed) {
        await Promise.all([
          updateDoc(doc(db, "pairings", user.uid), { met: true }),
          updateDoc(doc(db, "pairings", pairing.buddy), { met: true }),
        ]);
      }
      localStorage.setItem(`coffeeReveal_${weekKey}`, "all");
      setAllPairs((prev) =>
        prev.map((p) => {
          if (p.userA.uid === user.uid) return { ...p, userA: { ...p.userA, met: buddyHasConfirmed, confirmed: true } };
          if (p.userB.uid === user.uid) return { ...p, userB: { ...p.userB, met: buddyHasConfirmed, confirmed: true } };
          return p;
        })
      );
    } catch (err) {
      console.error(err);
    } finally {
      setMetLoading(false);
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

  if (error) {
    return (
      <div className="page-fade-in responsive-pad" style={{ textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "#555" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="page-fade-in responsive-pad-wide" style={{ maxWidth: 760, margin: "0 auto" }}>
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
          marginBottom: 40,
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

      {profile?.strikes >= 2 && !pairing ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ textAlign: "center", paddingTop: 32 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
            style={{ marginBottom: 24 }}
          >
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </motion.div>
          <h1 className="text-display text-primary" style={{ marginBottom: 12 }}>
            Taking a break this week
          </h1>
          <p className="text-body text-secondary" style={{ maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
            You didn't confirm any meetups last week, so we're giving you a week off. 
            Don't worry — you'll be back in the mix next week with a fresh start.
          </p>
        </motion.div>
      ) : profile?.strikes === 1 && !pairing ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ textAlign: "center", paddingTop: 32 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
            style={{ marginBottom: 24 }}
          >
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </motion.div>
          <h1 className="text-display text-primary" style={{ marginBottom: 12 }}>
            No pairing this week
          </h1>
          <p className="text-body text-secondary" style={{ maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
            Last week slipped by without a meetup. This week we're giving you one more chance to 
            reconnect — make it count! Your pairing will appear here once they're out.
          </p>
        </motion.div>
      ) : !pairing ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ textAlign: "center", paddingTop: 32 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
            style={{ marginBottom: 24 }}
          >
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </motion.div>
          <h1 className="text-display text-primary" style={{ marginBottom: 12 }}>
            No pairing yet
          </h1>
          <p className="text-body text-secondary" style={{ maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
            Pairings are released at the start of each week. Your coffee buddy will appear here once the pairings are out.
          </p>
        </motion.div>
      ) : (
        <>
          {step === "buddy-hidden" && !pairing.met && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ textAlign: "center", paddingTop: 40 }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
              >
                <motion.svg
                  animate={{ rotate: [0, -8, 8, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#3d3d3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 20 }}
                >
                  <path d="M18 8h1a4 4 0 010 8h-1" />
                  <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
                  <line x1="6" y1="1" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="1" x2="14" y2="4" />
                </motion.svg>
              </motion.div>
              <h1 className="text-display text-primary" style={{ marginBottom: 12 }}>
                This week's pairing is ready
              </h1>
              <p className="text-body text-secondary" style={{ maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.6 }}>
                Someone in {pairing.class} has been matched with you for coffee this week.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  localStorage.setItem(`coffeeReveal_${weekKey}`, "buddy");
                  setStep("buddy-revealed");
                }}
                style={{
                  padding: "14px 36px",
                  backgroundColor: "#3d3d3d",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background-color 150ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2d2d2d")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3d3d3d")}
              >
                Reveal buddy
              </motion.button>
            </motion.div>
          )}

          {(step !== "buddy-hidden" || pairing.met) && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ textAlign: "center", marginBottom: 48 }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3d3d3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
                    <path d="M18 8h1a4 4 0 010 8h-1" />
                    <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
                    <line x1="6" y1="1" x2="6" y2="4" />
                    <line x1="10" y1="1" x2="10" y2="4" />
                    <line x1="14" y1="1" x2="14" y2="4" />
                  </svg>
                </motion.div>
                <h1 className="text-display text-primary" style={{ marginBottom: 8 }}>
                  Your Coffee Buddy
                </h1>
                <p className="text-body text-secondary">
                  Grab a coffee, sit down, and get to know someone new.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: 14,
                  padding: 40,
                  textAlign: "center",
                  marginBottom: 32,
                }}
              >
                <p className="text-small text-muted" style={{ marginBottom: 20 }}>
                  You're paired with
                </p>

                {pairing.buddyPhoto ? (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{ cursor: pairing.buddyUsername ? "pointer" : "default", display: "inline-block" }}
                    onClick={() => pairing.buddyUsername && navigate(`/students/${pairing.buddyUsername}`)}
                  >
                    <img
                      src={pairing.buddyPhoto}
                      alt={pairing.buddyName}
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "3px solid #f8fafc",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                        marginBottom: 16,
                        transition: "opacity 150ms ease",
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{ marginBottom: 16, cursor: pairing.buddyUsername ? "pointer" : "default" }}
                    onClick={() => pairing.buddyUsername && navigate(`/students/${pairing.buddyUsername}`)}
                  >
                    <AvatarPlaceholder name={pairing.buddyName} size={100} />
                  </motion.div>
                )}

                <motion.h2
                  whileHover={pairing.buddyUsername ? { color: "#3d3d3d" } : {}}
                  onClick={() => pairing.buddyUsername && navigate(`/students/${pairing.buddyUsername}`)}
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#111",
                    letterSpacing: "-0.02em",
                    marginBottom: 8,
                    cursor: pairing.buddyUsername ? "pointer" : "default",
                    transition: "color 150ms ease",
                  }}
                >
                  {pairing.buddyName}
                </motion.h2>

                <span
                  style={{
                    display: "inline-block",
                    padding: "5px 14px",
                    borderRadius: 100,
                    backgroundColor: (() => {
                      const styles = { Y1: "#f1f5f9", Y2: "#f0fdf4", Y3: "#fefce8" };
                      return styles[pairing.buddyClass] || "#f1f5f9";
                    })(),
                    color: (() => {
                      const colors = { Y1: "#475569", Y2: "#166534", Y3: "#854d0e" };
                      return colors[pairing.buddyClass] || "#475569";
                    })(),
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {pairing.buddyClass}
                </span>

                {pairing.met || userConfirmed ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    style={{
                      marginTop: 20,
                      padding: "10px 20px",
                      backgroundColor: bothConfirmed ? "#f0fdf4" : "#fffbeb",
                      border: "1px solid",
                      borderColor: bothConfirmed ? "#bbf7d0" : "#fde68a",
                      borderRadius: 8,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {bothConfirmed ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#16a34a" }}>
                          You've met!
                        </span>
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4" />
                          <path d="M12 8h.01" />
                        </svg>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#d97706" }}>
                          Waiting for them
                        </span>
                      </>
                    )}
                  </motion.div>
                ) : null}
              </motion.div>

              {step === "buddy-revealed" && !pairing.met && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e5e5",
                    borderRadius: 14,
                    padding: 32,
                    marginBottom: 32,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      backgroundColor: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3d3d3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 4 }}>
                    You have an icebreaker waiting
                  </p>
                  <p className="text-small text-muted" style={{ marginBottom: 20 }}>
                    Something to help you break the ice when you meet.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      localStorage.setItem(`coffeeReveal_${weekKey}`, "all");
                      setStep("question-revealed");
                    }}
                    style={{
                      padding: "10px 24px",
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
                    Open icebreaker
                  </motion.button>
                </motion.div>
              )}

              {(step === "question-revealed" || pairing.met) && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e5e5",
                      borderRadius: 14,
                      padding: 32,
                      marginBottom: 32,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          backgroundColor: "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3d3d3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p className="text-small text-muted" style={{ marginBottom: 4 }}>
                          Icebreaker question
                        </p>
                        <p
                          style={{
                            fontSize: 17,
                            fontWeight: 600,
                            color: "#111",
                            lineHeight: 1.4,
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {question}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {!bothConfirmed && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      style={{ textAlign: "center", marginBottom: 48 }}
                    >
                      {userConfirmed ? (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "12px 24px",
                            backgroundColor: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            borderRadius: 8,
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                          <div style={{ textAlign: "left" }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: "#16a34a" }}>
                              You've met
                            </p>
                            <p style={{ fontSize: 12, color: "#16a34a", opacity: 0.8 }}>
                              Waiting for them to confirm
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleMarkMet}
                            disabled={metLoading}
                            style={{
                              padding: "14px 32px",
                              backgroundColor: metLoading ? "#94a3b8" : "#3d3d3d",
                              color: "#fff",
                              border: "none",
                              borderRadius: 8,
                              fontSize: 15,
                              fontWeight: 600,
                              cursor: metLoading ? "not-allowed" : "pointer",
                              transition: "background-color 150ms ease",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {metLoading ? (
                              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} />
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                                <path d="M16 3.13a4 4 0 010 7.75" />
                              </svg>
                            )}
                            {metLoading ? "Marking..." : "We met!"}
                          </motion.button>
                          <p className="text-small text-muted" style={{ marginTop: 12 }}>
                            Found them in person? Tap this after you've grabbed coffee together.
                          </p>
                        </>
                      )}
                    </motion.div>
                  )}

                  {bothConfirmed && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      style={{ textAlign: "center", marginBottom: 48 }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "14px 28px",
                          backgroundColor: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderRadius: 12,
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <div style={{ textAlign: "left" }}>
                          <p style={{ fontSize: 15, fontWeight: 700, color: "#16a34a" }}>
                            You both met!
                          </p>
                          <p style={{ fontSize: 12, color: "#16a34a", opacity: 0.8 }}>
                            Another connection made on campus.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}

              {step !== "buddy-hidden" && !showPublic ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ textAlign: "center" }}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleShowPublic}
                    disabled={publicLoading}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: publicLoading ? "#94a3b8" : "#fff",
                      color: "#111",
                      border: "1px solid #e5e5e5",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: publicLoading ? "not-allowed" : "pointer",
                      transition: "background-color 150ms ease",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                    onMouseEnter={(e) => {
                      if (!publicLoading) e.currentTarget.style.backgroundColor = "#f9f9f9";
                    }}
                    onMouseLeave={(e) => {
                      if (!publicLoading) e.currentTarget.style.backgroundColor = "#fff";
                    }}
                  >
                    {publicLoading ? (
                      <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87" />
                        <path d="M16 3.13a4 4 0 010 7.75" />
                      </svg>
                    )}
                    {publicLoading ? "Loading..." : "Show other pairings"}
                  </motion.button>
                </motion.div>
              ) : null}

              {showPublic && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{ flex: 1, height: 1, backgroundColor: "#e2e8f0" }} />
                    <span className="text-small text-muted" style={{ fontWeight: 500, whiteSpace: "nowrap" }}>
                      This week's pairings
                    </span>
                    <div style={{ flex: 1, height: 1, backgroundColor: "#e2e8f0" }} />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                      gap: 8,
                    }}
                  >
                    {allPairs.map((p, i) => {
                      const isOwnA = p.userA.uid === user?.uid;
                      const isOwnB = p.userB.uid === user?.uid;
                      const isOwn = isOwnA || isOwnB;
                      return (
                        <motion.div
                          key={p.pairId}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: i * 0.02 }}
                          style={{
                            padding: "14px 16px",
                            borderRadius: 10,
                            border: `1px solid ${isOwn ? "#3d3d3d" : "#e5e5e5"}`,
                            backgroundColor: isOwn ? "#f8fafc" : "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            minWidth: 0,
                          }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1, cursor: p.userA.username ? "pointer" : "default" }}
                            onClick={() => p.userA.username && navigate(`/students/${p.userA.username}`)}
                          >
                            <AvatarPlaceholder name={p.userA.name} size={28} />
                            <span
                              className="text-truncate"
                              style={{
                                fontSize: 13,
                                fontWeight: isOwnA ? 700 : 500,
                                color: "#111",
                              }}
                            >
                              {p.userA.name}
                            </span>
                          </motion.div>

                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <path d="M5 12h14" />
                            <path d="M12 5l7 7-7 7" />
                          </svg>

                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1, justifyContent: "flex-end", cursor: p.userB.username ? "pointer" : "default" }}
                            onClick={() => p.userB.username && navigate(`/students/${p.userB.username}`)}
                          >
                            <span
                              className="text-truncate"
                              style={{
                                fontSize: 13,
                                fontWeight: isOwnB ? 700 : 500,
                                color: "#111",
                                textAlign: "right",
                              }}
                            >
                              {p.userB.name}
                            </span>
                            <AvatarPlaceholder name={p.userB.name} size={28} />
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    style={{ textAlign: "center", marginTop: 40, paddingBottom: 8 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 1,
                        backgroundColor: "#d1d5db",
                        margin: "0 auto 16px",
                      }}
                    />
                    <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, maxWidth: 320, margin: "0 auto" }}>
                      That's everyone this week. No one left out, no one forgotten.
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
