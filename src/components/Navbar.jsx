import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useAuth } from "../AuthContext";
import AvatarPlaceholder from "./AvatarPlaceholder";

export default function Navbar() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const dropdownRef = useRef(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const THRESHOLD = 20;
    function handleScroll() {
      const currentY = window.scrollY;
      if (currentY <= THRESHOLD) {
        setNavVisible(true);
      } else if (currentY < lastScrollY.current) {
        setNavVisible(true);
      } else if (currentY > lastScrollY.current) {
        setNavVisible(false);
      }
      lastScrollY.current = currentY;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut(auth);
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className="navbar-inner"
      style={{
        position: "fixed",
        top: 12,
        left: "50%",
        transform: navVisible ? "translateX(-50%)" : "translateX(-50%) translateY(-80px)",
        width: "90%",
        maxWidth: 1100,
        height: 56,
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        zIndex: 1000,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        transition: "transform 250ms ease",
      }}
    >
      <Link
        to="/directory"
        className="navbar-brand"
        style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#1e293b",
            display: "inline-block",
            position: "relative",
          }}
        />
        <span style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", letterSpacing: "-0.03em" }}>
          RCA Village
        </span>
      </Link>

      <div className="navbar-links" style={{ display: "flex", gap: 4 }}>
        {[
          { to: "/directory", label: "Directory" },
          { to: "/coffee", label: "Coffee" },
          { to: "/quiz", label: "Quiz" },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            style={{
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              color: isActive(link.to) ? "#0f172a" : "#64748b",
              padding: "6px 14px",
              borderRadius: 9999,
              backgroundColor: isActive(link.to) ? "#f1f5f9" : "transparent",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isActive(link.to)) {
                e.target.style.color = "#0f172a";
                e.target.style.backgroundColor = "#f8fafc";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(link.to)) {
                e.target.style.color = "#64748b";
                e.target.style.backgroundColor = "transparent";
              }
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div style={{ position: "relative" }} ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            background: "none",
            border: "2px solid transparent",
            cursor: "pointer",
            padding: 2,
            borderRadius: "50%",
            transition: "border-color 200ms ease",
            lineHeight: 0,
            borderColor: dropdownOpen ? "#e2e8f0" : "transparent",
          }}
          aria-label="Profile menu"
        >
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt=""
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <AvatarPlaceholder name={profile?.name || ""} size={30} />
          )}
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 48,
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              minWidth: 180,
              zIndex: 100,
              overflow: "hidden",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
              animation: "fadeIn 150ms ease",
            }}
          >
            {profile?.name && (
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.3 }}>
                  {profile.name}
                </p>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                  {profile.class || "Student"}
                </p>
              </div>
            )}
            <button
              onClick={() => {
                setDropdownOpen(false);
                navigate("/profile-setup");
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 16px",
                background: "none",
                border: "none",
                color: "#334155",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "background-color 150ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              Edit Profile
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                navigate("/settings");
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 16px",
                background: "none",
                border: "none",
                color: "#334155",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "background-color 150ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              Settings
            </button>
            {profile?.admin && (
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/admin");
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 16px",
                  background: "none",
                  border: "none",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background-color 150ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                Admin
              </button>
            )}
            <div style={{ height: 1, backgroundColor: "#f1f5f9" }} />
            <button
              onClick={handleSignOut}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 16px",
                background: "none",
                border: "none",
                color: "#334155",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "background-color 150ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
