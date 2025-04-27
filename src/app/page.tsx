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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

export type FileType = ".txt" | ".pdf" | ".rtf" | ".docx";

// Function to calculate Levenshtein distance
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize the matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][i] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export default function Home() {
  const [questions, setQuestions] = useState<
    { question: string; answer: string; isMultipleChoice?: boolean; options?: string[] }[]
  >([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [detectedFileType, setDetectedFileType] = useState<FileType | null>(null);
  const [theme, setTheme] = useState<"light" | "dark" | "fully-black" | "monet">("monet");
  const [testComplete, setTestComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false); // Track if results are shown
  const [results, setResults] = useState<
    { question: string; userAnswer: string; correctAnswer: string; isCorrect: boolean }[]
  >([]);
    const [monetBackgroundColor, setMonetBackgroundColor] = useState<string | null>(null);
  // Quiz Generation State
  const [quizClass, setQuizClass] = useState("");
  const [quizSubject, setQuizSubject] = useState("");
  const [quizTopic, setQuizTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5); // Default to 5 questions
    const [mcqOnly, setMcqOnly] = useState(false); // State for MCQ toggle

  // Storing User Answers
  const [userAnswers, setUserAnswers] = useState<string[]>([]);

    const generateMonetColor = () => {
        const hue = Math.floor(Math.random() * 360);
        const saturation = Math.floor(Math.random() * 20) + 20; // Ensure saturation is low to make the color lighter
        const lightness = Math.floor(Math.random() * 20) + 80;   // Ensure lightness is high
        setMonetBackgroundColor(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    };


  useEffect(() => {
    document.documentElement.classList.remove("dark", "fully-black", "monet");
    setMonetBackgroundColor(null); // Reset Monet background color

    if (theme === "fully-black") {
      document.documentElement.classList.add("fully-black");
    } else if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "monet") {
      document.documentElement.classList.add("monet");
      // Generate random Monet-like color
      generateMonetColor();
    }
  }, [theme]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setIsLoading(true);
    setQuestions([]); // Clear existing questions when uploading a file
    setTestComplete(false); // Reset test completion status
    setShowResults(false);
    setResults([]);
    setUserAnswers([]); // Clear existing user answers


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
            fileContent = fileDataUri; // Placeholder for RTF processing
          }


        const parsedQuestions = await parseQuestions({
          fileDataUri: fileContent,
          fileType: fileTypeExtension,
        });

                  // Apply MCQ filter
                  let filteredQuestions = parsedQuestions;
                  if (mcqOnly) {
                      filteredQuestions = parsedQuestions.filter(q => q.isMultipleChoice);
                  } else {
                      filteredQuestions = parsedQuestions;
                  }

        // Sequence the questions using GenAI
        const sequencedQuestions = await sequenceQuestions({
          questions: filteredQuestions.map((q) => q.question),
        });

        // Reorder parsedQuestions based on sequencedQuestions
        const orderedQuestions = sequencedQuestions.orderedQuestions.map(
          (orderedQuestion) =>
          filteredQuestions.find((q) => q.question === orderedQuestion)!
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
  }, [parseQuestions, sequenceQuestions, mcqOnly]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt', '.rtf'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    }
  });


  const handleAnswerSubmit = async () => {
    if (questions.length === 0) {
      setFeedback("No questions available. Please upload a file or generate a quiz.");
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

    // Implements submit test logic here, e.g., send data to server
    // Store user's answer and if it's correct

    const newResults = questions.map((question, index) => {
         const correctAnswer = question?.answer?.toLowerCase().trim() || "";
         const userAnswerLower = updatedAnswers[index]?.toLowerCase().trim() || "";
         const distance = levenshteinDistance(userAnswerLower, correctAnswer);
          const threshold = Math.max(3, Math.floor(correctAnswer.length * 0.2));
          let isCorrect = distance <= threshold;
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
  };

  const handleGenerateQuiz = async () => {
    setIsLoading(true);
    setQuestions([]); // Clear any existing questions
    setShowResults(false);
    setResults([]);
    setTestComplete(false);
    setUserAnswers([]); // Clear user answers

    try {
                  let filteredQuestions;

                  const generatedQuestions = await generateQuizQuestions({
                    quizClass: quizClass,
                    quizSubject: quizSubject,
                    quizTopic: quizTopic,
                    numQuestions: numQuestions,
                  });

                  if (mcqOnly) {
                      filteredQuestions = generatedQuestions.filter(q => q.isMultipleChoice);
                  } else {
                      filteredQuestions = generatedQuestions;
                  }

      setQuestions(filteredQuestions);
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

    const handleMultipleChoiceAnswer = (option: string) => {
        setUserAnswer(option);
    };


    const toggleMonetTheme = () => {
        if (theme === "monet") {
            generateMonetColor(); // Regenerate color if already in monet theme
        } else {
            setTheme("monet"); // Switch to monet theme
        }
    };

    useEffect(() => {
        if (theme === "monet") {
            generateMonetColor();
        }
    }, [theme]);


  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-12 bg-background px-4 shadow-lg" style={{ backgroundColor: theme === 'monet' && monetBackgroundColor ? monetBackgroundColor : undefined }}>
                  <div className="absolute top-4 left-4">
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="outline">Theme</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setTheme("fully-black")}>Fully Black</DropdownMenuItem>
                              <DropdownMenuItem onClick={toggleMonetTheme}>Monet</DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
      <h1 className="text-4xl font-bold mb-6 text-foreground">TestPrep AI</h1>

                           <div className="flex flex-col w-full max-w-4xl items-center">

        {/* Upload Questions Section */}
        <Card className="w-full max-w-md space-y-4 mb-8">
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
        <Card className="w-full max-w-md space-y-4">
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
                                          <div className="flex items-center space-x-2">
                                              <Switch id="mcq-only" onCheckedChange={setMcqOnly} />
                                              <label
                                                  htmlFor="mcq-only"
                                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                              >
                                                  Multiple choice question
                                              </label>
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

      {questions.length === 0 ? null : (!testComplete && !showResults) ? (
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
                     <RadioGroup onValueChange={handleMultipleChoiceAnswer} defaultValue={userAnswer}>
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
            <h2 className="text-lg font-semibold">
              {testComplete ? "Test Complete!" : "Test Results"}
            </h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {testComplete && !showResults ? (
              <p className="text-foreground">
                You have reached the end of the test.
              </p>
            ) : null}
            {showResults && results.length > 0 ? (
              <div>
                <h3 className="text-md font-semibold mb-2">Your Results:</h3>
                {results.map((result, index) => {
                  const question = questions[index]; // Get the corresponding question
                  let correctnessMessage = result.isCorrect ? "Correct" : "Incorrect";
                   if (!result.isCorrect && question?.isMultipleChoice) {
                    correctnessMessage += ` (Correct answer: ${result.correctAnswer})`;
                  }
                  return (
                    <div key={index} className="mb-4">
                      <p className="font-medium">
                        {index + 1}. {result.question}
                      </p>
                      <p>
                        Your Answer: {result.userAnswer || "No answer provided"}
                      </p>
                      
                      {!question?.isMultipleChoice && (
                        <p>
                           Correct Answer: {result.correctAnswer}
                        </p>
                      )}
                      
                      <p className={result.isCorrect ? "text-green-500" : "text-red-500"}>
                        {correctnessMessage}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <div className="flex justify-between">
              {testComplete && !showResults ? (
                <Button variant="secondary" onClick={handleReview}>
                  Review Answers
                </Button>
              ) : null}
              {!showResults ? (
                <Button onClick={handleSubmitTest} disabled={showResults}>
                  Submit Test
                </Button>
              ) : null}
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


