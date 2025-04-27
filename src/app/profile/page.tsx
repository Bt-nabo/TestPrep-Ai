'use client';

import {useState, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardHeader, CardContent} from '@/components/ui/card';
import {Avatar, AvatarImage, AvatarFallback} from "@/components/ui/avatar";
import {Progress} from "@/components/ui/progress";
import {CheckCircle, MessageSquare, BookOpen, Trophy} from "lucide-react";
import {cn} from "@/lib/utils";
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from "@/components/ui/dropdown-menu";

const PROFILE_PICTURES = [
  "https://picsum.photos/id/237/300/300",
  "https://picsum.photos/id/238/300/300",
  "https://picsum.photos/id/239/300/300",
  "https://picsum.photos/id/240/300/300",
];

export default function Profile() {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [name, setName] = useState(''); // Changed default name to empty string
  const [profilePicture, setProfilePicture] = useState('');
  const [points, setPoints] = useState(20);
  const [isMonet, setIsMonet] = useState(false); // Track if monet theme is active
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedProfilePicture = localStorage.getItem('userProfilePicture');
    const setupStatus = localStorage.getItem('isSetupComplete');

    if (storedName) {
      setName(storedName);
    }

    if (storedProfilePicture) {
      setProfilePicture(storedProfilePicture);
    }

    if (setupStatus === 'true') {
      setIsSetupComplete(true);
    }
  }, []);

  const handleSetupComplete = () => {
    localStorage.setItem('userName', name);
    localStorage.setItem('userProfilePicture', profilePicture || selectedImage || PROFILE_PICTURES[0]); // Default to first image if none selected
    localStorage.setItem('isSetupComplete', 'true');
    setIsSetupComplete(true);
  };

  const handleProfilePictureSelect = (picture: string) => {
    setProfilePicture(picture);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
                setProfilePicture(''); // Clear other selections
            };
            reader.readAsDataURL(file);
        }
    };

  if (!isSetupComplete) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-center">
            <h2 className="text-2xl font-semibold">Welcome!</h2>
            <p className="text-muted-foreground">Please set up your profile.</p>
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

            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Select Profile Picture
              </label>
              <div className="flex space-x-2">
                {PROFILE_PICTURES.map((picture) => (
                  <button
                    key={picture}
                    onClick={() => handleProfilePictureSelect(picture)}
                    className={cn(
                      "rounded-full overflow-hidden h-10 w-10 border-2",
                      profilePicture === picture ? "border-primary" : "border-transparent"
                    )}
                  >
                    <img src={picture} alt="Profile Picture Option" className="object-cover h-full w-full" />
                  </button>
                ))}
              </div>
            </div>

            <div>
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Upload from Gallery
                </label>
                <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full"
                />
            </div>

            <Button onClick={handleSetupComplete}>Complete Setup</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <Avatar className="w-32 h-32 mb-4">
            <AvatarImage src={profilePicture || selectedImage || PROFILE_PICTURES[0]} alt="Profile Picture" className="rounded-none" />
            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <h2 className="text-3xl font-semibold font-serif">Welcome back, {name}!</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          

          

          

          
        </CardContent>
      </Card>
    </div>
  );
}

