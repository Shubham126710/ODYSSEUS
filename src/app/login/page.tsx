"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StaticOrangeCompass } from "@/components/StaticOrangeCompass";
import { AvatarSelection } from "@/components/AvatarSelection";
import { supabase } from "@/lib/supabaseClient";
import { Mail, Lock, User, Facebook, Twitter, Linkedin, Github } from "lucide-react";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
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
    setMounted(true);
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
          setUsernameAvailable(true);
        } else if (data) {
          setUsernameAvailable(false);
        }
      } catch (err) {
        console.error('Error checking username:', err);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (isSignUp && username) {
        checkUsername();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, isSignUp]);

  const handleSignIn = async (e: React.FormEvent) => {
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
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/feed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
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
            avatar_url: selectedAvatar
          },
        },
      });
      if (error) throw error;
      setMessage('Check your email for the confirmation link!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="auth-switch">
      <style>{`
        .auth-switch,
        .auth-switch * {
          box-sizing: border-box;
        }

        .auth-switch {
          font-family: var(--font-sans, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
          background: var(--juice-green);
          min-height: 100vh;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .container {
          position: relative;
          width: 100%;
          max-width: 1000px;
          min-height: 750px;
          background: var(--juice-cream, white);
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }

        .forms-container {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .signin-signup {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          left: 75%;
          width: 50%;
          transition: 1s 0.7s ease-in-out;
          display: grid;
          grid-template-columns: 1fr;
          z-index: 5;
        }

        form {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 3rem;
          transition: all 0.2s 0.7s;
          overflow: hidden;
          grid-column: 1 / 2;
          grid-row: 1 / 2;
        }

        form.sign-up-form {
          opacity: 0;
          z-index: 1;
        }

        form.sign-in-form {
          z-index: 2;
        }

        .title {
          font-size: 2.2rem;
          color: var(--juice-green, #444);
          margin-bottom: 10px;
          font-weight: 700;
        }

        .input-field {
          max-width: 380px;
          width: 100%;
          background-color: rgba(93, 130, 70, 0.1);
          margin: 6px 0;
          height: 50px;
          border-radius: 50px;
          display: grid;
          grid-template-columns: 15% 85%;
          padding: 0 0.4rem;
          position: relative;
          transition: 0.3s;
        }

        .input-field.flex-row-input {
          display: flex;
          gap: 10px;
          background: none;
          padding: 0;
          margin: 6px 0;
        }

        .input-field.flex-row-input > div {
          flex: 1;
          background-color: rgba(93, 130, 70, 0.1);
          border-radius: 50px;
          display: flex;
          align-items: center;
          padding: 0 1rem;
        }

        .input-field.flex-row-input input, .input-field.flex-row-input select {
          width: 100%;
          background: none;
          border: none;
          outline: none;
          color: var(--juice-green, #333);
        }

        .input-field:focus-within {
          background-color: rgba(93, 130, 70, 0.15);
          box-shadow: 0 0 0 2px var(--juice-orange, #667eea);
        }
        
        .input-field.flex-row-input > div:focus-within {
          background-color: rgba(93, 130, 70, 0.15);
          box-shadow: 0 0 0 2px var(--juice-orange, #667eea);
        }

        .input-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--juice-green, #666);
          transition: 0.5s;
        }

        .input-field input, .input-field select {
          background: none;
          outline: none;
          border: none;
          line-height: 1;
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--juice-green, #333);
          width: 100%;
        }

        .input-field input::placeholder, .input-field select:invalid {
          color: rgba(93, 130, 70, 0.6);
          font-weight: 400;
        }

        .btn {
          width: 150px;
          background-color: var(--juice-orange, #667eea);
          border: none;
          outline: none;
          height: 49px;
          border-radius: 49px;
          color: var(--juice-cream, #fff);
          text-transform: uppercase;
          font-weight: 600;
          margin: 10px 0;
          cursor: pointer;
          transition: 0.5s;
          font-size: 0.9rem;
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(255, 107, 74, 0.4);
        }

        .panels-container {
          position: absolute;
          height: 100%;
          width: 100%;
          top: 0;
          left: 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }

        .panel {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-around;
          text-align: center;
          z-index: 6;
        }

        .left-panel {
          pointer-events: all;
          padding: 3rem 17% 2rem 12%;
        }

        .right-panel {
          pointer-events: none;
          padding: 3rem 12% 2rem 17%;
        }

        .panel .content {
          color: var(--juice-cream, #fff);
          transition: transform 0.9s ease-in-out;
          transition-delay: 0.6s;
        }

        .panel h3 {
          font-weight: 600;
          line-height: 1;
          font-size: 1.5rem;
          margin-bottom: 10px;
        }

        .panel p {
          font-size: 0.95rem;
          padding: 0.7rem 0;
        }

        .btn.transparent {
          margin: 0;
          background: none;
          border: 2px solid var(--juice-cream, #fff);
          width: 130px;
          height: 41px;
          font-weight: 600;
          font-size: 0.8rem;
          color: var(--juice-cream, #fff);
        }

        .btn.transparent:hover {
          background: rgba(255, 253, 208, 0.1);
          transform: translateY(-2px);
        }

        .right-panel .content {
          transform: translateX(800px);
        }

        .container.sign-up-mode:before {
          transform: translate(100%, -50%);
          right: 52%;
        }

        .container.sign-up-mode .left-panel .content {
          transform: translateX(-800px);
        }

        .container.sign-up-mode .signin-signup {
          left: 25%;
        }

        .container.sign-up-mode form.sign-up-form {
          opacity: 1;
          z-index: 2;
        }

        .container.sign-up-mode form.sign-in-form {
          opacity: 0;
          z-index: 1;
        }

        .container.sign-up-mode .right-panel .content {
          transform: translateX(0%);
        }

        .container.sign-up-mode .left-panel {
          pointer-events: none;
        }

        .container.sign-up-mode .right-panel {
          pointer-events: all;
        }

        .container:before {
          content: "";
          position: absolute;
          height: 2000px;
          width: 2000px;
          top: -10%;
          right: 48%;
          transform: translateY(-50%);
          background: var(--juice-orange);
          transition: 1.8s ease-in-out;
          border-radius: 50%;
          z-index: 6;
        }

        .social-text {
          padding: 0.7rem 0;
          font-size: 1rem;
          color: var(--juice-green, #666);
        }

        .social-media {
          display: flex;
          justify-content: center;
          gap: 15px;
        }

        .social-icon {
          height: 46px;
          width: 46px;
          display: flex;
          justify-content: center;
          align-items: center;
          border: 1px solid var(--juice-green, #ddd);
          border-radius: 50%;
          color: var(--juice-green, #667eea);
          transition: 0.3s;
          cursor: pointer;
        }

        .social-icon:hover {
          border-color: var(--juice-orange, #764ba2);
          color: var(--juice-orange, #764ba2);
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 870px) {
          .container {
            min-height: 900px;
            height: 100vh;
          }
          .signin-signup {
            width: 100%;
            top: 95%;
            transform: translate(-50%, -100%);
            transition: 1s 0.8s ease-in-out;
          }
          .signin-signup,
          .container.sign-up-mode .signin-signup {
            left: 50%;
          }
          .panels-container {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 2fr 1fr;
          }
          .panel {
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            padding: 2.5rem 8%;
            grid-column: 1 / 2;
          }
          .right-panel {
            grid-row: 3 / 4;
          }
          .left-panel {
            grid-row: 1 / 2;
          }
          .panel .content {
            padding-right: 15%;
            transition: transform 0.9s ease-in-out;
            transition-delay: 0.8s;
          }
          .panel h3 {
            font-size: 1.2rem;
          }
          .panel p {
            font-size: 0.7rem;
            padding: 0.5rem 0;
          }
          .btn.transparent {
            width: 110px;
            height: 35px;
            font-size: 0.7rem;
          }
          .container:before {
            width: 1500px;
            height: 1500px;
            transform: translateX(-50%);
            left: 30%;
            bottom: 68%;
            right: initial;
            top: initial;
            transition: 2s ease-in-out;
          }
          .container.sign-up-mode:before {
            transform: translate(-50%, 100%);
            bottom: 32%;
            right: initial;
          }
          .container.sign-up-mode .left-panel .content {
            transform: translateY(-300px);
          }
          .container.sign-up-mode .right-panel .content {
            transform: translateY(0px);
          }
          .right-panel .content {
            transform: translateY(300px);
          }
          .container.sign-up-mode .signin-signup {
            top: 5%;
            transform: translate(-50%, 0);
          }
        }

        @media (max-width: 570px) {
          form {
            padding: 0 1.5rem;
          }
          .panel .content {
            padding: 0.5rem 1rem;
          }
        }
      `}</style>

      <div className={isSignUp ? "container sign-up-mode" : "container"}>
        <div className="forms-container">
          <div className="signin-signup">
            
            {/* SIGN IN FORM */}
            <form className="sign-in-form" onSubmit={handleSignIn}>
              <Link href="/" className="mb-4">
                <StaticOrangeCompass className="w-16 h-16 drop-shadow-lg" />
              </Link>
              <h2 className="title">Sign in</h2>
              <p className="text-juice-green/60 text-xs font-bold uppercase tracking-[0.2em] mb-4">Enter your coordinates</p>
              
              {error && (
                <div className="mb-4 p-2 bg-red-500/10 border border-red-500/50 rounded text-xs text-red-500 text-center w-full max-w-[380px]">
                  {error}
                </div>
              )}
              {message && (
                <div className="mb-4 p-2 bg-green-500/10 border border-green-500/50 rounded text-xs text-green-600 text-center w-full max-w-[380px]">
                  {message}
                </div>
              )}

              <div className="input-field">
                <div className="input-icon"><Mail size={18} /></div>
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              
              {!isForgotPassword && (
                <div className="input-field relative">
                  <div className="input-icon"><Lock size={18} /></div>
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-juice-green/50 hover:text-juice-orange"
                  >
                    Forgot?
                  </button>
                </div>
              )}

              <button disabled={loading} type="submit" className="btn solid">
                {loading ? 'Processing...' : (isForgotPassword ? 'Reset' : 'Login')}
              </button>
              
              {isForgotPassword && (
                <button type="button" onClick={() => setIsForgotPassword(false)} className="text-xs text-juice-green/60 hover:text-juice-orange mt-2">
                  Back to login
                </button>
              )}

              <p className="social-text">Or sign in with social platforms</p>
              <div className="social-media">
                <a href="#" className="social-icon"><Facebook size={20} /></a>
                <a href="#" className="social-icon"><Twitter size={20} /></a>
                <a href="#" className="social-icon"><Linkedin size={20} /></a>
                <a href="#" className="social-icon"><Github size={20} /></a>
              </div>
            </form>

            {/* SIGN UP FORM */}
            <form className="sign-up-form" onSubmit={handleSignUp}>
              <h2 className="title text-[1.8rem] mb-2">Sign up</h2>
              
              {error && (
                <div className="mb-2 p-2 bg-red-500/10 border border-red-500/50 rounded text-xs text-red-500 text-center w-full max-w-[380px]">
                  {error}
                </div>
              )}

              <div className="w-full max-w-[380px] mb-2 flex justify-center">
                <AvatarSelection selectedAvatar={selectedAvatar} onSelect={setSelectedAvatar} />
              </div>

              <div className="input-field flex-row-input max-w-[380px]">
                <div>
                  <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div>
                  <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>

              <div className="input-field max-w-[380px]">
                <div className="input-icon"><User size={18} /></div>
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={usernameAvailable === false ? 'text-red-500' : ''}
                  required 
                />
                {checkingUsername && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-juice-green/50">...</span>}
              </div>

              <div className="input-field flex-row-input max-w-[380px]">
                <div>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} required>
                    <option value="" disabled hidden>Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                </div>
              </div>

              <div className="input-field max-w-[380px]">
                <div className="input-icon"><Mail size={18} /></div>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="input-field max-w-[380px]">
                <div className="input-icon"><Lock size={18} /></div>
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>

              <button disabled={loading || usernameAvailable === false} type="submit" className="btn mt-2 mb-2">
                {loading ? 'Processing...' : 'Sign up'}
              </button>
            </form>
          </div>
        </div>

        <div className="panels-container">
          <div className="panel left-panel">
            <div className="content">
              <h3>New here?</h3>
              <p>Join us today and discover a world of possibilities. Create your account in seconds!</p>
              <button type="button" className="btn transparent" onClick={() => setIsSignUp(true)}>
                Sign up
              </button>
            </div>
          </div>

          <div className="panel right-panel">
            <div className="content">
              <h3>One of us?</h3>
              <p>Welcome back! Sign in to continue your journey with us.</p>
              <button type="button" className="btn transparent" onClick={() => setIsSignUp(false)}>
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
