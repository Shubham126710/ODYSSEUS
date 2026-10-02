"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StaticOrangeCompass } from "@/components/StaticOrangeCompass";
import { AvatarSelection } from "@/components/AvatarSelection";
import { supabase } from "@/lib/supabaseClient";

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
          width: 100vw;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0;
          margin: 0;
        }

        .container {
          position: relative;
          width: 100vw;
          height: 100vh;
          max-width: 100%;
          min-height: 100vh;
          background: var(--juice-cream, white);
          border-radius: 0;
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

        .input-group {
          max-width: 380px;
          width: 100%;
          margin: 8px 0;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .input-group label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: rgba(93, 130, 70, 0.6);
          margin-bottom: 2px;
          margin-left: 2px;
        }

        .input-field {
          width: 100%;
          background-color: transparent;
          border-bottom: 1px solid rgba(93, 130, 70, 0.3);
          height: 40px;
          display: flex;
          align-items: center;
          padding: 0 0.4rem;
          transition: 0.3s;
        }

        .input-field:focus-within {
          border-bottom: 2px solid var(--juice-orange, #667eea);
        }

        .input-field input, .input-field select {
          background: none;
          outline: none;
          border: none;
          line-height: 1;
          font-weight: 500;
          font-size: 1rem;
          color: var(--juice-green, #333);
          width: 100%;
        }

        .input-field input::placeholder, .input-field select:invalid {
          color: rgba(93, 130, 70, 0.4);
          font-weight: 400;
        }

        .btn {
          width: 100%;
          max-width: 380px;
          background-color: var(--juice-orange, #667eea);
          border: none;
          outline: none;
          height: 49px;
          border-radius: 49px;
          color: var(--juice-cream, #fff);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.2em;
          margin: 20px 0 10px 0;
          cursor: pointer;
          transition: 0.5s;
          font-size: 0.8rem;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }

        .btn:hover {
          background-color: #fff;
          color: var(--juice-green);
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
          align-items: center;
          justify-content: center;
          text-align: center;
          z-index: 6;
        }

        .left-panel {
          pointer-events: all;
          padding: 3rem 12% 2rem 12%;
        }

        .right-panel {
          pointer-events: none;
          padding: 3rem 12% 2rem 12%;
        }

        .panel .content {
          color: var(--juice-cream, #fff);
          transition: transform 0.9s ease-in-out;
          transition-delay: 0.6s;
          max-width: 400px;
        }

        .panel h3 {
          font-family: var(--font-serif, serif);
          font-weight: 700;
          line-height: 1;
          font-size: 3rem;
          margin-bottom: 20px;
        }

        .panel p {
          font-size: 1.1rem;
          padding: 0.7rem 0;
          opacity: 0.8;
          font-weight: 500;
        }

        .btn.transparent {
          margin: 20px auto 0 auto;
          background: none;
          border: none;
          border-bottom: 1px solid rgba(255, 253, 208, 0.5);
          border-radius: 0;
          width: max-content;
          padding: 0 0 5px 0;
          height: auto;
          font-weight: 700;
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          color: var(--juice-cream, #fff);
          box-shadow: none;
        }

        .btn.transparent:hover {
          background: none;
          color: var(--juice-orange);
          border-bottom-color: var(--juice-orange);
          transform: translateY(0);
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
          height: 3500px;
          width: 3500px;
          top: -10%;
          right: 48%;
          transform: translateY(-50%);
          background: var(--juice-orange);
          transition: 1.8s ease-in-out;
          border-radius: 50%;
          z-index: 6;
        }

        @media (max-width: 870px) {
          .container {
            min-height: 100vh;
            height: auto;
          }
          .signin-signup {
            width: 100%;
            top: 95%;
            transform: translate(-50%, -100%);
            transition: 1s 0.8s ease-in-out;
            padding-bottom: 50px;
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
            font-size: 2rem;
          }
          .panel p {
            font-size: 0.9rem;
            padding: 0.5rem 0;
          }
          .container:before {
            width: 2500px;
            height: 2500px;
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
      `}</style>

      <div className={isSignUp ? "container sign-up-mode" : "container"}>
        <div className="forms-container">
          <div className="signin-signup">
            
            {/* SIGN IN FORM */}
            <form className="sign-in-form" onSubmit={handleSignIn}>
              <Link href="/" className="mb-6">
                <StaticOrangeCompass className="w-16 h-16 drop-shadow-lg" />
              </Link>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-juice-green mb-2">Sign In</h2>
              <p className="text-juice-green/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Enter your coordinates</p>
              
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

              <div className="input-group">
                <label>Email Address</label>
                <div className="input-field">
                  <input 
                    type="email" 
                    placeholder="hello@odysseus.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>
              
              {!isForgotPassword && (
                <div className="input-group">
                  <div className="flex justify-between w-full">
                    <label>Password</label>
                    <button 
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-[9px] font-bold uppercase tracking-widest text-juice-green/40 hover:text-juice-orange"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="input-field">
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>
              )}

              <button disabled={loading} type="submit" className="btn">
                {loading ? 'Processing...' : (isForgotPassword ? 'Reset Link' : 'Sign In')}
              </button>
              
              {isForgotPassword && (
                <button type="button" onClick={() => setIsForgotPassword(false)} className="text-[10px] font-bold uppercase tracking-widest text-juice-green/60 hover:text-juice-orange mt-4">
                  ← Back to login
                </button>
              )}
            </form>

            {/* SIGN UP FORM */}
            <form className="sign-up-form" onSubmit={handleSignUp}>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-juice-green mb-2">Register</h2>
              <p className="text-juice-green/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Begin your odyssey</p>
              
              {error && (
                <div className="mb-2 p-2 bg-red-500/10 border border-red-500/50 rounded text-xs text-red-500 text-center w-full max-w-[380px]">
                  {error}
                </div>
              )}

              <div className="w-full max-w-[380px] mb-2 flex justify-center">
                <AvatarSelection selectedAvatar={selectedAvatar} onSelect={setSelectedAvatar} />
              </div>

              <div className="flex gap-4 w-full max-w-[380px]">
                <div className="input-group w-1/2">
                  <label>First Name</label>
                  <div className="input-field">
                    <input type="text" placeholder="Odysseus" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                </div>
                <div className="input-group w-1/2">
                  <label>Last Name</label>
                  <div className="input-field">
                    <input type="text" placeholder="Explorer" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Username</label>
                <div className={`input-field ${usernameAvailable === false ? 'border-red-500' : ''}`}>
                  <input 
                    type="text" 
                    placeholder="odysseus_1" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required 
                  />
                  {checkingUsername && <span className="absolute right-2 text-[10px] text-juice-green/50">...</span>}
                  {usernameAvailable === false && !checkingUsername && <span className="absolute right-2 text-[10px] text-red-500">Taken</span>}
                </div>
              </div>

              <div className="flex gap-4 w-full max-w-[380px]">
                <div className="input-group w-1/2">
                  <label>Gender</label>
                  <div className="input-field">
                    <select value={gender} onChange={(e) => setGender(e.target.value)} required>
                      <option value="" disabled hidden>Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
                <div className="input-group w-1/2">
                  <label>Date of Birth</label>
                  <div className="input-field">
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Email Address</label>
                <div className="input-field">
                  <input type="email" placeholder="hello@odysseus.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="input-field">
                  <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
              </div>

              <button disabled={loading || usernameAvailable === false} type="submit" className="btn">
                {loading ? 'Processing...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>

        <div className="panels-container">
          <div className="panel left-panel">
            <div className="content">
              <h3>Join the Crew</h3>
              <p>Chart a new course through the noise of the web.</p>
              <button type="button" className="btn transparent" onClick={() => setIsSignUp(true)}>
                NEW HERE? CREATE AN ACCOUNT
              </button>
            </div>
          </div>

          <div className="panel right-panel">
            <div className="content">
              <h3>Welcome Back</h3>
              <p>The compass is set. Your stories are waiting.</p>
              <button type="button" className="btn transparent" onClick={() => setIsSignUp(false)}>
                ALREADY HAVE AN ACCOUNT? SIGN IN
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
