'use client';

/**
 * インタラクティブな日本地図。
 * - `@svg-maps/japan` のパスデータを自前で描画（外部地図APIは不使用）。
 * - 登録ユーザーがいる都道府県をハイライト＋件数ドット表示。
 * - ホバー（主）／クリック（タッチ向け）でスタイリッシュなポップアップを表示。
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import japanMap from '@svg-maps/japan';
import type { Profile } from '@/lib/types';
import { SVG_ID_TO_CODE } from '@/lib/prefectures';
import { PrefecturePopup } from './PrefecturePopup';

interface Location {
  id: string;
  name: string;
  path: string;
}

interface ActiveState {
  code: string;
  /** viewBox 座標系での中心（%） */
  xPct: number;
  yPct: number;
  /** クリックで固定表示中か */
  pinned: boolean;
}

const [VB_W, VB_H] = (() => {
  const parts = japanMap.viewBox.split(' ').map(Number);
  return [parts[2] || 438, parts[3] || 516];
})();

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

  // マウント後に各都道府県パスの中心座標（viewBox 単位）を計算し、件数ドット描画に使う。
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

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setActive(null), 180);
  }, []);

  useEffect(() => () => clearCloseTimer(), []);

  const handleEnter = (id: string) => {
    const code = codeFor(id);
    if (!hasUsers(code) || !code) return;
    if (active?.pinned) return; // 固定中はホバーで切り替えない
    openFor(code, false);
  };

  const handleClick = (id: string) => {
    const code = codeFor(id);
    if (!hasUsers(code) || !code) return;
    // 同じ県を再クリックで閉じる、別の県ならそちらを固定表示
    if (active?.code === code && active.pinned) {
      setActive(null);
    } else {
      openFor(code, true);
    }
  };

  const activeUsers = active ? profilesByPrefecture[active.code] ?? [] : [];

  // ポップアップは県の上に出す。上端付近の県では下に出して見切れを防ぐ。
  const popupBelow = active ? active.yPct < 28 : false;

  const filledCodes = useMemo(
    () => new Set(Object.keys(profilesByPrefecture).filter((c) => profilesByPrefecture[c]?.length)),
    [profilesByPrefecture],
  );

  return (
    <div
      className="relative w-full select-none rounded-xl bg-[#b9d6ec] p-2 ring-2 ring-[#10385f]/40"
      onMouseLeave={scheduleClose}
    >
      <svg
        ref={svgRef}
        viewBox={japanMap.viewBox}
        className="h-auto w-full"
        role="img"
        aria-label="日本地図：塾生のいる都道府県"
      >
        {locations.map((loc) => {
          const code = codeFor(loc.id);
          const filled = code ? filledCodes.has(code) : false;
          const isActive = active?.code === code;
          return (
            <path
              key={loc.id}
              d={loc.path}
              data-code={code}
              className={[
                'stroke-[#6f8aa8] transition-colors duration-150',
                filled
                  ? 'cursor-pointer fill-brand-pink hover:fill-brand-pink-dark'
                  : 'fill-[#fbfaf7] hover:fill-[#f0ece4]',
                isActive ? '!fill-brand-pink-dark' : '',
              ].join(' ')}
              strokeWidth={0.5}
              onMouseEnter={() => handleEnter(loc.id)}
              onClick={() => handleClick(loc.id)}
            >
              <title>{loc.name}</title>
            </path>
          );
        })}
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
