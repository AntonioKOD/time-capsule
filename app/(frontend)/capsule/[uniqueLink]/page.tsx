'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CapsuleData } from '@/types/capsule';
import Link from 'next/link';
import { Globe } from 'lucide-react';

interface CapsulePageProps {
  params: {
    uniqueLink: string;
  };
}

export default function CapsulePage() {
  const params = useParams();
  const uniqueLink = params.uniqueLink as string;
  
  const [capsule, setCapsule] = useState<CapsuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpened, setIsOpened] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showPublicOption, setShowPublicOption] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (uniqueLink) {
      fetchCapsule();
    }
  }, [uniqueLink]);

  const fetchCapsule = async () => {
    try {
      const response = await fetch(`/api/capsules/${uniqueLink}`);
      const data = await response.json();
      
      if (data.success) {
        setCapsule(data.capsule);
        if (data.capsule.password) {
          setShowPasswordForm(true);
        }
      } else {
        setError(data.error || 'Capsule not found');
      }
    } catch (err) {
      setError('Failed to load capsule');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    try {
      const response = await fetch(`/api/capsules/${uniqueLink}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowPasswordForm(false);
        setIsOpened(true);
      } else {
        setPasswordError('Incorrect password');
      }
    } catch (err) {
      setPasswordError('Failed to verify password');
    }
  };

  const handleOpenCapsule = () => {
    if (!capsule?.password) {
      setIsOpened(true);
    }
  };

  const handleMakePublic = async () => {
    if (!capsule || isSharing) return;
    
    setIsSharing(true);
    try {
      const response = await fetch(`/api/capsules/${uniqueLink}/make-public`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local capsule state
        setCapsule(prev => prev ? { ...prev, isPublic: true } : null);
        setShowPublicOption(false);
        
        // Show success message
        alert('🎉 Your memory has been shared anonymously in the public gallery!');
      } else {
        alert('Failed to share your memory. Please try again.');
      }
    } catch (error) {
      console.error('Error making capsule public:', error);
      alert('Failed to share your memory. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="brutalist-card brutalist-card-white p-12 text-center">
          <div className="mb-8">
                          <div className="w-24 h-24 mx-auto border-4 border-black relative">
                <div className="absolute inset-2 bg-blue animate-brutalist-bounce"></div>
              </div>
          </div>
          <h2 className="text-2xl font-black text-black font-retro uppercase mb-4">
            Loading Time Capsule
          </h2>
          <p className="text-black font-bold">Please wait while we retrieve your memory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray flex items-center justify-center p-4">
        <div className="brutalist-card brutalist-card-black p-12 text-center max-w-md">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-2xl font-black text-white mb-4 font-retro uppercase">
            Capsule Not Found
          </h1>
          <p className="text-white font-bold mb-8">{error}</p>
          <button className="brutalist-button brutalist-button-primary">
            <Link href="/" className="no-underline text-inherit">
              Create New Capsule
            </Link>
          </button>
        </div>
      </div>
    );
  }

  if (!capsule) return null;

  // Check if capsule is not ready to be opened yet
  if (capsule.isReady === false) {
    const timeUntilReady = new Date(capsule.deliveryDate).getTime() - new Date().getTime();
    const daysUntilReady = Math.ceil(timeUntilReady / (1000 * 60 * 60 * 24));
    const hoursUntilReady = Math.ceil(timeUntilReady / (1000 * 60 * 60));
    const minutesUntilReady = Math.ceil(timeUntilReady / (1000 * 60));

    let timeDisplay = '';
    if (daysUntilReady > 1) {
      timeDisplay = `${daysUntilReady} days`;
    } else if (hoursUntilReady > 1) {
      timeDisplay = `${hoursUntilReady} hours`;
    } else if (minutesUntilReady > 1) {
      timeDisplay = `${minutesUntilReady} minutes`;
    } else {
      timeDisplay = 'very soon';
    }

    return (
      <div className="min-h-screen bg-gray flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          {/* Brutalist Hourglass */}
          <div className="relative mb-12">
            <div className="w-32 h-40 mx-auto relative">
              {/* Hourglass Body */}
              <div className="relative z-10">
                {/* Top Chamber */}
                <div className="w-32 h-16 bg-blue border-4 border-black relative overflow-hidden">
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white animate-brutalist-bounce"></div>
                  {/* Sand particles */}
                  <div className="absolute top-2 left-8 w-1 h-1 bg-white animate-brutalist-float"></div>
                  <div className="absolute top-4 right-8 w-1 h-1 bg-white animate-brutalist-float" style={{animationDelay: '0.5s'}}></div>
                  <div className="absolute top-6 left-12 w-1 h-1 bg-white animate-brutalist-float" style={{animationDelay: '1s'}}></div>
                </div>
                
                {/* Neck */}
                <div className="w-4 h-8 bg-black mx-auto relative">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-white animate-pulse"></div>
                </div>
                
                {/* Bottom Chamber */}
                <div className="w-32 h-16 bg-black border-4 border-black relative">
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-blue"></div>
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-2 bg-blue"></div>
                </div>
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl font-black text-black mb-6 font-retro uppercase">
            ⏳ Time Capsule Sealed ⏳
          </h1>
          <p className="text-2xl text-blue mb-4 font-bold">
            This time capsule is still locked in time
          </p>
          <p className="text-xl text-black mb-3 font-bold">
            Sealed on {formatDate(capsule.createdAt)}
          </p>
          <p className="text-lg text-gray mb-8 font-bold">
            Will unlock on {formatDate(capsule.deliveryDate)}
          </p>
          
          {/* Countdown Display */}
          <div className="brutalist-card brutalist-card-white p-8 mb-8">
            <h2 className="text-2xl font-black text-black mb-4 font-retro uppercase">Time Remaining</h2>
            <div className="text-4xl font-black text-blue mb-2 font-retro">{timeDisplay}</div>
            <p className="text-black font-bold">until your time capsule unlocks</p>
          </div>
          
          {/* Capsule Info */}
          <div className="brutalist-card brutalist-card-gray p-6 mb-8">
            <div className="flex justify-center gap-8 text-center flex-wrap">
              <div>
                <div className="text-xs text-black uppercase tracking-wider mb-2 font-bold">Type</div>
                <div className="text-black font-black">
                  {capsule.contentType === 'text' && '📝 Text Message'}
                  {capsule.contentType === 'photo' && '📸 Photo Memory'}
                  {capsule.contentType === 'voice' && '🎵 Voice Message'}
                  {capsule.contentType === 'video' && '🎬 Video Memory'}
                </div>
              </div>
              <div>
                <div className="text-xs text-black uppercase tracking-wider mb-2 font-bold">Recipients</div>
                <div className="text-black font-black">{capsule.recipients.length}</div>
              </div>
              <div>
                <div className="text-xs text-black uppercase tracking-wider mb-2 font-bold">Status</div>
                <div className="text-blue font-black">{capsule.isPaid ? 'Premium' : 'Free'}</div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-4 flex-wrap">
            <button className="brutalist-button brutalist-button-primary">
              <Link href="/" className="no-underline text-inherit">
                Create Another Time Capsule
              </Link>
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="brutalist-button brutalist-button-secondary"
            >
              Check Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showPasswordForm) {
    return (
      <div className="min-h-screen bg-gray flex items-center justify-center p-4">
        <div className="brutalist-card brutalist-card-orange p-12 text-center max-w-md">
          <div className="text-6xl mb-6">🔐</div>
          <h1 className="text-3xl font-black text-white mb-2 font-retro uppercase">
            Protected Time Capsule
          </h1>
          <p className="text-white font-bold mb-8">This time capsule is password protected</p>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="brutalist-input flex-1"
                required
              />
              <button type="submit" className="brutalist-button brutalist-button-black">
                Unlock
              </button>
            </div>
            {passwordError && (
              <p className="text-white font-bold bg-black p-2 border-2 border-white">{passwordError}</p>
            )}
          </form>
        </div>
      </div>
    );
  }

  if (!isOpened) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <div className="relative mb-12">
            <div className="w-32 h-40 mx-auto relative">
              {/* Capsule Glow */}
              <div className="absolute inset-0 bg-blue opacity-20 blur-xl animate-pulse"></div>
              
              {/* Capsule Body */}
              <div className="relative z-10">
                {/* Capsule Lid */}
                <div className="w-32 h-16 bg-blue border-4 border-black relative flex items-center justify-center">
                  <div className="w-6 h-6 bg-white border-2 border-black animate-brutalist-bounce"></div>
                </div>
                
                {/* Capsule Base */}
                <div className="w-32 h-24 bg-black border-4 border-black relative flex items-center justify-center">
                  <div className="space-y-2">
                    <div className="w-20 h-1 bg-white"></div>
                    <div className="w-16 h-1 bg-white"></div>
                    <div className="w-20 h-1 bg-white"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="brutalist-card brutalist-card-white p-8 mb-8">
            <h1 className="text-4xl font-black text-black mb-4 font-retro uppercase">
              ✨ Your Time Capsule Awaits ✨
            </h1>
            <p className="text-xl text-black mb-2 font-bold">
              Sealed on {formatDate(capsule.createdAt)}
            </p>
            <p className="text-lg text-gray mb-8 font-bold">
              Ready to be opened on {formatDate(capsule.deliveryDate)}
            </p>
            
            <button 
              onClick={handleOpenCapsule}
              className="brutalist-button brutalist-button-primary text-lg px-8 py-4"
            >
              Open Time Capsule
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-5xl font-black text-black mb-4 font-retro uppercase">
            🎁 Time Capsule Unlocked!
          </h1>
          <p className="text-xl text-black font-bold">
            Opened on {formatDate(new Date().toISOString())}
          </p>
        </div>

        {/* Content Card */}
        <div className="brutalist-card brutalist-card-white p-8 mb-8">
          <div className="border-b-3 border-black pb-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="brutalist-badge">
                {capsule.contentType === 'text' && '📝 Text Message'}
                {capsule.contentType === 'photo' && '📸 Photo Capsule'}
                {capsule.contentType === 'voice' && '🎵 Voice Message'}
                {capsule.contentType === 'video' && '🎬 Video Memory'}
              </div>
              <div className="text-black font-bold">
                Sealed: {formatDate(capsule.createdAt)}
              </div>
            </div>
          </div>

          <div className="min-h-48 flex items-center justify-center">
            {capsule.contentType === 'text' && capsule.textContent && (
              <div className="text-center max-w-2xl">
                <div className="text-6xl text-blue mb-4">"</div>
                <p className="text-2xl leading-relaxed text-black font-bold mb-4">
                  {capsule.textContent}
                </p>
                <div className="text-6xl text-blue">"</div>
              </div>
            )}

            {capsule.media && (
              <div className="w-full text-center">
                {capsule.contentType === 'photo' && (
                  <img 
                    src={capsule.media.url} 
                    alt="Memory photo"
                    className="max-w-full h-auto border-4 border-black shadow-brutalist max-h-96 mx-auto"
                  />
                )}
                {capsule.contentType === 'voice' && (
                  <div className="brutalist-card brutalist-card-black p-6 inline-block">
                    <audio controls className="w-full min-w-80">
                      <source src={capsule.media.url} type={capsule.media.mimeType} />
                    </audio>
                  </div>
                )}
                {capsule.contentType === 'video' && (
                  <video controls className="max-w-full h-auto border-4 border-black shadow-brutalist max-h-96">
                    <source src={capsule.media.url} type={capsule.media.mimeType} />
                  </video>
                )}
              </div>
            )}
          </div>

          <div className="border-t-3 border-black pt-6 mt-6">
            <div className="flex justify-center gap-8 text-center flex-wrap">
              <div>
                <span className="text-xs text-black uppercase tracking-wider font-bold block mb-1">Type</span>
                <span className="text-black font-black">{capsule.isPaid ? 'Premium' : 'Free'}</span>
              </div>
              <div>
                <span className="text-xs text-black uppercase tracking-wider font-bold block mb-1">Recipients</span>
                <span className="text-black font-black">{capsule.recipients.length}</span>
              </div>
              {capsule.isPublic && (
                <div>
                  <span className="text-xs text-black uppercase tracking-wider font-bold block mb-1">Visibility</span>
                  <span className="text-blue font-black">Public</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Make Public Option */}
        {capsule.contentType === 'text' && !capsule.isPublic && showPublicOption && (
          <div className="brutalist-card brutalist-card-blue p-6 mb-8 text-center">
            <h3 className="text-xl font-black text-white mb-4 font-retro uppercase">
              Share Your Memory with the World
            </h3>
            <p className="text-white font-bold mb-6">
              Your time capsule has been opened! Would you like to share this memory anonymously 
              in our public gallery? Others might find inspiration in your words.
            </p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={handleMakePublic}
                className="brutalist-button brutalist-button-black"
              >
                <Globe className="h-4 w-4 mr-2" />
                Share Anonymously
              </button>
              <button 
                onClick={() => setShowPublicOption(false)}
                className="brutalist-button brutalist-button-secondary"
              >
                Keep Private
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 flex-wrap">
          <button className="brutalist-button brutalist-button-primary">
            <Link href="/" className="no-underline text-inherit">
              Create New Capsule
            </Link>
          </button>
          <button 
            onClick={() => window.print()} 
            className="brutalist-button brutalist-button-secondary"
          >
            Save Time Capsule
          </button>
          <button className="brutalist-button brutalist-button-secondary">
            <Link href="/gallery" className="no-underline text-inherit">
              <Globe className="h-4 w-4 mr-2" />
              Explore Gallery
            </Link>
          </button>
        </div>
      </div>
    </div>
  );
} 