
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Phone, Mail, User, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CompanyContact {
  id: string;
  company_name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  position?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CompanyContactsProps {
  companyName: string;
  onClose: () => void;
}

const CompanyContacts = ({ companyName, onClose }: CompanyContactsProps) => {
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<CompanyContact | null>(null);
  const [formData, setFormData] = useState({
    contact_name: '',
    phone: '',
    email: '',
    position: '',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadContacts();
  }, [companyName]);

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('company_contacts')
        .select('*')
        .eq('company_name', companyName)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Firma iletişim bilgileri yüklenemedi:', error);
        toast({
          title: "Hata!",
          description: "Firma iletişim bilgileri yüklenemedi.",
          variant: "destructive"
        });
        return;
      }

      setContacts(data || []);
    } catch (error) {
      console.error('Firma iletişim bilgileri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      contact_name: '',
      phone: '',
      email: '',
      position: '',
      notes: ''
    });
    setEditingContact(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingContact) {
        const { error } = await supabase
          .from('company_contacts')
          .update({
            contact_name: formData.contact_name || null,
            phone: formData.phone || null,
            email: formData.email || null,
            position: formData.position || null,
            notes: formData.notes || null
          })
          .eq('id', editingContact.id);

        if (error) {
          console.error('İletişim bilgisi güncellenemedi:', error);
          toast({
            title: "Hata!",
            description: "İletişim bilgisi güncellenemedi.",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Başarılı!",
          description: "İletişim bilgisi güncellendi."
        });
      } else {
        const { error } = await supabase
          .from('company_contacts')
          .insert({
            company_name: companyName,
            contact_name: formData.contact_name || null,
            phone: formData.phone || null,
            email: formData.email || null,
            position: formData.position || null,
            notes: formData.notes || null
          });

        if (error) {
          console.error('İletişim bilgisi eklenemedi:', error);
          toast({
            title: "Hata!",
            description: "İletişim bilgisi eklenemedi.",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Başarılı!",
          description: "İletişim bilgisi eklendi."
        });
      }

      resetForm();
      loadContacts();
    } catch (error) {
      console.error('İletişim bilgisi kaydedilemedi:', error);
      toast({
        title: "Hata!",
        description: "İletişim bilgisi kaydedilemedi.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (contact: CompanyContact) => {
    setFormData({
      contact_name: contact.contact_name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      position: contact.position || '',
      notes: contact.notes || ''
    });
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm('Bu iletişim bilgisini silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('company_contacts')
        .delete()
        .eq('id', contactId);

      if (error) {
        console.error('İletişim bilgisi silinemedi:', error);
        toast({
          title: "Hata!",
          description: "İletişim bilgisi silinemedi.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Başarılı!",
        description: "İletişim bilgisi silindi."
      });

      loadContacts();
    } catch (error) {
      console.error('İletişim bilgisi silinemedi:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">{companyName}</h2>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {contacts.length} İletişim
          </Badge>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni İletişim
          </Button>
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Henüz İletişim Bilgisi Yok</h3>
            <p className="text-gray-600 mb-4">
              Bu firma için henüz iletişim bilgisi eklenmemiş.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              İlk İletişimi Ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">
                        {contact.contact_name || 'İsimsiz İletişim'}
                      </span>
                      {contact.position && (
                        <Badge variant="outline" className="text-xs">
                          {contact.position}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {contact.phone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                    </div>

                    {contact.notes && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {contact.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(contact)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(contact.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact ? 'İletişim Bilgisini Düzenle' : 'Yeni İletişim Bilgisi'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="contact_name">İletişim Adı</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="Yetkili adı"
              />
            </div>
            
            <div>
              <Label htmlFor="position">Pozisyon</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Satış Müdürü, İletişim Sorumlusu vb."
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+90 5xx xxx xx xx"
              />
            </div>

            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ornek@firma.com"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ek bilgiler, özel notlar..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                İptal
              </Button>
              <Button type="submit">
                {editingContact ? 'Güncelle' : 'Kaydet'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyContacts;
