import { useState } from "react";
import { Plus, X, Linkedin, Mail, Trash2, Users2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  photo?: string;
  linkedin?: string;
  email?: string;
}

interface TeamManagerProps {
  members: TeamMember[];
  onUpdate: (members: TeamMember[]) => void;
}

export default function TeamManager({ members, onUpdate }: TeamManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<TeamMember>>({});

  // Ensure members is always an array
  const safeMembers = Array.isArray(members) ? members : [];

  const handleAdd = () => {
    if (!formData.name || !formData.role) return;

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: formData.name,
      role: formData.role,
      bio: formData.bio,
      photo: formData.photo,
      linkedin: formData.linkedin,
      email: formData.email,
    };

    onUpdate([...safeMembers, newMember]);
    setFormData({});
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(safeMembers.filter((m) => m.id !== id));
  };

  const resetForm = () => {
    setFormData({});
    setIsOpen(false);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#cfe2f3' }}>
              <Users2 className="h-5 w-5" style={{ color: '#0a0a37' }} />
            </div>
            <div>
              <h3 className="text-xl font-normal text-slate-900">Team Members</h3>
              <p className="text-sm text-slate-500">Showcase your talented team</p>
            </div>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" style={{ backgroundColor: '#0a0a37', color: 'white' }} className="hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            
            {/* Enhanced Add Member Modal */}
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#cfe2f3' }}>
                    <svg className="h-6 w-6" style={{ color: '#0a0a37' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-normal text-slate-900">Add Team Member</DialogTitle>
                    <p className="text-sm text-slate-500 mt-1">Introduce a key member of your team</p>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="py-6">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Left Column - Member Details */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Basic Information
                      </h3>
                      
                      {/* Member Name */}
                      <div className="space-y-2">
                        <Label htmlFor="member-name" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Full Name *
                        </Label>
                        <Input
                          id="member-name"
                          value={formData.name || ""}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., John Smith, Sarah Johnson"
                          className="h-11 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      {/* Member Role */}
                      <div className="space-y-2">
                        <Label htmlFor="member-role" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6z" />
                          </svg>
                          Job Title *
                        </Label>
                        <Input
                          id="member-role"
                          value={formData.role || ""}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          placeholder="e.g., CEO & Founder, Lead Developer, Marketing Director"
                          className="h-11 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      {/* Member Bio */}
                      <div className="space-y-2">
                        <Label htmlFor="member-bio" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Bio
                          <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                        </Label>
                        <Textarea
                          id="member-bio"
                          value={formData.bio || ""}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="Brief description of their background, expertise, and role in the company..."
                          rows={4}
                          className="text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                        />
                        <div className="flex justify-between items-center text-xs text-slate-500">
                          <span>Highlight their expertise and contributions</span>
                          <span className={`${(formData.bio || '').length > 200 ? 'text-amber-600' : ''}`}>
                            {(formData.bio || '').length}/250
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Contact & Social
                      </h3>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="member-email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Email Address
                        </Label>
                        <Input
                          id="member-email"
                          type="email"
                          value={formData.email || ""}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="john@company.com"
                          className="h-11 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      {/* LinkedIn */}
                      <div className="space-y-2">
                        <Label htmlFor="member-linkedin" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          LinkedIn Profile
                        </Label>
                        <Input
                          id="member-linkedin"
                          value={formData.linkedin || ""}
                          onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                          placeholder="https://linkedin.com/in/username"
                          className="h-11 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Photo & Preview */}
                  <div className="space-y-6">
                    {/* Member Photo */}
                    <div className="space-y-3">
                      <Label htmlFor="member-photo" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Profile Photo
                      </Label>
                      <Input
                        id="member-photo"
                        value={formData.photo || ""}
                        onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                        placeholder="https://example.com/photo.jpg"
                        className="h-11 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <p className="text-xs text-slate-500">Professional headshot recommended (square format works best)</p>
                      
                      {/* Photo Preview */}
                      <div className="flex justify-center">
                        <div className="relative">
                          <Avatar className="h-24 w-24 border-4 border-slate-100">
                            <AvatarImage src={formData.photo} alt={formData.name || 'Preview'} />
                            <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-600">
                              {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                            </AvatarFallback>
                          </Avatar>
                          {formData.photo && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-100 border-2 border-white rounded-full flex items-center justify-center">
                              <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Member Preview Card */}
                    {(formData.name || formData.role) && (
                      <div className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-white">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="text-sm font-medium text-slate-700">Preview</span>
                        </div>
                        <div className="p-4 border border-slate-100 rounded-lg bg-white hover:shadow-sm transition-shadow">
                          <div className="flex gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={formData.photo} alt={formData.name || 'Preview'} />
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 truncate">
                                {formData.name || 'Member Name'}
                              </h4>
                              <p className="text-sm text-slate-600 truncate">
                                {formData.role || 'Job Title'}
                              </p>
                              {formData.bio && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{formData.bio}</p>
                              )}
                              <div className="flex gap-2 mt-2">
                                {formData.linkedin && (
                                  <div className="text-blue-600">
                                    <Linkedin className="h-4 w-4" />
                                  </div>
                                )}
                                {formData.email && (
                                  <div className="text-slate-600">
                                    <Mail className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Team Building Tips */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900 mb-2">Team Profile Tips</h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Use professional headshots</li>
                            <li>• Highlight unique expertise and achievements</li>
                            <li>• Include relevant social profiles</li>
                            <li>• Keep bios concise but compelling</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-6 border-t border-slate-100 flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={resetForm}
                  className="flex-1 h-11"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAdd} 
                  disabled={!formData.name?.trim() || !formData.role?.trim()}
                  style={{ backgroundColor: '#0a0a37', color: 'white' }}
                  className="flex-1 h-11 hover:opacity-90 disabled:bg-slate-300 disabled:text-slate-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Enhanced Empty State */}
        {safeMembers.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="max-w-sm mx-auto">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl mx-auto flex items-center justify-center">
                  <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-100 border-2 border-white rounded-full flex items-center justify-center">
                  <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Introduce Your Team</h3>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Showcase the talented people behind your company to build trust and demonstrate your expertise.
              </p>
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex items-center gap-2 justify-center">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Builds trust and credibility</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Showcases expertise and experience</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Humanizes your company</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Enhanced Team Member Cards */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeMembers.map((member) => (
              <div
                key={member.id}
                className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Delete Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm"
                  onClick={() => handleDelete(member.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>

                {/* Member Content */}
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-4 border-4 border-blue-100 group-hover:border-blue-200 transition-colors">
                    <AvatarImage src={member.photo} alt={member.name} />
                    <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-600">
                      {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                    {member.name}
                  </h4>
                  <p className="text-sm text-slate-600 mb-3">{member.role}</p>
                  
                  {member.bio && (
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                      {member.bio}
                    </p>
                  )}
                  
                  {/* Contact Links */}
                  {(member.linkedin || member.email) && (
                    <div className="flex gap-3 justify-center">
                      {member.linkedin && (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Team Badge */}
                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-6 h-6 bg-blue-100 border-2 border-white rounded-full flex items-center justify-center">
                    <svg className="h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
