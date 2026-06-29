import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import Directory from "./pages/Directory";
import StudentProfile from "./pages/StudentProfile";
import Quiz from "./pages/Quiz";
import CoffeePairing from "./pages/CoffeePairing";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudents from "./pages/AdminStudents";
import AdminPairings from "./pages/AdminPairings";
import Settings from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import ToastContainer from "./components/Toast";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

function PageWrap({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <AuthProvider>
      <ToastContainer />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<PageWrap><Login /></PageWrap>} />
          <Route path="/forgot-password" element={<PageWrap><ForgotPassword /></PageWrap>} />
          <Route
            path="/profile-setup"
            element={
              <ProtectedRoute requireProfile={false}>
                <PageWrap><ProfileSetup /></PageWrap>
              </ProtectedRoute>
            }
          />
          <Route
            path="/directory"
            element={
              <ProtectedRoute requireProfile={true}>
                <Navbar />
                <PageWrap><Directory /></PageWrap>
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/:username"
            element={
              <ProtectedRoute requireProfile={true}>
                <Navbar />
                <PageWrap><StudentProfile /></PageWrap>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz"
            element={
              <ProtectedRoute requireProfile={true}>
                <Navbar />
                <PageWrap><Quiz /></PageWrap>
              </ProtectedRoute>
            }
          />
          <Route
            path="/coffee"
            element={
              <ProtectedRoute requireProfile={true}>
                <Navbar />
                <PageWrap><CoffeePairing /></PageWrap>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute requireProfile={true}>
                <Navbar />
                <PageWrap><Settings /></PageWrap>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireProfile={true}>
                <AdminRoute>
                  <Navbar />
                  <PageWrap><AdminDashboard /></PageWrap>
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute requireProfile={true}>
                <AdminRoute>
                  <Navbar />
                  <PageWrap><AdminStudents /></PageWrap>
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pairings"
            element={
              <ProtectedRoute requireProfile={true}>
                <AdminRoute>
                  <Navbar />
                  <PageWrap><AdminPairings /></PageWrap>
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute requireProfile={true}>
                <Navbar />
                <PageWrap><Directory /></PageWrap>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<PageWrap><Login /></PageWrap>} />
        </Routes>
      </AnimatePresence>
    </AuthProvider>
  );
}
