"use client";
import { useState, useEffect, useRef, useContext } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronDown, Clock, Share2 } from "lucide-react";
import Image from "next/image";
import { SupabaseContext } from "@/providers/supabase";

type Feedback = ("correct" | "wrong-position" | "incorrect")[];

interface QuizQuestion {
  id: number;
  question: string;
  answer: string;
  explanation: string;
  image_url?: string;
}

export default function QuizGame() {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "finished">("playing");
  const [stats, setStats] = useState({
    played: 0,
    winPercentage: 0,
    currentStreak: 0,
    maxStreak: 0,
  });
  const [showExplanation, setShowExplanation] = useState(false);
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(true);

  const answerInputRef = useRef<HTMLInputElement>(null);
  const { client: supabase, isAuthenticated } = useContext(SupabaseContext);

  useEffect(() => {
    fetchQuestion();
    fetchStats();
  }, []);

  useEffect(() => {
    if (gameState === "playing") {
      const timer = setInterval(() => {
        setTimeElapsed((prevTime) => prevTime + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  const fetchQuestion = async () => {
    const { data, error } = await supabase
      .from("question")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching question:", error);
    } else if (data) {
      setQuestion(data);
    }
  };

  const fetchStats = async () => {
    // Placeholder implementation
    setStats({
      played: 10,
      winPercentage: 80,
      currentStreak: 3,
      maxStreak: 5,
    });
  };
  const handleCharacterChange = (index: number, value: string) => {
    const newAnswer = answer.split("");
    newAnswer[index] = value.toUpperCase();
    setAnswer(newAnswer.join(""));

    if (newAnswer.join("").length === question?.answer.length) {
      handleSubmit(newAnswer.join(""));
    }
  };

  const handleSubmit = (submittedAnswer: string) => {
    if (!question) return;

    const newFeedback: Feedback = Array(submittedAnswer.length).fill(
      "incorrect"
    );
    let remainingCorrect = question.answer.split("");

    submittedAnswer.split("").forEach((letter, index) => {
      if (letter === question.answer[index]) {
        newFeedback[index] = "correct";
        remainingCorrect[index] = "";
      }
    });

    submittedAnswer.split("").forEach((letter, index) => {
      if (newFeedback[index] !== "correct") {
        const correctIndex = remainingCorrect.indexOf(letter);
        if (correctIndex !== -1) {
          newFeedback[index] = "wrong-position";
          remainingCorrect[correctIndex] = "";
        }
      }
    });

    setAttempts([...attempts, submittedAnswer]);
    setFeedback([...feedback, newFeedback]);

    if (submittedAnswer === question.answer || attempts.length === 2) {
      setGameState("finished");
      setShowExplanation(true);
    }

    setAnswer("");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getFeedbackColor = (
    type: "correct" | "wrong-position" | "incorrect"
  ) => {
    switch (type) {
      case "correct":
        return "bg-green-500";
      case "wrong-position":
        return "bg-yellow-500";
      case "incorrect":
        return "bg-gray-300";
    }
  };

  const calculateScore = (feedback: Feedback[], timeElapsed: number) => {
    let score = 0;
    feedback.forEach((row) => {
      row.forEach((f) => {
        if (f === "correct") score += 100;
        else if (f === "wrong-position") score -= 50;
        else if (f === "incorrect") score -= 25;
      });
    });
    score -= timeElapsed;
    return Math.max(score, 0);
  };

  const getShareableResult = () => {
    const score = calculateScore(feedback, timeElapsed);
    const feedbackEmojis = feedback
      .map((row) =>
        row
          .map((f) =>
            f === "correct" ? "🟩" : f === "wrong-position" ? "🟨" : "⬛"
          )
          .join("")
      )
      .join("\n");

    // Find the attempt where the user got the correct answer
    const correctAttemptIndex =
      attempts.findIndex((attempt) => attempt === question?.answer) + 1;

    return `QuizX #${question?.id}\n${
      correctAttemptIndex > 0 ? `${correctAttemptIndex}/3` : `X/3`
    } Score: ${score}\n${feedbackEmojis}`;
  };
  const [showToast, setShowToast] = useState(false);

  const handleCopy = async () => {
    const result = getShareableResult(); // Assuming this function returns the string to copy
    await navigator.clipboard.writeText(result);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000); // Toast disappears after 3 seconds
  };

  if (!question) return <div>Loading...</div>;

  return (
    <>
      <header className="quix-header">
        <div className="header-top-border"></div>{" "}
        {/* This div represents the top border */}
        <h1 className="quix-title">QUIX</h1>
      </header>
      <div className="quix-container">
        <div className="question-header">Question of the day</div>
        <div className="question-content">
          <p className={`${isQuestionExpanded ? "" : "line-clamp-2"}`}>
            {question.question}
          </p>
          {question.question.length > 100 && (
            <button
              className="expand-button"
              onClick={() => setIsQuestionExpanded(!isQuestionExpanded)}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isQuestionExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
          {question.image_url && question.image_url !== "NULL" && (
            <div className="question-image">
              <Image
                src={question.image_url}
                alt="Question image"
                width={500} // Set the original width of the image
                height={300} // Set the original height of the image
                layout="responsive"
              />
            </div>
          )}
        </div>
        <div className="attempts-container">
          {attempts.map((attempt, index) => (
            <div key={index} className="attempt-row">
              {attempt.split("").map((letter, letterIndex) => (
                <div
                  key={letterIndex}
                  className={`attempt-block ${getFeedbackColor(
                    feedback[index][letterIndex]
                  )}`}
                >
                  {letter}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="answer-container">
          {question.answer
            .split("")
            .map((char, index) =>
              char === " " ? (
                <div key={index} className="answer-space" />
              ) : (
                <input
                  key={index}
                  className="answer-input"
                  maxLength={1}
                  value={answer[index] || ""}
                  onChange={(event) =>
                    handleCharacterChange(index, event.target.value)
                  }
                  disabled={gameState !== "playing"}
                />
              )
            )}
        </div>
        <button
          className="submit-button"
          onClick={() => handleSubmit(answer)}
          disabled={gameState !== "playing"}
        >
          Submit
        </button>

        {showExplanation && (
          <div className="explanation">
            <h3>Answer Explanation:</h3>
            <p>{question?.explanation}</p>
            {question?.image_url && question.image_url !== "NULL" && (
              <div className="explanation-image">
                <Image
                  src={question.image_url}
                  alt="Explanation image"
                  width={500} // Set the original width of the image
                  height={300} // Set the original height of the image
                  layout="responsive"
                />
              </div>
            )}
          </div>
        )}
        {gameState === "finished" && isAuthenticated && (
          <div className="statistics-panel">
            <h3>Statistics</h3>
            <div className="stats-grid">
              <div className="stat">
                <div className="stat-value">{stats.played}</div>
                <div className="stat-label">Played</div>
              </div>
              <div className="stat">
                <div className="stat-value">{stats.winPercentage}%</div>
                <div className="stat-label">Win %</div>
              </div>
              <div className="stat">
                <div className="stat-value">{stats.currentStreak}</div>
                <div className="stat-label">Current Streak</div>
              </div>
              <div className="stat">
                <div className="stat-value">{stats.maxStreak}</div>
                <div className="stat-label">Max Streak</div>
              </div>
            </div>
            <button className="copy-button" onClick={handleCopy}>
              Copy
            </button>
            <button className="explore-button">Explore previous QOTD</button>
          </div>
        )}
        {showToast && <div className="toast">Copied to clipboard</div>}
        <div className="footer">
          <div className="timer">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeElapsed)}</span>
          </div>
          <span className="credits">Made with ❤️ o7 labs</span>
        </div>
      </div>
    </>
  );
}
