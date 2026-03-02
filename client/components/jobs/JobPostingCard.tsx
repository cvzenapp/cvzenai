import { useState } from "react";
import { MapPin, Briefcase, DollarSign, Users, Eye, Calendar, Edit, Trash2, MoreVertical } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import type { JobPosting } from "@/services/jobPostingsApi";

interface JobPostingCardProps {
  job: JobPosting;
  onEdit: (job: JobPosting) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

function JobPostingCard({ job, onEdit, onDelete, onToggleStatus }: JobPostingCardProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleStatus = async () => {
    setIsToggling(true);
    try {
      await onToggleStatus(job.id, !job.isActive);
    } finally {
      setIsToggling(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'full-time': 'bg-blue-100 text-blue-700',
      'part-time': 'bg-purple-100 text-purple-700',
      'contract': 'bg-orange-100 text-orange-700',
      'internship': 'bg-green-100 text-green-700',
    };
    return colors[type as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'entry': 'bg-emerald-100 text-emerald-700',
      'mid': 'bg-cyan-100 text-cyan-700',
      'senior': 'bg-indigo-100 text-indigo-700',
      'executive': 'bg-rose-100 text-rose-700',
    };
    return colors[level as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  const formatSalary = () => {
    if (!job.salary.min && !job.salary.max) return 'Salary not specified';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: job.salary.currency,
      minimumFractionDigits: 0,
    });
    if (job.salary.min && job.salary.max) {
      return `${formatter.format(job.salary.min)} - ${formatter.format(job.salary.max)}`;
    }
    return job.salary.min ? `From ${formatter.format(job.salary.min)}` : `Up to ${formatter.format(job.salary.max)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`group hover:shadow-lg transition-all ${!job.isActive ? 'opacity-60' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                {!job.isActive && (
                  <Badge variant="outline" className="text-xs">Inactive</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={getTypeColor(job.type)}>
                  {job.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Badge>
                <Badge className={getLevelColor(job.level)}>
                  {job.level.charAt(0).toUpperCase() + job.level.slice(1)} Level
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(job)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Job
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(job.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Job
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Briefcase className="h-4 w-4" />
              <span>{job.department}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <DollarSign className="h-4 w-4" />
              <span>{formatSalary()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="h-4 w-4" />
              <span>{new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
            {job.description}
          </p>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-4">
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <Users className="h-4 w-4" />
                <span>{job.applicationsCount} applicants</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <Eye className="h-4 w-4" />
                <span>{job.viewsCount} views</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                {job.isActive ? 'Active' : 'Inactive'}
              </span>
              <Switch
                checked={job.isActive}
                onCheckedChange={handleToggleStatus}
                disabled={isToggling}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default JobPostingCard;
