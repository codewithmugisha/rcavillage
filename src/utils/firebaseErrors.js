const ERROR_MAP = {
  "auth/email-already-in-use": "This email is already registered. Try signing in instead.",
  "auth/user-not-found": "No account found with that username.",
  "auth/wrong-password": "Incorrect password. Try again.",
  "auth/invalid-credential": "Invalid username or password.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "Invalid email address.",
  "auth/operation-not-allowed": "This sign-in method is not enabled. Contact support.",
  "auth/popup-closed-by-user": "Sign-in popup was closed before completing.",
  "auth/popup-blocked": "Sign-in popup was blocked. Allow popups for this site.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/requires-recent-login": "Please sign out and sign back in before trying again.",
};

export function friendlyError(err) {
  if (!err) return "Something went wrong.";
  const code = err.code || err;
  return ERROR_MAP[code] || err.message || err || "Something went wrong.";
}
