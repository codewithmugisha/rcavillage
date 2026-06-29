import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";
import { useAuth } from "../AuthContext";
import { friendlyError } from "../utils/firebaseErrors";
import { toast } from "../components/Toast";

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function Login() {
  const { user, profile, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) {
    if (profile) return <Navigate to="/directory" replace />;
    return <Navigate to="/profile-setup" replace />;
  }

  const handleGoogle = async () => {
    setSubmitting(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      toast(friendlyError(err));
      setSubmitting(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!username.trim() || !password.trim()) {
      toast("Username and password are required.");
      setSubmitting(false);
      return;
    }
    if (password.length < 6) {
      toast("Password must be at least 6 characters.");
      setSubmitting(false);
      return;
    }

    try {
      const val = `${username.trim().toLowerCase()}@rca.app`;
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, val, password);
      } else {
        await signInWithEmailAndPassword(auth, val, password);
      }
    } catch (err) {
      toast(friendlyError(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="page-fade-in login-layout" style={{ minHeight: "100vh", backgroundColor: "#fafafa", display: "flex", gap: 32, position: "relative", overflow: "hidden" }}>
      <div
        className="login-blob-top"
        style={{
          position: "absolute",
          top: "-30%",
          right: "-10%",
          width: "55%",
          height: "80%",
          backgroundColor: "#f1f5f9",
          borderRadius: "40% 60% 60% 40% / 50% 40% 60% 50%",
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />
      <div
        className="login-blob-bottom"
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "-8%",
          width: "45%",
          height: "60%",
          backgroundColor: "#e2e8f0",
          borderRadius: "50% 30% 60% 40% / 40% 50% 50% 60%",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />

      <div
        className="login-hero"
        style={{
          flex: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isRegister ? "register-hero" : "signin-hero"}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ maxWidth: 480 }}
          >
            {isRegister ? (
              <>
                <h1 className="text-display text-primary" style={{ marginBottom: 16 }}>
                  You belong here.
                </h1>
                <p className="text-body text-secondary" style={{ marginBottom: 40 }}>
                  This is a small corner of the internet built just for us — where classmates become friends, faces become familiar, and no one walks the hallways alone.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    "Create a profile that feels like you",
                    "Get paired with someone new over coffee each week",
                    "Learn names and faces before you meet",
                  ].map((text, i) => (
                    <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 3,
                          backgroundColor: "#3d3d3d",
                          flexShrink: 0,
                        }}
                      />
                      <span className="text-small" style={{ fontWeight: 500, color: "#475569" }}>{text}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h1 className="text-display text-primary" style={{ marginBottom: 16 }}>
                  Welcome back.
                </h1>
                <p className="text-body text-secondary" style={{ marginBottom: 40 }}>
                  RCA Village is a little thing we built to bring us closer together — because a campus feels warmer when you know the faces and names around you.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    "Find every face on campus in one place",
                    "Get paired for coffee with a new friend each week",
                    "Play the quiz and finally put names to faces",
                  ].map((text) => (
                    <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 3,
                          backgroundColor: "#3d3d3d",
                          flexShrink: 0,
                        }}
                      />
                      <span className="text-small" style={{ fontWeight: 500, color: "#475569" }}>{text}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="login-form-wrap"
        style={{
          flex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 48px 48px 16px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="card login-form"
          style={{ padding: 40, width: "100%", maxWidth: 420 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isRegister ? "register" : "signin"}
              initial={{ opacity: 0, x: isRegister ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRegister ? -20 : 20 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <h2
                className="text-heading text-primary"
                style={{ marginBottom: 32 }}
              >
                {isRegister ? "Join the community" : "Welcome back"}
              </h2>

              <button
                onClick={handleGoogle}
                disabled={submitting}
                className="btn-secondary"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  opacity: submitting ? 0.6 : 1,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? (
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                ) : (
                  <GoogleLogo />
                )}
                <span>{isRegister ? "Join with Google" : "Continue with Google"}</span>
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  margin: "24px 0",
                }}
              >
                <div style={{ flex: 1, height: 1, backgroundColor: "#e2e8f0" }} />
                <span className="text-small text-muted">or</span>
                <div style={{ flex: 1, height: 1, backgroundColor: "#e2e8f0" }} />
              </div>

              <form onSubmit={handleEmailAuth}>
                <div style={{ marginBottom: 20 }}>
                  <label className="text-small" style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="your.username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                    disabled={submitting}
                    className="input-field"
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="text-small" style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    className="input-field"
                  />
                </div>

                <div style={{ textAlign: "right", marginBottom: 4 }}>
                  <Link to="/forgot-password" className="text-small" style={{ color: "#64748b", textDecoration: "none", fontWeight: 500 }}
                    onMouseEnter={(e) => (e.target.style.color = "#3d3d3d")}
                    onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    opacity: submitting ? 0.6 : 1,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting && (
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} />
                  )}
                  {isRegister ? "Join the community" : "Sign in"}
                </button>
              </form>

              <p className="text-small text-secondary" style={{ textAlign: "center", marginTop: 20 }}>
                {isRegister ? "Already have an account?" : "No account?"}{" "}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => { setIsRegister(!isRegister); setError(""); }}
                  className="text-small"
                  style={{
                    background: "none",
                    border: "none",
                    color: submitting ? "#94a3b8" : "#3d3d3d",
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontWeight: 500,
                    textDecoration: "underline",
                    padding: 0,
                  }}
                >
                  {isRegister ? "Sign in" : "Create one"}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
