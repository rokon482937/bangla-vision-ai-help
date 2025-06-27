import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Mic, ScreenShare, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const Dashboard = () => {
  const { user, userData, logout, updateTokens } = useAuth();
  const navigate = useNavigate();
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('স্ক্রিন শেয়ার করে শুরু করুন');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<Recognition | null>(null);

  // Free users have unlimited usage, paid users have token limits
  const canUseTokens = userData && (userData.subscription === 'free' || userData.tokens - userData.usedTokens > 0 || userData.subscription === 'premium');

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case 'pro': return 'bg-blue-500';
      case 'premium': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getTokenDisplay = () => {
    if (!userData) return '0';
    if (userData.subscription === 'premium') return '∞';
    if (userData.subscription === 'free') return '∞'; // Free users have unlimited usage
    return `${userData.tokens - userData.usedTokens}`;
  };

  const startScreenShare = async () => {
    if (!canUseTokens) {
      toast({ 
        title: "সেবা অনুপলব্ধ!", 
        description: "দয়া করে সাবস্ক্রিপশন আপগ্রেড করুন",
        variant: "destructive" 
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true,
        audio: true 
      });
      
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsScreenSharing(true);
      setCurrentStatus('✅ স্ক্রিন শেয়ার চালু - এখন কথা বলুন');

      // Update tokens for paid users only
      if (userData?.subscription !== 'free' && userData?.subscription !== 'premium') {
        await updateTokens(1);
        toast({ 
          title: "টোকেন ব্যবহৃত!", 
          description: `১টি টোকেন ব্যবহার হয়েছে। বাকি: ${(userData?.tokens || 0) - (userData?.usedTokens || 0) - 1}`,
        });
      }

      // Start voice recognition
      startVoiceRecognition();

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      toast({ title: "স্ক্রিন শেয়ার শুরু!", description: "এখন বাংলায় আপনার সমস্যা বলুন" });
    } catch (error) {
      console.error('Screen share error:', error);
      toast({ 
        title: "স্ক্রিন শেয়ার ব্যর্থ", 
        description: "আবার চেষ্টা করুন",
        variant: "destructive" 
      });
    }
  };

  const stopScreenShare = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setIsScreenSharing(false);
    setIsListening(false);
    setCurrentStatus('স্ক্রিন শেয়ার বন্ধ হয়েছে');
    
    toast({ title: "স্ক্রিন শেয়ার বন্ধ" });
  };

  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'bn-BD';

      recognition.onstart = () => {
        setIsListening(true);
        setCurrentStatus('🎤 শুনছি... আপনার সমস্যা বলুন');
      };

      recognition.onresult = async (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setCurrentStatus(`আপনি বললেন: ${transcript}`);

        // Call AI API (placeholder - users need to implement their backend)
        try {
          const response = await fetch('/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: transcript }),
          });

          if (response.ok) {
            const data = await response.json();
            const reply = data.reply;
            
            setCurrentStatus(`AI সমাধান: ${reply}`);

            // Bengali text-to-speech
            const utterance = new SpeechSynthesisUtterance(reply);
            utterance.lang = 'bn-BD';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
          } else {
            setCurrentStatus('AI সার্ভিস অনুপলব্ধ - ব্যাকএন্ড সেটআপ করুন');
          }
        } catch (error) {
          setCurrentStatus('AI সার্ভিস সংযোগ ব্যর্থ');
          console.error('AI API Error:', error);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setCurrentStatus('ভয়েস রিকগনিশন সমস্যা');
      };

      recognition.onend = () => {
        if (isScreenSharing) {
          setTimeout(() => recognition.start(), 1000);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      toast({ 
        title: "ভয়েস সাপোর্ট নেই", 
        description: "আধুনিক ব্রাউজার ব্যবহার করুন",
        variant: "destructive" 
      });
    }
  };

  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [mediaStream]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-red-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            <span className="text-red-500">Killer</span> Assistant
          </h1>
          <p className="text-gray-300 mt-1">আপনার AI স্ক্রিন সহায়ক</p>
        </div>

        <div className="flex items-center gap-4">
          <Card className="bg-black/40 border-red-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white">👤 {userData?.displayName}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <Badge className={`${getSubscriptionColor(userData?.subscription || 'free')} text-white`}>
                  {userData?.subscription?.toUpperCase()}
                </Badge>
                <span className="text-white text-sm">
                  🔢 {getTokenDisplay()} টোকেন
                </span>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => navigate('/subscription')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            সাবস্ক্রিপশন
          </Button>

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
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] p-6">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Share Your Screen And <span className="text-red-500">Solve</span> Anything
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            আপনার স্ক্রিন শেয়ার করুন এবং বাংলায় কথা বলুন। AI আপনার সমস্যার সমাধান দেবে।
          </p>
        </div>

        {/* Video Display */}
        {isScreenSharing && (
          <Card className="mb-8 bg-black/40 border-red-500/30 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="relative">
                <Badge className="absolute top-2 right-2 bg-red-600 text-white z-10">
                  🔴 LIVE
                </Badge>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full max-w-4xl rounded-lg border-2 border-red-500/50"
                  style={{ aspectRatio: '16/9' }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Control Button */}
        <Button
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          disabled={!canUseTokens}
          className={`text-xl px-8 py-6 mb-8 ${
            isScreenSharing 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          } ${!canUseTokens ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ScreenShare className="w-6 h-6 mr-3" />
          {isScreenSharing ? 'স্ক্রিন শেয়ার বন্ধ করুন' : 'স্ক্রিন শেয়ার শুরু করুন'}
        </Button>

        {/* Status Indicators */}
        <div className="flex gap-8 mb-8">
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
              isScreenSharing ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
            }`}>
              <ScreenShare className="w-6 h-6" />
            </div>
            <span className="text-sm text-gray-300">Screen Share</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
              isListening 
                ? 'bg-blue-500/20 text-blue-400 animate-pulse' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              <Mic className="w-6 h-6" />
            </div>
            <span className="text-sm text-gray-300">Voice Assistant</span>
          </div>
        </div>

        {/* Status Display */}
        <Card className="max-w-2xl bg-black/40 border-red-500/30 backdrop-blur-xl">
          <CardContent className="p-6">
            <p className="text-white text-center text-lg">{currentStatus}</p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center p-6 text-gray-400">
        <p>Powered by Killer Assistant AI • Bengali Voice Recognition • Real-time Screen Analysis</p>
      </div>
    </div>
  );
};