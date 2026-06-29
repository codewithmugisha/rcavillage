import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "../components/Toast";

const RESET_API = import.meta.env.VITE_RESET_PASSWORD_API;

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const val = username.trim().toLowerCase();
    if (!val) { toast("Enter your username."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${RESET_API}/send-reset-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSentTo(data.email || "");
      setSent(true);
    } catch (err) {
      console.error("Reset password error:", err);
      toast(err.message || "Something went wrong. Check console for details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-fade-in" style={{ minHeight: "100vh", backgroundColor: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card"
        style={{ padding: 40, width: "100%", maxWidth: 420 }}
      >
        {sent ? (
          <>
            <h2 className="text-heading text-primary" style={{ marginBottom: 12 }}>Check your inbox</h2>
            <p className="text-body text-secondary" style={{ marginBottom: 24 }}>
              Reset link sent to <strong>{sentTo}</strong>. Check your inbox (and spam folder).
            </p>
            <Link to="/login" style={{ color: "#3d3d3d", fontSize: 14, fontWeight: 500 }}>Back to login</Link>
          </>
        ) : (
          <>
            <h2 className="text-heading text-primary" style={{ marginBottom: 12 }}>Forgot your password?</h2>
            <p className="text-body text-secondary" style={{ marginBottom: 24 }}>
              It happens to the best of us. Enter your username and we'll send a reset link to your recovery email.
            </p>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label className="text-small" style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                  placeholder="your.username"
                  className="input-field"
                  style={{ border: `1px solid ${error ? "#dc2626" : "#e2e8f0"}` }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{
                  width: "100%", backgroundColor: submitting ? "#94a3b8" : "#3d3d3d",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Sending..." : "Send reset link"}
              </button>
            </form>
            <p className="text-small text-secondary" style={{ textAlign: "center", marginTop: 20 }}>
              <Link to="/login" style={{ color: "#3d3d3d", fontWeight: 500 }}>Back to login</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
