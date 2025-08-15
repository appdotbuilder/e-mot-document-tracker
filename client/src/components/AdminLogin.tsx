import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { User, Lock, AlertCircle } from 'lucide-react';
import type { AdminLoginInput } from '../../../server/src/schema';

interface AdminLoginProps {
  onLogin: (adminId: number) => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [formData, setFormData] = useState<AdminLoginInput>({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await trpc.adminLogin.mutate(formData);
      if (result) {
        onLogin(result.id);
      } else {
        setError('Username atau password salah');
      }
    } catch (err) {
      setError('Username atau password salah');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="username" className="flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span>Username</span>
        </Label>
        <Input
          id="username"
          type="text"
          placeholder="Masukkan username"
          value={formData.username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: AdminLoginInput) => ({ ...prev, username: e.target.value }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center space-x-2">
          <Lock className="h-4 w-4" />
          <span>Password</span>
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Masukkan password"
          value={formData.password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: AdminLoginInput) => ({ ...prev, password: e.target.value }))
          }
          required
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Memverifikasi...' : 'Masuk'}
      </Button>
    </form>
  );
}