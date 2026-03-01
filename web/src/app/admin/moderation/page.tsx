'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Loader2,
  RefreshCw,
  LayoutGrid,
  List,
  EyeOff,
  Eye,
} from 'lucide-react';
import ModerationStats from '@/components/admin/ModerationStats';
import FeedPostGrid from '@/components/admin/FeedPostGrid';
import FeedPostTable from '@/components/admin/FeedPostTable';
import FeedPostDetail from '@/components/admin/FeedPostDetail';
import NoticeList from '@/components/admin/NoticeList';
import type { FeedPost, Notice, ModerationStats as StatsType, FeedPostSource } from '@/types/moderation';

async function apiFetch(path: string, user: { getIdToken: () => Promise<string> }, options?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

export default function ModerationPage() {
  const { user } = useAuth();

  // Data
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [stats, setStats] = useState<StatsType | null>(null);

  // Loading & errors
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View toggle (grid/table) for feed posts
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Feed post filters
  const [postSearch, setPostSearch] = useState('');
  const [postStatus, setPostStatus] = useState('all');
  const [postSource, setPostSource] = useState('all');

  // Notice filters
  const [noticeSearch, setNoticeSearch] = useState('');
  const [noticeStatus, setNoticeStatus] = useState('all');

  // Selection (feed posts)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Toggling states
  const [togglingPostIds, setTogglingPostIds] = useState<Set<string>>(new Set());
  const [togglingNoticeIds, setTogglingNoticeIds] = useState<Set<string>>(new Set());
  const [bulkHiding, setBulkHiding] = useState(false);

  // Detail modal
  const [detailPost, setDetailPost] = useState<FeedPost | null>(null);

  // Fetch functions
  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoadingPosts(true);
    try {
      const res = await apiFetch('/api/admin/moderation/feed-posts', user);
      if (!res.ok) throw new Error();
      setPosts(await res.json());
    } catch {
      setError('Error al cargar las publicaciones');
    } finally {
      setLoadingPosts(false);
    }
  }, [user]);

  const fetchNotices = useCallback(async () => {
    if (!user) return;
    setLoadingNotices(true);
    try {
      const res = await apiFetch('/api/admin/moderation/notices', user);
      if (!res.ok) throw new Error();
      setNotices(await res.json());
    } catch {
      setError('Error al cargar los anuncios');
    } finally {
      setLoadingNotices(false);
    }
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    setLoadingStats(true);
    try {
      const res = await apiFetch('/api/admin/moderation/stats', user);
      if (!res.ok) throw new Error();
      setStats(await res.json());
    } catch {
      // Stats failure is non-critical
    } finally {
      setLoadingStats(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();
    fetchNotices();
    fetchStats();
  }, [fetchPosts, fetchNotices, fetchStats]);

  // Client-side filtering for posts
  const filteredPosts = useMemo(() => {
    let result = posts;
    if (postStatus === 'visible') result = result.filter((p) => !p.isHidden);
    else if (postStatus === 'hidden') result = result.filter((p) => p.isHidden);
    if (postSource !== 'all') result = result.filter((p) => p.source === postSource);
    if (postSearch) {
      const q = postSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.authorName.toLowerCase().includes(q) ||
          (p.caption?.toLowerCase().includes(q) ?? false)
      );
    }
    return result;
  }, [posts, postStatus, postSource, postSearch]);

  // Client-side filtering for notices
  const filteredNotices = useMemo(() => {
    let result = notices;
    if (noticeStatus === 'visible') result = result.filter((n) => !n.isHidden);
    else if (noticeStatus === 'hidden') result = result.filter((n) => n.isHidden);
    if (noticeSearch) {
      const q = noticeSearch.toLowerCase();
      result = result.filter(
        (n) =>
          n.authorName.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q)
      );
    }
    return result;
  }, [notices, noticeStatus, noticeSearch]);

  // Toggle hide/show for a single feed post
  async function handleTogglePost(post: FeedPost) {
    if (!user) return;
    setTogglingPostIds((prev) => new Set(prev).add(post.id));
    try {
      const res = await apiFetch(`/api/admin/moderation/feed-posts/${post.id}`, user, {
        method: 'PUT',
        body: JSON.stringify({ isHidden: !post.isHidden }),
      });
      if (!res.ok) throw new Error();
      const updated: FeedPost = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      // Update detail modal if open
      if (detailPost?.id === updated.id) setDetailPost(updated);
      // Refresh stats
      fetchStats();
    } catch {
      setError('Error al actualizar la publicación');
    } finally {
      setTogglingPostIds((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
  }

  // Bulk hide selected posts
  async function handleBulkHide(hide: boolean) {
    if (!user || selectedIds.size === 0) return;
    setBulkHiding(true);
    try {
      const res = await apiFetch('/api/admin/moderation/feed-posts/bulk-hide', user, {
        method: 'POST',
        body: JSON.stringify({ postIds: Array.from(selectedIds), isHidden: hide }),
      });
      if (!res.ok) throw new Error();
      setPosts((prev) =>
        prev.map((p) => (selectedIds.has(p.id) ? { ...p, isHidden: hide } : p))
      );
      setSelectedIds(new Set());
      fetchStats();
    } catch {
      setError('Error al actualizar las publicaciones');
    } finally {
      setBulkHiding(false);
    }
  }

  // Toggle hide/show for a single notice
  async function handleToggleNotice(notice: Notice) {
    if (!user) return;
    setTogglingNoticeIds((prev) => new Set(prev).add(notice.id));
    try {
      const res = await apiFetch(`/api/admin/moderation/notices/${notice.id}`, user, {
        method: 'PUT',
        body: JSON.stringify({ isHidden: !notice.isHidden }),
      });
      if (!res.ok) throw new Error();
      const updated: Notice = await res.json();
      setNotices((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      fetchStats();
    } catch {
      setError('Error al actualizar el anuncio');
    } finally {
      setTogglingNoticeIds((prev) => {
        const next = new Set(prev);
        next.delete(notice.id);
        return next;
      });
    }
  }

  function handleRefresh() {
    setError(null);
    fetchPosts();
    fetchNotices();
    fetchStats();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-heading-4 text-charcoal">Moderación</h1>
          <p className="text-charcoal/60 type-body-small mt-1">
            Gestión del feed de fotos y tablón de anuncios
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <ModerationStats stats={stats} loading={loadingStats} />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={handleRefresh} className="ml-auto">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Reintentar
          </Button>
        </div>
      )}

      {/* Main tabs */}
      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="feed">
            Feed de fotos
            {posts.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">
                {posts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notices">
            Tablón de anuncios
            {notices.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">
                {notices.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Feed Posts Tab */}
        <TabsContent value="feed" className="space-y-4">
          {/* Feed filters row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
              <Input
                placeholder="Buscar por autor o descripción..."
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={postStatus} onValueChange={setPostStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="visible">Visibles</SelectItem>
                <SelectItem value="hidden">Ocultas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={postSource} onValueChange={setPostSource}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Fuente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fuentes</SelectItem>
                <SelectItem value="unfiltered">Sin filtro</SelectItem>
                <SelectItem value="import">Importada</SelectItem>
                <SelectItem value="share_extension">Compartida</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border border-charcoal/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 transition-colors ${
                  viewMode === 'grid' ? 'bg-charcoal text-white' : 'bg-white text-charcoal/60 hover:text-charcoal'
                }`}
                title="Vista cuadrícula"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 transition-colors ${
                  viewMode === 'table' ? 'bg-charcoal text-white' : 'bg-white text-charcoal/60 hover:text-charcoal'
                }`}
                title="Vista tabla"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 bg-ocean/5 border border-ocean/20 rounded-lg px-4 py-2.5">
              <Badge variant="secondary">
                {selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''}
              </Badge>
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkHide(true)}
                  disabled={bulkHiding}
                >
                  {bulkHiding ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Ocultar seleccionadas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkHide(false)}
                  disabled={bulkHiding}
                >
                  {bulkHiding ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Mostrar seleccionadas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Deseleccionar
                </Button>
              </div>
            </div>
          )}

          {/* Content */}
          {loadingPosts ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-ocean" />
            </div>
          ) : viewMode === 'grid' ? (
            <FeedPostGrid
              posts={filteredPosts}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onToggleHidden={handleTogglePost}
              onViewDetail={setDetailPost}
              togglingIds={togglingPostIds}
            />
          ) : (
            <FeedPostTable
              posts={filteredPosts}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onToggleHidden={handleTogglePost}
              onViewDetail={setDetailPost}
              togglingIds={togglingPostIds}
            />
          )}
        </TabsContent>

        {/* Notices Tab */}
        <TabsContent value="notices" className="space-y-4">
          {/* Notice filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
              <Input
                placeholder="Buscar por autor o contenido..."
                value={noticeSearch}
                onChange={(e) => setNoticeSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={noticeStatus} onValueChange={setNoticeStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="visible">Visibles</SelectItem>
                <SelectItem value="hidden">Ocultos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notices content */}
          {loadingNotices ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-ocean" />
            </div>
          ) : (
            <NoticeList
              notices={filteredNotices}
              onToggleHidden={handleToggleNotice}
              togglingIds={togglingNoticeIds}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Feed post detail modal */}
      <FeedPostDetail
        post={detailPost}
        open={!!detailPost}
        onOpenChange={(open) => { if (!open) setDetailPost(null); }}
        onToggleHidden={handleTogglePost}
        toggling={detailPost ? togglingPostIds.has(detailPost.id) : false}
      />
    </div>
  );
}
