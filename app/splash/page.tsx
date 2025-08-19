"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers le dashboard après 2.5 secondes
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 3500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A2647]">
      <div className="flex flex-col items-center justify-center animate-fade-in">
        {/* Texte TUDI Contrôl */}
        <div className="text-white text-center mb-4">
          <h1 className="text-7xl font-bold">TUDI</h1>
          <h2 className="text-5xl font-semibold">Contrôl</h2>
        </div>
        
        {/* Indicateur de chargement */}
        <div className="mt-12">
          <div className="w-24 h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white animate-loading-bar"></div>
          </div>
        </div>
      </div>
    </div>
  );
}