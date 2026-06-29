import { motion } from "framer-motion";

export default function CountdownTimer({ timeLeft, totalTime }) {
  const pct = timeLeft / totalTime;
  const isUrgent = timeLeft <= 3;
  const strokeColor = isUrgent ? "#dc2626" : "#1e293b";
  const textColor = isUrgent ? "#dc2626" : "#0f172a";

  const size = 72;
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ display: "inline-block", position: "relative", width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset, stroke: strokeColor }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </svg>
      <motion.span
        key={timeLeft}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: isUrgent ? [1, 1.1, 1] : 1,
        }}
        transition={{ duration: 0.2 }}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 800,
          color: textColor,
          letterSpacing: "-0.02em",
        }}
      >
        {timeLeft}
      </motion.span>
    </motion.div>
  );
}
