// /app/quiz/spin/page.tsx

import QuizSpin from './QuizSpin';

interface QuizSpinPageProps {
  searchParams: {
    quizKey?: string;
    session?: string;
  };
}

export default function QuizSpinPage({ searchParams }: QuizSpinPageProps) {
  const quizKey = searchParams?.quizKey || '';
  const sessionId = searchParams?.session || null;

  return <QuizSpin quizKey={quizKey} sessionId={sessionId} />;
}
