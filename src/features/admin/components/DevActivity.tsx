/**
 * src/features/admin/components/DevActivity.tsx
 *
 * DevActivity dashboard card displaying the 5 most recent commit messages
 * from the repository configured in environment variables via GithubService.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  GitCommit,
  Github,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  GitBranch,
  Calendar,
  User,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GithubService, CommitItem } from '../../../services/githubService';

interface DevActivityProps {
  limit?: number;
  className?: string;
  onViewAll?: () => void;
}

export const DevActivity: React.FC<DevActivityProps> = ({
  limit = 5,
  className = '',
  onViewAll,
}) => {
  const [commits, setCommits] = useState<CommitItem[]>([]);
  const [repo, setRepo] = useState<string>('nedtwistmovies-star/FindAba-OS');
  const [branch, setBranch] = useState<string>('main');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  const loadCommits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await GithubService.fetchCommitHistory(limit);
      if (response.success && response.commits) {
        setCommits(response.commits.slice(0, limit));
        if (response.repo) setRepo(response.repo);
        if (response.branch) setBranch(response.branch);
        setLastRefreshed(new Date());
      } else {
        throw new Error(response.message || 'No commits found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve repository activity');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadCommits();
  }, [loadCommits]);

  const handleCopySha = (sha: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      id="dev-activity-card"
      className={`bg-white/5 border border-white/10 rounded-[2.5rem] p-6 lg:p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-between transition-all hover:border-white/20 ${className}`}
    >
      {/* Card Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-aba-green/10 border border-aba-green/30 flex items-center justify-center text-aba-green shadow-[0_0_20px_rgba(0,140,82,0.15)]">
              <GitCommit size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white uppercase">
                  Dev Activity
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-aba-gold/10 border border-aba-gold/30 text-aba-gold text-[9px] font-black uppercase tracking-widest">
                  Live Stream
                </span>
              </div>
              <p className="text-[11px] text-white/50 font-medium">
                Latest commits from environment repository
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="dev-activity-refresh-btn"
              onClick={loadCommits}
              disabled={loading}
              title="Refresh commit stream"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5 transition-all disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-aba-gold' : ''} />
            </button>
            <a
              id="dev-activity-github-link"
              href={`https://github.com/${repo}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View repository on GitHub"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5 transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <Github size={15} />
              <ExternalLink size={12} className="opacity-60" />
            </a>
          </div>
        </div>

        {/* Repository & Branch Meta Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-white/5 pb-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/40 border border-white/5 text-[10px] text-white/80 font-mono">
            <Github size={12} className="text-aba-gold" />
            <span className="font-bold">{repo}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 text-[10px] text-white/60 font-mono">
            <GitBranch size={12} className="text-aba-green" />
            <span>{branch}</span>
          </div>
          {lastRefreshed && (
            <div className="flex items-center gap-1 text-[10px] text-white/40 ml-auto font-mono">
              <Clock size={11} />
              <span>Synced {formatRelativeTime(lastRefreshed.toISOString())}</span>
            </div>
          )}
        </div>
      </div>

      {/* Commit Stream Content */}
      <div className="my-5 space-y-3">
        {loading && commits.length === 0 ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse flex items-center px-4 gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/10 rounded-md w-3/4" />
                  <div className="h-2 bg-white/5 rounded-md w-1/3" />
                </div>
                <div className="w-16 h-5 bg-white/10 rounded-md" />
              </div>
            ))}
          </div>
        ) : error && commits.length === 0 ? (
          <div className="py-8 px-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-center space-y-3">
            <AlertCircle className="mx-auto text-red-400" size={28} />
            <p className="text-xs text-red-200/80 font-medium max-w-sm mx-auto">
              {error}
            </p>
            <button
              onClick={loadCommits}
              className="px-4 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-bold transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : commits.length === 0 ? (
          <div className="py-10 text-center text-white/40 space-y-2">
            <GitCommit size={32} className="mx-auto opacity-30" />
            <p className="text-xs uppercase tracking-widest font-mono">No recent commits recorded</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {commits.map((commit, idx) => {
              const isCopied = copiedSha === commit.sha;
              // Clean commit message: title on top line
              const [title] = commit.message.split('\n');

              return (
                <motion.div
                  key={commit.sha || idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                  className="group relative flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 transition-all duration-200"
                >
                  {/* Author Avatar or Initial */}
                  <div className="relative shrink-0 mt-0.5">
                    {commit.authorAvatar ? (
                      <img
                        src={commit.authorAvatar}
                        alt={commit.authorName}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full border border-white/10 object-cover bg-white/5"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-aba-gold/10 border border-aba-gold/20 flex items-center justify-center text-aba-gold text-xs font-bold">
                        {commit.authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {commit.verified && (
                      <div
                        title="Verified GPG/SSH Signature"
                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-aba-green text-black flex items-center justify-center shadow-md"
                      >
                        <ShieldCheck size={9} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Commit Details */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <a
                        href={commit.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-white/90 group-hover:text-aba-gold truncate transition-colors hover:underline"
                        title={commit.message}
                      >
                        {title}
                      </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/40 font-mono">
                      <span className="text-white/70 font-sans font-medium flex items-center gap-1">
                        <User size={10} className="text-white/40" />
                        {commit.authorName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {formatRelativeTime(commit.date)}
                      </span>
                    </div>
                  </div>

                  {/* Commit SHA Badge & Direct Link */}
                  <div className="shrink-0 flex items-center gap-1.5 mt-0.5">
                    <button
                      onClick={(e) => handleCopySha(commit.sha, e)}
                      title={isCopied ? 'SHA Copied!' : 'Copy full SHA'}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all flex items-center gap-1 ${
                        isCopied
                          ? 'bg-aba-green/20 text-aba-green border border-aba-green/40'
                          : 'bg-black/40 text-aba-gold/90 hover:text-white border border-white/10 hover:border-white/25'
                      }`}
                    >
                      {isCopied ? <Check size={10} /> : <Copy size={10} className="opacity-50" />}
                      <span>{commit.shortSha || commit.sha.substring(0, 7)}</span>
                    </button>
                    <a
                      href={commit.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View Commit Diff on GitHub"
                      className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-white/50">
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="w-2 h-2 rounded-full bg-aba-green animate-ping" />
          <span className="text-aba-green font-bold">Live Git Watcher</span>
        </div>
        {onViewAll ? (
          <button
            onClick={onViewAll}
            className="text-[10px] font-black uppercase tracking-widest text-aba-gold hover:text-white transition-colors"
          >
            Open Git Console →
          </button>
        ) : (
          <a
            href={`https://github.com/${repo}/commits/${branch}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-1"
          >
            All Commits <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  );
};

export default DevActivity;
