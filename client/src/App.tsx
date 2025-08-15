import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicTracking } from '@/components/PublicTracking';
import { AdminLogin } from '@/components/AdminLogin';
import { AdminDashboard } from '@/components/AdminDashboard';
import { IncomingMails } from '@/components/IncomingMails';
import { Settings } from '@/components/Settings';
import { FileText, Shield, Home, Mail, SettingsIcon, LogOut } from 'lucide-react';

type AdminSection = 'dashboard' | 'mails' | 'settings';

function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [activeAdminSection, setActiveAdminSection] = useState<AdminSection>('dashboard');
  const [adminId, setAdminId] = useState<number | null>(null);

  const handleAdminLogin = (id: number) => {
    setIsAdminLoggedIn(true);
    setAdminId(id);
    setActiveAdminSection('dashboard');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminId(null);
    setActiveAdminSection('dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">E-MOT</h1>
                <p className="text-sm text-gray-600">Electronic Monitoring System</p>
              </div>
            </div>
            {isAdminLoggedIn && (
              <Button
                variant="outline"
                onClick={handleAdminLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar Admin</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!isAdminLoggedIn ? (
          <Tabs defaultValue="tracking" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
              <TabsTrigger value="tracking" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Lacak Dokumen</span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tracking">
              <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">📋 Lacak Status Dokumen</CardTitle>
                  <p className="text-gray-600">
                    Masukkan nomor registrasi untuk melacak status dokumen Anda
                  </p>
                </CardHeader>
                <CardContent>
                  <PublicTracking />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admin">
              <Card className="max-w-md mx-auto">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">🔐 Login Administrator</CardTitle>
                  <p className="text-gray-600">
                    Masuk untuk mengakses panel administrasi
                  </p>
                </CardHeader>
                <CardContent>
                  <AdminLogin onLogin={handleAdminLogin} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            {/* Admin Navigation */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    <Button
                      variant={activeAdminSection === 'dashboard' ? 'default' : 'ghost'}
                      onClick={() => setActiveAdminSection('dashboard')}
                      className="flex items-center space-x-2"
                    >
                      <Home className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Button>
                    <Button
                      variant={activeAdminSection === 'mails' ? 'default' : 'ghost'}
                      onClick={() => setActiveAdminSection('mails')}
                      className="flex items-center space-x-2"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Surat Masuk</span>
                    </Button>
                    <Button
                      variant={activeAdminSection === 'settings' ? 'default' : 'ghost'}
                      onClick={() => setActiveAdminSection('settings')}
                      className="flex items-center space-x-2"
                    >
                      <SettingsIcon className="h-4 w-4" />
                      <span>Pengaturan</span>
                    </Button>
                  </div>
                  <Badge variant="secondary">Admin Panel</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Admin Content */}
            {activeAdminSection === 'dashboard' && <AdminDashboard />}
            {activeAdminSection === 'mails' && <IncomingMails />}
            {activeAdminSection === 'settings' && adminId && <Settings adminId={adminId} />}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;