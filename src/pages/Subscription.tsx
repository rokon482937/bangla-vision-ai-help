import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Check, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Subscription = () => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '৳০',
      period: 'চিরকাল',
      tokens: '৫ টোকেন',
      features: [
        'বেসিক স্ক্রিন শেয়ার',
        'বাংলা ভয়েস রিকগনিশন',
        'লিমিটেড AI সাপোর্ট',
        '৫টি টোকেন'
      ],
      buttonText: 'বর্তমান প্ল্যান',
      popular: false,
      disabled: userData?.subscription === 'free'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '৳৪৯৯',
      period: 'মাসিক',
      tokens: '১০০ টোকেন/মাস',
      features: [
        'আনলিমিটেড স্ক্রিন শেয়ার',
        'অ্যাডভান্সড AI সাপোর্ট',
        'প্রাইওরিটি কাস্টমার সাপোর্ট',
        '১০০টি টোকেন প্রতি মাসে',
        'ফাস্ট রেসপন্স টাইম'
      ],
      buttonText: 'আপগ্রেড করুন',
      popular: true,
      disabled: userData?.subscription === 'pro'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '৳৯৯৯',
      period: 'মাসিক',
      tokens: 'আনলিমিটেড',
      features: [
        'আনলিমিটেড সব কিছু',
        'AI এক্সপার্ট সাপোর্ট',
        '২৪/৭ কাস্টমার সাপোর্ট',
        'আনলিমিটেড টোকেন',
        'এক্সক্লুসিভ ফিচার অ্যাক্সেস',
        'কাস্টম AI মডেল'
      ],
      buttonText: 'আপগ্রেড করুন',
      popular: false,
      disabled: userData?.subscription === 'premium'
    }
  ];

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    
    // Simulate payment processing
    setTimeout(() => {
      toast({
        title: "পেমেন্ট সিস্টেম",
        description: "পেমেন্ট গেটওয়ে শীঘ্রই যুক্ত হবে!",
      });
      setLoading(null);
    }, 2000);
  };

  const getCurrentPlanColor = (subscription: string) => {
    switch (subscription) {
      case 'pro': return 'bg-blue-500';
      case 'premium': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="bg-black/40 border-red-500/30 text-white hover:bg-red-900/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            ব্যাক
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              <span className="text-red-500">Killer</span> Assistant
            </h1>
            <p className="text-gray-300 mt-1">সাবস্ক্রিপশন প্ল্যান</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Card className="bg-black/40 border-red-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge className={`${getCurrentPlanColor(userData?.subscription || 'free')} text-white`}>
                  {userData?.subscription?.toUpperCase()}
                </Badge>
                <span className="text-white text-sm">
                  🔢 {userData?.subscription === 'premium' ? '∞' : `${(userData?.tokens || 0) - (userData?.usedTokens || 0)}`} টোকেন
                </span>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={logout} 
            variant="outline" 
            className="bg-black/40 border-red-500/30 text-white hover:bg-red-900/20"
          >
            লগআউট
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Choose Your <span className="text-red-500">Plan</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            আপনার প্রয়োজন অনুযায়ী প্ল্যান বেছে নিন এবং AI এর সম্পূর্ণ শক্তি উপভোগ করুন
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative bg-black/40 border-red-500/30 backdrop-blur-xl ${
                plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1 flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    জনপ্রিয়
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-300 ml-2">/{plan.period}</span>
                </div>
                <CardDescription className="text-lg text-blue-400 font-semibold">
                  {plan.tokens}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={plan.disabled || loading === plan.id}
                  className={`w-full py-6 text-lg ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : plan.id === 'premium'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  } ${plan.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading === plan.id ? 'প্রসেসিং...' : plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-black/40 border-red-500/30 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">💡 টোকেন সিস্টেম</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
                <div>
                  <h4 className="font-semibold text-white mb-2">টোকেন কিভাবে কাজ করে?</h4>
                  <ul className="text-sm space-y-1">
                    <li>• প্রতি স্ক্রিন শেয়ার = ১ টোকেন</li>
                    <li>• প্রথম লগইনে ১০ বোনাস টোকেন</li>
                    <li>• প্রিমিয়াম প্ল্যানে আনলিমিটেড</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">বিশেষ সুবিধা</h4>
                  <ul className="text-sm space-y-1">
                    <li>• বাংলা ভয়েস রিকগনিশন</li>
                    <li>• রিয়েল-টাইম AI সাপোর্ট</li>
                    <li>• সিকিউর স্ক্রিন শেয়ারিং</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Subscription;