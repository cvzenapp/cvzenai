import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Users,
  Calendar,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Award,
  Briefcase,
  Heart,
  TrendingUp,
  Target,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Mail,
  Phone,
  CheckCircle,
  Quote,
  Star,
  X,
  DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { companyApi } from "@/services/companyApi";
import { jobPostingsApi, type JobPosting } from "@/services/jobPostingsApi";
import { jobApplicationsApi } from "@/services/jobApplicationsApi";
import { unifiedAuthService } from "@/services/unifiedAuthService";
import type { Company } from "../../shared/recruiterAuth";
import ClientsSection from "@/components/company/ClientsSection";
import ProjectsSection from "@/components/company/ProjectsSection";
import AwardsSection from "@/components/company/AwardsSection";
import AchievementsSection from "@/components/company/AchievementsSection";
import QuickApplicationModal from "@/components/QuickApplicationModal";

export default function CompanyProfile() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [showQuickApply, setShowQuickApply] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [pendingJobTitle, setPendingJobTitle] = useState<string>('');
  
  // Remove auth state subscription - no longer needed
  
  const handleApplyNow = (jobId: string, jobTitle: string) => {
    console.log('🎯 Apply Now clicked for job:', jobId, jobTitle);
    setPendingJobId(jobId);
    setPendingJobTitle(jobTitle);
    setShowQuickApply(true);
  };

  const handleQuickApplySubmit = async (data: { 
    name: string; 
    email: string; 
    resumeFile: File;
    userId?: string;
    resumeId?: number;
    shareToken?: string;
    resumeUrl?: string;
  }) => {
    console.log('📤 Quick apply submit:', data);
    
    if (!pendingJobId) {
      throw new Error('No job selected');
    }

    try {
      // Resume is already parsed by QuickApplicationModal
      // Just submit the application with parsed data
      const appResponse = await fetch('/api/job-applications/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: parseInt(pendingJobId),
          name: data.name,
          email: data.email,
          resumeFileUrl: data.resumeUrl || '',
          userId: data.userId,
          resumeId: data.resumeId,
          shareToken: data.shareToken
        })
      });

      if (!appResponse.ok) {
        const errorData = await appResponse.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }

      const result = await appResponse.json();
      
      alert('Application submitted successfully! The recruiter has been notified via email. Check your email for account details.');
      setShowJobsModal(false);
      setPendingJobId(null);
      setPendingJobTitle('');
    } catch (error: any) {
      console.error('❌ Failed to submit application:', error);
      throw error;
    }
  };

  useEffect(() => {
    const loadCompany = async () => {
      if (!slug) {
        setError("No company specified");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await companyApi.getCompanyBySlug(slug);
        if (response.success && response.company) {
          setCompany(response.company);
        }
      } catch (err) {
        console.error("Failed to load company:", err);
        setError("Company not found");
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [slug]);

  const handleViewJobs = async () => {
    console.log('🔍 handleViewJobs called');
    console.log('🏢 Company:', company);
    console.log('🏢 Company ID:', company?.id);
    console.log('🏢 Company ID type:', typeof company?.id);
    
    if (!company?.id) {
      console.error('❌ No company ID available');
      alert('Error: Company ID not found. Company data: ' + JSON.stringify(company));
      return;
    }

    console.log('✅ Opening modal...');
    setShowJobsModal(true);
    setLoadingJobs(true);

    try {
      console.log('📡 Fetching jobs for company:', company.id);
      const response = await jobPostingsApi.getPublicCompanyJobs(company.id);
      console.log('✅ API Response:', response);
      
      if (response.success) {
        console.log('📊 Jobs received:', response.jobs.length);
        console.log('📋 Jobs data:', response.jobs);
        setJobs(response.jobs);
      } else {
        console.error('❌ API returned success: false');
        alert('API returned success: false');
      }
    } catch (err) {
      console.error("❌ Failed to load jobs:", err);
      alert('Failed to load jobs: ' + err.message);
    } finally {
      setLoadingJobs(false);
      console.log('✅ Loading complete. Jobs in state:', jobs.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading company profile...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Company Not Found</h2>
          <p className="text-slate-600 mb-6">The company profile you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  const socialLinks = [
    { icon: Linkedin, url: company.socialLinks?.linkedin, label: "LinkedIn", color: "text-blue-600" },
    { icon: Twitter, url: company.socialLinks?.twitter, label: "Twitter", color: "text-sky-500" },
    { icon: Facebook, url: company.socialLinks?.facebook, label: "Facebook", color: "text-blue-700" },
    { icon: Instagram, url: company.socialLinks?.instagram, label: "Instagram", color: "text-pink-600" },
    { icon: Youtube, url: company.socialLinks?.youtube, label: "YouTube", color: "text-red-600" },
  ].filter(link => link.url);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Cover Image Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative h-80 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden"
      >
        {company.coverImageUrl ? (
          <img
            src={company.coverImageUrl}
            alt={`${company.name} cover`}
            className="w-full h-full object-cover"
            style={{ objectPosition: `center ${company.coverImagePosition || '50%'}` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
            </div>
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </motion.div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-16">
        {/* Company Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Logo */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="relative"
                >
                  <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                    <AvatarImage src={company.logoUrl} alt={company.name} />
                    <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {company.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 shadow-lg"
                  >
                    <CheckCircle className="h-5 w-5 text-white" />
                  </motion.div>
                </motion.div>

                {/* Company Info */}
                <div className="flex-1">
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-4xl font-bold text-slate-900 mb-2"
                  >
                    {company.name}
                  </motion.h1>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="flex flex-wrap gap-4 text-slate-600 mb-4"
                  >
                    {company.industry && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span>{company.industry}</span>
                      </div>
                    )}
                    {company.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{company.location}</span>
                      </div>
                    )}
                    {company.employeeCount && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{company.employeeCount.toLocaleString()} employees</span>
                      </div>
                    )}
                    {company.foundedYear && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Founded {company.foundedYear}</span>
                      </div>
                    )}
                  </motion.div>

                  {/* Social Links */}
                  {socialLinks.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                      className="flex gap-3 mb-4"
                    >
                      {socialLinks.map((social, index) => (
                        <motion.a
                          key={social.label}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className={`p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors ${social.color}`}
                        >
                          <social.icon className="h-5 w-5" />
                        </motion.a>
                      ))}
                    </motion.div>
                  )}

                  {/* CTA Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="flex flex-wrap gap-3"
                  >
                    {company.website && (
                      <Button asChild className="group">
                        <a href={company.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4 mr-2" />
                          Visit Website
                          <ExternalLink className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" className="group">
                      <Heart className="h-4 w-4 mr-2" />
                      Follow Company
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Company Info Bar - Highlighted */}
        {(company.companyType || company.sizeRange || company.workEnvironment) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200/50 shadow-lg">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {company.companyType && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                      className="flex items-center gap-4"
                    >
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Briefcase className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Company Type</p>
                        <p className="text-lg font-bold text-slate-900">{company.companyType}</p>
                      </div>
                    </motion.div>
                  )}
                  
                  {company.sizeRange && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                      className="flex items-center gap-4"
                    >
                      <div className="p-3 bg-indigo-100 rounded-xl">
                        <Users className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Company Size</p>
                        <p className="text-lg font-bold text-slate-900">{company.sizeRange}</p>
                      </div>
                    </motion.div>
                  )}
                  
                  {company.workEnvironment && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                      className="flex items-center gap-4"
                    >
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <Building2 className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Work Environment</p>
                        <Badge variant="secondary" className="text-base font-bold px-4 py-1">
                          {company.workEnvironment}
                        </Badge>
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Content Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content - Left Column (2/3) */}
          <div className="md:col-span-2 space-y-6">
            {/* About Section */}
            {company.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">About Us</h2>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {company.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Specialties & Benefits - Side by Side */}
            {(company.specialties && Array.isArray(company.specialties) && company.specialties.length > 0) || (company.benefits && Array.isArray(company.benefits) && company.benefits.length > 0) ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Specialties */}
                  {company.specialties && Array.isArray(company.specialties) && company.specialties.length > 0 && (
                    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Target className="h-5 w-5 text-purple-600" />
                          </div>
                          <h2 className="text-2xl font-bold text-slate-900">Specialties</h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {company.specialties.map((specialty, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: 1 + index * 0.05 }}
                              whileHover={{ scale: 1.05 }}
                            >
                              <Badge variant="secondary" className="px-4 py-2 text-sm">
                                <Sparkles className="h-3 w-3 mr-1" />
                                {specialty}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Benefits */}
                  {company.benefits && Array.isArray(company.benefits) && company.benefits.length > 0 && (
                    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 bg-rose-100 rounded-lg">
                            <Heart className="h-5 w-5 text-rose-500" />
                          </div>
                          <h2 className="text-2xl font-bold text-slate-900">Benefits</h2>
                        </div>
                        <ul className="space-y-2">
                          {company.benefits.map((benefit, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 1.1 + index * 0.05 }}
                              className="flex items-start gap-2 text-slate-700"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{benefit}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.div>
            ) : null}



            {/* Team Members */}
            {company.teamMembers && Array.isArray(company.teamMembers) && company.teamMembers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.5 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">Meet Our Team</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {company.teamMembers.map((member, index) => (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 1.6 + index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          className="p-4 bg-slate-50 rounded-lg hover:bg-white hover:shadow-md transition-all border border-slate-200"
                        >
                          <div className="flex gap-3">
                            <Avatar className="h-14 w-14">
                              <AvatarImage src={member.photo} alt={member.name} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                {member.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900">{member.name}</h4>
                              <p className="text-sm text-slate-600">{member.role}</p>
                              {member.bio && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{member.bio}</p>
                              )}
                              <div className="flex gap-2 mt-2">
                                {member.linkedin && (
                                  <a
                                    href={member.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Linkedin className="h-4 w-4" />
                                  </a>
                                )}
                                {member.email && (
                                  <a
                                    href={`mailto:${member.email}`}
                                    className="text-slate-600 hover:text-slate-700"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Culture & Values */}
            {company.cultureValues && Array.isArray(company.cultureValues) && company.cultureValues.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.6 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Heart className="h-5 w-5 text-purple-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">Our Culture</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {company.cultureValues.map((value, index) => {
                        const getIcon = (iconName: string) => {
                          const icons: Record<string, any> = {
                            heart: Heart,
                            target: Target,
                            zap: Sparkles,
                            users: Users,
                          };
                          return icons[iconName] || Heart;
                        };
                        const IconComponent = getIcon(value.icon);
                        return (
                          <motion.div
                            key={value.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 1.7 + index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg hover:shadow-md transition-all border border-purple-100"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-white rounded-lg shadow-sm">
                                <IconComponent className="h-5 w-5 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-slate-900 mb-1">{value.title}</h4>
                                <p className="text-sm text-slate-600">{value.description}</p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Testimonials */}
            {company.testimonials && Array.isArray(company.testimonials) && company.testimonials.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.7 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Quote className="h-5 w-5 text-amber-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">What People Say</h2>
                    </div>
                    <div className="space-y-4">
                      {company.testimonials.map((testimonial, index) => (
                        <motion.div
                          key={testimonial.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 1.8 + index * 0.1 }}
                          className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg hover:shadow-md transition-all border border-amber-100"
                        >
                          <div className="flex gap-4">
                            <Avatar className="h-12 w-12 flex-shrink-0">
                              <AvatarImage src={testimonial.photo} alt={testimonial.name} />
                              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                                {testimonial.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <h4 className="font-semibold text-slate-900">{testimonial.name}</h4>
                                  <p className="text-sm text-slate-600">
                                    {testimonial.role}
                                    {testimonial.company && ` at ${testimonial.company}`}
                                  </p>
                                </div>
                                {testimonial.rating && (
                                  <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < testimonial.rating!
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-slate-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <Quote className="h-5 w-5 text-amber-300 mb-2" />
                              <p className="text-slate-700 italic text-sm">{testimonial.content}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Right Column (1/3) */}
          <div className="space-y-6">

             {/* CTA Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 border-0 shadow-lg text-white overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  <TrendingUp className="h-8 w-8 mb-3" />
                  <h3 className="text-xl font-bold mb-2">Join Our Team</h3>
                  <p className="text-blue-100 text-sm mb-4">
                    Discover exciting opportunities and grow your career with us.
                  </p>
                  <Button 
                    variant="secondary" 
                    className="w-full group"
                    onClick={handleViewJobs}
                  >
                    View Open Positions
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Trusted Clients */}
            {company.clients && Array.isArray(company.clients) && company.clients.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
              >
                <ClientsSection 
                  clients={company.clients} 
                  onUpdate={() => {}} 
                  viewOnly={true}
                />
              </motion.div>
            )}

            {/* Projects */}
            {company.projects && Array.isArray(company.projects) && company.projects.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
              >
                <ProjectsSection 
                  projects={company.projects} 
                  onUpdate={() => {}} 
                  viewOnly={true}
                />
              </motion.div>
            )}

            {/* Awards */}
            {company.awards && Array.isArray(company.awards) && company.awards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                <AwardsSection 
                  awards={company.awards} 
                  onUpdate={() => {}} 
                  viewOnly={true}
                />
              </motion.div>
            )}

            {/* Achievements Carousel */}
            {/* {company.achievements && Array.isArray(company.achievements) && company.achievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.3 }}
              >
                <AchievementsSection 
                  achievements={company.achievements} 
                  onUpdate={() => {}} 
                  viewOnly={true}
                />
              </motion.div>
            )} */}

           
          </div>
        </div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="bg-slate-900 text-white mt-16"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12 border-2 border-white/20">
                  <AvatarImage src={company?.logoUrl} alt={company?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    {company?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{company?.name}</h3>
                  <p className="text-slate-400 text-sm">{company?.industry}</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                {company?.description?.slice(0, 150)}
                {company?.description && company.description.length > 150 ? '...' : ''}
              </p>
              {socialLinks.length > 0 && (
                <div className="flex gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      <social.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#about" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#careers" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#culture" className="hover:text-white transition-colors">
                    Culture
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link to="/" className="hover:text-white transition-colors">
                    CVZen Home
                  </Link>
                </li>
                <li>
                  <Link to="/templates" className="hover:text-white transition-colors">
                    Resume Templates
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/features" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-slate-800" />

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
            <p>
              © {new Date().getFullYear()} {company?.name}. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#terms" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#cookies" className="hover:text-white transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </motion.footer>

      {/* Jobs Modal */}
      <AnimatePresence>
        {showJobsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => {
              console.log('🔴 Modal backdrop clicked - closing');
              setShowJobsModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => {
                console.log('🟢 Modal content clicked - preventing close');
                e.stopPropagation();
              }}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-6 w-6" />
                  <div>
                    <h2 className="text-2xl font-bold">Open Positions</h2>
                    <p className="text-blue-100 text-sm">
                      {company?.name} • {jobs.length} {jobs.length === 1 ? 'position' : 'positions'} available
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    console.log('❌ Close button clicked');
                    setShowJobsModal(false);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(80vh-120px)] custom-scrollbar">
                {(() => {
                  console.log('🎨 Rendering modal content - loadingJobs:', loadingJobs, 'jobs.length:', jobs.length);
                  return null;
                })()}
                {loadingJobs ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-slate-600">Loading positions...</p>
                    </div>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <Briefcase className="h-16 w-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Open Positions</h3>
                    <p className="text-slate-600">
                      There are currently no active job openings at {company?.name}.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    {jobs.map((job, index) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{job.title}</h3>
                            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                              <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                <span>{job.department}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{job.applicationsCount} applicants</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <Badge variant="secondary" className="text-xs">
                              {job.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {job.level}
                            </Badge>
                          </div>
                        </div>

                        {job.salary.min && job.salary.max && (
                          <div className="flex items-center gap-2 text-green-600 font-semibold mb-3">
                            <DollarSign className="h-4 w-4" />
                            <span>
                              {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
                            </span>
                          </div>
                        )}

                        {job.description && (
                          <p className="text-slate-700 text-sm mb-4 line-clamp-2">
                            {job.description}
                          </p>
                        )}

                        {job.requirements && job.requirements.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-slate-900 mb-2">Requirements:</h4>
                            <ul className="space-y-1">
                              {job.requirements.slice(0, 3).map((req, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{req}</span>
                                </li>
                              ))}
                              {job.requirements.length > 3 && (
                                <li className="text-sm text-slate-500 ml-6">
                                  +{job.requirements.length - 3} more requirements
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {job.benefits && job.benefits.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {job.benefits.slice(0, 4).map((benefit, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {benefit}
                              </Badge>
                            ))}
                            {job.benefits.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{job.benefits.length - 4} more
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <span className="text-xs text-slate-500">
                            Posted {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                          <Button 
                            size="sm" 
                            className="group"
                            onClick={() => handleApplyNow(job.id, job.title)}
                          >
                            Apply Now
                            <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Apply Modal */}
      <QuickApplicationModal
        isOpen={showQuickApply}
        onClose={() => {
          setShowQuickApply(false);
          setPendingJobId(null);
          setPendingJobTitle('');
        }}
        onSubmit={handleQuickApplySubmit}
        jobTitle={pendingJobTitle}
        companyName={company?.name || ''}
      />
    </div>
  );
}
