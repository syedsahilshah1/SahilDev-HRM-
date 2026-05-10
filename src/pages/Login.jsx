import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sendOTPEmail } from '../services/emailService';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('login'); // login, otp
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { login, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError('Please fill in all fields.');
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      
      // If login successful, trigger OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      
      try {
        await sendOTPEmail(email, code);
      } catch (emailErr) {
        console.error("OTP Email failed:", emailErr);
        setError(`Failed to send OTP email: ${emailErr.message}. Check console or .env configuration.`);
        setLoading(false);
        return; // Stop here so user knows why they didn't get the code
      }
      
      setStep('otp');
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp === generatedOtp || otp === '123456') { // Allow 123456 for dev testing
      navigate('/');
    } else {
      setError('Invalid OTP code. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    try {
      setError('');
      setOtpLoading(true);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      await sendOTPEmail(email, code);
      setResendCooldown(60);
    } catch (err) {
      setError('Failed to resend OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError('Failed to login with Google.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return setError('Please enter your email first to reset password.');
    try {
      setError('');
      setLoading(true);
      await resetPassword(email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err) {
      setError('Failed to send reset email. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card card">
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {resetSent && (
          <div className="alert alert-success">
            Password reset link sent to your email!
          </div>
        )}

        {step === 'login' ? (
          <>
            <div className="login-header">
              <h1>SahilDev </h1>
              <p>Access your professional workspace</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Work Email</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input 
                    type="email" 
                    placeholder="name@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label>Password</label>
                  <button 
                    type="button" 
                    className="forgot-link-btn" 
                    onClick={handleForgotPassword}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Processing...' : 'Login to Portal'}
              </button>
            </form>

            <div className="divider">
              <span>OR CONTINUE WITH</span>
            </div>

            <div className="social-logins">
              <button className="social-btn" onClick={handleGoogleLogin} disabled={loading}>
                <img src="https://www.google.com/favicon.ico" alt="Google" />
                Google
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="login-header">
              <h1>Verify OTP</h1>
              <p>We've sent a 6-digit code to <strong>{email}</strong></p>
            </div>

            <form className="login-form" onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label>Verification Code</label>
                <div className="otp-input-container">
                  <input 
                    type="text" 
                    maxLength="6"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="otp-input"
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" className="login-btn">
                Verify & Access
              </button>
              
              <div className="otp-footer">
                <p>Didn't receive the code?</p>
                <button 
                  type="button" 
                  className="resend-btn"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || otpLoading}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
                <button 
                  type="button" 
                  className="back-to-login"
                  onClick={() => setStep('login')}
                >
                  Back to Login
                </button>
              </div>
            </form>
          </>
        )}

        <p className="footer-text">
          New to the team? <a href="#">Contact HR Admin</a>
        </p>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          padding: 2rem;
        }

        .alert {
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .alert-error {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fee2e2;
        }

        .alert-success {
          background: #f0fdf4;
          color: #10b981;
          border: 1px solid #dcfce7;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 3rem;
          background: white;
          border-radius: 24px;
          text-align: center;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .login-header h1 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          color: #0f172a;
          letter-spacing: -0.025em;
        }

        .login-header p {
          color: #64748b;
          font-size: 0.9375rem;
          margin-bottom: 2.5rem;
        }

        .role-toggle {
          display: flex;
          background: #f1f5f9;
          padding: 0.25rem;
          border-radius: 12px;
          margin-bottom: 2.5rem;
        }

        .toggle-btn {
          flex: 1;
          padding: 0.75rem;
          border-radius: 10px;
          border: none;
          background: transparent;
          font-weight: 600;
          font-size: 0.875rem;
          color: #64748b;
          cursor: pointer;
        }

        .toggle-btn.active {
          background: white;
          color: #0f172a;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .login-form {
          text-align: left;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .forgot-link-btn {
          background: transparent;
          border: none;
          font-size: 0.75rem;
          font-weight: 700;
          color: #2563eb;
          cursor: pointer;
          padding: 0;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          color: #94a3b8;
        }

        .input-wrapper input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          font-size: 0.9375rem;
          outline: none;
        }

        .input-wrapper input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .eye-btn {
          position: absolute;
          right: 1rem;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
        }

        .login-btn {
          width: 100%;
          padding: 1rem;
          background: #000;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 1rem;
        }

        .login-btn:disabled { opacity: 0.7; }

        .divider {
          position: relative;
          text-align: center;
          margin: 2rem 0;
        }

        .divider::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 1px;
          background: #e2e8f0;
        }

        .divider span {
          position: relative;
          background: white;
          padding: 0 0.75rem;
          font-size: 0.7rem;
          font-weight: 700;
          color: #94a3b8;
        }

        .social-logins {
          margin-bottom: 2.5rem;
        }

        .social-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          font-weight: 600;
          cursor: pointer;
        }

        .social-btn img { width: 18px; }

        .footer-text { font-size: 0.875rem; color: #64748b; }
        .footer-text a { color: #2563eb; font-weight: 700; text-decoration: none; }

        .otp-input-container {
          margin-top: 1rem;
        }

        .otp-input {
          width: 100%;
          padding: 1.25rem;
          text-align: center;
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: 0.5rem;
          border-radius: 16px;
          border: 2px solid #e2e8f0;
          background: #f8fafc;
          outline: none;
          transition: all 0.2s;
        }

        .otp-input:focus {
          border-color: #000;
          background: white;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .otp-footer {
          margin-top: 2rem;
          text-align: center;
        }

        .otp-footer p {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 0.5rem;
        }

        .resend-btn {
          background: transparent;
          border: none;
          color: #2563eb;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.5rem;
          display: block;
          margin: 0 auto;
        }

        .resend-btn:disabled {
          color: #94a3b8;
          cursor: not-allowed;
        }

        .back-to-login {
          background: transparent;
          border: none;
          color: #64748b;
          font-weight: 600;
          font-size: 0.75rem;
          cursor: pointer;
          margin-top: 1.5rem;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default Login;
