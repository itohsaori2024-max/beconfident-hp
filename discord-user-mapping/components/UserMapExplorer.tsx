'use client';

/**
 * デフォルメ版・日本地図（タイルグリッド）。
 * 都道府県を「まるいタイル」で日本の形に並べたかわいい地図。
 * 外部の地図APIは使わず、グリッド配置は自前で定義している。
 * 登録者のいる県はブランドピンクでハイライト。ホバー／タップでポップアップ表示。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Profile } from '@/lib/types';
import { PREFECTURES } from '@/lib/prefectures';
import { PrefecturePopup } from './PrefecturePopup';

/** 都道府県コード → タイルの配置セル [列x(0=西), 行y(0=北)]。 */
const TILE_LAYOUT: Readonly<Record<string, [number, number]>> = {
  '01': [12, 0],
  '02': [11, 1],
  '03': [11, 2], '05': [10, 2],
  '04': [11, 3], '06': [10, 3],
  '07': [11, 4], '15': [10, 4],
  '08': [12, 5], '09': [11, 5], '10': [10, 5], '16': [9, 5], '17': [8, 5],
  '12': [12, 6], '11': [11, 6], '20': [10, 6], '21': [9, 6], '18': [8, 6], '26': [7, 6], '31': [5, 6], '32': [4, 6],
  '13': [11, 7], '19': [10, 7], '23': [9, 7], '25': [8, 7], '28': [6, 7], '33': [5, 7], '34': [4, 7], '35': [3, 7],
  '14': [11, 8], '22': [10, 8], '24': [9, 8], '29': [8, 8], '27': [7, 8], '36': [6, 8], '37': [5, 8], '38': [4, 8], '40': [3, 8], '41': [2, 8], '42': [1, 8],
  '30': [7, 9], '39': [5, 9], '44': [3, 9], '43': [2, 9],
  '45': [2, 10], '46': [1, 10],
  '47': [0, 11],
};

const COLS = 13;
const ROWS = 12;

/** タイルに表示する短い県名（都/道/府/県 を省略。北海道は例外）。 */
function shortName(name: string): string {
  if (name === '北海道') return '北海道';
  return name.replace(/[都道府県]$/, '');
}

interface ActiveState {
  code: string;
  /** コンテナ左上からの px 位置（タイル中央上端） */
  x: number;
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
    setActive({
      code,
      x: t.left - c.left + t.width / 2,
      y: t.top - c.top,
      pinned,
    });
  }, []);

  const handleEnter = (code: string, el: HTMLElement) => {
    if (!hasUsers(code)) return;
    if (active?.pinned) return;
    openFor(code, el, false);
  };
  const handleClick = (code: string, el: HTMLElement) => {
    if (!hasUsers(code)) return;
    if (active?.code === code && active.pinned) {
      setActive(null);
    } else {
      openFor(code, el, true);
    }
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
      className="relative w-full select-none rounded-xl bg-[#b9d6ec] p-3 ring-2 ring-[#10385f]/40"
      onMouseLeave={scheduleClose}
    >
      <div className="overflow-x-auto">
        <div
          className="mx-auto grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
            minWidth: 460,
            maxWidth: 560,
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
                  'flex aspect-square items-center justify-center rounded-[7px] text-center text-[9px] font-bold leading-none transition-all sm:text-[11px]',
                  filled
                    ? 'cursor-pointer bg-brand-pink text-white shadow-sm hover:bg-brand-pink-dark'
                    : 'bg-white/85 text-neutral-400',
                  isActive ? 'scale-110 !bg-brand-pink-dark ring-2 ring-white' : '',
                ].join(' ')}
              >
                {shortName(p.name)}
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
