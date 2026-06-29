import { createContext, useContext, useEffect, useState, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchedUid = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          if (fetchedUid.current === firebaseUser.uid) {
            setLoading(false);
            return;
          }
          fetchedUid.current = firebaseUser.uid;

          const docRef = doc(db, "users", firebaseUser.uid);
          let docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile({ id: docSnap.id, ...docSnap.data() });
          } else if (firebaseUser.email) {
            const emailRef = doc(db, "users", firebaseUser.email);
            const emailSnap = await getDoc(emailRef);
            if (emailSnap.exists()) {
              await setDoc(docRef, emailSnap.data());
              setProfile({ id: docRef.id, ...emailSnap.data() });
            } else {
              setProfile(null);
            }
          } else {
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
          fetchedUid.current = null;
        }
      } catch (err) {
        console.error("Auth state error:", err.code, err.message);
        console.error("User UID:", firebaseUser?.uid, "Email:", firebaseUser?.email);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() });
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("refreshProfile error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
