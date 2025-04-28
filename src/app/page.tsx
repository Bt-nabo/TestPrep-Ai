"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { parseQuestions } from "@/ai/flows/parse-questions";
import { sequenceQuestions } from "@/ai/flows/sequence-questions";
import { generateQuizQuestions } from "@/ai/flows/generate-quiz-questions";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";
import { fileTypeFromBuffer } from 'file-type';
import * as mammoth from 'mammoth';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react"; // Import the Settings icon
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';


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
  const [type, setType] = useState<'uploaded' | 'generated'>('uploaded');
  const router = useRouter();


  // Storing User Answers
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [theme, setTheme] = useState<"light" | "dark" | "fully-black" | "monet">("monet");
    const [open, setOpen] = useState(false);

    const generateMonetColor = () => {
        const hue = Math.floor(Math.random() * 360);
        const saturation = Math.floor(Math.random() * 20) + 20; // Ensure saturation is low to make the color lighter
        const lightness = Math.floor(Math.random() * 20) + 80;   // Ensure lightness is high
        setMonetBackgroundColor(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    };

    useEffect(() => {
        if (theme === "monet") {
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


        // setQuestions(orderedQuestions);
        // setCurrentQuestionIndex(0); // Reset to the first question
        // setFeedback(null); // Clear any previous feedback
        // setTestComplete(false); // Reset test completion status
        setIsLoading(false);
        setType('uploaded');
        router.push(`/quiz?type=uploaded&questions=${encodeURIComponent(JSON.stringify(orderedQuestions))}`);

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
  }, [parseQuestions, sequenceQuestions, mcqOnly, router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt', '.rtf'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    }
  });


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

      // setQuestions(filteredQuestions);
      // setCurrentQuestionIndex(0);
      // setFeedback(null);
      // setTestComplete(false);
        setType('generated');
      router.push(`/quiz?type=generated&questions=${encodeURIComponent(JSON.stringify(filteredQuestions))}`);

    } catch (error: any) {
      console.error("Error generating quiz:", error);
      setFeedback(`Failed to generate quiz: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-12 bg-background px-4 shadow-lg">
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
      {feedback && (
        <div className="mt-4 text-center text-sm text-gray-500">
          {feedback}
        </div>
      )}
    </div>
  );
}

