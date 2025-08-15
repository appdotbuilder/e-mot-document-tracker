import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { BarChart3, Mail, CheckCircle, Clock, Calendar, User, Building } from 'lucide-react';
import type { DashboardStats, IncomingMail } from '../../../server/src/schema';

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentMails, setRecentMails] = useState<IncomingMail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      const [statsResult, mailsResult] = await Promise.all([
        trpc.getDashboardStats.query(),
        trpc.getRecentMails.query({ limit: 5 })
      ]);
      setStats(statsResult);
      setRecentMails(mailsResult);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Surat</CardTitle>
              <Mail className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.total_mails}</div>
              <p className="text-xs text-blue-600 mt-1">📄 Semua dokumen masuk</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">Diproses</CardTitle>
              <Clock className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{stats.processed_mails}</div>
              <p className="text-xs text-yellow-600 mt-1">⏳ Sedang dalam proses</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Selesai</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.completed_mails}</div>
              <p className="text-xs text-green-600 mt-1">✅ Sudah diselesaikan</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Mails */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>📬 Surat Masuk Terbaru</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentMails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada surat masuk terbaru</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentMails.map((mail: IncomingMail, index: number) => (
                <div key={mail.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {mail.registration_number}
                        </Badge>
                        <Badge
                          className={`${getStatusColor(mail.status)} border text-xs`}
                        >
                          <span className="mr-1">{getStatusIcon(mail.status)}</span>
                          {mail.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900">{mail.letter_subject}</h3>
                    </div>
                    <div className="text-xs text-gray-500">
                      #{index + 1}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Pengirim:</span>
                      <span className="font-medium">{mail.sender_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Bidang:</span>
                      <span className="font-medium">{mail.department}</span>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Masuk: {mail.incoming_date.toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div>
                      OPD: {mail.opd_name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}