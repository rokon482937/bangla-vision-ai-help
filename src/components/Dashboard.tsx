
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Mic, ScreenShare, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user, userData, logout, updateTokens } = useAuth();
  const navigate = useNavigate();
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('স্ক্রিন শেয়ার করুন এবং বাংলায় কথা বলুন');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

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
    if (!userData) return '∞';
    if (userData.subscription === 'premium') return '∞';
    if (userData.subscription === 'free') return '∞';
    return `${Math.max(0, userData.tokens - userData.usedTokens)}`;
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
      console.log('🎬 Starting screen share...');
      setCurrentStatus('🎬 স্ক্রিন শেয়ার শুরু করছি...');
      
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true 
      });
      
      console.log('✅ Screen share stream obtained:', stream);
      setMediaStream(stream);
      setIsVideoReady(false);
      
      // Properly set up video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for metadata to load before playing
        videoRef.current.onloadedmetadata = async () => {
          console.log('✅ Video metadata loaded');
          setCurrentStatus('📹 ভিডিও লোড হচ্ছে...');
          try {
            if (videoRef.current) {
              await videoRef.current.play();
              setIsVideoReady(true);
              console.log('✅ Video started playing');
              setCurrentStatus('✅ স্ক্রিন শেয়ার চালু - এখন কথা বলুন');
              
              // Start continuous voice recording
              startContinuousRecording();
            }
          } catch (playError) {
            console.error('❌ Error playing video:', playError);
            setCurrentStatus('❌ ভিডিও প্লে সমস্যা');
            toast({ 
              title: "ভিডিও প্লে সমস্যা", 
              description: "ভিডিও শুরু করতে সমস্যা হয়েছে",
              variant: "destructive" 
            });
          }
        };

        // Handle video errors
        videoRef.current.onerror = (error) => {
          console.error('❌ Video element error:', error);
          setIsVideoReady(false);
          setCurrentStatus('❌ ভিডিও এরর');
        };
      }

      setIsScreenSharing(true);

      // Update tokens for paid users only
      if (userData?.subscription !== 'free' && userData?.subscription !== 'premium') {
        await updateTokens(1);
        toast({ 
          title: "টোকেন ব্যবহৃত!", 
          description: `১টি টোকেন ব্যবহার হয়েছে। বাকি: ${Math.max(0, (userData?.tokens || 0) - (userData?.usedTokens || 0) - 1)}`,
        });
      }

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        console.log('🛑 Screen share ended by user');
        stopScreenShare();
      };

      toast({ title: "স্ক্রিন শেয়ার শুরু!", description: "এখন বাংলায় আপনার সমস্যা বলুন" });
    } catch (error) {
      console.error('❌ Screen share error:', error);
      let errorMessage = 'স্ক্রিন শেয়ার ব্যর্থ - আবার চেষ্টা করুন';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'স্ক্রিন শেয়ার অনুমতি দিন';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'কোন স্ক্রিন পাওয়া যায়নি';
        }
      }
      
      setCurrentStatus(`❌ ${errorMessage}`);
      toast({ 
        title: "স্ক্রিন শেয়ার ব্যর্থ", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  };

  const stopScreenShare = () => {
    console.log('🛑 Stopping screen share...');
    
    // Clear recording interval
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.kind);
      });
      setMediaStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      setIsVideoReady(false);
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      console.log('🛑 Stopped media recorder');
    }

    setIsScreenSharing(false);
    setIsListening(false);
    setCurrentStatus('স্ক্রিন শেয়ার বন্ধ হয়েছে');
    setMediaRecorder(null);
    
    toast({ title: "স্ক্রিন শেয়ার বন্ধ" });
  };

  const startContinuousRecording = () => {
    console.log('🎤 Starting continuous recording every 5 seconds...');
    
    // Start first recording immediately
    startSingleRecording();
    
    // Set up interval for continuous recording
    const interval = setInterval(() => {
      if (isScreenSharing) {
        startSingleRecording();
      }
    }, 5000);
    
    setRecordingInterval(interval);
  };

  const startSingleRecording = async () => {
    try {
      console.log('🎤 Starting single voice recording...');
      setCurrentStatus('🎤 শুনছি... আপনার সমস্যা বলুন');
      
      // Request microphone permission explicitly
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('✅ Audio stream obtained');
      
      // Check if MediaRecorder supports the desired format
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/wav';
      
      console.log('🎵 Using MIME type:', mimeType);
      
      const recorder = new MediaRecorder(audioStream, { mimeType });
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        console.log('📊 Audio data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        console.log('🛑 Single recorder stopped, processing audio...');
        
        // Stop the audio stream
        audioStream.getTracks().forEach(track => track.stop());
        
        if (chunks.length > 0) {
          const audioBlob = new Blob(chunks, { type: mimeType });
          console.log('📦 Audio blob created:', audioBlob.size, 'bytes');
          
          if (audioBlob.size > 1000) { // Only process if there's substantial audio
            await processAudioWithWhisper(audioBlob);
          } else {
            console.log('📦 Audio too small, skipping...');
            setCurrentStatus('🎤 কোন কথা শোনা যায়নি - আবার বলুন');
          }
        } else {
          console.log('📦 No audio chunks to process');
          setCurrentStatus('🎤 কোন অডিও পাওয়া যায়নি');
        }
      };

      recorder.onstart = () => {
        console.log('✅ Single recorder started');
        setIsListening(true);
      };

      recorder.onerror = (event) => {
        console.error('❌ Single recorder error:', event);
        setCurrentStatus('❌ অডিও রেকর্ডিং সমস্যা');
        audioStream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      
      // Record for 4 seconds (leaving 1 second gap for processing)
      setTimeout(() => {
        if (recorder.state === 'recording') {
          console.log('⏰ Stopping recorder after 4 seconds');
          recorder.stop();
          setIsListening(false);
        }
      }, 4000);

    } catch (error) {
      console.error('❌ Audio recording error:', error);
      
      let errorMessage = 'মাইক্রোফোন অনুমতি দিন এবং আবার চেষ্টা করুন';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'মাইক্রোফোন অনুমতি দিন';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'মাইক্রোফোন পাওয়া যায়নি';
        }
      }
      
      toast({ 
        title: "অডিও রেকর্ডিং ব্যর্থ", 
        description: errorMessage,
        variant: "destructive" 
      });
      setCurrentStatus(`❌ ${errorMessage}`);
    }
  };

  const processAudioWithWhisper = async (audioBlob: Blob) => {
    try {
      console.log('🤖 Processing audio with Whisper...');
      setCurrentStatus('🤖 AI শুনছে... অপেক্ষা করুন');

      // Convert audio to the format expected by Whisper
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('userId', user?.uid || '');

      console.log('📤 Sending request to /api/transcribe');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      console.log('📥 Transcribe response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        const transcript = data.transcript;
        console.log('✅ Transcript received:', transcript);
        
        if (transcript && transcript.trim()) {
          setCurrentStatus(`📝 আপনি বললেন: "${transcript}"`);
          
          // Call AI for response
          await getAIResponse(transcript);
        } else {
          console.log('📝 Empty transcript received');
          setCurrentStatus('🎤 কোন কথা শোনা যায়নি - আবার বলুন');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Transcribe error:', response.status, errorText);
        
        if (response.status === 404) {
          setCurrentStatus('❌ ব্যাকএন্ড সার্ভার চালু নেই - localhost:3000 এ সার্ভার চালান');
        } else if (response.status === 429) {
          setCurrentStatus('❌ টোকেন শেষ - সাবস্ক্রিপশন আপগ্রেড করুন');
        } else {
          setCurrentStatus(`❌ ভয়েস প্রসেসিং সমস্যা (${response.status})`);
        }
      }
    } catch (error) {
      console.error('❌ Whisper processing error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setCurrentStatus('❌ নেটওয়ার্ক সংযোগ সমস্যা - ব্যাকএন্ড সার্ভার চেক করুন');
      } else {
        setCurrentStatus('❌ ভয়েস সার্ভিস সংযোগ ব্যর্থ');
      }
    }
  };

  const getAIResponse = async (transcript: string) => {
    try {
      console.log('🧠 Getting AI response for:', transcript);
      setCurrentStatus('🧠 AI চিন্তা করছে... অপেক্ষা করুন');

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: transcript,
          userId: user?.uid 
        }),
      });

      console.log('📥 AI response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        const reply = data.reply;
        console.log('✅ AI reply received:', reply);
        
        setCurrentStatus(`💡 AI সমাধান: "${reply}"`);

        // Bengali text-to-speech with better error handling
        try {
          console.log('🔊 Starting text-to-speech...');
          setCurrentStatus(`🔊 AI বলছে: "${reply}"`);
          
          const utterance = new SpeechSynthesisUtterance(reply);
          const isBangla = /[\u0980-\u09FF]/.test(reply);
          utterance.lang = isBangla ? 'bn-BD' : 'en-US';
          utterance.rate = 0.8;
          utterance.volume = 0.8;
          
          utterance.onstart = () => {
            console.log('✅ Text-to-speech started');
          };
          
          utterance.onend = () => {
            console.log('✅ Text-to-speech completed');
            setCurrentStatus('✅ সমাধান সম্পূর্ণ - নতুন প্রশ্ন বলুন');
          };
          
          utterance.onerror = (event) => {
            console.error('❌ Speech synthesis error:', event);
            setCurrentStatus('❌ কণ্ঠস্বর সমস্যা - টেক্সট পড়ুন');
          };
          
          speechSynthesis.speak(utterance);
        } catch (speechError) {
          console.error('❌ Text-to-speech error:', speechError);
          setCurrentStatus('❌ কণ্ঠস্বর সেবা অনুপলব্ধ');
        }

        // Update tokens for paid users
        if (userData?.subscription !== 'free' && userData?.subscription !== 'premium') {
          await updateTokens(8);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ AI response error:', response.status, errorText);
        
        if (response.status === 404) {
          setCurrentStatus('❌ ব্যাকএন্ড AI সার্ভার চালু নেই');
        } else if (response.status === 401) {
          setCurrentStatus('❌ OpenAI API Key সেটআপ করুন');
        } else if (response.status === 429) {
          setCurrentStatus('❌ টোকেন শেষ - সাবস্ক্রিপশন আপগ্রেড করুন');
        } else {
          setCurrentStatus(`❌ AI সার্ভিস সমস্যা (${response.status})`);
        }
      }
    } catch (error) {
      console.error('❌ AI API Error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setCurrentStatus('❌ AI সার্ভার সংযোগ ব্যর্থ - নেটওয়ার্ক চেক করুন');
      } else {
        setCurrentStatus('❌ AI সার্ভিস সংযোগ ব্যর্থ');
      }
    }
  };

  useEffect(() => {
    return () => {
      console.log('🧹 Dashboard cleanup...');
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, [mediaStream, mediaRecorder, recordingInterval]);

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      {/* Modern AI Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-45 from-black via-red-950/20 to-red-900/10 animate-gradient-shift"></div>
        
        {/* AI Neural network style blobs */}
        <div className="absolute -top-40 -left-60 w-[500px] h-[500px] bg-gradient-radial from-red-500/20 via-red-600/10 to-transparent rounded-full blur-3xl animate-float1"></div>
        <div className="absolute -bottom-40 -right-60 w-[400px] h-[400px] bg-gradient-radial from-red-700/20 via-red-800/10 to-transparent rounded-full blur-3xl animate-float2"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gradient-radial from-red-400/15 via-red-500/5 to-transparent rounded-full blur-3xl animate-float3"></div>

        {/* AI Particles */}
        <div className="absolute w-1 h-1 bg-red-500/80 rounded-full top-1/5 left-1/10 animate-particle-move"></div>
        <div className="absolute w-1 h-1 bg-red-500/80 rounded-full top-3/5 left-4/5 animate-particle-move delay-2000"></div>
        <div className="absolute w-1 h-1 bg-red-500/80 rounded-full top-4/5 left-3/10 animate-particle-move delay-4000"></div>
        <div className="absolute w-1 h-1 bg-red-500/80 rounded-full top-3/10 left-7/10 animate-particle-move delay-6000"></div>

        {/* Neural Network Lines */}
        <div className="absolute top-1/4 left-3/20 w-[200px] h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent rotate-45 animate-neural-pulse"></div>
        <div className="absolute top-3/5 right-1/5 w-[150px] h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent -rotate-30 animate-neural-pulse delay-1000"></div>
        <div className="absolute bottom-3/10 left-2/5 w-[100px] h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent rotate-20 animate-neural-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-6">
        <div>
          <h1 className="text-3xl font-bold text-white">
            <span className="text-red-500">Killer</span> Assistant
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Card className="bg-black/40 border-red-500/30 backdrop-blur-md">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="text-white text-sm">
                  <div className="font-medium">{userData?.displayName}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${getSubscriptionColor(userData?.subscription || 'free')} text-white text-xs`}>
                      {userData?.subscription?.toUpperCase() || 'FREE'}
                    </Badge>
                    <span className="text-xs">
                      🔢 {getTokenDisplay()} টোকেন
                    </span>
                  </div>
                </div>
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
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Share Your Screen And <span className="text-red-500">Solve</span> Anything
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            আপনার স্ক্রিন শেয়ার করুন এবং বাংলায় কথা বলুন। AI আপনার সমস্যার সমাধান দেবে।
          </p>
        </div>

        {/* Video Display */}
        {isScreenSharing && (
          <Card className="mb-8 bg-black/40 border-red-500/30 backdrop-blur-xl transition-all duration-600">
            <CardContent className="p-4">
              <div className="relative">
                <Badge className="absolute top-2 right-2 bg-red-600 text-white z-10">
                  🔴 {isVideoReady ? 'LIVE' : 'LOADING...'}
                </Badge>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-w-4xl rounded-lg border-2 border-red-500/50"
                  style={{ aspectRatio: '16/9', minHeight: '300px', backgroundColor: '#000' }}
                />
                {!isVideoReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <div className="text-white text-lg">ভিডিও লোড হচ্ছে...</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Control Button */}
        <Button
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          disabled={!canUseTokens}
          className={`text-xl px-8 py-6 mb-8 transition-all duration-300 ${
            isScreenSharing 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-red-600 hover:bg-red-700'
          } ${!canUseTokens ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ScreenShare className="w-6 h-6 mr-3" />
          {isScreenSharing ? 'Stop Sharing' : 'Share Your Screen'}
        </Button>

        {/* Status Indicators */}
        <div className="flex gap-12 mb-12">
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
              isScreenSharing ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
            }`}>
              <ScreenShare className="w-6 h-6" />
            </div>
            <span className="text-sm text-gray-300">Screen Share</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
              isListening 
                ? 'bg-blue-500/20 text-blue-400 animate-pulse' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              <Mic className="w-6 h-6" />
            </div>
            <span className="text-sm text-gray-300">Whisper AI</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="max-w-2xl mb-12">
          <p className="text-white/80 text-lg text-center leading-relaxed">
            আপনার স্ক্রিন শেয়ার করুন এবং বাংলায় কথা বলুন। Whisper AI আপনার কথা বুঝবে এবং GPT-4 সমাধান দেবে।
          </p>
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
        <p>Powered by Killer Assistant AI • OpenAI Whisper • GPT-4 • Real-time Screen Analysis</p>
      </div>
    </div>
  );
};
