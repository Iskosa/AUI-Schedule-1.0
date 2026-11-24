interface RansomTitleProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'div';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  accentIndices?: number[];
  className?: string;
}

const ROTATIONS = [-4, 2, -2, 3, -3, 1, -1, 4];
const SHIFTS = ['0px', '-2px', '1px', '-1px', '2px', '0px'];

const SIZE_CLASSES: Record<NonNullable<RansomTitleProps['size']>, string> = {
  sm: 'text-xs sm:text-sm',
  md: 'text-sm sm:text-lg',
  lg: 'text-lg sm:text-2xl',
  xl: 'text-2xl sm:text-4xl',
};

const TILE_PADDING_CLASSES: Record<NonNullable<RansomTitleProps['size']>, string> = {
  sm: 'px-1 py-0.5',
  md: 'px-1 py-0.5',
  lg: 'px-1.5 py-0.5',
  xl: 'px-2 py-1',
};

export function RansomTitle({
  text,
  as: Tag = 'h2',
  size = 'md',
  accentIndices,
  className = '',
}: RansomTitleProps) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  let globalCharIdx = 0;

  return (
    <Tag
      aria-label={text}
      className={`inline-flex flex-wrap items-baseline gap-x-2 gap-y-1 font-display uppercase leading-none select-none ${SIZE_CLASSES[size]} ${className}`}
    >
      <span aria-hidden="true" className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {words.map((word, wordIdx) => (
          <span
            key={`${word}-${wordIdx}`}
            className="inline-flex items-baseline gap-[1px] whitespace-nowrap"
          >
            {Array.from(word).map((char, letterIdx) => {
              const charIdx = globalCharIdx;
              globalCharIdx += 1;

              const rotate = ROTATIONS[charIdx % ROTATIONS.length];
              const shiftY = SHIFTS[charIdx % SHIFTS.length];
              const isRedTile = accentIndices
                ? accentIndices.includes(charIdx)
                : charIdx === 0;
              const isWhiteTile = !isRedTile && charIdx > 0 && charIdx % 4 === 2;
              const isBlackTile =
                !isRedTile && !isWhiteTile && charIdx > 0 && charIdx % 7 === 0;

              let tileClass =
                'text-white px-[1px] [text-shadow:2px_2px_0_#0D0D0D,-1px_-1px_0_#0D0D0D,1px_-1px_0_#0D0D0D,-1px_1px_0_#0D0D0D]';
              if (isRedTile) {
                tileClass = `bg-[#E60012] text-white border-2 border-white ${TILE_PADDING_CLASSES[size]} shadow-[3px_3px_0_#0D0D0D]`;
              } else if (isWhiteTile) {
                tileClass = `bg-white text-[#0D0D0D] border-2 border-[#0D0D0D] ${TILE_PADDING_CLASSES[size]} shadow-[3px_3px_0_#E60012]`;
              } else if (isBlackTile) {
                tileClass = `bg-[#0D0D0D] text-white border-2 border-white ${TILE_PADDING_CLASSES[size]} shadow-[3px_3px_0_#0D0D0D]`;
              }

              return (
                <span
                  key={`${char}-${wordIdx}-${letterIdx}`}
                  style={{ transform: `rotate(${rotate}deg) translateY(${shiftY})` }}
                  className={`inline-block leading-none ${tileClass}`}
                >
                  {char}
                </span>
              );
            })}
          </span>
        ))}
      </span>
    </Tag>
  );
}
