// /app/settings/points/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface XPSetting {
  id: number;
  role: string;
  action: string;
  effort: string | null;
  xp: number;
}

export default function PointsPage() {
  const [settings, setSettings] = useState<XPSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("xp_settings")
        .select("*")
        .order("role", { ascending: true });

      if (!error && data) {
        setSettings(data);
      }

      setLoading(false);
    };

    fetchSettings();
  }, []);

  const updateXP = async (id: number, xp: number) => {
    const { error } = await supabase
      .from("xp_settings")
      .update({ xp })
      .eq("id", id);

    if (!error) {
      setSettings((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, xp } : entry))
      );
    }
  };

  const renderTable = (title: string, roleFilter: string) => {
    const roleSettings = settings.filter((s) => s.role === roleFilter);
    const fantasySettings = roleSettings.filter((s) =>
      s.action.startsWith('add_fantasy') ||
      s.action.startsWith('plan_fantasy') ||
      s.action.startsWith('complete_fantasy')
    );
    const recommendationSettings = roleSettings.filter((s) => s.action === 'complete_recommendation')
    const evaluationSettings = roleSettings.filter((s) =>
      s.action.startsWith('evaluate_')
    );
    const bucketSettings = roleSettings.filter((s) =>
      s.action === 'complete_subgoal' ||
      s.action === 'complete_bucket'
    );
    const gameSettings = roleSettings.filter((s) =>
      s.action === 'complete_truth_dare' ||
      s.action === 'reject_truth_dare'
    );
    const quizSettings = roleSettings.filter((s) =>
      s.action === 'quiz_correct' || s.action === 'quiz_wrong'
    );
    const taskSettings = roleSettings.filter((s) =>
      s.action === 'complete_task'
    );
    const parquizSettings = roleSettings.filter((s) =>
  s.action === 'complete_parquiz'
    
);

    return (
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>

        {/* Fantasier */}
        {fantasySettings.length > 0 && (
          <>
            <h3 className="font-semibold mb-2">Fantasier</h3>
            <table className="w-full border text-sm mb-6">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2 text-left">Handling</th>
                  <th className="border px-4 py-2 text-left">Effort</th>
                  <th className="border px-4 py-2 text-left">XP</th>
                </tr>
              </thead>
              <tbody>
                {fantasySettings.map((setting) => (
                  <tr key={setting.id}>
                    <td className="border px-4 py-2">{setting.action}</td>
                    <td className="border px-4 py-2">{setting.effort || '-'}</td>
                    <td className="border px-4 py-2">
                      <input
                        type="number"
                        value={setting.xp}
                        onChange={(e) =>
                          updateXP(setting.id, parseInt(e.target.value))
                        }
                        className="w-20 border px-2 py-1 text-right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Evaluering */}
        {evaluationSettings.length > 0 && (
          <>
            <h3 className="font-semibold mb-2">Evaluering</h3>
            <table className="w-full border text-sm mb-6">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2 text-left">Handling</th>
                  <th className="border px-4 py-2 text-left">Effort</th>
                  <th className="border px-4 py-2 text-left">XP</th>
                </tr>
              </thead>
              <tbody>
                {evaluationSettings.map((setting) => (
                  <tr key={setting.id}>
                    <td className="border px-4 py-2">{setting.action}</td>
                    <td className="border px-4 py-2">{setting.effort || '-'}</td>
                    <td className="border px-4 py-2">
                      <input
                        type="number"
                        value={setting.xp}
                        onChange={(e) =>
                          updateXP(setting.id, parseInt(e.target.value))
                        }
                        className="w-20 border px-2 py-1 text-right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Bucketmål */}
        {bucketSettings.length > 0 && (
          <>
            <h3 className="font-semibold mb-2">Bucketmål</h3>
            <table className="w-full border text-sm mb-6">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2 text-left">Handling</th>
                  <th className="border px-4 py-2 text-left">Effort</th>
                  <th className="border px-4 py-2 text-left">XP</th>
                </tr>
              </thead>
              <tbody>
                {bucketSettings.map((setting) => (
                  <tr key={setting.id}>
                    <td className="border px-4 py-2">{setting.action}</td>
                    <td className="border px-4 py-2">{setting.effort || '-'}</td>
                    <td className="border px-4 py-2">
                      <input
                        type="number"
                        value={setting.xp}
                        onChange={(e) =>
                          updateXP(setting.id, parseInt(e.target.value))
                        }
                        className="w-20 border px-2 py-1 text-right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Spil – Sandhed eller Konsekvens */}
        {gameSettings.length > 0 && (
          <>
            <h3 className="font-semibold mb-2">Spil – Sandhed eller Konsekvens</h3>
            <table className="w-full border text-sm mb-6">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2 text-left">Handling</th>
                  <th className="border px-4 py-2 text-left">Sværhedsgrad</th>
                  <th className="border px-4 py-2 text-left">XP</th>
                </tr>
              </thead>
              <tbody>
                {gameSettings.map((setting) => (
                  <tr key={setting.id}>
                    <td className="border px-4 py-2">{setting.action}</td>
                    <td className="border px-4 py-2">{setting.effort || '-'}</td>
                    <td className="border px-4 py-2">
                      <input
                        type="number"
                        value={setting.xp}
                        onChange={(e) =>
                          updateXP(setting.id, parseInt(e.target.value))
                        }
                        className="w-20 border px-2 py-1 text-right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Spil – Parquizzen */}
        {quizSettings.length > 0 && (
          <>
            <h3 className="font-semibold mb-2">Spil – Parquizzen</h3>
            <table className="w-full border text-sm mb-6">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2 text-left">Handling</th>
                  <th className="border px-4 py-2 text-left">Effort</th>
                  <th className="border px-4 py-2 text-left">XP</th>
                </tr>
              </thead>
              <tbody>
                {quizSettings.map((setting) => (
                  <tr key={setting.id}>
                    <td className="border px-4 py-2">{setting.action}</td>
                    <td className="border px-4 py-2">{setting.effort || '-'}</td>
                    <td className="border px-4 py-2">
                      <input
                        type="number"
                        value={setting.xp}
                        onChange={(e) =>
                          updateXP(setting.id, parseInt(e.target.value))
                        }
                        className="w-20 border px-2 py-1 text-right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Opgaver */}
        {taskSettings.length > 0 && (
          <>
            <h3 className="font-semibold mb-2">Opgaver</h3>
            <table className="w-full border text-sm mb-6">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2 text-left">Handling</th>
                  <th className="border px-4 py-2 text-left">Effort</th>
                  <th className="border px-4 py-2 text-left">XP</th>
                </tr>
              </thead>
              <tbody>
                {taskSettings.map((setting) => (
                  <tr key={setting.id}>
                    <td className="border px-4 py-2">{setting.action}</td>
                    <td className="border px-4 py-2">{setting.effort || '-'}</td>
                    <td className="border px-4 py-2">
                      <input
                        type="number"
                        value={setting.xp}
                        onChange={(e) =>
                          updateXP(setting.id, parseInt(e.target.value))
                        }
                        className="w-20 border px-2 py-1 text-right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {/* Spil – Parquiz */}
{parquizSettings.length > 0 && (
  <>
    <h3 className="font-semibold mb-2">Forhold – Parquiz</h3>
    <table className="w-full border text-sm mb-6">
      <thead className="bg-gray-100">
        <tr>
          <th className="border px-4 py-2 text-left">Handling</th>
          <th className="border px-4 py-2 text-left">Sværhedsgrad</th>
          <th className="border px-4 py-2 text-left">XP</th>
        </tr>
      </thead>
      <tbody>
        {parquizSettings.map((setting) => (
          <tr key={setting.id}>
            <td className="border px-4 py-2">{setting.action}</td>
            <td className="border px-4 py-2">{setting.effort || '-'}</td>
            <td className="border px-4 py-2">
              <input
                type="number"
                value={setting.xp}
                onChange={(e) =>
                  updateXP(setting.id, parseInt(e.target.value))
                }
                className="w-20 border px-2 py-1 text-right"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </>
)}
{/* Ugens anbefaling */}
{recommendationSettings.length > 0 && (
  <>
    <h3 className="font-semibold mb-2">Ugens anbefaling</h3>
    <table className="w-full border text-sm mb-6">
      <thead className="bg-gray-100">
        <tr>
          <th className="border px-4 py-2 text-left">Handling</th>
          <th className="border px-4 py-2 text-left">Effort</th>
          <th className="border px-4 py-2 text-left">XP</th>
        </tr>
      </thead>
      <tbody>
        {recommendationSettings.map((setting) => (
          <tr key={setting.id}>
            <td className="border px-4 py-2">{setting.action}</td>
            <td className="border px-4 py-2">{setting.effort || '-'}</td>
            <td className="border px-4 py-2">
              <input
                type="number"
                value={setting.xp}
                onChange={(e) =>
                  updateXP(setting.id, parseInt(e.target.value))
                }
                className="w-20 border px-2 py-1 text-right"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </>
)}


        {/* Memory-upload */}
        <h3 className="font-semibold mb-2">Memory – Upload billede</h3>
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2 text-left">Bruger</th>
              <th className="border px-4 py-2 text-left">Handling</th>
              <th className="border px-4 py-2 text-left">XP</th>
            </tr>
          </thead>
          <tbody>
            {settings
              .filter((s) => s.action === 'memory_upload')
              .map((setting) => (
                <tr key={setting.id}>
                  <td className="border px-4 py-2 capitalize">{setting.role}</td>
                  <td className="border px-4 py-2">{setting.action}</td>
                  <td className="border px-4 py-2">
                    <input
                      type="number"
                      value={setting.xp}
                      onChange={(e) =>
                        updateXP(setting.id, parseInt(e.target.value))
                      }
                      className="w-20 border px-2 py-1 text-right"
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) return <p>Indlæser...</p>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">XP-indstillinger</h1>
      {renderTable("Stine", "stine")}
      {renderTable("Mads", "mads")}
    </div>
  );
}
