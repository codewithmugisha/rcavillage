import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function AdminRoute({ children }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#666" }}>
        Loading...
      </div>
    );
  }

  if (!profile?.admin) return <Navigate to="/directory" replace />;

  return children;
}
