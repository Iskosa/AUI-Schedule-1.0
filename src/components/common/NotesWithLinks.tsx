import { AlertTriangle, ExternalLink, Info } from 'lucide-react';
import { getNoteSeverity, tokenizeNotes } from '../../utils/links';

interface NotesWithLinksProps {
  notes: string | null | undefined;
  compact?: boolean;
}

export function NotesWithLinks({ notes, compact = false }: NotesWithLinksProps) {
  if (!notes) return null;

  const severity = getNoteSeverity(notes);
  const tokens = tokenizeNotes(notes);

  const boxStyle =
    severity === 'warning'
      ? 'border-amber-500/35 bg-amber-500/10 text-amber-200'
      : severity === 'info'
        ? 'border-sky-500/30 bg-sky-500/10 text-sky-200'
        : 'border-slate-700/70 bg-slate-800/60 text-slate-300';

  const Icon = severity === 'warning' ? AlertTriangle : Info;

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border ${
        compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2.5 text-sm'
      } ${boxStyle}`}
    >
      <Icon
        className={`mt-0.5 shrink-0 ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} ${
          severity === 'warning'
            ? 'text-amber-400'
            : severity === 'info'
              ? 'text-sky-400'
              : 'text-slate-400'
        }`}
      />
      <div className="min-w-0 flex-1 break-words leading-relaxed">
        {tokens.map((token, idx) =>
          token.type === 'url' ? (
            <a
              key={`${token.value}-${idx}`}
              href={token.value}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 font-medium text-blue-400 underline decoration-blue-400/50 underline-offset-2 transition hover:text-blue-300"
            >
              <span className="break-all">{token.value}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ) : (
            <span key={idx}>{token.value}</span>
          )
        )}
      </div>
    </div>
  );
}
