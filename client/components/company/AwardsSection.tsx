import { useState, useEffect } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { CompanyAward } from "../../../shared/recruiterAuth";

interface AwardsSectionProps {
  awards: CompanyAward[];
  onUpdate: (awards: CompanyAward[]) => void;
  isEditing?: boolean;
  viewOnly?: boolean;
}

export default function AwardsSection({ awards, onUpdate, viewOnly = false }: AwardsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: '', issuer: '', date: '', description: '', image: '' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingAward, setEditingAward] = useState<CompanyAward | null>(null);

  useEffect(() => {
    if (awards.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % awards.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [awards.length]);

  const handleAdd = () => {
    if (editingAward) {
      const updatedAwards = awards.map(a =>
        a.id === editingAward.id
          ? { ...a, title: form.title, issuer: form.issuer, date: form.date, description: form.description, image: form.image }
          : a
      );
      onUpdate(updatedAwards);
      setEditingAward(null);
    } else {
      const newAward: CompanyAward = {
        id: Date.now().toString(),
        title: form.title,
        issuer: form.issuer,
        date: form.date,
        description: form.description,
        image: form.image,
      };
      onUpdate([...awards, newAward]);
    }
    setForm({ title: '', issuer: '', date: '', description: '', image: '' });
    setIsOpen(false);
  };

  const handleEdit = (award: CompanyAward) => {
    setEditingAward(award);
    setForm({ title: award.title, issuer: award.issuer, date: award.date, description: award.description || '', image: award.image || '' });
    setIsOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Awards & Recognition</h3>
        {!viewOnly && (
          <Button onClick={() => setIsOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Award
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          {awards.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No awards added yet</p>
            </div>
          ) : (
            <div className="relative">
              <div className="relative overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {awards.map(award => (
                    <div
                      key={award.id}
                      className="group relative flex-shrink-0 w-full h-80 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-100 flex flex-col overflow-hidden"
                    >
                      {award.image && (
                        <div className="flex-shrink-0 h-32 w-full bg-white border-b border-yellow-100">
                          <img 
                            src={award.image} 
                            alt={award.title}
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col p-4 overflow-hidden">
                        <div className="flex-shrink-0">
                          <h4 className="font-bold">{award.title}</h4>
                          <p className="text-sm text-slate-600">{award.issuer} • {award.date}</p>
                        </div>
                        {award.description && (
                          <div className="flex-1 overflow-y-auto mt-2 px-2 scrollbar-thin scrollbar-thumb-yellow-300 scrollbar-track-transparent">
                            <p className="text-sm">{award.description}</p>
                          </div>
                        )}
                      </div>
                      {!viewOnly && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 bg-white/80 hover:bg-white"
                            onClick={() => handleEdit(award)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={() => onUpdate(awards.filter(a => a.id !== award.id))}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {awards.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {awards.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        index === currentIndex 
                          ? 'bg-blue-600 w-6' 
                          : 'bg-slate-300 hover:bg-slate-400'
                      }`}
                      aria-label={`Go to award ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setEditingAward(null);
          setForm({ title: '', issuer: '', date: '', description: '', image: '' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAward ? 'Edit Award' : 'Add Award'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div>
              <Label>Issuer *</Label>
              <Input value={form.issuer} onChange={e => setForm({...form, issuer: e.target.value})} />
            </div>
            <div>
              <Label>Date *</Label>
              <Input value={form.date} onChange={e => setForm({...form, date: e.target.value})} placeholder="2024" />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input 
                value={form.image} 
                onChange={e => setForm({...form, image: e.target.value})} 
                placeholder="https://example.com/award-image.png"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.title || !form.issuer || !form.date}>
              {editingAward ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
