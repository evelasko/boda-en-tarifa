'use client';

import { Image, MessageSquare, Eye, EyeOff, Camera, Upload, Share2 } from 'lucide-react';
import type { ModerationStats as Stats } from '@/types/moderation';

interface ModerationStatsProps {
  stats: Stats | null;
  loading: boolean;
}

export default function ModerationStats({ stats, loading }: ModerationStatsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-charcoal/10 p-4 animate-pulse">
            <div className="h-3 bg-charcoal/10 rounded w-20 mb-2" />
            <div className="h-7 bg-charcoal/10 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard
        label="Publicaciones"
        value={stats.totalPosts}
        icon={<Image className="h-4 w-4" />}
      />
      <StatCard
        label="Visibles"
        value={stats.visiblePosts}
        icon={<Eye className="h-4 w-4" />}
        variant="sage"
      />
      <StatCard
        label="Ocultas"
        value={stats.hiddenPosts}
        icon={<EyeOff className="h-4 w-4" />}
        variant="muted"
      />
      <StatCard
        label="Anuncios"
        value={stats.totalNotices}
        icon={<MessageSquare className="h-4 w-4" />}
      />
      <StatCard
        label="Sin filtro"
        value={stats.sourceBreakdown.unfiltered}
        icon={<Camera className="h-4 w-4" />}
        variant="ocean"
      />
      <StatCard
        label="Importadas"
        value={stats.sourceBreakdown.import + stats.sourceBreakdown.share_extension}
        icon={<Upload className="h-4 w-4" />}
        variant="ocean"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  variant?: 'sage' | 'ocean' | 'muted';
}) {
  const colorClasses = {
    sage: 'text-sage',
    ocean: 'text-ocean',
    muted: 'text-charcoal/50',
  };
  const valueColor = variant ? colorClasses[variant] : 'text-charcoal';

  return (
    <div className="bg-white rounded-lg border border-charcoal/10 p-4">
      <div className="flex items-center gap-2 text-charcoal/60 type-body-small mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}
