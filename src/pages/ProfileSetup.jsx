import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { EmailAuthProvider, linkWithCredential } from "firebase/auth";
import { doc, setDoc, updateDoc, query, collection, where, getDocs } from "firebase/firestore";
import { auth, db, CLOUDINARY_CLOUD, CLOUDINARY_PRESET } from "../firebase/config";
import { useAuth } from "../AuthContext";
import AvatarPlaceholder from "../components/AvatarPlaceholder";

export default function ProfileSetup() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const isEditing = !!profile;
  const fileInputRef = useRef(null);
  const secondaryFileInputRef = useRef(null);
  const hasPassword = user?.providerData?.some((p) => p.providerId === "password");

  const [name, setName] = useState("");
  const [photoURL, setPhotoURL] = useState(null);
  const [secondaryPhotoURL, setSecondaryPhotoURL] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [secondaryUploading, setSecondaryUploading] = useState(false);
  const [classVal, setClassVal] = useState("");
  const [funFact, setFunFact] = useState("");
  const [slackUsername, setSlackUsername] = useState("");
  const [github, setGithub] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [proposedUsername, setProposedUsername] = useState("");
  const [usernameEditable, setUsernameEditable] = useState(false);
  const [customUsername, setCustomUsername] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setClassVal(profile.class || "");
      setFunFact(profile.funFact || "");
      setSlackUsername(profile.slackUsername || "");
      setGithub(profile.github || "");
      setInstagram(profile.instagram || "");
      setLinkedin(profile.linkedin || "");
      setCustomUsername(profile.username || "");
      setProposedUsername(profile.username || "");
      setRecoveryEmail(profile.recoveryEmail || "");
      if (profile.photoURL) setPhotoURL(profile.photoURL);
      if (profile.secondaryPhotoURL) setSecondaryPhotoURL(profile.secondaryPhotoURL);
    }
  }, [profile]);

  useEffect(() => {
    if (!isEditing && name.trim().length > 1) {
      const timer = setTimeout(async () => {
        const gen = await generateUsername(name.trim());
        setProposedUsername(gen);
        if (!usernameEditable) setCustomUsername(gen);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [name, isEditing]);

  const generateUsername = async (displayName) => {
    let base = displayName.toLowerCase().replace(/[^a-z\s]/g, "").trim().replace(/\s+/g, ".");
    let username = base;
    let i = 1;
    while (true) {
      const q = query(collection(db, "users"), where("username", "==", username));
      const snap = await getDocs(q);
      if (snap.empty) return username;
      username = `${base}${i}`;
      i++;
    }
  };

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload failed");
      setPhotoURL(data.secure_url);
    } catch (err) {
      setErrors({ photo: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSecondaryFilePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSecondaryUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload failed");
      setSecondaryPhotoURL(data.secure_url);
    } catch (err) {
      setErrors({ secondaryPhoto: err.message });
    } finally {
      setSecondaryUploading(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Full name is required.";
    if (!classVal) errs.classVal = "Please select a class.";
    if (!customUsername.trim()) errs.username = "Username is required.";
    if (!/^[a-z0-9._-]+$/.test(customUsername)) errs.username = "Use only lowercase letters, numbers, dots, hyphens, and underscores.";
    if (!hasPassword && isEditing === false && !password) errs.password = "Set a password so you can log in with your username.";
    if (!hasPassword && isEditing === false && password && password.length < 6) errs.password = "Password must be at least 6 characters.";
    if (github && !/^https?:\/\/.*/.test(github)) errs.github = "Enter a valid URL.";
    if (instagram && !/^https?:\/\/.*/.test(instagram)) errs.instagram = "Enter a valid URL.";
    if (linkedin && !/^https?:\/\/.*/.test(linkedin)) errs.linkedin = "Enter a valid URL.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || !user) return;
    setSaving(true);

    try {
      const data = {
        name: name.trim(),
        photoURL,
        secondaryPhotoURL: secondaryPhotoURL || null,
        class: classVal,
        funFact: funFact.trim() || null,
        username: customUsername.trim(),
        email: user.email,
        recoveryEmail: recoveryEmail.trim() || null,
        slackUsername: slackUsername.trim() || null,
        github: github.trim() || null,
        instagram: instagram.trim() || null,
        linkedin: linkedin.trim() || null,
        createdAt: profile?.createdAt || new Date(),
      };

      if (isEditing) {
        await updateDoc(doc(db, "users", user.uid), data);
      } else {
        data.createdAt = new Date();
        await setDoc(doc(db, "users", user.uid), data);
        if (!hasPassword && password) {
          const authEmail = `${customUsername.trim().toLowerCase()}@rca.app`;
          const credential = EmailAuthProvider.credential(authEmail, password);
          await linkWithCredential(user, credential);
        }
      }

      await refreshProfile();
      navigate("/directory", { replace: true });
    } catch (err) {
      if (err.code === "auth/credential-already-in-use" || err.code === "auth/email-already-in-use") {
        setErrors({ submit: `The username "${customUsername}" is already taken. Please choose a different one.` });
      } else {
        setErrors({ submit: err.message });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-fade-in profile-setup-page" style={{ minHeight: "100vh", backgroundColor: "#fafafa", padding: "80px 24px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p className="text-xs text-accent" style={{ marginBottom: 12 }}>
            Glad you're here
          </p>
          <h1 className="text-display text-primary" style={{ marginBottom: 12 }}>
            {isEditing ? "Edit your profile" : "Make it yours"}
          </h1>
          <p className="text-body text-secondary" style={{ maxWidth: 480, margin: "0 auto" }}>
            {isEditing ? "Small changes, big impact. Your updates show up right away." : "This is where your corner of campus comes to life. Share what feels right — it helps the rest of us find you."}
          </p>
        </div>

        <div className="card profile-setup-card" style={{ padding: 40 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 40, textAlign: "center" }}>
              <p className="text-small text-muted" style={{ marginBottom: 16 }}>
                A photo helps others recognize you when you pass by. No pressure, but it makes the quiz way more fun.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFilePick}
                style={{ display: "none" }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  background: "none",
                  border: "none",
                  cursor: uploading ? "not-allowed" : "pointer",
                  padding: 0,
                  position: "relative",
                  display: "inline-block",
                }}
              >
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt=""
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "4px solid #ffffff",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      opacity: uploading ? 0.5 : 1,
                      transition: "all 0.2s ease",
                    }}
                  />
                ) : (
                  <div style={{ opacity: uploading ? 0.5 : 1, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", borderRadius: "50%" }}>
                    <AvatarPlaceholder name={name || "?"} size={120} />
                  </div>
                )}
                {uploading && (
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      color: "#475569",
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderRadius: "50%",
                    }}
                  >
                    Uploading...
                  </span>
                )}
              </button>
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-small"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#3d3d3d",
                    cursor: "pointer",
                    fontWeight: 500,
                    padding: "8px 16px",
                    borderRadius: 6,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {photoURL ? "Change photo" : "Add a photo"}
                </button>
              </div>
              {errors.photo && (
                <p className="text-small" style={{ color: "#dc2626", marginTop: 8 }}>{errors.photo}</p>
              )}
            </div>

            <div style={{ marginBottom: 40 }}>
              <p className="text-small text-muted" style={{ marginBottom: 12 }}>
                A second photo gives people another way to spot you.
              </p>
              <input
                ref={secondaryFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleSecondaryFilePick}
                style={{ display: "none" }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button
                  type="button"
                  onClick={() => secondaryFileInputRef.current?.click()}
                  disabled={secondaryUploading}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: secondaryUploading ? "not-allowed" : "pointer",
                    padding: 0,
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  {secondaryPhotoURL ? (
                    <img
                      src={secondaryPhotoURL}
                      alt=""
                      style={{
                        width: 88,
                        height: 88,
                        borderRadius: 12,
                        objectFit: "cover",
                        border: "3px solid #ffffff",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                        opacity: secondaryUploading ? 0.5 : 1,
                        transition: "all 0.2s ease",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 88,
                        height: 88,
                        borderRadius: 12,
                        border: "2px dashed #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                        color: "#94a3b8",
                        opacity: secondaryUploading ? 0.5 : 1,
                        transition: "all 0.2s ease",
                      }}
                    >
                      +
                    </div>
                  )}
                  {secondaryUploading && (
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        color: "#475569",
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderRadius: 12,
                      }}
                    >
                      Uploading...
                    </span>
                  )}
                </button>
                <div>
                  <button
                    type="button"
                    onClick={() => secondaryFileInputRef.current?.click()}
                    className="text-small"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#3d3d3d",
                      cursor: "pointer",
                      fontWeight: 500,
                      padding: "6px 12px",
                      borderRadius: 6,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {secondaryPhotoURL ? "Change" : "Add a secondary photo"}
                  </button>
                  {secondaryPhotoURL && (
                    <button
                      type="button"
                      onClick={() => setSecondaryPhotoURL(null)}
                      className="text-small"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#dc2626",
                        cursor: "pointer",
                        fontWeight: 500,
                        padding: "6px 12px",
                        borderRadius: 6,
                        transition: "all 0.2s ease",
                        marginLeft: 4,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fef2f2")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              {errors.secondaryPhoto && (
                <p className="text-small" style={{ color: "#dc2626", marginTop: 8 }}>{errors.secondaryPhoto}</p>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="text-small" style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Full name <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jean Paul"
                className="input-field"
                style={{
                  border: `1px solid ${errors.name ? "#dc2626" : "#e2e8f0"}`,
                }}
              />
              {errors.name && (
                <p className="text-small" style={{ color: "#dc2626", marginTop: 6 }}>{errors.name}</p>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="text-small" style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Class <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <select
                value={classVal}
                onChange={(e) => setClassVal(e.target.value)}
                className="select-field"
                style={{
                  border: `1px solid ${errors.classVal ? "#dc2626" : "#e2e8f0"}`,
                }}
              >
                <option value="">Select class</option>
                <option value="Y1">Y1</option>
                <option value="Y2">Y2</option>
                <option value="Y3">Y3</option>
              </select>
              {errors.classVal && (
                <p className="text-small" style={{ color: "#dc2626", marginTop: 6 }}>{errors.classVal}</p>
              )}
            </div>

            {!isEditing && (
              <div style={{ marginBottom: 24 }}>
                <label className="text-small" style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                  Username <span style={{ color: "#dc2626" }}>*</span>
                </label>
                {usernameEditable ? (
                  <input
                    type="text"
                    value={customUsername}
                    onChange={(e) => setCustomUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                    placeholder="your.username"
                    className="input-field"
                    style={{ border: `1px solid ${errors.username ? "#dc2626" : "#e2e8f0"}` }}
                    onBlur={() => setUsernameEditable(false)}
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() => !saving && setUsernameEditable(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 14px", border: `1px solid ${errors.username ? "#dc2626" : "#e2e8f0"}`,
                      borderRadius: 8, cursor: saving ? "default" : "pointer",
                      backgroundColor: "#fff", transition: "border-color 150ms ease",
                    }}
                    onMouseEnter={(e) => { if (!saving) e.currentTarget.style.borderColor = "#3d3d3d"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = errors.username ? "#dc2626" : "#e2e8f0"; }}
                  >
                    <span style={{ fontSize: 14, color: "#0f172a", flex: 1 }}>{customUsername || proposedUsername}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                  </div>
                )}
                <p className="text-small text-muted" style={{ marginTop: 6 }}>
                  This is how people find you in the directory. Make it your own.
                </p>
                {errors.username && (
                  <p className="text-small" style={{ color: "#dc2626", marginTop: 6 }}>{errors.username}</p>
                )}
              </div>
            )}

            {!isEditing && !hasPassword && (
              <div style={{ marginBottom: 24 }}>
                <label className="text-small" style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                  Set password <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set a password for username login"
                  className="input-field"
                  style={{ border: `1px solid ${errors.password ? "#dc2626" : "#e2e8f0"}` }}
                />
                <p className="text-small text-muted" style={{ marginTop: 6 }}>
                  A password lets you sign in anytime with your username <strong>{customUsername || proposedUsername}</strong>. 
                </p>
                {errors.password && (
                  <p className="text-small" style={{ color: "#dc2626", marginTop: 6 }}>{errors.password}</p>
                )}
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label className="text-small" style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Recovery email
              </label>
              <input
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="input-field"
                style={{ border: "1px solid #e2e8f0" }}
              />
              <p className="text-small text-muted" style={{ marginTop: 6 }}>
                This is how we'll help you back in if you ever get locked out. We'll never share it.
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="text-small" style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Fun fact
              </label>
              <input
                type="text"
                value={funFact}
                onChange={(e) => setFunFact(e.target.value)}
                placeholder="e.g. I once met the President of Rwanda"
                className="input-field"
                style={{ border: "1px solid #e2e8f0" }}
              />
              <p className="text-small text-muted" style={{ marginTop: 6 }}>
                The little things that make you, you. Share whatever feels right.
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="text-small" style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Slack username
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500 }}>@</span>
                <input
                  type="text"
                  value={slackUsername}
                  onChange={(e) => setSlackUsername(e.target.value.replace(/\s/g, ""))}
                  placeholder="you"
                  className="input-field"
                  style={{ border: "1px solid #e2e8f0", flex: 1 }}
                />
              </div>
              <p className="text-small text-muted" style={{ marginTop: 6 }}>
                So people can find you on Slack — we use it every day.
              </p>
            </div>

            {[
              { label: "GitHub URL", value: github, set: setGithub, key: "github", placeholder: "https://github.com/username" },
              { label: "Instagram URL", value: instagram, set: setInstagram, key: "instagram", placeholder: "https://instagram.com/username" },
              { label: "LinkedIn URL", value: linkedin, set: setLinkedin, key: "linkedin", placeholder: "https://linkedin.com/in/username" },
            ].map((field) => (
              <div key={field.key} style={{ marginBottom: 20 }}>
                <label className="text-small" style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                  {field.label}
                </label>
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  className="input-field"
                  style={{
                    border: `1px solid ${errors[field.key] ? "#dc2626" : "#e2e8f0"}`,
                  }}
                />
                {errors[field.key] && (
                  <p className="text-small" style={{ color: "#dc2626", marginTop: 6 }}>{errors[field.key]}</p>
                )}
              </div>
            ))}

            {errors.submit && (
              <div style={{
                padding: "12px 16px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                marginBottom: 20
              }}>
                <p className="text-small" style={{ color: "#dc2626" }}>{errors.submit}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{
                width: "100%",
                backgroundColor: saving ? "#94a3b8" : "#3d3d3d",
                cursor: saving ? "not-allowed" : "pointer",
                transform: saving ? "none" : undefined,
              }}
            >
              {saving ? "Saving..." : isEditing ? "Save changes" : "Join the community"}
            </button>

            {isEditing && (
              <p className="text-small text-muted" style={{ textAlign: "center", marginTop: 16 }}>
                Your updates show up in the directory right away.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
