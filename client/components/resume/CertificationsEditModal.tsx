import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Award, Calendar, Building, Link, FileText } from 'lucide-react';
import { Certification } from '@shared/api';

interface CertificationsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCertifications: Certification[];
  onSave: (certifications: Certification[]) => Promise<void>;
  resumeData?: any;
}

export const CertificationsEditModal: React.FC<CertificationsEditModalProps> = ({
  isOpen,
  onClose,
  currentCertifications,
  onSave,
  resumeData
}) => {
  const [certifications, setCertifications] = useState<Certification[]>(currentCertifications);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCertifications(currentCertifications.length > 0 ? currentCertifications : [createEmptyCertification()]);
      setSelectedIndex(0);
    }
  }, [isOpen, currentCertifications]);

  const createEmptyCertification = (): Certification => ({
    name: '',
    issuer: '',
    date: '',
    url: '',
    description: ''
  });

  const addCertification = () => {
    const newCertifications = [...certifications, createEmptyCertification()];
    setCertifications(newCertifications);
    setSelectedIndex(newCertifications.length - 1);
  };

  const removeCertification = (index: number) => {
    if (certifications.length === 1) return;
    
    const newCertifications = certifications.filter((_, i) => i !== index);
    setCertifications(newCertifications);
    setSelectedIndex(Math.max(0, Math.min(selectedIndex, newCertifications.length - 1)));
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    const newCertifications = [...certifications];
    newCertifications[index] = { ...newCertifications[index], [field]: value };
    setCertifications(newCertifications);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Filter out empty certifications
      const validCertifications = certifications.filter(cert => 
        cert.name.trim() !== '' || cert.issuer.trim() !== ''
      );
      await onSave(validCertifications);
      onClose();
    } catch (error) {
      console.error('Failed to save certifications:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCertification = certifications[selectedIndex] || createEmptyCertification();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Edit Certifications
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Left Panel - Certifications List */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Certifications</h3>
              <Button
                onClick={addCertification}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {certifications.map((cert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedIndex === index
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900 truncate">
                        {cert.name || 'New Certification'}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {cert.issuer || 'No issuer specified'}
                      </p>
                      {cert.date && (
                        <p className="text-xs text-gray-400">{cert.date}</p>
                      )}
                    </div>
                    {certifications.length > 1 && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCertification(index);
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Certification Form */}
          <div className="lg:col-span-2 flex flex-col">
            <h3 className="font-semibold text-gray-900 mb-4">
              Certification Details
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Certification Name */}
              <div>
                <Label htmlFor="certName" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Award className="w-4 h-4" />
                  Certification Name *
                </Label>
                <Input
                  id="certName"
                  value={selectedCertification.name}
                  onChange={(e) => updateCertification(selectedIndex, 'name', e.target.value)}
                  placeholder="e.g., AWS Certified Solutions Architect"
                  className="mt-1"
                />
              </div>

              {/* Issuing Organization */}
              <div>
                <Label htmlFor="issuer" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Building className="w-4 h-4" />
                  Issuing Organization
                </Label>
                <Input
                  id="issuer"
                  value={selectedCertification.issuer || ''}
                  onChange={(e) => updateCertification(selectedIndex, 'issuer', e.target.value)}
                  placeholder="e.g., Amazon Web Services"
                  className="mt-1"
                />
              </div>

              {/* Issue Date */}
              <div>
                <Label htmlFor="date" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4" />
                  Issue Date
                </Label>
                <Input
                  id="date"
                  type="month"
                  value={selectedCertification.date || ''}
                  onChange={(e) => updateCertification(selectedIndex, 'date', e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Credential URL */}
              <div>
                <Label htmlFor="url" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Link className="w-4 h-4" />
                  Credential URL
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={selectedCertification.url || ''}
                  onChange={(e) => updateCertification(selectedIndex, 'url', e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="w-4 h-4" />
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={selectedCertification.description || ''}
                  onChange={(e) => updateCertification(selectedIndex, 'description', e.target.value)}
                  placeholder="Brief description of the certification..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};