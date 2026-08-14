'use client';

/**
 * デフォルメ日本地図（気象庁の全般季節予報区分風）。
 * 都道府県を「まるいタイル」で日本の形に並べ、フルの県名を表示する。
 * 登録者のいる県はブランドピンクでハイライト。ホバー／タップでポップアップ。
 * 外部の地図APIは使わず、グリッド配置は自前で定義。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Profile } from '@/lib/types';
import { PREFECTURES } from '@/lib/prefectures';
import { PrefecturePopup } from './PrefecturePopup';

/** 都道府県コード → タイルの配置セル [列x(0=西), 行y(0=北)]。気象庁デフォルメ図に準拠。 */
const TILE_LAYOUT: Readonly<Record<string, [number, number]>> = {
  '01': [10, 0],
  '02': [10, 1],
  '05': [9, 2], '03': [10, 2],
  '06': [9, 3], '04': [10, 3],
  '07': [10, 4],
  '17': [6, 5], '16': [7, 5], '15': [8, 5],
  '18': [6, 6], '21': [7, 6], '20': [8, 6], '10': [9, 6], '09': [10, 6],
  '25': [6, 7], '23': [7, 7], '19': [8, 7], '11': [9, 7], '08': [10, 7],
  '29': [6, 8], '24': [7, 8], '13': [9, 8], '12': [10, 8],
  '22': [8, 9], '14': [9, 9],
  '26': [5, 6], '28': [4, 6], '31': [3, 6], '32': [2, 6],
  '27': [5, 7], '33': [4, 7], '34': [3, 7], '35': [2, 7],
  '30': [5, 8], '37': [4, 8], '38': [3, 8], '44': [2, 8], '40': [1, 8], '41': [0, 8],
  '36': [4, 9], '39': [3, 9], '45': [2, 9], '43': [1, 9], '42': [0, 9],
  '46': [1, 10],
  '47': [0, 11],
};

const COLS = 11;
const ROWS = 12;

interface ActiveState {
  code: string;
  x: number; // コンテナ左上からの px（タイル中央上端）
  y: number;
  pinned: boolean;
}

export function UserMapExplorer({
  profilesByPrefecture,
}: {
  profilesByPrefecture: Record<string, Profile[]>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<ActiveState | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasUsers = useCallback(
    (code: string) => (profilesByPrefecture[code]?.length ?? 0) > 0,
    [profilesByPrefecture],
  );

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setActive(null), 180);
  }, []);
  useEffect(() => () => clearCloseTimer(), []);

  const openFor = useCallback((code: string, el: HTMLElement, pinned: boolean) => {
    clearCloseTimer();
    const cont = containerRef.current;
    if (!cont) return;
    const t = el.getBoundingClientRect();
    const c = cont.getBoundingClientRect();
    setActive({ code, x: t.left - c.left + t.width / 2, y: t.top - c.top, pinned });
  }, []);

  const handleEnter = (code: string, el: HTMLElement) => {
    if (!hasUsers(code) || active?.pinned) return;
    openFor(code, el, false);
  };
  const handleClick = (code: string, el: HTMLElement) => {
    if (!hasUsers(code)) return;
    if (active?.code === code && active.pinned) setActive(null);
    else openFor(code, el, true);
  };

  const filledCodes = useMemo(
    () => new Set(Object.keys(profilesByPrefecture).filter((c) => profilesByPrefecture[c]?.length)),
    [profilesByPrefecture],
  );

  const activeUsers = active ? profilesByPrefecture[active.code] ?? [] : [];
  const popupBelow = active ? active.y < 110 : false;

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none rounded-2xl bg-[#b9d6ec] p-3 ring-2 ring-[#10385f]/40"
      onMouseLeave={scheduleClose}
    >
      <div className="overflow-x-auto">
        <div
          className="mx-auto grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
            minWidth: 520,
            maxWidth: 600,
          }}
        >
          {PREFECTURES.map((p) => {
            const cell = TILE_LAYOUT[p.code];
            if (!cell) return null;
            const [x, y] = cell;
            const filled = filledCodes.has(p.code);
            const isActive = active?.code === p.code;
            return (
              <button
                key={p.code}
                type="button"
                title={p.name}
                aria-label={`${p.name}${filled ? `（${profilesByPrefecture[p.code].length}人）` : ''}`}
                onMouseEnter={(e) => handleEnter(p.code, e.currentTarget)}
                onFocus={(e) => handleEnter(p.code, e.currentTarget)}
                onClick={(e) => handleClick(p.code, e.currentTarget)}
                style={{ gridColumnStart: x + 1, gridRowStart: y + 1 }}
                className={[
                  'flex aspect-square items-center justify-center rounded-lg p-0.5 text-center text-[9px] font-bold leading-[1.1] shadow-sm transition-all sm:text-[10.5px]',
                  filled
                    ? 'z-[1] cursor-pointer bg-brand-pink text-white ring-1 ring-brand-pink-dark hover:bg-brand-pink-dark'
                    : 'bg-white text-[#10385f]/80 ring-1 ring-[#10385f]/10',
                  isActive ? 'z-[2] scale-110 !bg-brand-pink-dark ring-2 ring-white' : '',
                ].join(' ')}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ポップアップ */}
      {active && activeUsers.length > 0 && (
        <div
          className="absolute z-10"
          style={{
            left: active.x,
            top: active.y,
            transform: `translate(-50%, ${popupBelow ? '12px' : 'calc(-100% - 12px)'})`,
          }}
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
        >
          <PrefecturePopup prefectureCode={active.code} users={activeUsers} />
        </div>
      )}
    </div>
  );
}
