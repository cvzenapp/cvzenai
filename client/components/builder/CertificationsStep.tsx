import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Award, Calendar, Building2, Link as LinkIcon } from 'lucide-react';
import { Certification } from '@shared/api';

interface CertificationsStepProps {
  certifications: Certification[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof Certification, value: string) => void;
}

export function CertificationsStep({
  certifications,
  onAdd,
  onRemove,
  onUpdate
}: CertificationsStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6" />
            Certifications
          </h2>
          <p className="text-muted-foreground mt-1">
            Add your professional certifications and licenses
          </p>
        </div>
        <Button onClick={onAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Certification
        </Button>
      </div>

      {certifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              No certifications added yet
            </p>
            <Button onClick={onAdd} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Certification
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {certifications.map((cert, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Certification {index + 1}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Certification Name */}
                  <div className="md:col-span-2">
                    <Label htmlFor={`cert-name-${index}`} className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Certification Name *
                    </Label>
                    <Input
                      id={`cert-name-${index}`}
                      value={cert.name || ''}
                      onChange={(e) => onUpdate(index, 'name', e.target.value)}
                      placeholder="e.g., AWS Certified Solutions Architect"
                      required
                    />
                  </div>

                  {/* Issuing Organization */}
                  <div>
                    <Label htmlFor={`cert-issuer-${index}`} className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Issuing Organization
                    </Label>
                    <Input
                      id={`cert-issuer-${index}`}
                      value={cert.issuer || ''}
                      onChange={(e) => onUpdate(index, 'issuer', e.target.value)}
                      placeholder="e.g., Amazon Web Services"
                    />
                  </div>

                  {/* Issue Date */}
                  <div>
                    <Label htmlFor={`cert-date-${index}`} className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Issue Date
                    </Label>
                    <Input
                      id={`cert-date-${index}`}
                      type="month"
                      value={cert.date || ''}
                      onChange={(e) => onUpdate(index, 'date', e.target.value)}
                    />
                  </div>

                  {/* Credential URL */}
                  <div className="md:col-span-2">
                    <Label htmlFor={`cert-url-${index}`} className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Credential URL
                    </Label>
                    <Input
                      id={`cert-url-${index}`}
                      type="url"
                      value={cert.url || ''}
                      onChange={(e) => onUpdate(index, 'url', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <Label htmlFor={`cert-description-${index}`}>
                      Description (Optional)
                    </Label>
                    <Textarea
                      id={`cert-description-${index}`}
                      value={cert.description || ''}
                      onChange={(e) => onUpdate(index, 'description', e.target.value)}
                      placeholder="Brief description of the certification..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
