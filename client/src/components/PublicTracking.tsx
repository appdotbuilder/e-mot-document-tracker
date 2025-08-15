import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { Search, Calendar, Building, FileText, AlertCircle } from 'lucide-react';
import type { DocumentStatus } from '../../../server/src/schema';

export function PublicTracking() {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationNumber.trim()) return;

    setIsLoading(true);
    setError(null);
    setDocumentStatus(null);

    try {
      const result = await trpc.trackDocument.query({
        registration_number: registrationNumber.trim()
      });
      setDocumentStatus(result);
    } catch (err) {
      setError('Dokumen dengan nomor registrasi tersebut tidak ditemukan');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Diterima':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Diproses':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Selesai':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Ditolak':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Diterima':
        return '📨';
      case 'Diproses':
        return '⏳';
      case 'Selesai':
        return '✅';
      case 'Ditolak':
        return '❌';
      default:
        return '📄';
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Masukkan Nomor Registrasi"
            value={registrationNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setRegistrationNumber(e.target.value)
            }
            className="pr-12"
            required
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Mencari...' : 'Lacak Dokumen'}
        </Button>
      </form>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {documentStatus && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <FileText className="h-5 w-5" />
              <span>Status Dokumen Ditemukan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Nomor Registrasi:</span>
                <Badge variant="outline" className="font-mono">
                  {documentStatus.registration_number}
                </Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Status Surat Terakhir:</span>
                <Badge
                  className={`${getStatusColor(documentStatus.last_status)} border`}
                >
                  <span className="mr-1">{getStatusIcon(documentStatus.last_status)}</span>
                  {documentStatus.last_status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Bidang Penanganan:</span>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{documentStatus.handling_department}</span>
                </div>
              </div>

              {documentStatus.last_update_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Tanggal Update Terakhir:</span>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {documentStatus.last_update_date.toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}

              {documentStatus.progress_notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-600">Keterangan Progres:</span>
                    <div className="bg-white p-3 rounded-md border">
                      <p className="text-sm">{documentStatus.progress_notes}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}