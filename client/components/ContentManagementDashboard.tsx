import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  History, 
  Upload, 
  Download,
  Plus,
  Eye,
  Edit,
  RotateCcw
} from 'lucide-react';
import { 
  templateContentManager, 
  ContentReviewRequest, 
  ContentVersion,
  ContentReviewResult 
} from '../services/templateContentManager';
import { TemplateSpecificContent } from '../types/templateContent';
import { templateContentRegistry } from '../services/templateContentRegistry';

interface ContentManagementDashboardProps {
  userRole: 'admin' | 'editor' | 'reviewer';
  currentUser: string;
}

export const ContentManagementDashboard: React.FC<ContentManagementDashboardProps> = ({
  userRole,
  currentUser
}) => {
  const [pendingReviews, setPendingReviews] = useState<ContentReviewRequest[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [versionHistory, setVersionHistory] = useState<ContentVersion[]>([]);
  const [reviewHistory, setReviewHistory] = useState<ContentReviewResult[]>([]);
  const [newTemplateId, setNewTemplateId] = useState('');
  const [newTemplateRole, setNewTemplateRole] = useState('');
  const [newTemplateLevel, setNewTemplateLevel] = useState('mid');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadPendingReviews();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      loadTemplateHistory(selectedTemplate);
    }
  }, [selectedTemplate]);

  const loadPendingReviews = () => {
    const reviews = templateContentManager.getPendingReviews();
    setPendingReviews(reviews);
  };

  const loadTemplateHistory = (templateId: string) => {
    const versions = templateContentManager.getContentVersionHistory(templateId);
    const reviews = templateContentManager.getReviewHistory(templateId);
    setVersionHistory(versions);
    setReviewHistory(reviews);
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateId || !newTemplateRole) {
      setAlert({ type: 'error', message: 'Template ID and role are required' });
      return;
    }

    try {
      // Create basic template structure
      const templateContent: TemplateSpecificContent = {
        templateId: newTemplateId,
        personalInfo: {
          name: `[${newTemplateRole} Name]`,
          title: `[${newTemplateRole} Title]`,
          email: '[email@example.com]',
          location: '[City, State]'
        },
        professionalSummary: `[Professional summary for ${newTemplateRole}]`,
        objective: `[Career objective for ${newTemplateRole}]`,
        skills: [],
        experiences: [],
        education: [],
        projects: [],
        achievements: []
      };

      const result = await templateContentManager.createTemplateContent(
        newTemplateId,
        templateContent,
        currentUser,
        `Created new ${newTemplateRole} template`
      );

      if (result.success) {
        setAlert({ type: 'success', message: `Template created and submitted for review: ${result.reviewId}` });
        setNewTemplateId('');
        setNewTemplateRole('');
        loadPendingReviews();
      } else {
        setAlert({ type: 'error', message: result.errors?.join(', ') || 'Failed to create template' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to create template' });
    }
  };

  const handleReviewTemplate = async (reviewId: string, approved: boolean) => {
    if (!reviewFeedback.trim()) {
      setAlert({ type: 'error', message: 'Review feedback is required' });
      return;
    }

    try {
      const result = await templateContentManager.reviewContent(
        reviewId,
        approved,
        currentUser,
        reviewFeedback
      );

      if (result.success) {
        setAlert({ 
          type: 'success', 
          message: `Template ${approved ? 'approved' : 'rejected'} successfully` 
        });
        setReviewFeedback('');
        loadPendingReviews();
      } else {
        setAlert({ type: 'error', message: result.errors?.join(', ') || 'Failed to review template' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to review template' });
    }
  };

  const handleRollback = async (templateId: string, version: string) => {
    try {
      const result = await templateContentManager.rollbackToVersion(
        templateId,
        version,
        currentUser
      );

      if (result.success) {
        setAlert({ type: 'success', message: `Successfully rolled back to version ${version}` });
        loadTemplateHistory(templateId);
      } else {
        setAlert({ type: 'error', message: result.errors?.join(', ') || 'Failed to rollback' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to rollback template' });
    }
  };

  const handleExportContent = () => {
    try {
      const exportData = templateContentManager.exportAllContent();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-content-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setAlert({ type: 'success', message: 'Content exported successfully' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to export content' });
    }
  };

  const getStatusBadge = (changeType: string, priority: string) => {
    const variant = priority === 'high' ? 'destructive' : priority === 'medium' ? 'default' : 'secondary';
    return <Badge variant={variant}>{changeType.toUpperCase()}</Badge>;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Template Content Management</h1>
        <p className="text-gray-600 mt-2">
          Manage template content creation, review, and versioning
        </p>
      </div>

      {alert && (
        <Alert className={`mb-6 ${alert.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <AlertDescription className={alert.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="reviews" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reviews">Pending Reviews</TabsTrigger>
          <TabsTrigger value="create">Create Template</TabsTrigger>
          <TabsTrigger value="history">Version History</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Reviews ({pendingReviews.length})
              </CardTitle>
              <CardDescription>
                Review and approve template content changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingReviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending reviews</p>
              ) : (
                <div className="space-y-4">
                  {pendingReviews.map((review, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{review.templateId}</h3>
                            <p className="text-sm text-gray-600">
                              Requested by {review.requestedBy} on{' '}
                              {review.requestedAt.toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {getStatusBadge(review.changeType, review.priority)}
                            <Badge variant="outline" className={getPriorityColor(review.priority)}>
                              {review.priority.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        {review.reviewNotes && (
                          <div className="mb-4 p-3 bg-gray-50 rounded">
                            <p className="text-sm">{review.reviewNotes}</p>
                          </div>
                        )}

                        {userRole === 'reviewer' || userRole === 'admin' ? (
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Enter review feedback..."
                              value={reviewFeedback}
                              onChange={(e) => setReviewFeedback(e.target.value)}
                              className="min-h-[100px]"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleReviewTemplate(`review_${review.templateId}_${review.requestedAt.getTime()}`, true)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleReviewTemplate(`review_${review.templateId}_${review.requestedAt.getTime()}`, false)}
                                variant="destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            You don't have permission to review this template
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          {userRole === 'admin' || userRole === 'editor' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Template
                </CardTitle>
                <CardDescription>
                  Create a new template content structure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Template ID</label>
                    <Input
                      placeholder="e.g., devops-engineer-senior"
                      value={newTemplateId}
                      onChange={(e) => setNewTemplateId(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Role</label>
                    <Input
                      placeholder="e.g., DevOps Engineer"
                      value={newTemplateRole}
                      onChange={(e) => setNewTemplateRole(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Experience Level</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newTemplateLevel}
                    onChange={(e) => setNewTemplateLevel(e.target.value)}
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="executive">Executive Level</option>
                  </select>
                </div>
                <Button onClick={handleCreateTemplate} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">
                  You don't have permission to create templates
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Version History
              </CardTitle>
              <CardDescription>
                View and manage template version history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Template</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                >
                  <option value="">Select a template...</option>
                  {templateContentRegistry.getAvailableTemplateIds().map(id => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>

              {selectedTemplate && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Versions</h3>
                  {versionHistory.length === 0 ? (
                    <p className="text-gray-500">No version history available</p>
                  ) : (
                    <div className="space-y-3">
                      {versionHistory.map((version, index) => (
                        <Card key={index} className="border-l-4 border-l-green-500">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{version.version}</h4>
                                <p className="text-sm text-gray-600">
                                  {version.changeLog}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Created by {version.createdBy} on{' '}
                                  {version.createdAt.toLocaleDateString()}
                                </p>
                                {version.approved && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Approved by {version.approvedBy} on{' '}
                                    {version.approvedAt?.toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              {(userRole === 'admin' || userRole === 'editor') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRollback(selectedTemplate, version.version)}
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Rollback
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  <h3 className="font-semibold mt-6">Review History</h3>
                  {reviewHistory.length === 0 ? (
                    <p className="text-gray-500">No review history available</p>
                  ) : (
                    <div className="space-y-3">
                      {reviewHistory.map((review, index) => (
                        <Card key={index} className="border-l-4 border-l-blue-500">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  {review.approved ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className={review.approved ? 'text-green-600' : 'text-red-600'}>
                                    {review.approved ? 'APPROVED' : 'REJECTED'}
                                  </span>
                                  <Badge variant="outline">
                                    Score: {review.qualityScore}%
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{review.feedback}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Reviewed by {review.reviewedBy} on{' '}
                                  {review.reviewedAt.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Content
                </CardTitle>
                <CardDescription>
                  Export all template content for backup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExportContent} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Content
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content Statistics
                </CardTitle>
                <CardDescription>
                  Overview of template content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Templates:</span>
                    <span className="font-medium">
                      {templateContentRegistry.getAvailableTemplateIds().length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Reviews:</span>
                    <span className="font-medium">{pendingReviews.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your Role:</span>
                    <Badge variant="outline">{userRole.toUpperCase()}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentManagementDashboard;