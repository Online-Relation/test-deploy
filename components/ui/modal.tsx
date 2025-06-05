// components/ui/modal.tsx
'use client';

import { useCategory } from '@/context/CategoryContext';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tag, Zap, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useHasMounted } from '@/hooks/useHasMounted';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface Fantasy {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  category?: string;
  effort?: string;
  status: 'idea' | 'planned' | 'fulfilled';
  xp_granted?: boolean;
  fulfilled_date?: string;
}

interface ModalProps {
  fantasy?: Fantasy | null;
  onClose: () => void;
  onEdit?: (fantasy: Fantasy) => void;
  title?: string;
  children?: React.ReactNode;
  isCreateMode?: boolean;
  onCreate?: () => void;
  newFantasy?: Omit<Fantasy, 'id'>;
  setNewFantasy?: (fantasy: Omit<Fantasy, 'id'>) => void;
  onDelete?: (id: string) => void;
}

export default function Modal(props: ModalProps) {
  const { fantasyCategories } = useCategory();
  const hasMounted = useHasMounted();

  const {
    fantasy,
    onClose,
    onEdit,
    title,
    isCreateMode,
    onCreate,
    newFantasy,
    setNewFantasy,
    onDelete,
  } = props;

  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState<Fantasy | null>(fantasy ?? null);

  useEffect(() => {
    setEdited(fantasy ?? null);
    setEditing(false);
  }, [fantasy]);

  if (!hasMounted || (!fantasy && !isCreateMode)) return null;

  const handleSave = () => {
    if (!edited) return;
    onEdit?.(edited);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!fantasy?.id || !onDelete) return;

    const { error: deleteError } = await supabase.from('fantasies').delete().eq('id', fantasy.id);
    if (deleteError) {
      console.error('Fejl ved sletning:', deleteError.message);
      return;
    }

    const { error: xpError } = await supabase
      .from('xp_log')
      .delete()
      .eq('description', `stine – add_fantasy`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (xpError) {
      console.error('Fejl ved sletning af XP:', xpError.message);
    }

    onDelete(fantasy.id);
    onClose();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `fantasies/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('fantasies')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Fejl ved upload:', uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('fantasies')
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData?.publicUrl;

    if (isCreateMode && newFantasy && setNewFantasy && imageUrl) {
      setNewFantasy({ ...newFantasy, image_url: imageUrl });
    } else if (edited && imageUrl) {
      setEdited({ ...edited, image_url: imageUrl });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-black text-xl"
        >
          ✕
        </button>

        {isCreateMode && newFantasy && setNewFantasy ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-3 pr-10">{title || 'Tilføj ny fantasi'}</h2>
            <input
              type="text"
              placeholder="Titel"
              value={newFantasy.title}
              onChange={(e) => setNewFantasy({ ...newFantasy, title: e.target.value })}
              className="w-full px-4 py-2 border rounded text-black"
            />
            <RichTextEditor
              value={newFantasy.description}
              onChange={(val) => setNewFantasy({ ...newFantasy, description: val })}
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full"
            />
            {newFantasy.image_url && (
              <img
                src={newFantasy.image_url}
                alt=""
                className="rounded w-full max-h-[300px] object-cover mb-4"
              />
            )}
            <select
              value={newFantasy.category || ''}
              onChange={(e) => setNewFantasy({ ...newFantasy, category: e.target.value })}
              className="w-full px-4 py-2 border rounded text-black bg-white"
            >
              <option value="">Vælg kategori</option>
              {fantasyCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={newFantasy.effort || ''}
              onChange={(e) => setNewFantasy({ ...newFantasy, effort: e.target.value })}
              className="w-full px-4 py-2 border rounded text-black bg-white"
            >
              <option value="">Vælg effort</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <button
              onClick={onCreate}
              className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
            >
              Tilføj fantasi
            </button>
          </div>
        ) : editing ? (
          <div className="space-y-4">
            <input
              type="text"
              value={edited?.title || ''}
              onChange={(e) => setEdited({ ...edited!, title: e.target.value })}
              className="w-full px-4 py-2 border rounded text-black"
              placeholder="Titel"
            />
            <RichTextEditor
              value={edited?.description || ''}
              onChange={(val) => setEdited({ ...edited!, description: val })}
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full"
            />
            {edited?.image_url && (
              <img
                src={edited.image_url}
                alt=""
                className="rounded w-full max-h-[300px] object-cover mb-4"
              />
            )}
            <select
              value={edited?.category || ''}
              onChange={(e) => setEdited({ ...edited!, category: e.target.value })}
              className="w-full px-4 py-2 border rounded text-black bg-white"
            >
              <option value="">Vælg kategori</option>
              {fantasyCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={edited?.effort || ''}
              onChange={(e) => setEdited({ ...edited!, effort: e.target.value })}
              className="w-full px-4 py-2 border rounded text-black bg-white"
            >
              <option value="">Vælg effort</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Gem
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEdited(fantasy ?? null);
                  }}
                  className="text-gray-600 hover:text-black px-4 py-2"
                >
                  Annuller
                </button>
              </div>
              {fantasy?.id && (
                <button
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-800 text-sm ml-auto"
                >
                  🗑️ Slet
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-3 pr-10">{fantasy?.title}</h2>
            {fantasy?.image_url && (
              <img
                src={fantasy.image_url}
                alt=""
                className="mb-4 rounded w-full max-h-[350px] object-cover"
              />
            )}
            <div
              className="prose max-w-none text-gray-700 leading-relaxed [&_p]:mb-4"
              dangerouslySetInnerHTML={{ __html: fantasy?.description || '' }}
            />
            <div className="mt-4 flex flex-wrap gap-2 text-sm font-medium">
              {fantasy?.category && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 gap-1">
                  <Tag size={14} /> {fantasy.category}
                </Badge>
              )}
              {fantasy?.effort && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 gap-1">
                  <Zap size={14} /> {fantasy.effort}
                </Badge>
              )}
              {fantasy?.fulfilled_date && (
                <Badge variant="outline" className="bg-gray-100 text-gray-800 gap-1">
                  <Calendar size={14} /> Opfyldt: {fantasy.fulfilled_date}
                </Badge>
              )}
            </div>
            <div className="mt-6">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => setEditing(true)}
              >
                ✏️ Redigér
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
