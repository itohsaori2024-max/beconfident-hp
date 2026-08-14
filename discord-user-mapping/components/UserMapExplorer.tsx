'use client';

/**
 * デフォルメ日本地図（長方形カルトグラム）。
 * 都道府県を大きさの異なる長方形タイル（正方形・横長・縦長）で日本列島の形に配置。
 * 北海道は大きく、東北は縦長、福島・静岡は横長…のように形をデフォルメして寄せている。
 * 登録者のいる県はブランドピンクでハイライト。ホバー／タップでポップアップ。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Profile } from '@/lib/types';
import { PREFECTURES } from '@/lib/prefectures';
import { PrefecturePopup } from './PrefecturePopup';

/** 都道府県コード → [列x(0=西), 行y(0=北), 幅w, 高さh]（セル単位）。 */
const TILE_LAYOUT: Readonly<Record<string, [number, number, number, number]>> = {
  '01': [11, 0, 3, 3], // 北海道（大）
  '02': [11, 3, 2, 1], // 青森（横長）
  '05': [11, 4, 1, 2], // 秋田（縦長）
  '03': [12, 4, 1, 2], // 岩手（縦長）
  '06': [11, 6, 1, 2], // 山形（縦長）
  '04': [12, 6, 1, 2], // 宮城（縦長）
  '07': [11, 8, 2, 1], // 福島（横長）
  '15': [10, 7, 1, 2], // 新潟（縦長）
  '16': [9, 7, 1, 1],
  '17': [8, 6, 1, 2], // 石川（縦長）
  '18': [8, 8, 1, 1],
  '21': [9, 8, 1, 2], // 岐阜（縦長）
  '23': [9, 10, 1, 1],
  '24': [9, 11, 1, 2], // 三重（縦長）
  '25': [8, 9, 1, 1],
  '26': [7, 7, 1, 2], // 京都（縦長）
  '27': [7, 10, 1, 1],
  '28': [6, 8, 1, 2], // 兵庫（縦長）
  '29': [8, 10, 1, 2], // 奈良（縦長）
  '30': [7, 11, 1, 1],
  '20': [10, 9, 1, 2], // 長野（縦長）
  '19': [11, 11, 1, 1],
  '22': [11, 12, 2, 1], // 静岡（横長）
  '10': [11, 9, 1, 1],
  '09': [12, 9, 1, 1],
  '08': [13, 9, 1, 1],
  '11': [11, 10, 1, 1],
  '13': [12, 10, 1, 1],
  '12': [13, 10, 1, 1],
  '14': [12, 11, 1, 1],
  '31': [5, 7, 1, 1],
  '32': [3, 7, 2, 1], // 島根（横長）
  '33': [5, 8, 1, 1],
  '34': [4, 8, 1, 1],
  '35': [2, 8, 2, 1], // 山口（横長）
  '37': [4, 9, 1, 1],
  '38': [3, 9, 1, 1],
  '36': [4, 10, 1, 1],
  '39': [3, 10, 1, 1],
  '40': [1, 9, 1, 1],
  '41': [0, 9, 1, 1],
  '44': [2, 10, 1, 1],
  '43': [1, 10, 1, 1],
  '42': [0, 10, 1, 1],
  '45': [2, 11, 1, 1],
  '46': [1, 11, 1, 1],
  '47': [0, 13, 1, 1], // 沖縄
};

const COLS = 14;
const ROWS = 14;

interface ActiveState {
  code: string;
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
          className="mx-auto grid gap-[3px]"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
            aspectRatio: `${COLS} / ${ROWS}`,
            minWidth: 540,
            maxWidth: 640,
          }}
        >
          {PREFECTURES.map((p) => {
            const cell = TILE_LAYOUT[p.code];
            if (!cell) return null;
            const [x, y, w, h] = cell;
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
                style={{
                  gridColumn: `${x + 1} / span ${w}`,
                  gridRow: `${y + 1} / span ${h}`,
                }}
                className={[
                  'flex items-center justify-center rounded-lg p-0.5 text-center text-[9px] font-bold leading-[1.1] shadow-sm transition-all sm:text-[10.5px]',
                  filled
                    ? 'z-[1] cursor-pointer bg-brand-pink text-white ring-1 ring-brand-pink-dark hover:bg-brand-pink-dark'
                    : 'bg-white text-[#10385f]/80 ring-1 ring-[#10385f]/10',
                  isActive ? 'z-[2] scale-105 !bg-brand-pink-dark ring-2 ring-white' : '',
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
