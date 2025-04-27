'use client';

import {useState, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardHeader, CardContent} from '@/components/ui/card';

export default function Profile() {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [name, setName] = useState('');

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
      {!isSetupComplete ? (
        <Card className="w-full max-w-md">
          <CardHeader>
            <h2>Profile Setup</h2>
            <p>Please enter your name to complete the setup.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Your Name
              </label>
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button onClick={handleSetupComplete} disabled={!name}>
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader>
            <h1 className="text-2xl font-semibold">Hi {name},</h1>
          </CardHeader>
          <CardContent>
            <p>Welcome to TestPrep AI!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
