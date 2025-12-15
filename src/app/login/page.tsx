"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StaticOrangeCompass } from "@/components/StaticOrangeCompass";
import { AvatarSelection } from "@/components/AvatarSelection";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('https://api.dicebear.com/9.x/micah/svg?seed=Felix&hair=fonze&backgroundColor=f0fdf4&baseColor=f97316');
  
  // Validation State
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Debounce username check
  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      
      setCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .single();

        if (error && error.code === 'PGRST116') {
          // No rows found, username is available
          setUsernameAvailable(true);
        } else if (data) {
          // Row found, username is taken
          setUsernameAvailable(false);
        }
      } catch (err) {
        console.error('Error checking username:', err);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (!isLogin && username) {
        checkUsername();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, isLogin]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage('Password reset link sent to your email.');
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/feed');
      } else {
        // Registration
        if (usernameAvailable === false) {
          throw new Error("Username is already taken.");
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              username: username,
              gender: gender,
              dob: dob,
              avatar_url: selectedAvatar // Storing the ID of the preset
            },
          },
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans bg-juice-green text-juice-cream">
      
      {/* Left Panel - Visuals */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-12 relative overflow-hidden border-b md:border-b-0 md:border-r border-juice-cream/10 bg-black/5">
        
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
           <div className="absolute top-10 left-10 w-96 h-96 rounded-full border border-juice-cream" />
           <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full border border-juice-cream" />
        </div>

        <div className={`relative z-10 flex flex-col items-center text-center space-y-8 transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <Link href="/" className="group">
            <StaticOrangeCompass className="w-32 h-32 md:w-48 md:h-48 drop-shadow-2xl transition-transform duration-500 hover:scale-105" />
          </Link>
          
          <div className="space-y-4 max-w-md">
            <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight">
              {isLogin ? 'Welcome Back' : 'Join the Crew'}
            </h1>
            <p className="text-lg md:text-xl font-medium opacity-70 leading-relaxed">
              {isLogin 
                ? 'The compass is set. Your stories are waiting.' 
                : 'Chart a new course through the noise of the web.'}
            </p>
          </div>
        </div>

        {/* Mobile Back Button */}
        <Link href="/" className="absolute top-6 left-6 md:hidden text-xs font-bold uppercase tracking-widest border-b border-juice-cream/30 pb-1 opacity-60">
          ← Back
        </Link>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 relative">
        
        {/* Desktop Back Button */}
        <Link href="/" className="hidden md:block absolute top-10 right-10 text-xs font-bold uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity hover:text-juice-orange">
          ← Return Home
        </Link>

        <div className={`w-full max-w-sm transition-all duration-1000 delay-150 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          
          {/* Form Header */}
          <div className="text-center md:text-left mb-8">
            <h2 className="font-serif text-3xl md:text-4xl font-bold">
              {isForgotPassword ? 'Reset Password' : (isLogin ? 'Sign In' : 'Register')}
            </h2>
            <p className="opacity-60 text-sm font-medium uppercase tracking-widest mt-2">
              {isForgotPassword ? 'Recover your access' : (isLogin ? 'Enter your coordinates' : 'Begin your odyssey')}
            </p>
          </div>

          {/* Form Fields */}
          <form className="space-y-4" onSubmit={handleAuth}>
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-sm text-red-200 text-center">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 bg-green-500/20 border border-green-500/50 rounded text-sm text-green-200 text-center">
                {message}
              </div>
            )}

            {!isLogin && !isForgotPassword && (
              <>
                {/* Avatar Selection */}
                <div className="flex justify-center pb-2">
                  <AvatarSelection selectedAvatar={selectedAvatar} onSelect={setSelectedAvatar} />
                </div>

                {/* Name Fields - Compact Row */}
                <div className="flex gap-3">
                  <div className="space-y-1 group w-1/2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-juice-cream/60 ml-1">First Name</label>
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-juice-cream/5 border-b border-juice-cream/30 px-3 py-2 text-base text-juice-cream placeholder:text-juice-cream/40 focus:outline-none focus:border-juice-orange transition-all rounded-t-sm"
                      placeholder="Odysseus"
                      required
                    />
                  </div>
                  <div className="space-y-1 group w-1/2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-juice-cream/60 ml-1">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-juice-cream/5 border-b border-juice-cream/30 px-3 py-2 text-base text-juice-cream placeholder:text-juice-cream/40 focus:outline-none focus:border-juice-orange transition-all rounded-t-sm"
                      placeholder="Explorer"
                      required
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1 group relative">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-juice-cream/60 ml-1">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full bg-juice-cream/5 border-b px-3 py-2 text-base text-juice-cream placeholder:text-juice-cream/40 focus:outline-none transition-all rounded-t-sm ${
                      usernameAvailable === false ? 'border-red-500' : (usernameAvailable === true ? 'border-green-500' : 'border-juice-cream/30 focus:border-juice-orange')
                    }`}
                    placeholder="odysseus_1"
                    required
                  />
                  {checkingUsername && (
                    <span className="absolute right-2 top-8 text-xs text-juice-cream/50">Checking...</span>
                  )}
                  {usernameAvailable === false && !checkingUsername && (
                    <span className="absolute right-2 top-8 text-xs text-red-400">Taken</span>
                  )}
                </div>

                {/* Gender & DOB - Compact Row */}
                <div className="flex gap-3">
                  <div className="space-y-1 group w-1/2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-juice-cream/60 ml-1">Gender</label>
                    <select 
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-juice-cream/5 border-b border-juice-cream/30 px-3 py-2 text-base text-juice-cream focus:outline-none focus:border-juice-orange transition-all rounded-t-sm appearance-none"
                      required
                    >
                      <option value="" className="bg-juice-green text-juice-cream">Select</option>
                      <option value="male" className="bg-juice-green text-juice-cream">Male</option>
                      <option value="female" className="bg-juice-green text-juice-cream">Female</option>
                      <option value="other" className="bg-juice-green text-juice-cream">Other</option>
                      <option value="prefer_not_to_say" className="bg-juice-green text-juice-cream">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="space-y-1 group w-1/2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-juice-cream/60 ml-1">Date of Birth</label>
                    <input 
                      type="date" 
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-juice-cream/5 border-b border-juice-cream/30 px-3 py-2 text-base text-juice-cream placeholder:text-juice-cream/40 focus:outline-none focus:border-juice-orange transition-all rounded-t-sm"
                      required
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="space-y-1 group">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-juice-cream/60 ml-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-juice-cream/5 border-b border-juice-cream/30 px-3 py-2 text-base text-juice-cream placeholder:text-juice-cream/40 focus:outline-none focus:border-juice-orange transition-all rounded-t-sm"
                placeholder="hello@odysseus.com"
                required
              />
            </div>

            {!isForgotPassword && (
              <div className="space-y-1 group">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-juice-cream/60 ml-1">Password</label>
                  {isLogin && (
                    <button 
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-[10px] font-bold uppercase tracking-widest text-juice-cream/40 hover:text-juice-orange transition-colors"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-juice-cream/5 border-b border-juice-cream/30 px-3 py-2 text-base text-juice-cream placeholder:text-juice-cream/40 focus:outline-none focus:border-juice-orange transition-all rounded-t-sm"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            )}

            <button 
              disabled={loading || (!isLogin && !isForgotPassword && usernameAvailable === false)}
              className="w-full bg-juice-orange text-juice-cream font-bold text-sm py-3 rounded-full uppercase tracking-[0.2em] hover:bg-white hover:text-juice-green transition-all shadow-2xl hover:shadow-juice-orange/50 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isForgotPassword ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Create Account'))}
            </button>
          </form>

          {/* Toggle */}
          <div className="text-center pt-4">
            <button 
              onClick={toggleMode}
              className="text-xs font-bold uppercase tracking-widest text-juice-cream/60 hover:text-juice-orange transition-colors"
            >
              {isLogin ? "New here? Create an account" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
