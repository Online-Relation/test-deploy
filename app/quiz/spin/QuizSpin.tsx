'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Confetti from 'react-confetti';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';  // Importér din user context

const SEGMENT_COUNT = 8;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

const colors = [
  '#6B46C1',
  '#805AD5',
  '#9F7AEA',
  '#B794F4',
  '#6B46C1',
  '#805AD5',
  '#9F7AEA',
  '#B794F4',
];

const labels = [
  'Stine',
  'Mads',
  'Stine',
  'Mads',
  'Stine',
  'Mads',
  'Stine',
  'Mads',
];

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

interface QuizSpinProps {
  quizKey: string;
  sessionId?: string | null;
}

export default function QuizSpin({ quizKey, sessionId }: QuizSpinProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const router = useRouter();
  const { user } = useUserContext(); // Hent user fra context

  const spinWheel = async () => {
  if (!quizKey) {
    console.error('quizKey er ikke defineret');
    return;
  }
  if (isSpinning) return;
  if (!user?.id) {
    console.error('Bruger ikke logget ind eller mangler ID');
    return;
    }

    setIsSpinning(true);
    setShowConfetti(false);

    const extraSpins = 4;
    const randomSegment = Math.floor(Math.random() * SEGMENT_COUNT);
    const finalRotation =
      360 * extraSpins + (360 - randomSegment * SEGMENT_ANGLE - SEGMENT_ANGLE / 2);

    setRotation(finalRotation);
    setSelectedIndex(randomSegment);

    const selectedStarter = labels[randomSegment];

    try {
      const { error } = await supabase
        .from('quiz_conversation_starter_log')
        .insert([{ quiz_key: quizKey, starter: selectedStarter, user_id: user.id }]);

      if (error) {
        console.error('Fejl ved gemning af samtalestarter:', error.message);
      } else {
        console.log('Samtalestarter gemt:', selectedStarter);
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

      <div className="relative w-64 h-64">
        {/* Pil */}
        <div
          style={{
            position: 'absolute',
            top: '-16px',
            left: '50%',
            transform: 'translateX(-50%) rotate(180deg)',
            width: 0,
            height: 0,
            borderLeft: '16px solid transparent',
            borderRight: '16px solid transparent',
            borderTop: '28px solid #4C51BF',
            zIndex: 10,
            filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.2))',
          }}
          aria-label="Pointer"
        />

        {/* Spinner hjul */}
        <div
          style={{
            width: '256px',
            height: '256px',
            borderRadius: '50%',
            border: '8px solid #6B46C1',
            boxShadow: '0 0 15px rgba(107, 70, 193, 0.6)',
            transition: isSpinning
              ? 'transform 5s cubic-bezier(0.33, 1, 0.68, 1)'
              : 'none',
            transform: `rotate(${rotation}deg)`,
          }}
        >
          <svg
            viewBox="0 0 200 200"
            width="100%"
            height="100%"
            className="block"
            style={{ borderRadius: '50%' }}
          >
            {Array.from({ length: SEGMENT_COUNT }).map((_, i) => {
              const startAngle = i * SEGMENT_ANGLE;
              const endAngle = startAngle + SEGMENT_ANGLE;
              const path = describeArc(100, 100, 100, startAngle, endAngle);

              const textAngle = startAngle + SEGMENT_ANGLE / 2;
              const textPos = polarToCartesian(100, 100, 65, textAngle);

              return (
                <g key={i}>
                  <path d={path} fill={colors[i]} stroke="#4C51BF" strokeWidth="2" />
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    fill="white"
                    fontWeight="bold"
                    fontSize="14"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    transform={`rotate(${textAngle + 90} ${textPos.x} ${textPos.y})`}
                  >
                    {labels[i]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {selectedIndex === null && !isSpinning && (
        <button
          onClick={spinWheel}
          disabled={isSpinning}
          className={`mt-8 px-6 py-3 rounded-full font-semibold text-white transition ${
            isSpinning ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          Spin hjulet
        </button>
      )}

      {selectedIndex !== null && !isSpinning && (
        <div className="mt-6 text-xl font-bold text-indigo-800">
          {labels[selectedIndex]} skal starte samtalen!
        </div>
      )}

      {selectedIndex !== null && !isSpinning && (
        <button
  onClick={() => router.push(`/quiz/resultater/${encodeURIComponent(quizKey)}${sessionId ? `?session=${sessionId}` : ''}`)}
  className="mt-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition"
>
  Se resultater
</button>

      )}

      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}
    </div>
  );
}
