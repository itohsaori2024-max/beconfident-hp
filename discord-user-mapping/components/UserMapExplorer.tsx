'use client';

/**
 * 擬似3Dの日本地図。
 * `@svg-maps/japan` の実形状パスを使い、下方向に茶色い「厚み」を重ねて立体風に見せる
 * （他社イラストの複製ではなくオリジナル実装）。
 * 未登録県は薄いグレー、登録者のいる県はブランドピンク。ホバー／タップでポップアップ。
 * スマホでも小さな県をタップしやすいよう、登録県には広い透明タップ領域を重ねている。
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
  xPct: number;
  yPct: number;
  pinned: boolean;
}

const [VB_W, VB_H] = (() => {
  const p = japanMap.viewBox.split(' ').map(Number);
  return [p[2] || 438, p[3] || 516];
})();

const LAND_COLOR = '#dfe3e8'; // 未登録県：薄いグレー
const PINK = '#e291a6';
const PINK_DARK = '#d0798f';

export function UserMapExplorer({
  profilesByPrefecture,
}: {
  profilesByPrefecture: Record<string, Profile[]>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const vpRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<ActiveState | null>(null);
  const [centers, setCenters] = useState<Record<string, { x: number; y: number }>>({});
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locations = japanMap.locations as Location[];
  const codeFor = useCallback((id: string): string | undefined => SVG_ID_TO_CODE[id], []);
  const hasUsers = useCallback(
    (code: string | undefined) => !!code && (profilesByPrefecture[code]?.length ?? 0) > 0,
    [profilesByPrefecture],
  );

  useLayoutEffect(() => {
    if (!svgRef.current) return;
    const next: Record<string, { x: number; y: number }> = {};
    for (const path of Array.from(svgRef.current.querySelectorAll<SVGPathElement>('path[data-code]'))) {
      const code = path.dataset.code;
      if (!code) continue;
      const b = path.getBBox();
      next[code] = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    }
    setCenters(next);
  }, []);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  // ホバーが外れたら閉じる（ただし固定表示中＝クリックで開いたものは閉じない）。
  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setActive((a) => (a?.pinned ? a : null)), 180);
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

  const enterCode = (code: string | undefined) => {
    if (!code || !hasUsers(code) || active?.pinned) return;
    openFor(code, false);
  };
  const clickCode = (code: string | undefined) => {
    if (!code || !hasUsers(code)) return;
    if (active?.code === code && active.pinned) setActive(null);
    else openFor(code, true);
  };

  // スマホのピンチ拡大時もカードを一定サイズ・見える範囲に保つ（Visual Viewport 追従）。
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!active || !vv) return;
    const update = () => {
      const el = vpRef.current;
      if (!el) return;
      el.style.width = `${vv.width * vv.scale}px`;
      el.style.height = `${vv.height * vv.scale}px`;
      el.style.transform = `translate(${vv.offsetLeft}px, ${vv.offsetTop}px) scale(${1 / vv.scale})`;
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [active]);

  // 固定表示中に地図の外をタップ／クリックしたら閉じる（スマホ対応）。
  useEffect(() => {
    if (!active?.pinned) return;
    const onDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActive(null);
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [active?.pinned]);

  const filledCodes = useMemo(
    () => Object.keys(profilesByPrefecture).filter((c) => profilesByPrefecture[c]?.length),
    [profilesByPrefecture],
  );
  const filledSet = useMemo(() => new Set(filledCodes), [filledCodes]);

  const activeUsers = active ? profilesByPrefecture[active.code] ?? [] : [];
  const popupBelow = active ? active.yPct < 28 : false;

  const extrudeLayers = [
    { dx: 2.4, dy: 6.5, fill: '#7a4a28' },
    { dx: 1.2, dy: 3.2, fill: '#a56a3f' },
  ];

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none rounded-2xl bg-[#b9d6ec] p-3 ring-2 ring-[#10385f]/40"
      onMouseLeave={scheduleClose}
    >
      <svg
        ref={svgRef}
        viewBox={japanMap.viewBox}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="日本地図：塾生のいる都道府県"
        style={{ filter: 'drop-shadow(0 4px 4px rgba(16,56,95,0.30))' }}
      >
        {/* 立体の厚み（茶色いフチ） */}
        {extrudeLayers.map((layer, i) => (
          <g key={`ex-${i}`} transform={`translate(${layer.dx}, ${layer.dy})`} className="pointer-events-none">
            {locations.map((loc) => (
              <path key={loc.id} d={loc.path} fill={layer.fill} stroke={layer.fill} strokeWidth={0.6} />
            ))}
          </g>
        ))}

        {/* 天面（未登録＝薄グレー／登録＝ピンク） */}
        {locations.map((loc) => {
          const code = codeFor(loc.id);
          const filled = code ? filledSet.has(code) : false;
          const isActive = active?.code === code;
          const fill = filled ? (isActive ? PINK_DARK : PINK) : LAND_COLOR;
          return (
            <path
              key={loc.id}
              d={loc.path}
              data-code={code}
              fill={fill}
              stroke="#ffffff"
              strokeWidth={1.2}
              strokeLinejoin="round"
              strokeLinecap="round"
              className={filled ? 'cursor-pointer transition-colors' : 'transition-colors'}
              onMouseEnter={() => enterCode(code)}
              onClick={() => clickCode(code)}
            >
              <title>{loc.name}</title>
            </path>
          );
        })}

        {/* 登録県の広い透明タップ領域（スマホで小さい県も押しやすく） */}
        {filledCodes.map((code) => {
          const c = centers[code];
          if (!c) return null;
          return (
            <circle
              key={`hit-${code}`}
              cx={c.x}
              cy={c.y}
              r={24}
              fill="transparent"
              pointerEvents="all"
              className="cursor-pointer"
              onMouseEnter={() => enterCode(code)}
              onClick={() => clickCode(code)}
            />
          );
        })}
      </svg>

      {/* ポップアップ */}
      {active && activeUsers.length > 0 && (
        <>
          {/* スマホ：背景（タップで閉じる） */}
          <div className="fixed inset-0 z-10 bg-black/25 sm:hidden" onClick={() => setActive(null)} />

          {/* スマホ：見える範囲に追従する固定サイズのカード */}
          <div
            ref={vpRef}
            className="fixed left-0 top-0 z-20 origin-top-left sm:hidden"
            style={{ width: '100vw', height: '100vh', pointerEvents: 'none' }}
          >
            <div className="pointer-events-auto absolute inset-x-3 bottom-3">
              <PrefecturePopup prefectureCode={active.code} users={activeUsers} />
            </div>
          </div>

          {/* PC：県の近くにフロート表示 */}
          <div
            className="absolute z-20 hidden sm:block"
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
        </>
      )}
    </div>
  );
}
