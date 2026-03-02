import { ExternalLink, MapPin, Briefcase, Calendar, Mail, Phone, Linkedin, Github, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Candidate } from "@/services/candidatesApi";

interface CandidateCardProps {
  candidate: Candidate;
  isShortlisted?: boolean;
}

export default function CandidateCard({ candidate, isShortlisted = false }: CandidateCardProps) {
  const getAvailabilityColor = (availability?: string) => {
    const colors = {
      'immediate': 'bg-green-100 text-green-700',
      'two-weeks': 'bg-blue-100 text-blue-700',
      'one-month': 'bg-orange-100 text-orange-700',
      'flexible': 'bg-purple-100 text-purple-700',
    };
    return colors[availability as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  const getAvailabilityLabel = (availability?: string) => {
    const labels = {
      'immediate': 'Immediate',
      'two-weeks': '2 Weeks',
      'one-month': '1 Month',
      'flexible': 'Flexible',
    };
    return labels[availability as keyof typeof labels] || 'Not specified';
  };

  const handleViewResume = () => {
    if (candidate.resumeShareUrl) {
      window.open(candidate.resumeShareUrl, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group hover:shadow-lg transition-all">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 flex-shrink-0">
              <AvatarImage src={candidate.profilePicture} alt={`${candidate.firstName} ${candidate.lastName}`} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg">
                {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-normal text-slate-900">
                      {candidate.firstName} {candidate.lastName}
                    </h3>
                    {isShortlisted && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-300">
                        ⭐ Shortlisted
                      </Badge>
                    )}
                  </div>
                  {candidate.title && (
                    <p className="text-sm text-slate-600">{candidate.title}</p>
                  )}
                </div>
                {candidate.availability && (
                  <Badge className={getAvailabilityColor(candidate.availability)}>
                    {getAvailabilityLabel(candidate.availability)}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-sm text-slate-600">
                {candidate.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{candidate.location}</span>
                  </div>
                )}
                {candidate.experience && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    <span>{candidate.experience}</span>
                  </div>
                )}
                {candidate.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{candidate.email}</span>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span>{candidate.phone}</span>
                  </div>
                )}
              </div>

              {candidate.skills && candidate.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {candidate.skills.slice(0, 5).map((skill, index) => {
                    const skillName = typeof skill === 'string' ? skill : skill?.name || 'Skill';
                    return (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skillName}
                      </Badge>
                    );
                  })}
                  {candidate.skills.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{candidate.skills.length - 5} more
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex gap-2">
                  {candidate.linkedinUrl && (
                    <a
                      href={candidate.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {candidate.githubUrl && (
                    <a
                      href={candidate.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-slate-700"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                  )}
                  {candidate.portfolioUrl && (
                    <a
                      href={candidate.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-slate-700"
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                  {candidate.registeredAt && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 ml-2">
                      <Calendar className="h-3 w-3" />
                      <span>Joined {new Date(candidate.registeredAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                {candidate.resumeShareUrl && (
                  <Button size="sm" onClick={handleViewResume} className="gap-1">
                    View Resume
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
