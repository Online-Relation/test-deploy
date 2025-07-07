'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { supabase } from '@/lib/supabaseClient';
import { Badge } from '@/components/ui/badge';

// Emoji-ikoner
const emojiIcons: Record<string, string> = {
  Oral: "😋",
  Anal: "🍑",
  Stående: "🦵",
  Missionær: "❤️",
  Cowgirl: "🤠",
  default: "✨",
};

const effortMap = {
  let: { text: "Let", color: "bg-green-100 text-green-700", icon: "⚡" },
  middel: { text: "Middel", color: "bg-yellow-100 text-yellow-700", icon: "⚡" },
  svær: { text: "Svær", color: "bg-red-100 text-red-700", icon: "⚡" },
};

const statusMap = {
  ny: { text: "Ny", color: "bg-gray-200 text-gray-800", icon: "🆕" },
  prøvet: { text: "Prøvet", color: "bg-green-100 text-green-700", icon: "✅" },
  afvist: { text: "Afvist", color: "bg-red-100 text-red-700", icon: "❌" },
};

type SexPosition = {
  id: string;
  name: string;
  image_url?: string;
  description?: string;
  status?: 'ny' | 'prøvet' | 'afvist';
  tried_count?: number;
  category_id?: string;
  category_name?: string;
  effort?: 'let' | 'middel' | 'svær';
  family_id?: string;
  tags?: { tag_id: string }[];
};

type Category = { id: string; name: string; };
type Family = { id: string; name: string; };
type Tag = { id: string; name: string; };

export default function SexPositionsPage() {
  const [positions, setPositions] = useState<SexPosition[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // FILTER STATE
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // MODAL STATE
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activePosition, setActivePosition] = useState<SexPosition | null>(null);

  // FORM STATE
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ny' | 'prøvet' | 'afvist'>('ny');
  const [triedCount, setTriedCount] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [categoryId, setCategoryId] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [effort, setEffort] = useState<'let' | 'middel' | 'svær'>('let');
  const [familyId, setFamilyId] = useState<string>('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');

  // MOBIL FILTER DRAWER
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Responsiv breakpoint
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 640); // Tailwind's "sm"
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadPositions();
    loadCategories();
    loadFamilies();
    loadTags();
  }, []);

  useEffect(() => {
    if (!categoryId && categories.length > 0) setCategoryId(categories[0].id);
    if (!familyId && families.length > 0) setFamilyId(families[0].id);
  }, [categories, families]);

  // Reset pagination hvis filter ændres
  useEffect(() => { setCurrentPage(1); }, [selectedCategories, selectedFamilies, selectedTags]);

  // Hent alle sexstillinger med tags
  async function loadPositions() {
    const { data, error } = await supabase
      .from('sex_positions')
      .select(`
        id, name, image_url, description, status, tried_count, category_id, effort, family_id,
        category:sex_position_categories(name),
        tags:sex_position_tag_links(tag_id)
      `)
      .order('name');
    if (error) return;
    if (data) {
      const mapped = data.map((pos: any) => ({
        ...pos,
        category_name: pos.category?.name || '',
        category_id: pos.category_id || '',
        effort: pos.effort || 'let',
        family_id: pos.family_id || '',
        tags: pos.tags || [],
      }));
      setPositions(mapped);
    }
  }

  async function loadCategories() {
    const { data, error } = await supabase
      .from('sex_position_categories')
      .select('id, name')
      .order('name');
    if (!error && data) setCategories(data);
  }

  async function loadFamilies() {
    const { data, error } = await supabase
      .from('sex_position_families')
      .select('id, name')
      .order('name');
    if (!error && data) setFamilies(data);
  }

  async function loadTags() {
    const { data, error } = await supabase
      .from('sex_position_tags')
      .select('id, name')
      .order('name');
    if (!error && data) setTags(data);
  }

  function openModalView(pos: SexPosition) {
    setActivePosition(pos);
    setEditMode(false);
    setOpen(true);
    setName(pos.name || '');
    setDescription(pos.description || '');
    setStatus(pos.status || 'ny');
    setTriedCount(pos.tried_count || 0);
    setImageUrl(pos.image_url || '');
    setImageFile(null);
    setCategoryId(pos.category_id || categories[0]?.id || '');
    setEffort(pos.effort || 'let');
    setFamilyId(pos.family_id || families[0]?.id || '');
    setSelectedTagIds(pos.tags ? pos.tags.map(t => t.tag_id) : []);
  }

  function openModalEdit(pos?: SexPosition) {
    setEditMode(true);
    setOpen(true);
    if (pos) {
      setActivePosition(pos);
      setName(pos.name || '');
      setDescription(pos.description || '');
      setStatus(pos.status || 'ny');
      setTriedCount(pos.tried_count || 0);
      setImageUrl(pos.image_url || '');
      setImageFile(null);
      setCategoryId(pos.category_id || categories[0]?.id || '');
      setEffort(pos.effort || 'let');
      setFamilyId(pos.family_id || families[0]?.id || '');
      setSelectedTagIds(pos.tags ? pos.tags.map(t => t.tag_id) : []);
    } else {
      setActivePosition(null);
      setName('');
      setDescription('');
      setStatus('ny');
      setTriedCount(0);
      setImageUrl('');
      setImageFile(null);
      setCategoryId(categories[0]?.id || '');
      setEffort('let');
      setFamilyId(families[0]?.id || '');
      setSelectedTagIds([]);
    }
    setNewCategoryName('');
    setNewFamilyName('');
    setNewTagName('');
  }

  async function handleSave() {
    let uploadedUrl = imageUrl;
    if (imageFile) {
      setUploading(true);
      const ext = imageFile.name.split('.').pop();
      const fileName = `${activePosition?.id || Date.now()}.${ext}`;
      const { error } = await supabase
        .storage
        .from('sex-positions-images')
        .upload(fileName, imageFile, { upsert: true });
      if (!error) {
        const { data } = supabase
          .storage
          .from('sex-positions-images')
          .getPublicUrl(fileName);
        if (data?.publicUrl) {
          uploadedUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
          setImageUrl(uploadedUrl);
        }
      }
      setUploading(false);
    }
    const values = {
      name: name.trim(),
      description: description.trim(),
      status,
      tried_count: triedCount,
      image_url: uploadedUrl,
      category_id: categoryId || null,
      effort,
      family_id: familyId || null,
    };
    if (activePosition) {
      await supabase.from('sex_positions').update(values).eq('id', activePosition.id);
      await supabase.from('sex_position_tag_links').delete().eq('sex_position_id', activePosition.id);
      for (const tagId of selectedTagIds) {
        await supabase.from('sex_position_tag_links').insert({ sex_position_id: activePosition.id, tag_id: tagId });
      }
    } else {
      const { data, error } = await supabase.from('sex_positions').insert([values]).select().single();
      if (data && data.id) {
        for (const tagId of selectedTagIds) {
          await supabase.from('sex_position_tag_links').insert({ sex_position_id: data.id, tag_id: tagId });
        }
      }
    }
    setOpen(false);
    await loadPositions();
  }

  async function handleDelete() {
    if (!activePosition) return;
    if (!confirm('Vil du slette denne stilling?')) return;
    await supabase.from('sex_positions').delete().eq('id', activePosition.id);
    setOpen(false);
    await loadPositions();
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    const { data, error } = await supabase
      .from('sex_position_categories')
      .insert([{ name: newCategoryName.trim() }])
      .select()
      .single();
    if (!error && data) {
      setCategories(prev => [...prev, data]);
      setCategoryId(data.id);
      setNewCategoryName('');
    }
  }

  async function handleCreateFamily() {
    if (!newFamilyName.trim()) return;
    const { data, error } = await supabase
      .from('sex_position_families')
      .insert([{ name: newFamilyName.trim() }])
      .select()
      .single();
    if (!error && data) {
      setFamilies(prev => [...prev, data]);
      setFamilyId(data.id);
      setNewFamilyName('');
    }
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return;
    const { data, error } = await supabase
      .from('sex_position_tags')
      .insert([{ name: newTagName.trim() }])
      .select()
      .single();
    if (!error && data) {
      setTags(prev => [...prev, data]);
      setSelectedTagIds(prev => [...prev, data.id]);
      setNewTagName('');
    }
  }

  const badgeClass = "inline-flex items-center rounded-full px-2 py-0 text-xs gap-1 font-normal";

  // === FILTERING + PAGINATION ===
  const filteredPositions = positions.filter(pos => {
    const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(pos.category_id || '');
    const matchFamily = selectedFamilies.length === 0 || selectedFamilies.includes(pos.family_id || '');
    const tagIdsForPos = pos.tags ? pos.tags.map(t => t.tag_id) : [];
    const matchTags =
      selectedTags.length === 0 ||
      selectedTags.some(tagId => tagIdsForPos.includes(tagId));
    return matchCategory && matchFamily && matchTags;
  });

  const totalPages = Math.ceil(filteredPositions.length / pageSize);
  const paginatedPositions = filteredPositions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Mobil-filter-drawer helpers (lokal kopi til visning)
  const [drawerCategories, setDrawerCategories] = useState<string[]>([]);
  const [drawerFamilies, setDrawerFamilies] = useState<string[]>([]);
  const [drawerTags, setDrawerTags] = useState<string[]>([]);
  useEffect(() => {
    if (filterDrawerOpen) {
      setDrawerCategories(selectedCategories);
      setDrawerFamilies(selectedFamilies);
      setDrawerTags(selectedTags);
    }
  }, [filterDrawerOpen, selectedCategories, selectedFamilies, selectedTags]);

  // Brug drawerens filtre på “vis resultater”
  const applyDrawerFilters = () => {
    setSelectedCategories(drawerCategories);
    setSelectedFamilies(drawerFamilies);
    setSelectedTags(drawerTags);
    setFilterDrawerOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-2 sm:px-4">
      {/* Header + Tilføj-knap */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sexstillinger – Inspiration</h1>
        <button
          className="btn btn-primary px-4 py-2 rounded text-white bg-indigo-600 hover:bg-indigo-700 transition"
          onClick={() => openModalEdit()}
        >
          + Tilføj
        </button>
      </div>
      <p className="text-gray-500 text-sm mb-6">
        Der er <span className="font-semibold">{positions.length}</span> stillinger til inspiration
      </p>

      {/* === FILTER-BAR ELLER FILTER-KNAP === */}
      {!isMobile ? (
        <div className="mb-6">
          {/* Kategori-chips */}
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge
              className={selectedCategories.length === 0 ? 'bg-indigo-600 text-white cursor-pointer' : 'cursor-pointer'}
              onClick={() => setSelectedCategories([])}
            >
              Alle kategorier
            </Badge>
            {categories.map(cat => (
              <Badge
                key={cat.id}
                className={`${selectedCategories.includes(cat.id) ? 'bg-indigo-600 text-white' : ''} cursor-pointer`}
                onClick={() => {
                  setSelectedCategories(selected =>
                    selected.includes(cat.id)
                      ? selected.filter(id => id !== cat.id)
                      : [...selected, cat.id]
                  );
                }}
              >
                {cat.name}
              </Badge>
            ))}
          </div>
          {/* Familie-chips */}
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge
              className={selectedFamilies.length === 0 ? 'bg-blue-600 text-white cursor-pointer' : 'cursor-pointer'}
              onClick={() => setSelectedFamilies([])}
            >
              Alle familier
            </Badge>
            {families.map(fam => (
              <Badge
                key={fam.id}
                className={`${selectedFamilies.includes(fam.id) ? 'bg-blue-600 text-white' : ''} cursor-pointer`}
                onClick={() => {
                  setSelectedFamilies(selected =>
                    selected.includes(fam.id)
                      ? selected.filter(id => id !== fam.id)
                      : [...selected, fam.id]
                  );
                }}
              >
                {fam.name}
              </Badge>
            ))}
          </div>
          {/* Tag-chips */}
          <div className="flex flex-wrap gap-2">
            <Badge
              className={selectedTags.length === 0 ? 'bg-purple-600 text-white cursor-pointer' : 'cursor-pointer'}
              onClick={() => setSelectedTags([])}
            >
              Alle tags
            </Badge>
            {tags.map(tag => (
              <Badge
                key={tag.id}
                className={`${selectedTags.includes(tag.id) ? 'bg-purple-600 text-white' : ''} cursor-pointer`}
                onClick={() => {
                  setSelectedTags(selected =>
                    selected.includes(tag.id)
                      ? selected.filter(id => id !== tag.id)
                      : [...selected, tag.id]
                  );
                }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <button
          className="btn btn-outline w-full mb-6"
          onClick={() => setFilterDrawerOpen(true)}
        >
          Filtrer
        </button>
      )}

      {/* === FILTER-DRAWER (MOBIL) === */}
      {isMobile && filterDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-end sm:hidden">
          <div className="w-full bg-white rounded-t-2xl p-6 max-h-[70vh] overflow-y-auto shadow-lg">
            <div className="mb-3 font-semibold text-lg">Filtrer stillinger</div>
            {/* Kategori */}
            <div className="mb-4">
              <div className="mb-1 text-sm text-gray-600">Kategorier</div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  className={drawerCategories.length === 0 ? 'bg-indigo-600 text-white cursor-pointer' : 'cursor-pointer'}
                  onClick={() => setDrawerCategories([])}
                >
                  Alle kategorier
                </Badge>
                {categories.map(cat => (
                  <Badge
                    key={cat.id}
                    className={`${drawerCategories.includes(cat.id) ? 'bg-indigo-600 text-white' : ''} cursor-pointer`}
                    onClick={() => {
                      setDrawerCategories(selected =>
                        selected.includes(cat.id)
                          ? selected.filter(id => id !== cat.id)
                          : [...selected, cat.id]
                      );
                    }}
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>
            {/* Familie */}
            <div className="mb-4">
              <div className="mb-1 text-sm text-gray-600">Familier</div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  className={drawerFamilies.length === 0 ? 'bg-blue-600 text-white cursor-pointer' : 'cursor-pointer'}
                  onClick={() => setDrawerFamilies([])}
                >
                  Alle familier
                </Badge>
                {families.map(fam => (
                  <Badge
                    key={fam.id}
                    className={`${drawerFamilies.includes(fam.id) ? 'bg-blue-600 text-white' : ''} cursor-pointer`}
                    onClick={() => {
                      setDrawerFamilies(selected =>
                        selected.includes(fam.id)
                          ? selected.filter(id => id !== fam.id)
                          : [...selected, fam.id]
                      );
                    }}
                  >
                    {fam.name}
                  </Badge>
                ))}
              </div>
            </div>
            {/* Tags */}
            <div>
              <div className="mb-1 text-sm text-gray-600">Tags</div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  className={drawerTags.length === 0 ? 'bg-purple-600 text-white cursor-pointer' : 'cursor-pointer'}
                  onClick={() => setDrawerTags([])}
                >
                  Alle tags
                </Badge>
                {tags.map(tag => (
                  <Badge
                    key={tag.id}
                    className={`${drawerTags.includes(tag.id) ? 'bg-purple-600 text-white' : ''} cursor-pointer`}
                    onClick={() => {
                      setDrawerTags(selected =>
                        selected.includes(tag.id)
                          ? selected.filter(id => id !== tag.id)
                          : [...selected, tag.id]
                      );
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
            <button
              className="btn btn-primary w-full mt-6"
              onClick={applyDrawerFilters}
            >
              Vis {positions.filter(pos => {
                const matchCategory = drawerCategories.length === 0 || drawerCategories.includes(pos.category_id || '');
                const matchFamily = drawerFamilies.length === 0 || drawerFamilies.includes(pos.family_id || '');
                const tagIdsForPos = pos.tags ? pos.tags.map(t => t.tag_id) : [];
                const matchTags =
                  drawerTags.length === 0 ||
                  drawerTags.some(tagId => tagIdsForPos.includes(tagId));
                return matchCategory && matchFamily && matchTags;
              }).length} resultater
            </button>
            <button
              className="w-full text-gray-400 underline mt-2"
              onClick={() => setFilterDrawerOpen(false)}
            >
              Annuller
            </button>
          </div>
        </div>
      )}

      {/* === CARDS === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {paginatedPositions.map(pos => {
          const catIcon = emojiIcons[pos.category_name || ""] || emojiIcons.default;
          const familyName = families.find(f => f.id === pos.family_id)?.name || "";
          return (
            <div
              key={pos.id}
              className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition"
              onClick={() => openModalView(pos)}
            >
              {pos.image_url ? (
                <img src={pos.image_url} alt={pos.name} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-400">
                  <span>Intet billede</span>
                </div>
              )}
              <div className="px-6 py-5 flex-1 flex flex-col">
                <h2 className="text-base mb-1">{pos.name}</h2>
                <p className="text-gray-600 text-sm mb-3">
                  {pos.description && pos.description.length > 140
                    ? pos.description.slice(0, 140) + '…'
                    : pos.description}
                </p>
                <div className="flex gap-2 items-center mt-auto flex-wrap">
                  {pos.category_name && (
                    <Badge className={`${badgeClass} bg-pink-100 text-pink-700`}>
                      <span className="text-base">{catIcon}</span>
                      {pos.category_name}
                    </Badge>
                  )}
                  {familyName && (
                    <Badge className={`${badgeClass} bg-blue-100 text-blue-700`}>
                      <span className="text-base">👨‍👩‍👧‍👦</span>
                      {familyName}
                    </Badge>
                  )}
                  {pos.effort && (
                    <Badge className={`${badgeClass} ${effortMap[pos.effort].color}`}>
                      <span className="text-base">{effortMap[pos.effort].icon}</span>
                      {effortMap[pos.effort].text}
                    </Badge>
                  )}
                  {pos.status && (
                    <Badge className={`${badgeClass} ${statusMap[pos.status].color}`}>
                      <span className="text-base">{statusMap[pos.status].icon}</span>
                      {statusMap[pos.status].text}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            className="btn btn-outline px-3 py-1"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
          >
            Forrige
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`btn px-3 py-1 ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'btn-outline'}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="btn btn-outline px-3 py-1"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
          >
            Næste
          </button>
        </div>
      )}



      {/* === MODAL === */}
      <Dialog open={open} onClose={() => setOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-lg mx-auto space-y-6 max-h-[90vh] overflow-y-auto">
          {/* View-mode */}
          {!editMode && activePosition && (
            <>
              <h2 className="text-xl font-bold mb-2">{activePosition.name}</h2>
              {activePosition.image_url && (
                <img src={activePosition.image_url} alt="Stillingsbillede" className="w-full h-64 object-contain rounded mb-2" />
              )}
              <p className="mb-2">{activePosition.description}</p>
              <div className="flex gap-2 items-center mb-2 flex-wrap">
                {activePosition.category_id && (
                  <Badge className={`${badgeClass} bg-pink-100 text-pink-700`}>
                    <span className="text-base">
                      {emojiIcons[categories.find(c => c.id === activePosition.category_id)?.name || ""] || emojiIcons.default}
                    </span>
                    {categories.find(c => c.id === activePosition.category_id)?.name || ''}
                  </Badge>
                )}
                {activePosition.family_id && families.length > 0 && (
                  <Badge className={`${badgeClass} bg-blue-100 text-blue-700`}>
                    <span className="text-base">👨‍👩‍👧‍👦</span>
                    {families.find(f => f.id === activePosition.family_id)?.name || ""}
                  </Badge>
                )}
                {activePosition.effort && (
                  <Badge className={`${badgeClass} ${effortMap[activePosition.effort].color}`}>
                    <span className="text-base">{effortMap[activePosition.effort].icon}</span>
                    {effortMap[activePosition.effort].text}
                  </Badge>
                )}
                {activePosition.status && (
                  <Badge className={`${badgeClass} ${statusMap[activePosition.status].color}`}>
                    <span className="text-base">{statusMap[activePosition.status].icon}</span>
                    {statusMap[activePosition.status].text}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {activePosition.tried_count && activePosition.tried_count > 0 && (
                  <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">
                    {activePosition.tried_count}x
                  </span>
                )}
              </div>
              {/* Tags-badges nederst */}
              {activePosition.tags && activePosition.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-4">
                  {activePosition.tags.map(tagLink => {
                    const tag = tags.find(t => t.id === tagLink.tag_id);
                    if (!tag) return null;
                    return (
                      <Badge key={tag.id} className="inline-flex items-center rounded-full px-2 py-0 text-xs gap-1 font-normal bg-purple-100 text-purple-700">
                        <span className="text-base">🏷️</span>
                        {tag.name}
                      </Badge>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-end mt-4">
                <button onClick={() => setEditMode(true)} className="btn btn-primary">Rediger</button>
              </div>
            </>
          )}
          {/* Edit-mode */}
          {editMode && (
            <>
              <h2 className="text-xl font-bold mb-2">{activePosition ? 'Rediger stilling' : 'Tilføj ny stilling'}</h2>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 mb-2"
                placeholder="Navn"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <textarea
                className="w-full border rounded px-3 py-2 mb-2"
                placeholder="Beskrivelse"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              {/* Vælg eller opret kategori */}
              <label className="block mb-2">
                Kategori:
                <select
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                >
                  <option value="">-- Vælg kategori --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                  <option value="__new">+ Opret ny kategori…</option>
                </select>
              </label>
              {categoryId === '__new' && (
                <div className="mb-2">
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 mt-1"
                    placeholder="Navn på ny kategori"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                  />
                  <button
                    className="mt-2 btn btn-primary"
                    onClick={handleCreateCategory}
                  >
                    Opret kategori
                  </button>
                </div>
              )}
              {/* Vælg eller opret familie */}
              <label className="block mb-2">
                Familie:
                <select
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={familyId}
                  onChange={e => setFamilyId(e.target.value)}
                >
                  <option value="">-- Vælg familie --</option>
                  {families.map(fam => (
                    <option key={fam.id} value={fam.id}>{fam.name}</option>
                  ))}
                  <option value="__new">+ Opret ny familie…</option>
                </select>
              </label>
              {familyId === '__new' && (
                <div className="mb-2">
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 mt-1"
                    placeholder="Navn på ny familie"
                    value={newFamilyName}
                    onChange={e => setNewFamilyName(e.target.value)}
                  />
                  <button
                    className="mt-2 btn btn-primary"
                    onClick={handleCreateFamily}
                  >
                    Opret familie
                  </button>
                </div>
              )}
              {/* Effort / Sværhedsgrad */}
              <div className="mb-2">
                <label className="block font-medium mb-1">Sværhedsgrad:</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={effort}
                  onChange={e => setEffort(e.target.value as 'let' | 'middel' | 'svær')}
                >
                  <option value="let">Let</option>
                  <option value="middel">Middel</option>
                  <option value="svær">Svær</option>
                </select>
              </div>
              {/* Tags */}
              <div className="mb-2">
                <label className="block font-medium mb-1">Tags:</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <Badge
                      key={tag.id}
                      className={`cursor-pointer px-2 py-0 text-xs rounded-full ${
                        selectedTagIds.includes(tag.id)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                      onClick={() => {
                        setSelectedTagIds(prev =>
                          prev.includes(tag.id)
                            ? prev.filter(id => id !== tag.id)
                            : [...prev, tag.id]
                        );
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                  <Badge
                    className="cursor-pointer bg-green-100 text-green-800"
                    onClick={() => setNewTagName(' ')}
                  >
                    + Opret tag
                  </Badge>
                </div>
                {newTagName !== '' && (
                  <div className="flex gap-2 mt-1">
                    <input
                      className="w-full border rounded px-3 py-2"
                      placeholder="Nyt tag"
                      value={newTagName.trimStart()}
                      onChange={e => setNewTagName(e.target.value)}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleCreateTag}
                    >
                      Tilføj
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mb-2">
                <label className="flex items-center gap-2">
                  Status:
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="border rounded px-2 py-1 ml-2"
                  >
                    <option value="ny">Ny</option>
                    <option value="prøvet">Prøvet</option>
                    <option value="afvist">Afvist</option>
                  </select>
                </label>
                {status === 'prøvet' && (
                  <label className="flex items-center gap-1">
                    Antal gange:
                    <input
                      type="number"
                      value={triedCount}
                      onChange={e => setTriedCount(Number(e.target.value))}
                      min={1}
                      className="border rounded px-2 py-1 w-16 ml-2"
                    />
                  </label>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label>
                  Billede:
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={e => setImageFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                </label>
                {imageUrl && !imageFile && (
                  <img src={imageUrl} alt="Nu" className="w-32 h-32 rounded object-cover mt-2" />
                )}
                {imageFile && (
                  <span className="text-sm text-gray-500">Billede valgt: {imageFile.name}</span>
                )}
              </div>
              {/* Tags-badges nederst */}
              {selectedTagIds.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-4">
                  {selectedTagIds.map(tagId => {
                    const tag = tags.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <Badge key={tag.id} className="inline-flex items-center rounded-full px-2 py-0 text-xs gap-1 font-normal bg-purple-100 text-purple-700">
                        <span className="text-base">🏷️</span>
                        {tag.name}
                      </Badge>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-between gap-2 mt-4">
                {activePosition && (
                  <button
                    onClick={handleDelete}
                    className="btn btn-outline text-red-600"
                  >
                    Slet
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={handleSave}
                    className="btn btn-primary"
                    disabled={uploading || !name.trim()}
                  >
                    {activePosition ? 'Gem ændringer' : 'Opret'}
                  </button>
                  <button onClick={() => {
                    setEditMode(false);
                    if (activePosition) openModalView(activePosition);
                  }} className="btn btn-outline">Annuller</button>
                </div>
              </div>
            </>
          )}
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}
