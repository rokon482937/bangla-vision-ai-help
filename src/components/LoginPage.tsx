
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast({ title: "সফলভাবে লগইন হয়েছে!" });
    } catch (error) {
      toast({ title: "লগইন ব্যর্থ", description: "ইমেইল বা পাসওয়ার্ড ভুল", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password, displayName);
      toast({ title: "অ্যাকাউন্ট তৈরি হয়েছে!", description: "৫টি ফ্রি টোকেন পেয়েছেন" });
    } catch (error) {
      toast({ title: "রেজিস্ট্রেশন ব্যর্থ", description: "আবার চেষ্টা করুন", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast({ title: "Google দিয়ে লগইন সফল!" });
    } catch (error) {
      toast({ title: "Google লগইন ব্যর্থ", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Card className="w-full max-w-md bg-black/40 backdrop-blur-xl border-red-500/30 shadow-2xl relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white mb-2">
            <span className="text-red-500">Killer</span> Assistant
          </CardTitle>
          <CardDescription className="text-gray-300">
            AI স্ক্রিন সহায়ক - আপনার সমস্যার সমাধান
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-red-900/20">
              <TabsTrigger value="signin" className="text-white data-[state=active]:bg-red-600">
                লগইন
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-white data-[state=active]:bg-red-600">
                সাইনআপ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">ইমেইল</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black/50 border-red-500/30 text-white placeholder:text-gray-400"
                    placeholder="আপনার ইমেইল"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">পাসওয়ার্ড</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black/50 border-red-500/30 text-white placeholder:text-gray-400"
                    placeholder="পাসওয়ার্ড"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700">
                  {loading ? 'লগইন করা হচ্ছে...' : 'লগইন করুন'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-white">নাম</Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-black/50 border-red-500/30 text-white placeholder:text-gray-400"
                    placeholder="আপনার নাম"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-white">ইমেইল</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black/50 border-red-500/30 text-white placeholder:text-gray-400"
                    placeholder="আপনার ইমেইল"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-white">পাসওয়ার্ড</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black/50 border-red-500/30 text-white placeholder:text-gray-400"
                    placeholder="পাসওয়ার্ড (৬+ অক্ষর)"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700">
                  {loading ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'অ্যাকাউন্ট তৈরি করুন'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-red-500/30" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black px-2 text-gray-400">অথবা</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full mt-4 bg-black/50 border-red-500/30 text-white hover:bg-red-900/20"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google দিয়ে লগইন
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              ফ্রি প্ল্যান: ৫টি টোকেন • প্রো: ১০০/মাস • প্রিমিয়াম: আনলিমিটেড
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
