import { useState, useEffect } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { CompanyAchievement } from "../../../shared/recruiterAuth";

interface AchievementsSectionProps {
  achievements: CompanyAchievement[];
  onUpdate: (achievements: CompanyAchievement[]) => void;
  isEditing?: boolean;
  viewOnly?: boolean;
}

export default function AchievementsSection({ achievements, onUpdate, viewOnly = false }: AchievementsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', metric: '', date: '' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingAchievement, setEditingAchievement] = useState<CompanyAchievement | null>(null);

  useEffect(() => {
    if (achievements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % achievements.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [achievements.length]);

  const handleAdd = () => {
    if (editingAchievement) {
      const updatedAchievements = achievements.map(a =>
        a.id === editingAchievement.id
          ? { ...a, title: form.title, description: form.description, metric: form.metric, date: form.date }
          : a
      );
      onUpdate(updatedAchievements);
      setEditingAchievement(null);
    } else {
      const newAchievement: CompanyAchievement = {
        id: Date.now().toString(),
        title: form.title,
        description: form.description,
        metric: form.metric,
        date: form.date,
      };
      onUpdate([...achievements, newAchievement]);
    }
    setForm({ title: '', description: '', metric: '', date: '' });
    setIsOpen(false);
  };

  const handleEdit = (achievement: CompanyAchievement) => {
    setEditingAchievement(achievement);
    setForm({ title: achievement.title, description: achievement.description, metric: achievement.metric || '', date: achievement.date || '' });
    setIsOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Key Achievements</h3>
        {!viewOnly && (
          <Button onClick={() => setIsOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Achievement
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          {achievements.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No achievements added yet</p>
            </div>
          ) : (
            <div className="relative">
              <div className="relative overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {achievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className="group relative flex-shrink-0 w-full h-80 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 flex flex-col"
                    >
                      <div className="flex-shrink-0 text-center">
                        {achievement.metric && (
                          <div className="text-3xl font-bold text-primary mb-2">{achievement.metric}</div>
                        )}
                        <h4 className="font-bold mb-1">{achievement.title}</h4>
                      </div>
                      <div className="flex-1 overflow-y-auto mt-2 px-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent">
                        <p className="text-sm text-slate-600 text-center">{achievement.description}</p>
                      </div>
                      {!viewOnly && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={() => handleEdit(achievement)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={() => onUpdate(achievements.filter(a => a.id !== achievement.id))}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {achievements.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {achievements.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        index === currentIndex 
                          ? 'bg-blue-600 w-6' 
                          : 'bg-slate-300 hover:bg-slate-400'
                      }`}
                      aria-label={`Go to achievement ${index + 1}`}
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
          setEditingAchievement(null);
          setForm({ title: '', description: '', metric: '', date: '' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAchievement ? 'Edit Achievement' : 'Add Achievement'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
            </div>
            <div>
              <Label>Metric</Label>
              <Input value={form.metric} onChange={e => setForm({...form, metric: e.target.value})} placeholder="500+" />
            </div>
            <div>
              <Label>Date</Label>
              <Input value={form.date} onChange={e => setForm({...form, date: e.target.value})} placeholder="2024" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.title || !form.description}>
              {editingAchievement ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
