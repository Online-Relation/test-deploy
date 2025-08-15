// /app/quiz/spin/QuizSpin.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Confetti from 'react-confetti';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';

const SEGMENT_COUNT = 8;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

const colors = ['#6B46C1','#805AD5','#9F7AEA','#B794F4','#6B46C1','#805AD5','#9F7AEA','#B794F4'];
const labels = ['Stine','Mads','Stine','Mads','Stine','Mads','Stine','Mads'];

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return { x: cx + radius * Math.cos(angleInRadians), y: cy + radius * Math.sin(angleInRadians) };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [`M ${cx} ${cy}`, `L ${start.x} ${start.y}`, `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, 'Z'].join(' ');
}

interface QuizSpinProps { quizKey: string; sessionId?: string | null }

export default function QuizSpin({ quizKey, sessionId }: QuizSpinProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [existingStarter, setExistingStarter] = useState<string | null>(null);
  const [eligible, setEligible] = useState(false);
  const router = useRouter();
  const { user } = useUserContext();

  // Fald tilbage til localStorage hvis sessionId ikke er i query
  const effectiveSessionId = useMemo(() => {
    let s = sessionId || null;
    if (!s && typeof window !== 'undefined' && quizKey) {
      s = localStorage.getItem(`quiz_session_${quizKey}`);
    }
    return s;
  }, [sessionId, quizKey]);

  useEffect(() => {
    (async () => {
      if (!quizKey || !effectiveSessionId) return;
      console.log('🔎 Spin-check for', { quizKey, effectiveSessionId });

      // 1) Findes der allerede et spin-resultat pr. (quiz_key, session_id)?
      const { data: existing } = await supabase
        .from('quiz_conversation_starter_log')
        .select('starter')
        .eq('quiz_key', quizKey)
        .eq('session_id', effectiveSessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.starter) {
        setExistingStarter(existing.starter);
        setSelectedIndex(labels.findIndex(l => l.toLowerCase() === existing.starter.toLowerCase()));
      }

      // 2) Verificer at der er 2 submitted i denne session
      const { data: submitted } = await supabase
        .from('quiz_responses')
        .select('user_id')
        .eq('quiz_key', quizKey)
        .eq('session_id', effectiveSessionId)
        .eq('status', 'submitted');

      const uniqueUsers = new Set((submitted || []).map(r => r.user_id));
      const ok = uniqueUsers.size >= 2;
      setEligible(ok);
      console.log('✅ Eligible to spin?', ok);
    })();
  }, [quizKey, effectiveSessionId]);

  const spinWheel = async () => {
    if (!quizKey || !effectiveSessionId) { console.error('Mangler quizKey/sessionId'); return; }
    if (isSpinning) return;
    if (!user?.id) { console.error('Bruger ikke logget ind eller mangler ID'); return; }

    // Hvis der allerede findes et resultat – blokér for nyt spin
    if (existingStarter) {
      console.log('ℹ️ Allerede spundet:', existingStarter);
      return;
    }
    if (!eligible) {
      console.log('⛔ Ikke eligible til spin endnu (begge skal have submitted).');
      return;
    }

    setIsSpinning(true);
    setShowConfetti(false);

    const extraSpins = 4;
    const randomSegment = Math.floor(Math.random() * SEGMENT_COUNT);
    const finalRotation = 360 * extraSpins + (360 - randomSegment * SEGMENT_ANGLE - SEGMENT_ANGLE / 2);

    setRotation(finalRotation);
    setSelectedIndex(randomSegment);

    const selectedStarter = labels[randomSegment];

    try {
      // Upsert én række pr. (quiz_key, session_id)
      const { error } = await supabase
        .from('quiz_conversation_starter_log')
        .upsert([{ quiz_key: quizKey, session_id: effectiveSessionId, starter: selectedStarter, user_id: user.id }], {
          onConflict: 'quiz_key,session_id'
        });

      if (error) {
        console.error('Fejl ved gemning af samtalestarter:', error.message);
      } else {
        console.log('Samtalestarter gemt:', selectedStarter);
        setExistingStarter(selectedStarter);
      }
    } catch (e) {
      console.error('Exception ved gemning af samtalestarter:', e);
    }

    setTimeout(() => {
      setIsSpinning(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }, 5000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-purple-100 p-6 relative">
      <h1 className="text-3xl font-bold mb-8 text-indigo-700">Hvem starter samtalen?</h1>
      <div className="max-w-md text-center mb-8 text-indigo-600 text-sm sm:text-base">
        Når I begge har gennemført quizzen, er det vinderen på lykkehjulet, der får æren (og måske lidt udfordringen) med at starte samtalen.
      </div>

      
      {!eligible && (
        <div className="mb-4 text-sm text-yellow-800">Din partner mangler at aflevere – spin bliver aktiveret, når I begge har submitted.</div>
      )}

      <div className="relative w-64 h-64">
        {/* Pil */}
        <div style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%) rotate(180deg)', width: 0, height: 0, borderLeft: '16px solid transparent', borderRight: '16px solid transparent', borderTop: '28px solid #4C51BF', zIndex: 10, filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.2))' }} aria-label="Pointer" />

        {/* Spinner hjul */}
        <div style={{ width: '256px', height: '256px', borderRadius: '50%', border: '8px solid #6B46C1', boxShadow: '0 0 15px rgba(107, 70, 193, 0.6)', transition: isSpinning ? 'transform 5s cubic-bezier(0.33, 1, 0.68, 1)' : 'none', transform: `rotate(${rotation}deg)` }}>
          <svg viewBox="0 0 200 200" width="100%" height="100%" className="block" style={{ borderRadius: '50%' }}>
            {Array.from({ length: SEGMENT_COUNT }).map((_, i) => {
              const startAngle = i * SEGMENT_ANGLE;
              const endAngle = startAngle + SEGMENT_ANGLE;
              const path = describeArc(100, 100, 100, startAngle, endAngle);
              const textAngle = startAngle + SEGMENT_ANGLE / 2;
              const textPos = polarToCartesian(100, 100, 65, textAngle);
              return (
                <g key={i}>
                  <path d={path} fill={colors[i]} stroke="#4C51BF" strokeWidth="2" />
                  <text x={textPos.x} y={textPos.y} fill="white" fontWeight="bold" fontSize="14" textAnchor="middle" alignmentBaseline="middle" transform={`rotate(${textAngle + 90} ${textPos.x} ${textPos.y})`}>
                    {labels[i]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {selectedIndex === null && !isSpinning && (
        <button onClick={spinWheel} disabled={isSpinning || !eligible || !!existingStarter} className={`mt-8 px-6 py-3 rounded-full font-semibold text-white transition ${isSpinning || !eligible || !!existingStarter ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
          {existingStarter ? 'Starter valgt' : 'Spin hjulet'}
        </button>
      )}

      {selectedIndex !== null && !isSpinning && (
        <div className="mt-6 text-xl font-bold text-indigo-800">{labels[selectedIndex]} skal starte samtalen!</div>
      )}

      {selectedIndex !== null && !isSpinning && (
        <button onClick={() => router.push(`/quiz/resultater/${encodeURIComponent(quizKey)}${effectiveSessionId ? `?session=${effectiveSessionId}` : ''}`)} className="mt-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition">
          Se resultater
        </button>
      )}

      {showConfetti && <Confetti width={typeof window !== 'undefined' ? window.innerWidth : 0} height={typeof window !== 'undefined' ? window.innerHeight : 0} recycle={false} numberOfPieces={200} gravity={0.3} />}
    </div>
  );
}