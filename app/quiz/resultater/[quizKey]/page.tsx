// /app/quiz/resultater/[quizKey]/page.tsx
'use client'

import dynamic from 'next/dynamic'

const ResultComponent = dynamic(() => import('./result-component'), {
  ssr: false,
})

export default function ResultPage() {
  return <ResultComponent />
}
