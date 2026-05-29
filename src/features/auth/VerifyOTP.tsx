
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseService';

interface Props {
  setView: (v: any) => void;
  userEmail: string;
  onVerified: () => void;
}

const VerifyOTP: React.FC<Props> = ({
  userEmail,
  onVerified
}) => {

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const verifyOTP = async () => {
    setLoading(true);

    try {

      const { error } = await supabase.functions.invoke('verify-otp', {
        body: {
          email: userEmail,
          code: otp
        }
      });

      if (error) {
        setMessage('INVALID OTP');
        return;
      }

      setMessage('VERIFICATION SUCCESSFUL');

      setTimeout(() => {
        onVerified();
      }, 1000);

    } catch (e) {

      console.error(e);

      setMessage('SYSTEM ERROR');

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="min-h-screen bg-[#00140d] flex items-center justify-center p-8">

      <div className="w-full max-w-md space-y-6">

        <div className="text-center">

          <h1 className="text-4xl font-black text-white">
            VERIFY NODE
          </h1>

          <p className="text-white/50 text-sm mt-3">
            ENTER THE OTP SENT TO YOUR WHATSAPP
          </p>

        </div>

        <input
          type="text"
          placeholder="ENTER OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full p-5 rounded-2xl bg-[#012017] text-white outline-none"
        />

        <button
          onClick={verifyOTP}
          disabled={loading}
          className="w-full p-5 rounded-2xl bg-aba-gold text-black font-black"
        >

          {loading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (
            'VERIFY OTP'
          )}

        </button>

        {message && (
          <div className="text-center text-aba-gold text-sm">
            {message}
          </div>
        )}

      </div>

    </div>
  );
};

export default VerifyOTP;
```
