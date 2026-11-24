import { AlertTriangle, ExternalLink, Info } from 'lucide-react';
import { getNoteSeverity, tokenizeNotes } from '../../utils/links';
import { playOpen } from '../../utils/p5Sound';

interface NotesWithLinksProps {
  notes: string | null | undefined;
  compact?: boolean;
}

function getLinkLabel(url: string): string {
  const low = url.toLowerCase();
  if (low.includes('meet.google.com')) {
    return 'GOOGLE MEET';
  }
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '').toUpperCase();
  } catch {
    return url;
  }
}

export function NotesWithLinks({ notes, compact = false }: NotesWithLinksProps) {
  if (!notes) return null;

  const severity = getNoteSeverity(notes);
  const tokens = tokenizeNotes(notes);

  const boxStyle =
    severity === 'warning'
      ? 'border-[#FFE600] border-l-[6px] border-l-[#E60012] bg-[#0D0D0D] text-[#FFE600]'
      : severity === 'info'
        ? 'border-[#FFE600] bg-[#161616] text-white'
        : 'border-white/50 bg-[#161616] text-neutral-200';

  const Icon = severity === 'warning' ? AlertTriangle : Info;

  return (
    <div
      className={`p5-shadow-sm flex items-start gap-2.5 rounded-none border-2 ${
        compact ? 'px-2.5 py-2 text-xs' : 'px-3.5 py-2.5 text-sm'
      } ${boxStyle}`}
    >
      <Icon
        className={`mt-0.5 shrink-0 ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} ${
          severity === 'warning' || severity === 'info'
            ? 'text-[#FFE600]'
            : 'text-white'
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
              title={token.value}
              onClick={(e) => {
                e.stopPropagation();
                playOpen();
              }}
              className="p5-skew p5-shadow-sm mx-1 my-0.5 inline-block align-middle border-2 border-[#0D0D0D] bg-[#FFE600] px-2.5 py-0.5 text-[#0D0D0D] hover:border-white hover:bg-[#E60012] hover:text-white"
            >
              <span className="p5-unskew inline-flex items-center gap-1 font-condensed text-xs font-bold uppercase tracking-wider">
                <span>{getLinkLabel(token.value)}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </span>
            </a>
          ) : (
            <span key={idx}>{token.value}</span>
          )
        )}
      </div>
    </div>
  );
}
