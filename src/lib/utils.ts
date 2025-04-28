import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const saveScoreHistory = (numCorrect: number, totalQuestions: number, type: string) => {
    const newRecord = {
        type: type === 'uploaded' ? 'Uploaded File' : 'Generated Quiz',
        date: Date.now(),
        score: `${numCorrect}/${totalQuestions}`,
    };

    // Retrieve existing history
    const storedHistory = localStorage.getItem('scoreHistory');
    let history = storedHistory ? JSON.parse(storedHistory) : [];

    // Add the new record to the history
    history = [newRecord, ...history];

    // Store updated history back to local storage
    localStorage.setItem('scoreHistory', JSON.stringify(history));
};

export function levenshteinDistance(a: string, b: string): number {
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
