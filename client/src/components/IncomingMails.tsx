import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { Plus, Search, Edit, Trash2, User, Building, Calendar, FileText } from 'lucide-react';
import { IncomingMailForm } from '@/components/IncomingMailForm';
import type { IncomingMail, SearchMailsInput } from '../../../server/src/schema';

export function IncomingMails() {
  const [mails, setMails] = useState<IncomingMail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMail, setEditingMail] = useState<IncomingMail | null>(null);

  const loadAllMails = useCallback(async () => {
    try {
      const result = await trpc.getAllMails.query();
      setMails(result);
    } catch (error) {
      console.error('Failed to load mails:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchMails = useCallback(async (query: string) => {
    if (!query.trim()) {
      loadAllMails();
      return;
    }

    setIsSearching(true);
    try {
      const searchInput: SearchMailsInput = {
        sender_name: query.trim()
      };
      const result = await trpc.searchMails.query(searchInput);
      setMails(result);
    } catch (error) {
      console.error('Failed to search mails:', error);
      setMails([]);
    } finally {
      setIsSearching(false);
    }
  }, [loadAllMails]);

  useEffect(() => {
    loadAllMails();
  }, [loadAllMails]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchMails(searchQuery);
  };

  const handleMailCreated = (newMail: IncomingMail) => {
    setMails((prev: IncomingMail[]) => [newMail, ...prev]);
    setIsFormOpen(false);
  };

  const handleMailUpdated = (updatedMail: IncomingMail) => {
    setMails((prev: IncomingMail[]) =>
      prev.map((mail: IncomingMail) => (mail.id === updatedMail.id ? updatedMail : mail))
    );
    setEditingMail(null);
  };

  const handleDeleteMail = async (mailId: number) => {
    try {
      await trpc.deleteMail.mutate({ id: mailId });
      setMails((prev: IncomingMail[]) => prev.filter((mail: IncomingMail) => mail.id !== mailId));
    } catch (error) {
      console.error('Failed to delete mail:', error);
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>📮 Manajemen Surat Masuk</span>
            </CardTitle>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Input Surat Masuk</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>📝 Input Surat Masuk Baru</DialogTitle>
                </DialogHeader>
                <IncomingMailForm onSuccess={handleMailCreated} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex space-x-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Cari berdasarkan nama pengirim..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Button type="submit" disabled={isSearching}>
              {isSearching ? 'Mencari...' : 'Cari'}
            </Button>
            {searchQuery && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  loadAllMails();
                }}
              >
                Reset
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Mails List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {searchQuery ? `📋 Hasil Pencarian "${searchQuery}"` : '📋 Daftar Surat Masuk'}
            <Badge variant="secondary" className="ml-2">
              {mails.length} surat
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>
                {searchQuery 
                  ? 'Tidak ditemukan surat dengan nama pengirim tersebut' 
                  : 'Belum ada surat masuk. Klik "Input Surat Masuk" untuk menambahkan.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mails.map((mail: IncomingMail) => (
                <div key={mail.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="font-mono">
                          {mail.registration_number}
                        </Badge>
                        <Badge
                          className={`${getStatusColor(mail.status)} border`}
                        >
                          <span className="mr-1">{getStatusIcon(mail.status)}</span>
                          {mail.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {mail.letter_subject}
                      </h3>
                    </div>
                    <div className="flex space-x-2">
                      <Dialog
                        open={editingMail?.id === mail.id}
                        onOpenChange={(open) => {
                          if (!open) setEditingMail(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingMail(mail)}
                            className="flex items-center space-x-1"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>✏️ Edit Surat Masuk</DialogTitle>
                          </DialogHeader>
                          {editingMail && (
                            <IncomingMailForm
                              initialData={editingMail}
                              onSuccess={handleMailUpdated}
                            />
                          )}
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Surat</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus surat dengan nomor registrasi{' '}
                              <strong>{mail.registration_number}</strong>? Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteMail(mail.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Mail Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-gray-600">Pengirim:</span>
                          <p className="font-medium">{mail.sender_name}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Building className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-gray-600">OPD:</span>
                          <p className="font-medium">{mail.opd_name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-gray-600">Penerima:</span>
                          <p className="font-medium">{mail.receiver_name}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Building className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-gray-600">Bidang:</span>
                          <p className="font-medium">{mail.department}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Masuk: {mail.incoming_date.toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      {mail.update_date && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Update: {mail.update_date.toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="font-mono">
                      No. Surat: {mail.letter_number}
                    </div>
                  </div>

                  {mail.notes && (
                    <>
                      <Separator className="my-3" />
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-sm text-blue-800">
                          <strong>Keterangan:</strong> {mail.notes}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}