import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import QuizQuestion from "../components/QuizQuestion";
import CountdownTimer from "../components/CountdownTimer";

const ROUNDS = 10;
const TIME_PER_QUESTION = 10;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz() {
  const navigate = useNavigate();
  const [allStudents, setAllStudents] = useState([]);
  const [quizStudents, setQuizStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [finished, setFinished] = useState(false);
  const [answering, setAnswering] = useState(false);
  const timerRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    document.title = "Quiz — RCA Village";
    async function fetch() {
      try {
        const q = query(collection(db, "users"), where("photoURL", "!=", null));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllStudents(list);
      } catch (err) {
        console.error(err);
        setError("Something went wrong. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const goNext = useCallback((wasCorrect) => {
    setScore((prev) => (wasCorrect ? prev + 1 : prev));
    setRound((prev) => prev + 1);
    setSelectedAnswer(null);
    setCorrectAnswer(null);
    setTimeLeft(TIME_PER_QUESTION);
    setAnswering(false);
  }, []);

  const handleTimeout = useCallback(() => {
    const student = quizStudents[round];
    if (!student) return;
    setCorrectAnswer(student.name);
    setSelectedAnswer(null);
    setAnswering(true);
    timeoutRef.current = setTimeout(() => {
      goNext(null);
    }, 1000);
  }, [quizStudents, round, goNext]);

  useEffect(() => {
    if (quizStudents.length === 0 || finished) return;
    if (answering) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => { clearInterval(timerRef.current); };
  }, [round, quizStudents, finished, answering]);

  useEffect(() => {
    if (timeLeft > 0) return;
    if (answering) return;
    if (finished) return;
    if (quizStudents.length === 0) return;
    clearInterval(timerRef.current);
    handleTimeout();
  }, [timeLeft, answering, finished, quizStudents, handleTimeout]);

  useEffect(() => {
    if (quizStudents.length > 0 && round >= quizStudents.length) {
      clearInterval(timerRef.current);
      clearTimeout(timeoutRef.current);
      setFinished(true);
    }
  }, [round, quizStudents]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleAnswer = useCallback((name) => {
    if (answering) return;
    const student = quizStudents[round];
    if (!student) return;
    clearInterval(timerRef.current);
    clearTimeout(timeoutRef.current);
    const isCorrect = name === student.name;
    setSelectedAnswer(name);
    setCorrectAnswer(student.name);
    setAnswering(true);
    timeoutRef.current = setTimeout(() => {
      goNext(isCorrect);
    }, 1000);
  }, [answering, quizStudents, round, goNext]);

  const startQuiz = useCallback(() => {
    const shuffled = shuffle(allStudents).slice(0, ROUNDS);
    setQuizStudents(shuffled);
    setStarted(true);
    setRound(0);
    setScore(0);
    setSelectedAnswer(null);
    setCorrectAnswer(null);
    setTimeLeft(TIME_PER_QUESTION);
    setFinished(false);
    setAnswering(false);
  }, [allStudents]);

  if (loading) {
    return (
      <div className="page-fade-in responsive-pad" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-fade-in responsive-pad" style={{ textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "#555" }}>{error}</p>
      </div>
    );
  }

  const currentStudent = started ? quizStudents[round] : null;
  const generateOptions = (student) => {
    const decoys = shuffle(allStudents.filter((s) => s.id !== student.id));
    const picked = decoys.slice(0, 4).concat(student);
    return shuffle(picked);
  };
  const options = currentStudent ? generateOptions(currentStudent) : [];

  const progress = ((round) / ROUNDS) * 100;

  const getMessage = () => {
    if (score === 0) return "Not even one? Time to meet your classmates.";
    if (score <= 3) return "Keep exploring the directory!";
    if (score <= 5) return "Getting there, keep playing!";
    if (score <= 7) return "Almost a pro!";
    if (score <= 9) return "You really know your campus!";
    return "Perfect score — you know everyone!";
  };

  return (
    <div className="page-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      {allStudents.length < 4 ? (
        <motion.div
          key="not-enough"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ maxWidth: 480, padding: "20px", textAlign: "center" }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3d3d3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111", letterSpacing: "-0.5px", marginBottom: 12, lineHeight: 1.2 }}>
            Face Quiz
          </h1>
          <p style={{ fontSize: 15, color: "#555", lineHeight: 1.5 }}>
            There are not enough profiles yet to start the quiz. At least 4 students need to have a profile photo.
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          {!started && (
            <motion.div
              key="pre-quiz"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              style={{ maxWidth: 480, padding: "20px", textAlign: "center" }}
            >
              <motion.svg
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3d3d3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ marginBottom: 16 }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </motion.svg>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#111",
                  letterSpacing: "-0.5px",
                  marginBottom: 8,
                  lineHeight: 1.2,
                }}
              >
                Face Quiz
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                style={{ fontSize: 15, color: "#555", marginBottom: 32, lineHeight: 1.5 }}
              >
                How well do you know your campus?
              </motion.p>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
                }}
                style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40, textAlign: "left", maxWidth: 320, margin: "0 auto 40px" }}
              >
                {[
                  "10 questions, one per student",
                  "10 seconds to answer each",
                  "Time runs out? It counts as wrong.",
                ].map((rule) => (
                  <motion.div
                    key={rule}
                    variants={{
                      hidden: { opacity: 0, x: -12 },
                      visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
                    }}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d3d3d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span style={{ fontSize: 14, color: "#555" }}>{rule}</span>
                  </motion.div>
                ))}
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startQuiz}
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  backgroundColor: "#3d3d3d",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background-color 150ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e293b")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3d3d3d")}
              >
                Start Quiz
              </motion.button>

              <p style={{ fontSize: 12, color: "#999", marginTop: 12 }}>
                Only students with profile photos are included.
              </p>
            </motion.div>
          )}

          {started && !finished && (
            <motion.div
              key="active-quiz"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              style={{ maxWidth: 660, padding: "20px", width: "100%" }}
            >
              <motion.div
                key={round}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <motion.span
                    key={`q-${round}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ fontSize: 13, color: "#999" }}
                  >
                    Question {round + 1} of {ROUNDS}
                  </motion.span>
                  <motion.span
                    key={`s-${score}`}
                    initial={{ scale: 1.3, color: "#16a34a" }}
                    animate={{ scale: 1, color: "#111" }}
                    transition={{ duration: 0.3 }}
                    style={{ fontSize: 13, fontWeight: 500, color: "#111" }}
                  >
                    Score: {score}
                  </motion.span>
                </div>

                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{
                    width: "100%",
                    height: 4,
                    backgroundColor: "#e5e5e5",
                    borderRadius: 4,
                    marginBottom: 24,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#3d3d3d",
                      borderRadius: 4,
                    }}
                  />
                </motion.div>

                <div style={{ marginBottom: 24, textAlign: "center" }}>
                  <CountdownTimer timeLeft={timeLeft} totalTime={TIME_PER_QUESTION} />
                </div>

                <QuizQuestion
                  student={currentStudent}
                  options={options}
                  selectedAnswer={selectedAnswer}
                  correctAnswer={correctAnswer}
                  onAnswer={handleAnswer}
                />
              </motion.div>
            </motion.div>
          )}

          {finished && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{ maxWidth: 480, padding: "20px", textAlign: "center" }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                style={{ marginBottom: 8 }}
              >
                <span style={{ fontSize: 56, fontWeight: 700, color: "#111", lineHeight: 1 }}>{score}</span>
                <span style={{ fontSize: 24, fontWeight: 400, color: "#999" }}>/10</span>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ fontSize: 18, fontWeight: 500, color: "#111", marginBottom: 32, lineHeight: 1.3 }}
              >
                {getMessage()}
              </motion.p>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                style={{ height: 1, backgroundColor: "#e5e5e5", marginBottom: 24, transformOrigin: "left" }}
              />

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="quiz-results-buttons"
                style={{ display: "flex", gap: 12, justifyContent: "center" }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startQuiz}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#3d3d3d",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "background-color 150ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e293b")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3d3d3d")}
                >
                  Play again
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/directory")}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#fff",
                    color: "#111",
                    border: "1px solid #e5e5e5",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "background-color 150ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
                >
                  Back to directory
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
