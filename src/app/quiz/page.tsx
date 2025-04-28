'use client';

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSearchParams } from 'next/navigation';
import { saveScoreHistory } from "@/lib/utils";
import { levenshteinDistance } from "@/lib/utils";
import { useRouter } from 'next/navigation';


export default function QuizPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const questions = JSON.parse(decodeURIComponent(searchParams.get('questions') || '[]'));
    const type = searchParams.get('type') || 'generated';

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState("");
    const [feedback, setFeedback] = useState<string | null>(null);
    const [testComplete, setTestComplete] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState<
        { question: string; userAnswer: string; correctAnswer: string; isCorrect: boolean }[]
    >([]);
    const [userAnswers, setUserAnswers] = useState<string[]>([]);


    useEffect(() => {
        if (!questions || questions.length === 0) {
            router.push('/');
        }
    }, [questions, router]);



    const handleAnswerSubmit = async () => {
        if (questions.length === 0) {
            setFeedback("No questions available.");
            return;
        }

        const currentQuestion = questions[currentQuestionIndex];
        if (currentQuestion && userAnswer.trim() !== "") {

            const correctAnswer = questions[currentQuestionIndex]?.answer?.toLowerCase().trim() || "";
            const userAnswerLower = userAnswer.toLowerCase().trim();

            // Calculate Levenshtein distance
            const distance = levenshteinDistance(userAnswerLower, correctAnswer);

            // Set a threshold for acceptable distance (adjust as needed)
            const threshold = Math.max(3, Math.floor(correctAnswer.length * 0.2)); //Dynamic threshold

            if (distance <= threshold) {
                setFeedback("Correct!");
            } else {
                setFeedback(`Incorrect.`);
            }
        } else {
            setFeedback("Please provide an answer.");
        }
    };

    const handleNextQuestion = () => {
        // Store the user's answer
        const updatedAnswers = [...userAnswers];
        updatedAnswers[currentQuestionIndex] = userAnswer;
        setUserAnswers(updatedAnswers);

        setUserAnswer(""); // Clear the user's answer
        setFeedback(null); // Clear the feedback

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setUserAnswer(updatedAnswers[currentQuestionIndex + 1] || ""); // Load next answer if available
        } else {
            setTestComplete(true);
        }
    };

    const handlePreviousQuestion = () => {
        // Store the user's answer
        const updatedAnswers = [...userAnswers];
        updatedAnswers[currentQuestionIndex] = userAnswer;
        setUserAnswers(updatedAnswers);

        setFeedback(null); // Clear the feedback

        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            setUserAnswer(userAnswers[currentQuestionIndex - 1] || ""); // Load previous answer
        }
    };

    const handleReview = () => {
        setCurrentQuestionIndex(0); // Shift to question 1
        setTestComplete(false); // Allow navigation
        setShowResults(false); // Hide results if reviewing
        setUserAnswer(userAnswers[0] || ""); // Load the first answer, if available

    };

    const handleSubmitTest = async () => {
        // Store user's final answer for current question
        const updatedAnswers = [...userAnswers];
        updatedAnswers[currentQuestionIndex] = userAnswer;
        setUserAnswers(updatedAnswers);

        let numCorrect = 0;
        // Implements submit test logic here, e.g., store user's answer and if it's correct
        const newResults = questions.map((question, index) => {
            const correctAnswer = question?.answer?.toLowerCase().trim() || "";
            const userAnswerLower = updatedAnswers[index]?.toLowerCase().trim() || "";
            const distance = levenshteinDistance(userAnswerLower, correctAnswer);
            const threshold = Math.max(3, Math.floor(correctAnswer.length * 0.2));
            let isCorrect = distance <= threshold;
            if (isCorrect) {
                numCorrect++;
            }
            return {
                question: question.question,
                userAnswer: updatedAnswers[index] || "",
                correctAnswer: question.answer,
                isCorrect: distance <= threshold,
            };
        });

        setResults(newResults);
        setShowResults(true); // Show the results
        setTestComplete(true);

        // Save score history to local storage
        saveScoreHistory(numCorrect, questions.length, type);
    };


    if (!questions || questions.length === 0) {
        return <div>No questions available.</div>;
    }

    return (
        <div className="flex flex-col items-center justify-start min-h-screen py-12 bg-background px-4 shadow-lg">
            <Card className="w-full max-w-md mt-8 space-y-4">
                <CardHeader>
                    <h2 className="text-lg font-semibold">
                        Question {currentQuestionIndex + 1} / {questions.length}
                    </h2>
                </CardHeader>
                <CardContent className="space-y-2">
                    {questions[currentQuestionIndex]?.question ? (
                        <>
                            <p className="text-foreground">
                                {questions[currentQuestionIndex].question}
                            </p>
                            {questions[currentQuestionIndex].isMultipleChoice &&
                                questions[currentQuestionIndex].options && (
                                    <RadioGroup onValueChange={setUserAnswer} defaultValue={userAnswer}>
                                        <div className="space-y-2">
                                            {questions[currentQuestionIndex].options!.map((option, index) => (
                                                <div key={index} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`option-${index}`} className="h-4 w-4" />
                                                    <label htmlFor={`option-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        {option}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </RadioGroup>
                                )}
                        </>
                    ) : (
                        <p className="text-red-500">Error: Question content not available.</p>
                    )}
                    {!questions[currentQuestionIndex]?.isMultipleChoice && (
                        <Textarea
                            placeholder="Your answer"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            className="mb-4"
                        />
                    )}
                    <div className="flex justify-between">
                        <Button variant="secondary" onClick={handleAnswerSubmit}>
                            Submit Answer
                        </Button>
                    </div>
                    <div className="flex justify-between">
                        <Button
                            disabled={currentQuestionIndex === 0}
                            onClick={handlePreviousQuestion}
                        >
                            Previous
                        </Button>
                        {currentQuestionIndex === questions.length - 1 ? (
                            <Button onClick={handleSubmitTest}>
                                Submit Test
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNextQuestion}
                            >
                                Next Question
                            </Button>
                        )}
                    </div>
                </CardContent>
                {feedback && <p className="text-sm mt-2">{feedback}</p>}
            </Card>

            {showResults && (
                <Card className="w-full max-w-md mt-8 space-y-4">
                    <CardHeader>
                        <h2 className="text-lg font-semibold">Test Results</h2>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {results.map((result, index) => (
                            <div key={index} className="mb-4">
                                <p className="font-medium">
                                    {index + 1}. {result.question}
                                </p>
                                <p>
                                    Your Answer: {result.userAnswer || "No answer provided"}
                                </p>
                                {!questions[index]?.isMultipleChoice && (
                                    <p>
                                        Correct Answer: {result.correctAnswer}
                                    </p>
                                )}
                                <p className={result.isCorrect ? "text-green-500" : "text-red-500"}>
                                    {result.isCorrect ? "Correct" : "Incorrect"}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                    <Button onClick={() => router.push('/')}>
                        Back to Home
                    </Button>
                </Card>
            )}
        </div>
    );
}
