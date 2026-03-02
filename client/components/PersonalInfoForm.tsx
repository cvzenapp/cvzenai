import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { PLACEHOLDER_TEXT } from '@/services/emptyStateService';

interface PersonalInfoFormProps {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  onNameChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onWebsiteChange: (value: string) => void;
  onLinkedinChange: (value: string) => void;
  onGithubChange: (value: string) => void;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  name,
  title,
  email,
  phone,
  location,
  website,
  linkedin,
  github,
  onNameChange,
  onTitleChange,
  onEmailChange,
  onPhoneChange,
  onLocationChange,
  onWebsiteChange,
  onLinkedinChange,
  onGithubChange,
}) => {


  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">
          Let's start with your basics
        </h2>
        <p className="text-slate-600">
          Tell us about yourself and how to reach you
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder={PLACEHOLDER_TEXT.personalInfo.name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Professional Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder={PLACEHOLDER_TEXT.personalInfo.title}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder={PLACEHOLDER_TEXT.personalInfo.email}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder={PLACEHOLDER_TEXT.personalInfo.phone}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                placeholder={PLACEHOLDER_TEXT.personalInfo.location}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => onWebsiteChange(e.target.value)}
                placeholder={PLACEHOLDER_TEXT.personalInfo.website}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={linkedin}
                onChange={(e) => onLinkedinChange(e.target.value)}
                placeholder={PLACEHOLDER_TEXT.personalInfo.linkedin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={github}
                onChange={(e) => onGithubChange(e.target.value)}
                placeholder={PLACEHOLDER_TEXT.personalInfo.github}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

PersonalInfoForm.displayName = 'PersonalInfoForm';

// Custom comparison function that only compares the actual values, not the callbacks
const areEqual = (prevProps: PersonalInfoFormProps, nextProps: PersonalInfoFormProps) => {
  return (
    prevProps.name === nextProps.name &&
    prevProps.title === nextProps.title &&
    prevProps.email === nextProps.email &&
    prevProps.phone === nextProps.phone &&
    prevProps.location === nextProps.location &&
    prevProps.website === nextProps.website &&
    prevProps.linkedin === nextProps.linkedin &&
    prevProps.github === nextProps.github
  );
};

export default memo(PersonalInfoForm, areEqual);