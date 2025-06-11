'use client';

import { useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Dialog } from '@headlessui/react';
import { v4 as uuidv4 } from 'uuid';
import { Fantasy } from '@/hooks/useFantasyBoardLogic';
import { ChevronLeft, ChevronRight, X, Tag, Zap } from 'lucide-react';
import { TagBadge } from '@/components/ui/TagBadge';
import RichTextEditor from '@/components/ui/RichTextEditor';

type FantasyInput = Omit<Fantasy, 'id'> & {
  extra_images?: string[];
  hasExtras?: boolean;
  status?: 'idea' | 'planned' | 'fulfilled';
};

type ModalProps = {
  isCreateMode?: boolean;
  readOnly?: boolean;
  title: string;
  onClose: () => void;
  onCreate?: (fantasy: FantasyInput) => Promise<void>;
  onEdit?: (fantasy: Fantasy) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  fantasy?: Fantasy;
  newFantasy: FantasyInput;
  setNewFantasy: (f: FantasyInput) => void;
  children?: ReactNode;
};

export default function Modal({
  isCreateMode = false,
  readOnly = false,
  title,
  onClose,
  onCreate,
  onEdit,
  onDelete,
  fantasy,
  newFantasy,
  setNewFantasy,
  children,
}: ModalProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadExtras, setUploadExtras] = useState(false);
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchCategories();

    if (!isCreateMode && fantasy) {
      setNewFantasy({
        title: fantasy.title || '',
        description: fantasy.description || '',
        category: fantasy.category || '',
        effort: fantasy.effort || '',
        image_url: fantasy.image_url || '',
        extra_images: fantasy.extra_images || [],
        hasExtras: (fantasy.extra_images ?? []).length > 0,
        status: fantasy.status,
        user_id: fantasy.user_id || '',
        xp_granted: fantasy.xp_granted || false,
        fulfilled_date: fantasy.fulfilled_date || undefined,
      });
      setExtraImages(fantasy.extra_images || []);
      setCurrentImageIndex(0);
    }
  }, [fantasy]);

  async function fetchCategories() {
    const { data, error } = await supabase.from('fantasy_categories').select('*');
    if (error) console.error('Fejl ved hentning af kategorier:', error.message);
    else if (data) setCategories(data);
  }

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const filename = `fantasies/${uuidv4()}_${file.name}`;
    setUploading(true);

    const { error } = await supabase.storage.from('fantasies').upload(filename, file);
    if (error) {
      console.error('Fejl ved billedupload:', error.message);
    } else {
      const {
        data: { publicUrl },
      } = supabase.storage.from('fantasies').getPublicUrl(filename);

      setNewFantasy({ ...newFantasy, image_url: publicUrl });
    }

    setUploading(false);
  };

  const handleExtraImagesUpload = async (e: any) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const urls: string[] = [];

    for (const file of files) {
      const filename = `fantasies/extras/${uuidv4()}_${file.name}`;
      const { error } = await supabase.storage.from('fantasies').upload(filename, file);

      if (error) {
        console.error('Fejl ved upload af ekstra billede:', error.message);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('fantasies').getPublicUrl(filename);

      urls.push(publicUrl);
    }

    // Vi samler tidligere extra_images med nye billeder, så intet går tabt
    const allImages = [...(newFantasy.extra_images || []), ...urls];
    setExtraImages(allImages);
    setNewFantasy({ ...newFantasy, extra_images: allImages });
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!onCreate) return;

    try {
      await onCreate({
        ...newFantasy,
        extra_images: extraImages,
        status: newFantasy.status || 'idea',
      });
      onClose();
    } catch (err) {
      console.error('Fejl ved oprettelse af fantasi:', err);
    }
  };

  const handlePrev = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? extraImages.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) =>
      prev === extraImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <Dialog open onClose={onClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-background p-6 rounded-xl max-w-lg w-full shadow-xl space-y-4 relative max-h-[80vh] overflow-y-auto">

          {/* Luk modal kryds */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            aria-label="Luk modal"
          >
            <X size={24} />
          </button>

          <h2 className="text-2xl font-semibold">{title}</h2>

          {/* Vis galleri */}
          {extraImages.length > 0 && !isCreateMode && (
            <div className="relative w-full h-56 mb-2 rounded overflow-hidden">
              <img
                src={extraImages[currentImageIndex]}
                alt={`Ekstra billede ${currentImageIndex + 1}`}
                className="object-cover w-full h-full rounded"
              />
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded">
                {currentImageIndex + 1} / {extraImages.length}
              </div>
            </div>
          )}

          {readOnly ? (
            <>
              <p className="font-semibold">{newFantasy.title}</p>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: newFantasy.description || '' }}
              />
              {newFantasy.image_url && (
                <img
                  src={newFantasy.image_url}
                  alt={newFantasy.title}
                  className="w-full rounded mt-2"
                />
              )}
              {extraImages.length > 0 && (
                <div className="mt-2 flex space-x-2 overflow-x-auto">
                  {extraImages.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Ekstra billede ${i + 1}`}
                      className="h-24 rounded"
                    />
                  ))}
                </div>
              )}

              {/* Badges nederst */}
              <div className="mt-6 border-t pt-4 flex flex-wrap gap-2">
                {newFantasy.category && (
                  <TagBadge label={newFantasy.category} icon={<Tag size={14} />} color="purple" />
                )}
                {newFantasy.effort && (
                  <TagBadge label={newFantasy.effort} icon={<Zap size={14} />} color="yellow" />
                )}
              </div>

              {children}
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Titel"
                value={newFantasy.title || ''}
                onChange={(e) =>
                  setNewFantasy({ ...newFantasy, title: e.target.value })
                }
                className="w-full border p-2 rounded"
              />

              <RichTextEditor
                value={newFantasy.description || ''}
                onChange={(val) =>
                  setNewFantasy({ ...newFantasy, description: val })
                }
              />

              <select
                value={newFantasy.category || ''}
                onChange={(e) =>
                  setNewFantasy({ ...newFantasy, category: e.target.value })
                }
                className="w-full border p-2 rounded"
              >
                <option value="">Vælg kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={newFantasy.effort || ''}
                onChange={(e) =>
                  setNewFantasy({ ...newFantasy, effort: e.target.value })
                }
                className="w-full border p-2 rounded"
              >
                <option value="">Vælg indsats</option>
                <option value="Low">Lav</option>
                <option value="Medium">Mellem</option>
                <option value="High">Høj</option>
              </select>

              {/* Mobilstatusvælger */}
              <select
                className="block md:hidden w-full border p-2 rounded mb-4"
                value={newFantasy.status || 'idea'}
                onChange={(e) =>
                  setNewFantasy({ ...newFantasy, status: e.target.value as 'idea' | 'planned' | 'fulfilled' })
                }
              >
                <option value="idea">Fantasier</option>
                <option value="planned">Planlagt</option>
                <option value="fulfilled">Opfyldt</option>
              </select>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Upload hovedbillede:
                </label>
                <input type="file" onChange={handleImageUpload} />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={uploadExtras}
                    onChange={(e) => setUploadExtras(e.target.checked)}
                  />
                  Ekstra tilføjelser (flere billeder)
                </label>

                {uploadExtras && (
                  <div className="mt-2">
                    <input type="file" multiple onChange={handleExtraImagesUpload} />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={onClose} className="btn">
                  Annuller
                </button>
                {isCreateMode ? (
                  <button
                    onClick={handleSubmit}
                    className="btn-primary"
                    disabled={uploading}
                  >
                    Tilføj fantasi
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (fantasy && onEdit) {
                          onEdit({
                            ...fantasy,
                            ...newFantasy,
                            extra_images: newFantasy.extra_images || [],
                          });
                        }
                      }}
                      className="btn-primary"
                    >
                      Gem
                    </button>
                    <button
                      onClick={() => {
                        if (fantasy && fantasy.id && onDelete) {
                          onDelete(fantasy.id);
                        }
                      }}
                      className="btn-destructive"
                    >
                      Slet
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}
