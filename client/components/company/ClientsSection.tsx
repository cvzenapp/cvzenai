import { useState, useEffect } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { CompanyClient } from "../../../shared/recruiterAuth";

interface ClientsSectionProps {
  clients: CompanyClient[];
  onUpdate: (clients: CompanyClient[]) => void;
  isEditing?: boolean;
  viewOnly?: boolean;
}

export default function ClientsSection({ clients, onUpdate, viewOnly = false }: ClientsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', logo: '', description: '' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingClient, setEditingClient] = useState<CompanyClient | null>(null);

  // Ensure clients is always an array
  const safeClients = Array.isArray(clients) ? clients : [];

  // Auto-play carousel effect
  useEffect(() => {
    if (safeClients.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % safeClients.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [safeClients.length]);

  const handleAdd = () => {
    if (editingClient) {
      // Update existing client
      const updatedClients = safeClients.map(c => 
        c.id === editingClient.id 
          ? { ...c, name: form.name, logo: form.logo, description: form.description }
          : c
      );
      onUpdate(updatedClients);
      setEditingClient(null);
    } else {
      // Add new client
      const newClient: CompanyClient = {
        id: Date.now().toString(),
        name: form.name,
        logo: form.logo,
        description: form.description,
      };
      onUpdate([...safeClients, newClient]);
    }
    setForm({ name: '', logo: '', description: '' });
    setIsOpen(false);
  };

  const handleEdit = (client: CompanyClient) => {
    setEditingClient(client);
    setForm({ name: client.name, logo: client.logo || '', description: client.description || '' });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    onUpdate(safeClients.filter(c => c.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Trusted Clients</h3>
        {!viewOnly && (
          <Button onClick={() => setIsOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          {safeClients.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <svg className="h-12 w-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>No clients added yet</p>
              <p className="text-sm mt-1">Showcase companies you've worked with</p>
            </div>
          ) : (
            <div className="relative">
              <div className="relative overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {safeClients.map(client => (
                    <div
                      key={client.id}
                      className="group relative flex-shrink-0 w-full h-80 p-6 bg-slate-50 rounded-lg border border-slate-200 flex flex-col"
                    >
                      <div className="flex flex-col items-center flex-shrink-0">
                        {client.logo && (
                          <div className="h-24 flex items-center justify-center mb-4">
                            <img src={client.logo} alt={client.name} className="max-h-24 w-auto object-contain grayscale" />
                          </div>
                        )}
                        <p className="font-bold text-lg text-center">{client.name}</p>
                      </div>
                      {client.description && (
                        <div className="flex-1 overflow-y-auto mt-4 px-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                          <p className="text-sm text-slate-600 text-center">{client.description}</p>
                        </div>
                      )}
                      {!viewOnly && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={() => handleEdit(client)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {safeClients.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {safeClients.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        index === currentIndex 
                          ? 'bg-blue-600 w-6' 
                          : 'bg-slate-300 hover:bg-slate-400'
                      }`}
                      aria-label={`Go to client ${index + 1}`}
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
          setEditingClient(null);
          setForm({ name: '', logo: '', description: '' });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add Client'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="client-name">Client Name *</Label>
              <Input 
                id="client-name"
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                placeholder="Acme Corporation"
              />
            </div>
            <div>
              <Label htmlFor="client-logo">Logo URL *</Label>
              <Input 
                id="client-logo"
                value={form.logo} 
                onChange={e => setForm({...form, logo: e.target.value})} 
                placeholder="https://example.com/logo.png"
              />
              {form.logo && (
                <div className="mt-2 p-2 border rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-600 mb-2">Preview:</p>
                  <img src={form.logo} alt="Logo preview" className="h-16 w-auto object-contain" />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="client-description">Description</Label>
              <Textarea 
                id="client-description"
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
                placeholder="Brief description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.name}>
              {editingClient ? 'Update Client' : 'Add Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
