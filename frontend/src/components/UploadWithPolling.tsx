"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export default function UploadWithPolling() {
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('IDLE'); // IDLE, UPLOADING, PENDING, STARTED, SUCCESS, FAILURE
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // YOU HOLD ROCK
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const isPro = user?.publicMetadata?.plan === "pro";
      const maxMb = isPro ? 5 : 2;
      const maxSize = maxMb * 1024 * 1024;
      
      if (selectedFile.size > maxSize) {
        setErrorMsg(`File too large. Your current plan limits uploads to ${maxMb} MB.`);
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
    }
  };

  // YOU THROW ROCK TO FASTAPI CAVE
  const handleUpload = async () => {
    if (!file) return;
    setStatus('UPLOADING');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // ME PRETEND CAVE IS AT 8000
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        headers: {
          'X-Tenant-ID': 'caveman-tenant-999' // ME WEAR FAKE TAG FOR NOW
        },
        body: formData,
      });

      if (!response.ok) throw new Error('BEAST REJECT ROCK');

      const data = await response.json();
      setTaskId(data.task_id);
      setStatus('PENDING');
    } catch (err) {
      console.error(err);
      setStatus('FAILURE');
    }
  };

  // ME PEEK IN CAVE EVERY 3 SECONDS
  useEffect(() => {
    if (!taskId) return;
    if (status === 'SUCCESS' || status === 'FAILURE') return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/tasks/${taskId}`, {
          headers: {
            'X-Tenant-ID': 'caveman-tenant-999'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStatus(data.status);
          if (data.status === 'SUCCESS') {
            setResult(data.result);
            clearInterval(interval);
          } else if (data.status === 'FAILURE') {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("CANNOT SEE BEAST", err);
      }
    }, 3000); // 3 SECONDS

    return () => clearInterval(interval);
  }, [taskId, status]);

  return (
    <div className="min-h-[400px] w-full max-w-2xl mx-auto p-8 rounded-3xl bg-[#0a0a0e]/80 backdrop-blur-2xl border border-purple-500/20 text-white shadow-[0_0_50px_rgba(88,28,135,0.15)] flex flex-col items-center justify-center font-sans transition-all duration-500">
      
      {status === 'IDLE' && (
        <div className="flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-500">
          <h2 className="text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
            FEED THE BEAST
          </h2>
          <div className="relative group">
            <input 
              type="file" 
              onChange={handleFileChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="px-8 py-4 rounded-xl border-2 border-dashed border-purple-500/30 bg-purple-900/10 group-hover:bg-purple-900/20 group-hover:border-purple-400 transition-all text-center flex flex-col items-center justify-center">
              <svg className="w-8 h-8 text-purple-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              <span className="text-purple-300 font-medium tracking-wide">{file ? file.name : "CHOOSE HEAVY ROCK (PDF)"}</span>
            </div>
          </div>
          
          <button 
            onClick={handleUpload} 
            disabled={!file}
            className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full font-bold tracking-wider shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(147,51,234,0.6)] active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            THROW TO BEAST
          </button>
          {errorMsg && <p className="text-red-500 font-bold mt-4">{errorMsg}</p>}
        </div>
      )}

      {(status === 'UPLOADING' || status === 'PENDING' || status === 'STARTED') && (
        <div className="flex flex-col items-center space-y-8 w-full animate-in fade-in duration-500">
          <h2 className="text-2xl font-bold text-purple-300 animate-pulse tracking-widest uppercase">
            BEAST IS CHEWING...
          </h2>
          
          {/* OBSIDIAN & AMETHYST SHIMMERING SKELETON */}
          <div className="w-full space-y-4">
            <div className="w-full h-24 animate-pulse bg-purple-900/20 border border-purple-500/30 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            </div>
            <div className="w-3/4 h-10 animate-pulse bg-purple-900/20 border border-purple-500/30 rounded-xl" />
            <div className="w-1/2 h-10 animate-pulse bg-purple-900/20 border border-purple-500/30 rounded-xl" />
          </div>
          <p className="text-purple-400/50 text-sm font-mono tracking-widest">POLLING STATUS: {status}</p>
        </div>
      )}

      {status === 'SUCCESS' && (
        <div className="flex flex-col items-center space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
             <svg className="w-12 h-12 animate-[bounce_2s_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
             </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 tracking-widest">
            MATRIX CARVED!
          </h2>
          <button className="px-10 py-4 mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full font-bold text-white tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] active:translate-y-0 transition-all duration-300 transform perspective-1000">
            VIEW MATRIX
          </button>
        </div>
      )}

      {status === 'FAILURE' && (
        <div className="flex flex-col items-center space-y-6 animate-in zoom-in duration-300">
          <h2 className="text-3xl font-bold text-red-500 tracking-widest">BEAST CHOKED!</h2>
          <p className="text-red-400/70 font-mono bg-red-950/30 px-4 py-2 rounded-lg border border-red-900">ROCK TOO HARD. TRY AGAIN.</p>
          <button onClick={() => {setStatus('IDLE'); setTaskId(null); setFile(null);}} className="px-8 py-3 bg-red-900/40 border border-red-500/50 rounded-full hover:bg-red-900/80 hover:border-red-500 transition-all tracking-wider text-red-200">
            GO BACK TO CAVE
          </button>
        </div>
      )}
    </div>
  );
}
