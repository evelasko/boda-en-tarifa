'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import {
  type BotMessageRow,
  cloudinaryUrl,
  formatMessageTime,
} from '@/lib/bot-conversations';

function cacheRatio(message: BotMessageRow): number | null {
  const u = message.claudeUsage;
  if (!u || !u.inputTokens) return null;
  const cached = u.cachedReadTokens ?? 0;
  return Math.round((cached / u.inputTokens) * 100);
}

export function ConversationMessageBubble({ message }: { message: BotMessageRow }) {
  const isInbound = message.direction === 'inbound';
  const isOperator = message.senderType === 'operator';
  const ratio = cacheRatio(message);
  const [toolsOpen, setToolsOpen] = useState(false);

  return (
    <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`
          max-w-[min(36rem,85%)] rounded-lg px-4 py-3 border
          ${
            isInbound
              ? 'bg-white border-charcoal/10'
              : isOperator
                ? 'bg-sage/10 border-sage/30'
                : 'bg-ocean/5 border-ocean/20'
          }
        `}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-charcoal/50 mb-1">
          <span className="uppercase tracking-wide font-medium">
            {isInbound ? 'Invitado' : isOperator ? 'Operador' : 'Thora'}
          </span>
          <span>·</span>
          <span>{message.type}</span>
          {message.outcome && (
            <>
              <span>·</span>
              <span
                className={
                  message.outcome === 'error' || message.outcome === 'rate_limited'
                    ? 'text-coral'
                    : ''
                }
              >
                {message.outcome}
              </span>
            </>
          )}
          <span className="ml-auto shrink-0">{formatMessageTime(message.createdAt)}</span>
        </div>

        {message.text && (
          <p className="whitespace-pre-wrap text-sm text-charcoal leading-relaxed">
            {message.text}
          </p>
        )}

        {message.cloudinaryPublicId && (
          <a
            href={cloudinaryUrl(message.cloudinaryPublicId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-ocean hover:underline mt-2"
          >
            Ver media <ExternalLink size={12} />
          </a>
        )}

        {message.templateName && (
          <p className="text-xs text-charcoal/50 mt-1">
            Plantilla: <span className="font-mono">{message.templateName}</span>
          </p>
        )}

        {message.errorMessage && (
          <p className="text-xs text-coral mt-2">{message.errorMessage}</p>
        )}

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 border-t border-charcoal/5 pt-2">
            <button
              type="button"
              onClick={() => setToolsOpen((o) => !o)}
              className="flex items-center gap-1 text-xs text-charcoal/60 hover:text-charcoal"
            >
              {toolsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {message.toolCalls.length} herramienta
              {message.toolCalls.length === 1 ? '' : 's'}
            </button>
            {toolsOpen && (
              <ul className="mt-2 space-y-2">
                {message.toolCalls.map((tc, i) => (
                  <li
                    key={`${tc.name}-${i}`}
                    className="text-[11px] font-mono bg-cream/50 rounded px-2 py-1.5 overflow-x-auto"
                  >
                    <span
                      className={
                        tc.errored ? 'text-coral font-semibold' : 'text-ocean font-semibold'
                      }
                    >
                      {tc.name}
                    </span>
                    {tc.output != null && (
                      <pre className="mt-1 text-charcoal/60 whitespace-pre-wrap break-all">
                        {JSON.stringify(tc.output, null, 2)}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {(message.claudeModel ||
          message.requestId ||
          message.latencyMs != null ||
          ratio != null) && (
          <div className="mt-2 pt-2 border-t border-charcoal/5 text-[10px] text-charcoal/40 font-mono flex flex-wrap gap-x-3 gap-y-0.5">
            {message.claudeModel && <span>model {message.claudeModel}</span>}
            {ratio != null && <span>cache {ratio}%</span>}
            {message.latencyMs != null && <span>{message.latencyMs}ms</span>}
            {message.requestId && (
              <span title={message.requestId}>req {message.requestId.slice(0, 8)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
