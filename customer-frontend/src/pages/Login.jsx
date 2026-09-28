import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const { loginWithOtp, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const otpInputs = useRef([]);

  useEffect(() => {
    if (user) {
      navigate(redirect);
    }
  }, [user, navigate, redirect]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (mobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/customer/auth/send-otp', { mobile });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next
    if (value !== '' && index < 5) {
      otpInputs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpInputs.current[index - 1].focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length < 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/customer/auth/verify-otp', { mobile, otp: otpString });
      loginWithOtp(res.data.token, res.data.user);
      navigate(redirect);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 px-4 pb-20">
      <div className="max-w-md w-full bg-white p-8 sm:p-12 shadow-2xl shadow-gray-200/50 rounded-sm border border-gray-100 relative overflow-hidden">
        
        {/* Subtle decorative accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-prettyglitz"></div>

        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold tracking-widest text-gray-900 uppercase">
            {step === 1 ? 'Welcome' : 'Verify Mobile'}
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            {step === 1 ? 'Enter your mobile number to sign in or create an account.' : `We sent a 6-digit code to +91 ${mobile}`}
          </p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 bg-red-50 text-red-600 text-xs tracking-wide font-medium rounded text-center border border-red-100">
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form 
              key="mobile-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOtp}
              className="space-y-6"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Mobile Number</label>
                <div className="flex border border-gray-300 rounded focus-within:border-gray-900 transition overflow-hidden">
                  <span className="flex items-center px-4 bg-gray-50 text-gray-500 border-r border-gray-300 font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength="10"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 py-3 px-4 focus:outline-none text-gray-900 font-medium tracking-wide"
                    placeholder="Enter 10 digit number"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gray-900 text-white py-4 uppercase tracking-widest text-sm font-bold hover:bg-black transition disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="otp-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleVerifyOtp}
              className="space-y-8"
            >
              <div className="flex justify-between gap-2 sm:gap-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => otpInputs.current[idx] = el}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border border-gray-300 rounded focus:border-gray-900 focus:outline-none transition shadow-sm"
                  />
                ))}
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gray-900 text-white py-4 uppercase tracking-widest text-sm font-bold hover:bg-black transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <div className="text-center mt-4">
                <button 
                  type="button" 
                  onClick={() => { setStep(1); setOtp(['','','','','','']); setError(''); }}
                  className="text-xs text-gray-500 uppercase tracking-widest font-semibold hover:text-gray-900 transition border-b border-transparent hover:border-gray-900 pb-0.5"
                >
                  Change Mobile Number
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Login;
