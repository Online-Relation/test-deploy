'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface BucketCardProps {
  title: string;
  category?: string;
  imageUrl?: string;
  description?: string;
  goals?: any[];
  users?: { id: string; display_name: string; avatar_url?: string }[];
  onClick: () => void;
}

function getNextSubgoal(goals: any[]) {
  const upcoming = goals
    ? goals.filter((g) => !g.done && g.dueDate).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    : [];
  return upcoming.length > 0 ? upcoming[0] : null;
}

function deadlineStatus(dueDate: string) {
  const today = new Date();
  const date = new Date(dueDate);
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'text-gray-400'; // overskredet
  if (diffDays === 0) return 'text-red-600 font-bold bg-red-100'; // i dag
  if (diffDays <= 3) return 'text-orange-500 font-semibold bg-orange-50'; // meget tæt på
  if (diffDays <= 7) return 'text-yellow-600 bg-yellow-50'; // indenfor en uge
  return 'text-gray-600 bg-gray-100';
}

export default function BucketCard({
  title,
  category,
  imageUrl,
  description,
  goals = [],
  users = [],
  onClick,
}: BucketCardProps) {
  const displayCategory = category && category.trim() !== '' ? category : 'Uden kategori';
  const nearest = getNextSubgoal(goals);
  const ownerUser = nearest ? users.find(u => u.id === nearest.owner) : null;
  const progress = goals.length ? Math.round(goals.filter(g => g.done).length / goals.length * 100) : 0;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition relative"
    >
      {/* Category badge overlay */}
      <div className="absolute top-2 left-2 z-10">
        <Badge variant="default">{displayCategory}</Badge>
      </div>
      {imageUrl && (
        <div className="h-40 w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4 pt-8">
        <h3 className="text-lg font-bold truncate">{title}</h3>

        {/* Ansvarlig og deadline badges */}
       {nearest && (
  <div className="flex items-center gap-2 mt-2 mb-3 flex-wrap">
            {ownerUser?.avatar_url && (
              <img src={ownerUser.avatar_url} alt={ownerUser.display_name} className="w-6 h-6 rounded-full" />
            )}
            <Badge variant="outline">
              👤 {ownerUser?.display_name || 'Ukendt'}
            </Badge>
            {nearest.dueDate && (
              <Badge className={deadlineStatus(nearest.dueDate)}>
                🕒 {new Date(nearest.dueDate).toLocaleDateString()}
              </Badge>
            )}
          </div>
        )}

        {/* Progress bar */}
        {goals.length > 0 && (
          <div className="w-full bg-gray-200 h-2 rounded mb-1">
            <div
              className={`h-2 rounded transition-all duration-300`}
              style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#22c55e' : '#a78bfa' }}
            />
          </div>
        )}
        {goals.length > 0 && (
          <div className="text-xs text-gray-500 mb-1">
            {goals.filter(g => g.done).length}/{goals.length} ({progress}%)
          </div>
        )}

        {description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-3">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
