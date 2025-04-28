'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
} from "@/components/ui/table"

const ScoreHistory = () => {
    const [scoreHistory, setScoreHistory] = useState<any[]>([]);

    useEffect(() => {
        // Load score history from local storage on component mount
        const storedHistory = localStorage.getItem('scoreHistory');
        if (storedHistory) {
            setScoreHistory(JSON.parse(storedHistory));
        }
    }, []);

    return (
        <div className="flex items-center justify-center h-full p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <h1 className="text-2xl font-semibold">Score History</h1>
                    <p className="text-sm text-muted-foreground">
                        Here's a record of your past quizzes and tests.
                    </p>
                </CardHeader>
                <CardContent>
                    {scoreHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableCaption>A comprehensive list of your quiz attempts and their results.</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Type</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Score</TableHead>
                                        {/* Add more headers if you track more data, e.g., Time Taken, Category */}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {scoreHistory.map((record, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{record.type}</TableCell>
                                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                                            <TableCell>{record.score}</TableCell>
                                            {/* Populate cells with the corresponding data */}
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={3}>
                                            Total Attempts: {scoreHistory.length}
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    ) : (
                        <p>No score history available yet. Take a quiz to see your results here!</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ScoreHistory;
