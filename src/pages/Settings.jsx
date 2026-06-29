import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { useAuth } from "../AuthContext";
import { friendlyError } from "../utils/firebaseErrors";
import { toast } from "../components/Toast";

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const hasPassword = user?.providerData?.some((p) => p.providerId === "password");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deleteUsername, setDeleteUsername] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [section, setSection] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recoverySaving, setRecoverySaving] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!currentPassword || !newPassword) { toast("Fill in both fields."); return; }
    if (newPassword.length < 6) { toast("New password must be at least 6 characters."); return; }
    try {
      const authEmail = `${profile?.username}@rca.app`;
      const credential = EmailAuthProvider.credential(authEmail, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSuccess("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setSection(null);
    } catch (err) {
      if (err.code === "auth/wrong-password") toast("Current password is incorrect.");
      else toast(friendlyError(err));
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!deleteUsername || !deletePassword) { toast("Fill in both fields."); return; }
    try {
      const authEmail = `${deleteUsername.trim().toLowerCase()}@rca.app`;
      const credential = EmailAuthProvider.credential(authEmail, deletePassword);
      await reauthenticateWithCredential(user, credential);
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      navigate("/login");
    } catch (err) {
      if (err.code === "auth/wrong-password") toast("Password is incorrect.");
      else if (err.code === "auth/user-not-found") toast("Username not found.");
      else toast(friendlyError(err));
    }
  };

  const handleSaveRecoveryEmail = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setRecoverySaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { recoveryEmail: recoveryEmail.trim() || null });
      await refreshProfile();
      setSuccess("Recovery email updated.");
      setSection(null);
    } catch (err) {
      toast(friendlyError(err));
    } finally {
      setRecoverySaving(false);
    }
  };

  return (
    <div className="page-fade-in responsive-pad-wide" style={{ maxWidth: 720, margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-display text-primary" style={{ marginBottom: 8 }}>Settings</h1>
        <p className="text-body text-secondary" style={{ marginBottom: 32 }}>Your account, your way.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, marginBottom: 16 }}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 12 }}>Account</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#64748b" }}>Username</span>
              <span style={{ color: "#111", fontWeight: 500 }}>{profile?.username || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#64748b" }}>Recovery email</span>
              <span style={{ color: "#111", fontWeight: 500 }}>{profile?.recoveryEmail || "Not set"}</span>
            </div>
            {profile?.slackUsername && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>Slack</span>
                <span style={{ color: "#111", fontWeight: 500 }}>@{profile.slackUsername}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#64748b" }}>Auth provider</span>
              <span style={{ color: "#111", fontWeight: 500 }}>
                {user?.providerData?.map((p) => p.providerId).join(", ") || "—"}
              </span>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
          <button
            onClick={() => navigate("/profile-setup")}
            style={{
              width: "100%", textAlign: "left", padding: "12px 16px",
              backgroundColor: "#fafafa", border: "1px solid #e5e5e5", borderRadius: 8,
              color: "#111", fontSize: 14, fontWeight: 500, cursor: "pointer",
              transition: "background-color 150ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Edit public profile</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Name, class, photo, fun fact, Slack, social links</p>
          </button>
        </div>

        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
          <button
            onClick={() => { setSection(section === "recovery" ? null : "recovery"); setError(""); setSuccess(""); setRecoveryEmail(profile?.recoveryEmail || ""); }}
            style={{
              width: "100%", textAlign: "left", background: "none", border: "none",
              padding: 0, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#111",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Recovery email</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: section === "recovery" ? "rotate(90deg)" : "none", transition: "transform 200ms ease" }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, fontWeight: 400 }}>Used to reset your password if you forget it</p>
          </button>
          {section === "recovery" && (
            <form onSubmit={handleSaveRecoveryEmail} style={{ marginTop: 16 }}>
              <input type="email" placeholder="you@gmail.com" value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="input-field"
                style={{ width: "100%", marginBottom: 10, padding: "10px 14px", fontSize: 14, border: "1px solid #e2e8f0", borderRadius: 8, boxSizing: "border-box" }}
              />
              {success && <p className="text-small" style={{ color: "#16a34a", marginBottom: 8 }}>{success}</p>}
              <button type="submit" disabled={recoverySaving} className="btn-primary"
                style={{ padding: "10px 20px", fontSize: 13, fontWeight: 500, backgroundColor: recoverySaving ? "#94a3b8" : "#3d3d3d", color: "#fff", border: "none", borderRadius: 8, cursor: recoverySaving ? "not-allowed" : "pointer" }}>
                {recoverySaving ? "Saving..." : "Save recovery email"}
              </button>
            </form>
          )}
        </div>

        {hasPassword && (
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
            <button
              onClick={() => { setSection(section === "password" ? null : "password"); setError(""); setSuccess(""); }}
              style={{
                width: "100%", textAlign: "left", background: "none", border: "none",
                padding: 0, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#111",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Change password</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: section === "password" ? "rotate(90deg)" : "none", transition: "transform 200ms ease" }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>
            {section === "password" && (
              <form onSubmit={handleChangePassword} style={{ marginTop: 16 }}>
                <input type="password" placeholder="Current password" value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field"
                  style={{ width: "100%", marginBottom: 10, padding: "10px 14px", fontSize: 14, border: "1px solid #e2e8f0", borderRadius: 8, boxSizing: "border-box" }}
                />
                <input type="password" placeholder="New password (min 6 chars)" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  style={{ width: "100%", marginBottom: 10, padding: "10px 14px", fontSize: 14, border: "1px solid #e2e8f0", borderRadius: 8, boxSizing: "border-box" }}
                />
                {success && <p className="text-small" style={{ color: "#16a34a", marginBottom: 8 }}>{success}</p>}
                <button type="submit" className="btn-primary"
                  style={{ padding: "10px 20px", fontSize: 13, fontWeight: 500, backgroundColor: "#3d3d3d", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
                  Update password
                </button>
              </form>
            )}
          </div>
        )}

        <div style={{ padding: "20px 24px" }}>
          <button
            onClick={handleSignOut}
            style={{
              width: "100%", textAlign: "left", padding: "12px 16px",
              backgroundColor: "#fafafa", border: "1px solid #e5e5e5", borderRadius: 8,
              color: "#111", fontSize: 14, fontWeight: 500, cursor: "pointer",
              transition: "background-color 150ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Sign out</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        style={{ backgroundColor: "#fff", border: "1px solid #fecaca", borderRadius: 10, overflow: "hidden" }}
      >
        <div style={{ padding: "20px 24px" }}>
          <button
            onClick={() => { setSection(section === "delete" ? null : "delete"); setError(""); setSuccess(""); }}
            style={{
              width: "100%", textAlign: "left", background: "none", border: "none",
              padding: 0, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#dc2626",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Delete account</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: section === "delete" ? "rotate(90deg)" : "none", transition: "transform 200ms ease" }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, fontWeight: 400 }}>Permanently remove your account and all data</p>
          </button>
          {section === "delete" && (
            <form onSubmit={handleDeleteAccount} style={{ marginTop: 16, padding: 16, backgroundColor: "#fef2f2", borderRadius: 8 }}>
              <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 500, marginBottom: 12 }}>
                This cannot be undone. Your profile, pairings, and all data will be permanently deleted.
              </p>
              <input type="text" placeholder="Your username" value={deleteUsername}
                onChange={(e) => setDeleteUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                className="input-field"
                style={{ width: "100%", marginBottom: 10, padding: "10px 14px", fontSize: 14, border: "1px solid #fecaca", borderRadius: 8, boxSizing: "border-box" }}
              />
              <input type="password" placeholder="Your password" value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="input-field"
                style={{ width: "100%", marginBottom: 10, padding: "10px 14px", fontSize: 14, border: "1px solid #fecaca", borderRadius: 8, boxSizing: "border-box" }}
              />
              <button type="submit"
                style={{
                  padding: "10px 20px", fontSize: 13, fontWeight: 600,
                  backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer",
                }}
              >
                Permanently delete my account
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
