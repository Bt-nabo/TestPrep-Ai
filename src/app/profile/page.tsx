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
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Label} from "@/components/ui/label";

const PROFILE_PICTURES = [
  "https://picsum.photos/id/237/300/300",
  "https://picsum.photos/id/238/300/300",
  "https://picsum.photos/id/239/300/300",
  "https://picsum.photos/id/240/300/300",
];

// Sample data for classes and subjects
const classes = [
  {
    value: "1",
    label: "Class 1",
    subjects: ["English", "Mathematics"],
  },
  {
    value: "2",
    label: "Class 2",
    subjects: ["English", "Mathematics"],
  },
  {
    value: "3",
    label: "Class 3",
    subjects: ["English", "Mathematics", "Science"],
  },
  {
    value: "4",
    label: "Class 4",
    subjects: ["English", "Mathematics", "Science"],
  },
  {
    value: "5",
    label: "Class 5",
    subjects: ["English", "Mathematics", "Science", "History", "Geography"],
  },
  {
    value: "6",
    label: "Class 6",
    subjects: ["English", "Mathematics", "Science", "History", "Geography"],
  },
  {
    value: "7",
    label: "Class 7",
    subjects: ["English", "Mathematics", "Science", "History", "Geography"],
  },
  {
    value: "8",
    label: "Class 8",
    subjects: ["English", "Mathematics", "Science", "History", "Geography"],
  },
  {
    value: "9",
    label: "Class 9",
    subjects: ["English", "Mathematics", "Science", "History", "Geography", "Civics"],
  },
  {
    value: "10",
    label: "Class 10",
    subjects: ["Physics", "Chemistry", "Biology", "Mathematics", "History", "Civics", "Geography", "English", "Hindi"],
  },
  {
    value: "11",
    label: "Class 11",
    subjects: ["Physics", "Chemistry", "Mathematics", "Biology", "English"],
  },
  {
    value: "12",
    label: "Class 12",
    subjects: ["Physics", "Chemistry", "Mathematics", "Biology", "English"],
  },
];

const subjectIcons: { [subject: string]: React.ReactNode } = {
    "Physics": <BookOpen className="w-5 h-5" />,
    "Chemistry": <MessageSquare className="w-5 h-5" />,
    "Mathematics": <Trophy className="w-5 h-5" />,
    "Biology": <CheckCircle className="w-5 h-5" />,
    "English": <BookOpen className="w-5 h-5" />,
    "Hindi": <BookOpen className="w-5 h-5" />,
    "History": <BookOpen className="w-5 h-5" />,
    "Civics": <BookOpen className="w-5 h-5" />,
    "Geography": <BookOpen className="w-5 h-5" />,
    "Science": <BookOpen className="w-5 h-5" />
};

export default function Profile() {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [name, setName] = useState(''); // Changed default name to empty string
  const [profilePicture, setProfilePicture] = useState('');
  const [points, setPoints] = useState(20);
  const [isMonet, setIsMonet] = useState(false); // Track if monet theme is active
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showChangePictureOptions, setShowChangePictureOptions] = useState(false);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);


  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedProfilePicture = localStorage.getItem('userProfilePicture');
    const setupStatus = localStorage.getItem('isSetupComplete');
    const storedClass = localStorage.getItem('userClass');
    const storedSubjects = localStorage.getItem('userSubjects');


    if (storedName) {
      setName(storedName);
    }

    if (storedProfilePicture) {
      setProfilePicture(storedProfilePicture);
    }

    if (setupStatus === 'true') {
      setIsSetupComplete(true);
    }
          if (storedClass) {
              setSelectedClass(storedClass);
               setAvailableSubjects(classes.find((cls) => cls.value === storedClass)?.subjects || []);
          }

          if (storedSubjects) {
              setSelectedSubjects(storedSubjects.split(','));
          }
  }, []);

  const handleSetupComplete = () => {
    localStorage.setItem('userName', name);
    localStorage.setItem('userProfilePicture', profilePicture || selectedImage || PROFILE_PICTURES[0]); // Default to first image if none selected
    localStorage.setItem('isSetupComplete', 'true');
      localStorage.setItem('userClass', selectedClass);
      localStorage.setItem('userSubjects', selectedSubjects.join(','));
    setIsSetupComplete(true);
    setIsEditing(false);
  };

  const handleProfilePictureSelect = (picture: string) => {
    setProfilePicture(picture);
        setSelectedImage(null);
    setShowChangePictureOptions(false);
    localStorage.setItem('userProfilePicture', picture);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
                setProfilePicture(''); // Clear other selections
                setShowChangePictureOptions(false);
                localStorage.setItem('userProfilePicture', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleChangePictureOptions = () => {
        setShowChangePictureOptions(!showChangePictureOptions);
    };

    const handleEditProfile = () => {
        setIsEditing(true);
    };

    const handleClassChange = (classValue: string) => {
        setSelectedClass(classValue);
        localStorage.setItem('userClass', classValue);

        const selectedClassSubjects = classes.find(cls => cls.value === classValue)?.subjects || [];
        setAvailableSubjects(selectedClassSubjects);
        setSelectedSubjects([]); // Clear selected subjects when class changes
    };

    const handleSubjectChange = (subject: string) => {
        setSelectedSubjects(prevSubjects => {
            if (prevSubjects.includes(subject)) {
                return prevSubjects.filter(s => s !== subject);
            } else {
                return [...prevSubjects, subject];
            }
        });
    };

  if (!isSetupComplete || isEditing) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-center">
            <h2 className="text-2xl font-semibold">{isEditing ? "Edit Profile" : "Welcome!"}</h2>
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
                                      Class
                                  </label>
                                  <Select onValueChange={handleClassChange} defaultValue={selectedClass}>
                                      <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Select a class" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {classes.map((cls) => (
                                              <SelectItem key={cls.value} value={cls.value}>
                                                  {cls.label}
                                              </SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>

            {selectedClass && (
                <div>
                    <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Taken Subjects
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                        {availableSubjects.map((subject) => (
                            <div key={subject} className="flex items-center space-x-2">
                                <Input
                                    type="checkbox"
                                    id={subject}
                                    value={subject}
                                    checked={selectedSubjects.includes(subject)}
                                    onChange={() => handleSubjectChange(subject)}
                                />
                                <label
                                    htmlFor={subject}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {subject}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
             <Avatar className="w-32 h-32 mb-4 cursor-pointer" onClick={handleEditProfile}>
                <AvatarImage src={profilePicture || selectedImage || PROFILE_PICTURES[0]} alt="Profile Picture" className="rounded-none" />
                <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {showChangePictureOptions && (
                <div className="mt-2 space-y-2">
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
                </div>
            )}
          <h2 className="text-3xl font-semibold font-serif">Welcome back, {name}!</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          
                          <div>
                              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  Class:
                              </label>
                              <p>{classes.find(cls => cls.value === selectedClass)?.label}</p>
                          </div>

                          <div>
                              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  Taken Subjects:
                              </label>
                              <div className="grid grid-cols-3 gap-2">
                                  {selectedSubjects.map((subject) => (
                                      <div key={subject} className="flex flex-col items-center justify-center p-2 rounded-md border border-muted shadow-sm">
                                          {subjectIcons[subject] && (
                                              <span className="mb-1">{subjectIcons[subject]}</span>
                                          )}
                                          <span>{subject}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>

          

          

          
        </CardContent>
      </Card>
    </div>
  );
}

