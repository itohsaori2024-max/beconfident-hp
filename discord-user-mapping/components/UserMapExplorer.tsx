'use client';

/**
 * 擬似3D・地方カラーの日本地図。
 * `@svg-maps/japan` の実形状パスを使い、地方ごとに色分け＋下方向に茶色い「厚み」を
 * 重ねて立体風に見せる（他社イラストの複製ではなくオリジナル実装）。
 * 登録者のいる県はブランドピンクでハイライト（地方色にはピンクを使わない）。
 * ホバー／タップでポップアップ。
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
  const p = japanMap.viewBox.split(' ').map(Number);
  return [p[2] || 438, p[3] || 516];
})();

/** 地方カラー（ピンクは登録者専用のため使わない）。コードの並び順が地方順なので範囲で判定。 */
function regionColor(code: string): string {
  const n = parseInt(code, 10);
  if (n === 1) return '#8fd3ab'; // 北海道（緑）
  if (n <= 7) return '#f2cf87'; // 東北（黄）
  if (n <= 14) return '#a7cbef'; // 関東（水色）
  if (n <= 23) return '#c3e29a'; // 中部（黄緑）
  if (n <= 30) return '#f2b277'; // 近畿（橙）
  if (n <= 35) return '#90d5cb'; // 中国（青緑）
  if (n <= 39) return '#b7a9e0'; // 四国（紫）
  if (n <= 46) return '#7fc0e8'; // 九州（青）
  return '#f4a15c'; // 沖縄（濃橙）
}

function shortName(code: string): string {
  const name = prefectureName(code) ?? '';
  return name === '北海道' ? name : name.replace(/[都道府県]$/, '');
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

  // 立体の「厚み」用オフセット（viewBox 単位）。奥から手前へ重ねる。
  const extrudeLayers = [
    { dx: 2.4, dy: 6.5, fill: '#7a4a28' },
    { dx: 1.2, dy: 3.2, fill: '#a56a3f' },
  ];

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

        {/* 天面（地方カラー／登録県はピンク） */}
        {locations.map((loc) => {
          const code = codeFor(loc.id);
          const filled = code ? filledCodes.has(code) : false;
          const isActive = active?.code === code;
          const fill = filled ? (isActive ? '#d0798f' : '#e291a6') : code ? regionColor(code) : '#dddddd';
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
            className="pointer-events-none font-bold"
            fill={filledCodes.has(code) ? '#ffffff' : '#10385f'}
            style={{ fontSize: 6 }}
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
