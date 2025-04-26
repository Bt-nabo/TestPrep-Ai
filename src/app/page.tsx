"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { parseQuestions } from "@/ai/flows/parse-questions";
import { sequenceQuestions } from "@/ai/flows/sequence-questions";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function Home() {
  const [questions, setQuestions] = useState<{ question: string; answer: string }[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [fileType, setFileType] = useState<".txt" | ".pdf">(".txt");
    const [theme, setTheme] = useState<"light" | "dark" | "fully-black">("light");
    const [testComplete, setTestComplete] = useState(false);


    useEffect(() => {
        if (theme === "fully-black") {
            document.documentElement.classList.add("fully-black");
            document.documentElement.classList.remove("dark");
        } else if (theme === "dark") {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("fully-black");
        } else {
            document.documentElement.classList.remove("dark");
            document.documentElement.classList.remove("fully-black");
        }
    }, [theme]);


  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setFileType(file.name.endsWith(".pdf") ? ".pdf" : ".txt");
    const reader = new FileReader();

    reader.onload = async () => {
      const fileDataUri = reader.result as string;
      try {
        const parsedQuestions = await parseQuestions({
          fileDataUri: fileDataUri,
          fileType: fileType,
        });

        // Sequence the questions using GenAI
        const sequencedQuestions = await sequenceQuestions({
          questions: parsedQuestions.map((q) => q.question),
        });

        // Reorder parsedQuestions based on sequencedQuestions
        const orderedQuestions = sequencedQuestions.orderedQuestions.map(
          (orderedQuestion) =>
            parsedQuestions.find((q) => q.question === orderedQuestion)!
        );

        setQuestions(orderedQuestions);
        setCurrentQuestionIndex(0); // Reset to the first question
        setFeedback(null); // Clear any previous feedback
        setTestComplete(false); // Reset test completion status

      } catch (error: any) {
        console.error("Error parsing questions:", error);
        setFeedback(`Failed to parse questions: ${error.message}`);
      }
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      setFeedback("Failed to read the file.");
    };

    reader.readAsDataURL(file);
  }, [fileType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleAnswerSubmit = () => {
    if (questions.length === 0) {
      setFeedback("No questions available. Please upload a file.");
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion && userAnswer.trim() !== "") {
      if (
        currentQuestion.answer.toLowerCase().trim() ===
        userAnswer.toLowerCase().trim()
      ) {
        setFeedback("Correct!");
      } else {
        setFeedback(`Incorrect. The correct answer is: ${currentQuestion.answer}`);
      }
    } else {
      setFeedback("Please provide an answer.");
    }
  };

  const handleNextQuestion = () => {
    setUserAnswer(""); // Clear the user's answer
    setFeedback(null); // Clear the feedback

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setTestComplete(true);
    }
  };

    const handlePreviousQuestion = () => {
        setUserAnswer(""); // Clear the user's answer
        setFeedback(null); // Clear the feedback

        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleReview = () => {
        setCurrentQuestionIndex(0); // Shift to question 1
        setTestComplete(false); // Allow navigation
    };

    const handleSubmitTest = () => {
        // Implement submit test logic here, e.g., send data to server
        alert("Submit test functionality not implemented yet.");
    };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-12 bg-background">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">Theme</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("fully-black")}>Fully Black</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      <h1 className="text-4xl font-bold mb-6 text-foreground">TestPrep AI</h1>

      {questions.length === 0 ? (
        <Card className="w-full max-w-md space-y-4">
          <CardHeader>
            <h2 className="text-lg font-semibold">Upload Questions</h2>
            <p className="text-sm text-muted-foreground">
              Upload a .txt or .pdf file containing questions and answers.
            </p>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className="flex items-center justify-center w-full h-32 bg-muted rounded-md border-2 border-muted-foreground border-dashed cursor-pointer"
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p className="text-foreground">Drop the files here ...</p>
              ) : (
                <p className="text-foreground">
                  Drag 'n' drop some files here, or click to select files
                </p>
              )}
            </div>
            {feedback && <p className="text-sm mt-2">{feedback}</p>}
          </CardContent>
        </Card>
      ) : !testComplete ? (
        <Card className="w-full max-w-md mt-8 space-y-4">
          <CardHeader>
            <h2 className="text-lg font-semibold">
              Question {currentQuestionIndex + 1} / {questions.length}
            </h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {questions[currentQuestionIndex]?.question ? (
              <p className="text-foreground">
                {questions[currentQuestionIndex].question}
              </p>
            ) : (
              <p className="text-red-500">Error: Question content not available.</p>
            )}
            <Textarea
              placeholder="Your answer"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="mb-4"
            />
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
                  <Button
                      onClick={handleNextQuestion}
                  >
                      Next Question
                  </Button>
              </div>
          </CardContent>
             {feedback && <p className="text-sm mt-2">{feedback}</p>}
        </Card>
      ) : (
        <Card className="w-full max-w-md mt-8 space-y-4">
          <CardHeader>
            <h2 className="text-lg font-semibold">Test Complete!</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-foreground">
              You have reached the end of the test.
            </p>
            <div className="flex justify-between">
              <Button variant="secondary" onClick={handleReview}>
                Review Answers
              </Button>
              <Button onClick={handleSubmitTest}>Submit Test</Button>
            </div>
          </CardContent>
        </Card>
      )}
           {feedback && (
                <div className="mt-4 text-center text-sm text-gray-500">
                    {feedback}
                </div>
            )}
    </div>
  );
}
