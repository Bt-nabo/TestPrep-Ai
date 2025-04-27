'use client';

import {useState, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardHeader, CardContent} from '@/components/ui/card';
import {Avatar, AvatarImage, AvatarFallback} from "@/components/ui/avatar";
import {Progress} from "@/components/ui/progress";
import {CheckCircle, MessageSquare, BookOpen, Trophy} from "lucide-react";
import {cn} from "@/lib/utils";

export default function Profile() {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [name, setName] = useState('Navneet'); // Default name
  const [progressTalk, setProgressTalk] = useState(70);
  const [progressRead, setProgressRead] = useState(30);
  const [points, setPoints] = useState(20);
  const [isMonet, setIsMonet] = useState(false); // Track if monet theme is active

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setName(storedName);
      setIsSetupComplete(true);
    }
  }, []);

  const handleSetupComplete = () => {
    localStorage.setItem('userName', name);
    setIsSetupComplete(true);
  };

  return (
    <div className="flex items-center justify-center h-full p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <Avatar className="w-32 h-32 mb-4">
            <AvatarImage src="https://picsum.photos/id/237/300/300" alt="Profile Picture" />
            <AvatarFallback>NN</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-semibold">Welcome back, {name}!</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Today's Mood</div>
            <div className="w-8 h-8 rounded-full border"></div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Today's Progress</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span>Talked</span>
                </div>
                <Progress value={progressTalk} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span>Read</span>
                </div>
                <Progress value={progressRead} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Goals</h3>
            <div className="flex items-center justify-between">
              <span>Make 2 new friends in school</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <span>Play 5 different scenarios</span>
              <div className="w-5 h-5 rounded-full border"></div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Achievement</h3>
            <span>Spend 40 minutes in the app today</span>
            <span className="font-semibold">{points} Points</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Button variant="secondary">Goals</Button>
            <Button variant="secondary">Achievements</Button>
            <Button variant="secondary">Journal</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

