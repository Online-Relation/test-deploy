// app/checkin/evaluering/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CheckinEvalueringPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'mads' | 'stine' | null>(null);

  const userIdMads = '190a3151-97bc-43be-9daf-1f3b3062f97f';
  const userIdStine = '5687c342-1a13-441c-86ca-f7e87e1edbd5';

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const id = session?.user.id || null;
      setCurrentUserId(id);
      if (id === userIdMads) setCurrentUserRole('mads');
      if (id === userIdStine) setCurrentUserRole('stine');

      if (!id) return;
      const today = new Date();
      const week = getWeekNumber(today);
      const year = today.getFullYear();

      const { data } = await supabase
        .from('checkin')
        .select('*')
        .eq('status', 'pending')
        .eq('evaluator_id', id)
        .eq('week_number', week)
        .eq('year', year);

      setPending(data || []);
    };

    fetchData();
  }, []);

  const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
  };

  const handleEvaluate = async (id: string, decision: 'approved' | 'partial' | 'rejected') => {
    await supabase
      .from('checkin')
      .update({ status: decision })
      .eq('id', id);
    setPending((prev) => prev.filter((item) => item.id !== id));
  };

  const title =
    currentUserRole === 'mads'
      ? 'Mads skal evaluere'
      : currentUserRole === 'stine'
      ? 'Stine skal evaluere'
      : 'Evaluering';

  return (
    <div className="pt-8 pb-10 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Check-in: Evaluering</h1>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">{title}</h2>
        {pending.length > 0 ? (
          <div className="space-y-4">
            {pending.map((item) => (
              <Card key={item.id} className="border">
                <CardContent className="flex flex-col space-y-4">
                  <span className="text-lg font-medium">{item.need_text}</span>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleEvaluate(item.id, 'approved')}
                    >
                      Godkend
                    </Button>
                    <Button
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                      onClick={() => handleEvaluate(item.id, 'partial')}
                    >
                      Delvist opfyldt
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handleEvaluate(item.id, 'rejected')}
                    >
                      Afvis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Ingen behov at evaluere</p>
        )}
      </section>
    </div>
  );
}
