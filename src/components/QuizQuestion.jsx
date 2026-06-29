import { motion } from "framer-motion";
import AvatarPlaceholder from "./AvatarPlaceholder";

const imageUrl = (url, size) => {
  if (!url) return null;
  if (url.includes("cloudinary")) {
    return url.replace("/upload/", `/upload/w_${size},c_fill,q_auto,f_auto/`);
  }
  return url;
};

export default function QuizQuestion({
  student,
  options,
  selectedAnswer,
  correctAnswer,
  onAnswer,
}) {
  const answered = selectedAnswer !== null;

  const getCardStyle = (opt) => {
    const base = {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      padding: "14px 10px",
      border: "2px solid #e2e8f0",
      borderRadius: 12,
      backgroundColor: "#fff",
      cursor: answered ? "default" : "pointer",
      transition: "background-color 150ms ease, border-color 150ms ease",
      width: "100%",
    };

    if (!answered) return base;

    if (opt.name === correctAnswer) {
      return { ...base, borderColor: "#16a34a", backgroundColor: "#f0fdf4" };
    }
    if (opt.name === selectedAnswer && opt.name !== correctAnswer) {
      return { ...base, borderColor: "#dc2626", backgroundColor: "#fef2f2" };
    }
    return { ...base, opacity: 0.3, cursor: "default" };
  };

  const getImgDim = (opt) => {
    if (answered && opt.name !== correctAnswer && opt.name !== selectedAnswer) return 56;
    return 72;
  };

  return (
    <motion.div
      key={student.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.05 }}
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        {student.photoURL ? (
          <img
            src={imageUrl(student.photoURL, 280)}
            alt=""
            style={{
              width: 180,
              height: 180,
              borderRadius: 12,
              objectFit: "cover",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            }}
          />
        ) : (
          <AvatarPlaceholder name={student.name} size={120} />
        )}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          textAlign: "center",
          fontSize: 17,
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: 24,
          letterSpacing: "-0.01em",
        }}
      >
        Who is this?
      </motion.p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 10,
          maxWidth: 700,
          margin: "0 auto",
        }}
      >
        {options.map((opt) => {
          const dim = getImgDim(opt);
          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              whileHover={!answered ? { scale: 1.04 } : {}}
              whileTap={!answered ? { scale: 0.96 } : {}}
              onClick={() => !answered && onAnswer(opt.name)}
              style={getCardStyle(opt)}
              onMouseEnter={(e) => {
                if (!answered) {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.borderColor = "#1e293b";
                }
              }}
              onMouseLeave={(e) => {
                if (!answered) {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }
              }}
            >
              {opt.photoURL ? (
                <img
                  src={imageUrl(opt.photoURL, dim * 2)}
                  alt=""
                  style={{
                    width: dim,
                    height: dim,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #f1f5f9",
                    transition: "width 200ms ease, height 200ms ease",
                  }}
                />
              ) : (
                <AvatarPlaceholder name={opt.name} size={dim} />
              )}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#0f172a",
                  textAlign: "center",
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%",
                }}
              >
                {opt.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
