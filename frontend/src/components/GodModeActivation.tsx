"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function GodModeActivation() {
  const { userId } = useAuth();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('IDLE'); // IDLE, LOADING, SUCCESS, ERROR
  const [isPro, setIsPro] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ME CHECK CAVE WALLS TO SEE IF ALREADY PRO
  useEffect(() => {
    const savedState = localStorage.getItem('IS_CAVE_PRO');
    if (savedState === 'TRUE') {
      setIsPro(true);
    }
  }, []);

  const handleRedeem = async () => {
    if (!code.trim()) return;
    setStatus('LOADING');
    setErrorMsg('');

    if (!userId) {
      setStatus('ERROR');
      setErrorMsg('Must be logged in to redeem magic stick.');
      return;
    }

    try {
      // ME YELL TO FASTAPI CAVE
      const response = await fetch('http://localhost:8000/api/v1/billing/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': userId // DYNAMIC TENANT TAG
        },
        body: JSON.stringify({ promo_code: code }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'BAD MAGIC STICK');
      }

      // IT WORKED! GLOW IN THE DARK!
      setStatus('SUCCESS');
      setIsPro(true);
      localStorage.setItem('IS_CAVE_PRO', 'TRUE'); // SAVE TO BROWSER MEMORY
      
    } catch (err: any) {
      console.error(err);
      setStatus('ERROR');
      setErrorMsg(err.message);
    }
  };

  return (
    <div className={`p-8 rounded-3xl bg-zinc-950/90 backdrop-blur-3xl border text-white transition-all duration-700 max-w-md mx-auto ${isPro ? 'ring-2 ring-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.6)] border-purple-500/50' : 'border-white/10'}`}>
      
      {!isPro ? (
        <div className="flex flex-col space-y-6 animate-in fade-in zoom-in duration-500">
          <h2 className="text-2xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 uppercase text-center">
            PROVE YOUR WORTH
          </h2>
          <p className="text-gray-400 text-sm tracking-wider text-center">ENTER MAGIC WORDS TO UNLOCK HEAVY DOORS.</p>
          
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="FAIZAN_ZERO_..."
              className="w-full bg-[#0a0a0e] border border-purple-500/30 rounded-xl px-4 py-4 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono tracking-widest uppercase text-purple-200 placeholder:text-zinc-700"
              disabled={status === 'LOADING'}
            />
            {status === 'LOADING' && (
              <div className="absolute right-4 top-4">
                 <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {status === 'ERROR' && (
            <div className="bg-red-950/50 border border-red-900 rounded-lg p-3 animate-in shake">
              <p className="text-red-400 text-xs font-bold uppercase text-center">{errorMsg}</p>
            </div>
          )}

          <button
            onClick={handleRedeem}
            disabled={status === 'LOADING' || !code.trim()}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] active:translate-y-0 transition-all disabled:opacity-50"
          >
            {status === 'LOADING' ? 'CHECKING STICK...' : 'REDEEM STICK'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center space-y-6 animate-in zoom-in duration-500">
          <div className="w-20 h-20 rounded-full bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)]">
            <svg className="w-10 h-10 text-purple-300 drop-shadow-[0_0_10px_rgba(216,180,254,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-fuchsia-300 uppercase mb-2">
              GOD MODE UNLOCKED
            </h2>
            <p className="text-purple-300/60 font-mono text-sm tracking-widest bg-purple-900/20 py-2 px-4 rounded-full inline-block border border-purple-500/30">BEAST OBEYS YOU NOW</p>
          </div>
        </div>
      )}
    </div>
  );
}
