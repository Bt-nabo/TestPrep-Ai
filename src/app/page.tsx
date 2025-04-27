"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { parseQuestions } from "@/ai/flows/parse-questions";
import { sequenceQuestions } from "@/ai/flows/sequence-questions";
import { generateQuizQuestions } from "@/ai/flows/generate-quiz-questions"; // Import the new flow
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";
import { fileTypeFromBuffer } from 'file-type';
import * as mammoth from 'mammoth';

export type FileType = ".txt" | ".pdf" | ".rtf" | ".docx";

export default function Home() {
  const [questions, setQuestions] = useState<
    { question: string; answer: string; isMultipleChoice?: boolean; options?: string[] }[]
  >([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [detectedFileType, setDetectedFileType] = useState<FileType | null>(null);
  const [theme, setTheme] = useState<"light" | "dark" | "fully-black">("light");
  const [testComplete, setTestComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Quiz Generation State
  const [quizClass, setQuizClass] = useState("");
  const [quizSubject, setQuizSubject] = useState("");
  const [quizTopic, setQuizTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5); // Default to 5 questions

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
    setIsLoading(true);
    setQuestions([]); // Clear existing questions when uploading a file
    setTestComplete(false); // Reset test completion status

    const reader = new FileReader();
    reader.onload = async () => {
      const fileDataUri = reader.result as string;

      try {
        let detectedType = await fileTypeFromBuffer(await acceptedFiles[0].arrayBuffer());
        let fileTypeExtension: FileType | null = null;

        if (detectedType) {
          fileTypeExtension = `.${detectedType.ext}` as FileType;
        } else {
          // Fallback: Determine file type based on the extension
          const fileNameParts = file.name.split('.');
          const fileExtension = fileNameParts.pop()?.toLowerCase();

          if (fileExtension === 'txt' || fileExtension === 'pdf' || fileExtension === 'rtf' || fileExtension === 'docx') {
            fileTypeExtension = `.${fileExtension}` as FileType;
          } else {
            setFeedback("Unable to determine file type");
            setIsLoading(false);
            return;
          }
        }

        setDetectedFileType(fileTypeExtension);

        let fileContent = fileDataUri;

        if (fileTypeExtension === ".docx") {
          const buffer = await acceptedFiles[0].arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer: buffer });
          fileContent = result.value;
        }
        if (fileTypeExtension === ".rtf") {
             // @ts-ignore
          //fileContent = await processRTF(fileDataUri)
            fileContent = fileDataUri; // Placeholder for RTF processing
          }


        const parsedQuestions = await parseQuestions({
          fileDataUri: fileContent,
          fileType: fileTypeExtension,
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
        setIsLoading(false);

      } catch (error: any) {
        console.error("Error parsing questions:", error);
        setFeedback(`Failed to parse questions: ${error.message}`);
        setIsLoading(false);
      }
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      setFeedback("Failed to read the file.");
      setIsLoading(false);
    };

    reader.readAsDataURL(file);
  }, [parseQuestions, sequenceQuestions]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt', '.rtf'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    }
  });


  const handleAnswerSubmit = () => {
    if (questions.length === 0) {
      setFeedback("No questions available. Please upload a file or generate a quiz.");
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

  const handleGenerateQuiz = async () => {
    setIsLoading(true);
    setQuestions([]); // Clear any existing questions

    try {
      const generatedQuestions = await generateQuizQuestions({
        quizClass: quizClass,
        quizSubject: quizSubject,
        quizTopic: quizTopic,
        numQuestions: numQuestions,
      });

      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setFeedback(null);
      setTestComplete(false);
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      setFeedback(`Failed to generate quiz: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
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

      <div className="flex flex-col w-full max-w-4xl items-center">
        {/* Upload Questions Section */}
        <Card className="w-full max-w-md space-y-4">
          <CardHeader>
            <h2 className="text-lg font-semibold">Upload Questions</h2>
            <p className="text-sm text-muted-foreground">
              Upload a .txt, .pdf, .rtf, or .docx file containing questions and answers.
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
                isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <p className="text-foreground">
                    Drag 'n' drop some files here, or click to select files
                  </p>
                )
              )}
            </div>
            {feedback && <p className="text-sm mt-2">{feedback}</p>}
          </CardContent>
        </Card>

        {/* Quiz Asking Agent Section */}
        <Card className="w-full max-w-md mt-8 space-y-4">
          <CardHeader>
            <h2 className="text-lg font-semibold">Quiz Asking Agent</h2>
            <p className="text-sm text-muted-foreground">
              Generate questions based on class, subject, and topic.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Class
              </label>
              <Input
                type="text"
                placeholder="e.g., Math 101"
                value={quizClass}
                onChange={(e) => setQuizClass(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Subject
              </label>
              <Input
                type="text"
                placeholder="e.g., Algebra"
                value={quizSubject}
                onChange={(e) => setQuizSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Chapter/Topic
              </label>
              <Input
                type="text"
                placeholder="e.g., Linear Equations"
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Number of Questions
              </label>
              <Input
                type="number"
                placeholder="e.g., 10"
                value={numQuestions.toString()}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              />
            </div>
            <Button onClick={handleGenerateQuiz} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Quiz"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {questions.length === 0 ? null : !testComplete ? (
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
                    <div className="space-y-2">
                      {questions[currentQuestionIndex].options!.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`option-${index}`}
                            name="mcq-option"
                            value={option}
                            className="h-4 w-4"
                          />
                          <label htmlFor={`option-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
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
