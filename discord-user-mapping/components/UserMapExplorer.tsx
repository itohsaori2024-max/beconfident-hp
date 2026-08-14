'use client';

/**
 * ゆるかわ日本地図（天気予報風）。
 * `@svg-maps/japan` の実際の都道府県パスを使いつつ、丸い白縁取り＋ふんわり影で
 * デフォルメしたかわいい見た目に。各県に県名ラベルを表示し、登録者のいる県は
 * ブランドピンクでハイライト。ホバー／タップでポップアップ。
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import japanMap from '@svg-maps/japan';
import type { Profile } from '@/lib/types';
import { SVG_ID_TO_CODE, prefectureName } from '@/lib/prefectures';
import { PrefecturePopup } from './PrefecturePopup';

interface Location {
  id: string;
  name: string;
  path: string;
}

interface ActiveState {
  code: string;
  xPct: number;
  yPct: number;
  pinned: boolean;
}

const [VB_W, VB_H] = (() => {
  const parts = japanMap.viewBox.split(' ').map(Number);
  return [parts[2] || 438, parts[3] || 516];
})();

/** ラベル用の短い県名（都/道/府/県 を省略。北海道は例外）。 */
function shortName(code: string): string {
  const name = prefectureName(code) ?? '';
  if (name === '北海道') return '北海道';
  return name.replace(/[都道府県]$/, '');
}

export function UserMapExplorer({
  profilesByPrefecture,
}: {
  profilesByPrefecture: Record<string, Profile[]>;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<ActiveState | null>(null);
  const [centers, setCenters] = useState<Record<string, { x: number; y: number }>>({});
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locations = japanMap.locations as Location[];

  const codeFor = useCallback((id: string): string | undefined => SVG_ID_TO_CODE[id], []);
  const hasUsers = useCallback(
    (code: string | undefined) => !!code && (profilesByPrefecture[code]?.length ?? 0) > 0,
    [profilesByPrefecture],
  );

  // マウント後に各県パスの中心を計算（ラベル位置＆ポップアップ位置に使用）。
  useLayoutEffect(() => {
    if (!svgRef.current) return;
    const next: Record<string, { x: number; y: number }> = {};
    for (const path of Array.from(svgRef.current.querySelectorAll<SVGPathElement>('path[data-code]'))) {
      const code = path.dataset.code;
      if (!code) continue;
      const box = path.getBBox();
      next[code] = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    }
    setCenters(next);
  }, []);

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

  const openFor = useCallback(
    (code: string, pinned: boolean) => {
      clearCloseTimer();
      const c = centers[code];
      setActive({
        code,
        xPct: c ? (c.x / VB_W) * 100 : 50,
        yPct: c ? (c.y / VB_H) * 100 : 50,
        pinned,
      });
    },
    [centers],
  );

  const handleEnter = (id: string) => {
    const code = codeFor(id);
    if (!code || !hasUsers(code) || active?.pinned) return;
    openFor(code, false);
  };
  const handleClick = (id: string) => {
    const code = codeFor(id);
    if (!code || !hasUsers(code)) return;
    if (active?.code === code && active.pinned) setActive(null);
    else openFor(code, true);
  };

  const filledCodes = useMemo(
    () => new Set(Object.keys(profilesByPrefecture).filter((c) => profilesByPrefecture[c]?.length)),
    [profilesByPrefecture],
  );

  const activeUsers = active ? profilesByPrefecture[active.code] ?? [] : [];
  const popupBelow = active ? active.yPct < 28 : false;

  return (
    <div
      className="relative w-full select-none rounded-2xl bg-[#b9d6ec] p-3 ring-2 ring-[#10385f]/40"
      onMouseLeave={scheduleClose}
    >
      <svg
        ref={svgRef}
        viewBox={japanMap.viewBox}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="日本地図：塾生のいる都道府県"
        style={{ filter: 'drop-shadow(0 3px 3px rgba(16,56,95,0.28))' }}
      >
        {/* 県のパス（丸い白縁取り） */}
        {locations.map((loc) => {
          const code = codeFor(loc.id);
          const filled = code ? filledCodes.has(code) : false;
          const isActive = active?.code === code;
          return (
            <path
              key={loc.id}
              d={loc.path}
              data-code={code}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth={1.6}
              className={[
                'stroke-white transition-colors duration-150',
                filled
                  ? 'cursor-pointer fill-brand-pink hover:fill-brand-pink-dark'
                  : 'fill-[#fdfbf7]',
                isActive ? '!fill-brand-pink-dark' : '',
              ].join(' ')}
              onMouseEnter={() => handleEnter(loc.id)}
              onClick={() => handleClick(loc.id)}
            >
              <title>{loc.name}</title>
            </path>
          );
        })}

        {/* 県名ラベル */}
        {Object.entries(centers).map(([code, c]) => (
          <text
            key={`label-${code}`}
            x={c.x}
            y={c.y}
            textAnchor="middle"
            dominantBaseline="central"
            className={`pointer-events-none font-bold ${
              filledCodes.has(code) ? 'fill-white' : 'fill-[#10385f]/75'
            }`}
            style={{ fontSize: 6.5 }}
          >
            {shortName(code)}
          </text>
        ))}
      </svg>

      {/* ポップアップ */}
      {active && activeUsers.length > 0 && (
        <div
          className="absolute z-10"
          style={{
            left: `${active.xPct}%`,
            top: `${active.yPct}%`,
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
