"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronDown, Clock, Share2 } from "lucide-react";
import Image from "next/image";
// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

    useEffect(() => {
        if (answerInputRef.current) {
            answerInputRef.current.focus();
        }
    }, [attempts]);

    const fetchQuestion = async () => {
        const { data, error } = await supabase
            .from("questions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error("Error fetching question:", error);
        } else if (data) {
            setQuestion(data);
            console.log(data);
        }
    };

    const fetchStats = async () => {
        // Fetch stats from Supabase or local storage
        // This is a placeholder implementation
        setStats({
            played: 10,
            winPercentage: 80,
            currentStreak: 3,
            maxStreak: 5,
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newAnswer = e.target.value.toUpperCase();
        setAnswer(newAnswer);

        if (newAnswer.length === question?.answer.length) {
            handleSubmit(newAnswer);
        }
    };

    // Define the handleCharacterChange function
    const handleCharacterChange = (index: number, value: string) => {
    // Create a new answer string with the updated character
        const newAnswer = answer.split("");
        newAnswer[index] = value.toUpperCase();

        // Update the answer state
        setAnswer(newAnswer.join(""));

        // If the new answer is the same length as the question's answer, submit it
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

        // First pass: mark correct letters
        submittedAnswer.split("").forEach((letter, index) => {
            if (letter === question.answer[index]) {
                newFeedback[index] = "correct";
                remainingCorrect[index] = "";
            }
        });

        // Second pass: mark wrong position
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

        // Assign points for correct answers, deduct for incorrect or misplaced
        feedback.forEach((row) => {
            row.forEach((f) => {
                if (f === "correct") {
                    score += 100;
                } else if (f === "wrong-position") {
                    score -= 50;
                } else if (f === "incorrect") {
                    score -= 25;
                }
            });
        });

        // Deduct points based on time taken (e.g., 1 point per second)
        score -= timeElapsed;

        // Ensure score is not negative
        score = Math.max(score, 0);

        return score;
    };

    const getShareableResult = () => {
        const attemptCount = attempts.length;
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

        return `QuizX #${question?.id}\n${attemptCount}/3 Score: ${score}\n${feedbackEmojis}`;
    };

    if (!question) return <div>Loading...</div>;

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle className="text-center text-2xl font-bold">QUIX</CardTitle>
            </CardHeader>
            <CardContent className="flex">
                <div className="flex-grow space-y-4 pr-4">
                    <div className="bg-blue-100 text-blue-800 text-sm font-medium p-2 rounded">
                        Question of the day
                    </div>
                    <div className="relative">
                        <p
                            className={`text-sm ${isQuestionExpanded ? "" : "line-clamp-2"}`}
                        >
                            {question.question}
                        </p>
                        {question.question.length > 100 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute bottom-0 right-0"
                                onClick={() => setIsQuestionExpanded(!isQuestionExpanded)}
                            >
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${isQuestionExpanded ? "rotate-180" : ""
                                        }`}
                                />
                            </Button>
                        )}
                    </div>
                    {question.image_url && question.image_url !== "NULL" && (
                        <div className="w-full h-48 relative">
                            <Image
                                src={question.image_url}
                                alt="Question image"
                                layout="fill"
                                objectFit="cover"
                                className="rounded-lg"
                            />
                        </div>
                    )}
                    {/* <input
                        ref={answerInputRef}
                        className="w-full p-2 border border-gray-300 rounded"
                        value={answer}
                        onChange={handleInputChange}
                        disabled={gameState !== "playing"}
                        placeholder="Type your answer here..."
                    /> */}
                    
                               
                                    {question && question.answer.split("").map((char, index) => {
    // If the character is a space, render a space instead of an input field
    if (char === " ") {
        return <div key={index} className="inline-block w-5" />;
    }

    // Render an input field for each character
    return (
        <input
            key={index}
            className="w-8 text-center"
            maxLength={1}
            value={answer[index] || ""}
            onChange={(event) => handleCharacterChange(index, event.target.value)}
            disabled={gameState !== "playing"}
        />
    );
})}

                    {attempts.map((attempt, index) => (
                        <div key={index} className="flex space-x-1">
                            {attempt.split("").map((letter, letterIndex) => (
                                <div
                                    key={letterIndex}
                                    className={`w-8 h-8 flex items-center justify-center text-white font-bold ${getFeedbackColor(
                                        feedback[index][letterIndex]
                                    )}`}
                                >
                                    {letter}
                                </div>
                            ))}
                        </div>
                    ))}
                    {showExplanation && (
                        <div className="bg-purple-100 p-4 rounded-lg">
                            <h3 className="font-bold mb-2">Answer Explanation:</h3>
                            <p>{question.explanation}</p>
                            {question.image_url && question.image_url !== "NULL" && (
                                <div className="w-full h-48 relative mt-2">
                                    <Image
                                        src={question.image_url}
                                        alt="Explanation image"
                                        layout="fill"
                                        objectFit="cover"
                                        className="rounded-lg"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {gameState === "finished" && (
                    <div className="w-1/3 space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-center text-sm">
                            <div>
                                <div className="font-bold">{stats.played}</div>
                                <div>Played</div>
                            </div>
                            <div>
                                <div className="font-bold">{stats.winPercentage}%</div>
                                <div>Win %</div>
                            </div>
                            <div>
                                <div className="font-bold">{stats.currentStreak}</div>
                                <div>Current Streak</div>
                            </div>
                            <div>
                                <div className="font-bold">{stats.maxStreak}</div>
                                <div>Max Streak</div>
                            </div>
                        </div>
                        
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                                navigator.clipboard.writeText(getShareableResult())
                            }
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            Copy
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                            Explore previous QOTD
                        </Button>
                    </div>
                )}
            </CardContent>
            <div className="px-6 pb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{formatTime(timeElapsed)}</span>
                </div>
                <span className="text-sm text-gray-500">Made with ❤️ o7 labs</span>
            </div>
        </Card>
    );
}
