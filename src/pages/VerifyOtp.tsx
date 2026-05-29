import React, { useState } from 'react';

const VerifyOtp = () => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1);

  const sendOtp = async () => {
    try {
      const res = await fetch(
        'https://pqzjkvqmherngispxlzy.supabase.co/functions/v1/send-otp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert('OTP sent to WhatsApp');
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to send OTP');
    }
  };

  const verifyOtp = async () => {
    alert(`Verify OTP: ${code}`);
    
    // NEXT:
    // connect to verify-otp edge function
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md p-8 space-y-6">

        <h1 className="text-3xl font-bold">
          WhatsApp OTP Login
        </h1>

        {step === 1 && (
          <>
            <input
              type="text"
              placeholder="2347032771739"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-4 rounded bg-zinc-900"
            />

            <button
              onClick={sendOtp}
              className="w-full bg-green-600 p-4 rounded"
            >
              Send OTP
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-4 rounded bg-zinc-900"
            />

            <button
              onClick={verifyOtp}
              className="w-full bg-yellow-500 text-black p-4 rounded"
            >
              Verify OTP
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyOtp;
