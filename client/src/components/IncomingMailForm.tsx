import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { AlertCircle, Save } from 'lucide-react';
import type { IncomingMail, CreateIncomingMailInput, UpdateIncomingMailInput } from '../../../server/src/schema';

interface IncomingMailFormProps {
  initialData?: IncomingMail;
  onSuccess: (mail: IncomingMail) => void;
}

export function IncomingMailForm({ initialData, onSuccess }: IncomingMailFormProps) {
  const isEditing = Boolean(initialData);
  
  const [formData, setFormData] = useState<CreateIncomingMailInput>({
    registration_number: initialData?.registration_number || '',
    sender_name: initialData?.sender_name || '',
    opd_name: initialData?.opd_name || '',
    letter_number: initialData?.letter_number || '',
    letter_subject: initialData?.letter_subject || '',
    receiver_name: initialData?.receiver_name || '',
    incoming_date: initialData?.incoming_date || new Date(),
    status: initialData?.status || 'Diterima',
    department: initialData?.department || 'Bidang Administrasi',
    update_date: initialData?.update_date || null,
    notes: initialData?.notes || null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isEditing && initialData) {
        const updateInput: UpdateIncomingMailInput = {
          id: initialData.id,
          ...formData
        };
        const result = await trpc.updateIncomingMail.mutate(updateInput);
        if (result) {
          onSuccess(result);
        } else {
          setError('Gagal memperbarui surat. Data tidak ditemukan.');
        }
      } else {
        const result = await trpc.createIncomingMail.mutate(formData);
        if (result) {
          onSuccess(result);
        } else {
          setError('Gagal membuat surat baru.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="registration_number">Nomor Registrasi *</Label>
          <Input
            id="registration_number"
            type="text"
            placeholder="Contoh: REG-2024-001"
            value={formData.registration_number}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateIncomingMailInput) => ({ 
                ...prev, 
                registration_number: e.target.value 
              }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="letter_number">Nomor Surat *</Label>
          <Input
            id="letter_number"
            type="text"
            placeholder="Contoh: 001/DIR/2024"
            value={formData.letter_number}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateIncomingMailInput) => ({ 
                ...prev, 
                letter_number: e.target.value 
              }))
            }
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="letter_subject">Perihal Surat *</Label>
        <Input
          id="letter_subject"
          type="text"
          placeholder="Masukkan perihal/subjek surat"
          value={formData.letter_subject}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateIncomingMailInput) => ({ 
              ...prev, 
              letter_subject: e.target.value 
            }))
          }
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sender_name">Nama Pengirim *</Label>
          <Input
            id="sender_name"
            type="text"
            placeholder="Masukkan nama pengirim"
            value={formData.sender_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateIncomingMailInput) => ({ 
                ...prev, 
                sender_name: e.target.value 
              }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="receiver_name">Nama Penerima *</Label>
          <Input
            id="receiver_name"
            type="text"
            placeholder="Masukkan nama penerima"
            value={formData.receiver_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateIncomingMailInput) => ({ 
                ...prev, 
                receiver_name: e.target.value 
              }))
            }
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="opd_name">Nama OPD *</Label>
        <Input
          id="opd_name"
          type="text"
          placeholder="Masukkan nama OPD (Organisasi Perangkat Daerah)"
          value={formData.opd_name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateIncomingMailInput) => ({ 
              ...prev, 
              opd_name: e.target.value 
            }))
          }
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="incoming_date">Tanggal Surat Masuk *</Label>
          <Input
            id="incoming_date"
            type="date"
            value={formatDateForInput(formData.incoming_date)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateIncomingMailInput) => ({ 
                ...prev, 
                incoming_date: new Date(e.target.value) 
              }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Status Surat *</Label>
          <Select
            value={formData.status}
            onValueChange={(value: 'Diterima' | 'Diproses' | 'Selesai' | 'Ditolak') =>
              setFormData((prev: CreateIncomingMailInput) => ({ 
                ...prev, 
                status: value 
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Diterima">📨 Diterima</SelectItem>
              <SelectItem value="Diproses">⏳ Diproses</SelectItem>
              <SelectItem value="Selesai">✅ Selesai</SelectItem>
              <SelectItem value="Ditolak">❌ Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Bidang *</Label>
          <Select
            value={formData.department}
            onValueChange={(value: 'Bidang Mutasi' | 'Bidang Kepegawaian' | 'Bidang Pengembangan' | 'Bidang Administrasi') =>
              setFormData((prev: CreateIncomingMailInput) => ({ 
                ...prev, 
                department: value 
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih bidang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bidang Administrasi">🏢 Bidang Administrasi</SelectItem>
              <SelectItem value="Bidang Kepegawaian">👥 Bidang Kepegawaian</SelectItem>
              <SelectItem value="Bidang Mutasi">🔄 Bidang Mutasi</SelectItem>
              <SelectItem value="Bidang Pengembangan">📈 Bidang Pengembangan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isEditing && (
        <div className="space-y-2">
          <Label htmlFor="update_date">Tanggal Update</Label>
          <Input
            id="update_date"
            type="date"
            value={formData.update_date ? formatDateForInput(formData.update_date) : ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateIncomingMailInput) => ({ 
                ...prev, 
                update_date: e.target.value ? new Date(e.target.value) : null
              }))
            }
          />
        </div>
      )}

      {isEditing && (
        <div className="space-y-2">
          <Label htmlFor="notes">Keterangan</Label>
          <Textarea
            id="notes"
            placeholder="Masukkan keterangan tambahan (opsional)"
            rows={3}
            value={formData.notes || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreateIncomingMailInput) => ({ 
                ...prev, 
                notes: e.target.value || null
              }))
            }
          />
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isLoading} className="flex items-center space-x-2">
          <Save className="h-4 w-4" />
          <span>
            {isLoading 
              ? (isEditing ? 'Memperbarui...' : 'Menyimpan...') 
              : (isEditing ? 'Perbarui Surat' : 'Simpan Surat')}
          </span>
        </Button>
      </div>
    </form>
  );
}