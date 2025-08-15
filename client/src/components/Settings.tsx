import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { Lock, Check, AlertCircle, Key } from 'lucide-react';
import type { ChangePasswordInput } from '../../../server/src/schema';

interface SettingsProps {
  adminId: number;
}

export function Settings({ adminId }: SettingsProps) {
  const [formData, setFormData] = useState<ChangePasswordInput>({
    current_password: '',
    new_password: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    // Validate password confirmation
    if (formData.new_password !== confirmPassword) {
      setError('Konfirmasi password tidak sesuai');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (formData.new_password.length < 6) {
      setError('Password baru harus minimal 6 karakter');
      setIsLoading(false);
      return;
    }

    try {
      await trpc.changePassword.mutate({
        adminId,
        current_password: formData.current_password,
        new_password: formData.new_password
      });
      
      setSuccess(true);
      setFormData({
        current_password: '',
        new_password: ''
      });
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah password. Periksa password lama Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>🔐 Ubah Password</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Perbarui password administrator untuk keamanan akun
          </p>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Password berhasil diubah! ✅
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password" className="flex items-center space-x-2">
                <Key className="h-4 w-4" />
                <span>Password Lama</span>
              </Label>
              <Input
                id="current_password"
                type="password"
                placeholder="Masukkan password lama"
                value={formData.current_password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: ChangePasswordInput) => ({ 
                    ...prev, 
                    current_password: e.target.value 
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password" className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Password Baru</span>
              </Label>
              <Input
                id="new_password"
                type="password"
                placeholder="Masukkan password baru (min. 6 karakter)"
                value={formData.new_password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: ChangePasswordInput) => ({ 
                    ...prev, 
                    new_password: e.target.value 
                  }))
                }
                minLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Konfirmasi Password Baru</span>
              </Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.target.value)
                }
                minLength={6}
                required
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Mengubah Password...' : 'Ubah Password'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Tips Keamanan:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Gunakan password minimal 6 karakter</li>
              <li>• Kombinasikan huruf, angka, dan simbol</li>
              <li>• Jangan gunakan password yang mudah ditebak</li>
              <li>• Ganti password secara berkala</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}