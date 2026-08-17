'use client';

/**
 * 擬似3Dの日本地図＋海外用の地球儀。
 * `@svg-maps/japan` の実形状パスに、ブランドネイビー(#10385f)の「厚み」を重ねて立体風に。
 * 未登録県は薄グレー、登録県はブランドピンク。右上の地球儀に海外ユーザーをまとめて表示。
 * ホバー／タップでポップアップ（スマホはピンチ拡大時も一定サイズを維持）。
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

interface Popup {
  users: Profile[];
  title: string;
  /** 都道府県ハイライト用（海外グループの場合は undefined）。 */
  prefCode?: string;
  /** 表示アンカー：地図上の割合位置、または右上の地球儀。 */
  anchor: { xPct: number; yPct: number } | 'globe';
  pinned: boolean;
}

const [VB_W, VB_H] = (() => {
  const p = japanMap.viewBox.split(' ').map(Number);
  return [p[2] || 438, p[3] || 516];
})();

const LAND_COLOR = '#dfe3e8';
const PINK = '#e291a6';
const PINK_DARK = '#d0798f';
const NAVY = '#10385f';

export function UserMapExplorer({
  profilesByPrefecture,
  overseasUsers = [],
}: {
  profilesByPrefecture: Record<string, Profile[]>;
  overseasUsers?: Profile[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const vpRef = useRef<HTMLDivElement>(null);
  const [popup, setPopup] = useState<Popup | null>(null);
  const [centers, setCenters] = useState<Record<string, { x: number; y: number }>>({});
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locations = japanMap.locations as Location[];
  const codeFor = useCallback((id: string): string | undefined => SVG_ID_TO_CODE[id], []);
  const hasUsers = useCallback(
    (code: string | undefined) => !!code && (profilesByPrefecture[code]?.length ?? 0) > 0,
    [profilesByPrefecture],
  );

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    const next: Record<string, { x: number; y: number }> = {};

    for (const path of Array.from(svg.querySelectorAll<SVGPathElement>('path[data-code]'))) {
      const code = path.dataset.code;
      if (!code) continue;
      const b = path.getBBox();

      // 図形内部の点をグリッドでサンプリング（外接矩形の中央は東京の島などで海上になるため）。
      const cols = 16;
      const rows = 16;
      const inside: { x: number; y: number }[] = [];
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = b.x + (b.width * (i + 0.5)) / cols;
          const y = b.y + (b.height * (j + 0.5)) / rows;
          pt.x = x;
          pt.y = y;
          if (path.isPointInFill(pt)) inside.push({ x, y });
        }
      }

      if (inside.length === 0) {
        next[code] = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
        continue;
      }

      // 内部点が最も密集している場所（＝本土などの最大の塊）の点を代表点に選ぶ。
      const rad = Math.max(b.width, b.height) / 6;
      let best = inside[0];
      let bestCount = -1;
      for (const p of inside) {
        let cnt = 0;
        for (const q of inside) {
          if (Math.hypot(p.x - q.x, p.y - q.y) <= rad) cnt++;
        }
        if (cnt > bestCount) {
          bestCount = cnt;
          best = p;
        }
      }
      next[code] = best;
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
    closeTimer.current = setTimeout(() => setPopup((p) => (p?.pinned ? p : null)), 180);
  }, []);
  useEffect(() => () => clearCloseTimer(), []);

  const openPref = useCallback(
    (code: string, pinned: boolean) => {
      clearCloseTimer();
      const c = centers[code];
      setPopup({
        users: profilesByPrefecture[code] ?? [],
        title: prefectureName(code) ?? '不明',
        prefCode: code,
        anchor: { xPct: c ? (c.x / VB_W) * 100 : 50, yPct: c ? (c.y / VB_H) * 100 : 50 },
        pinned,
      });
    },
    [centers, profilesByPrefecture],
  );

  const openOverseas = useCallback(
    (pinned: boolean) => {
      clearCloseTimer();
      setPopup({ users: overseasUsers, title: '海外・その他', anchor: 'globe', pinned });
    },
    [overseasUsers],
  );

  const enterPref = (code: string | undefined) => {
    if (!code || !hasUsers(code) || popup?.pinned) return;
    openPref(code, false);
  };
  const clickPref = (code: string | undefined) => {
    if (!code || !hasUsers(code)) return;
    if (popup?.prefCode === code && popup.pinned) setPopup(null);
    else openPref(code, true);
  };

  // スマホのピンチ拡大時もカードを一定サイズ・見える範囲に保つ。
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!popup || !vv) return;
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
  }, [popup]);

  // 固定表示中に外側をタップ／クリックしたら閉じる。
  useEffect(() => {
    if (!popup?.pinned) return;
    const onDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopup(null);
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [popup?.pinned]);

  const filledCodes = useMemo(
    () => Object.keys(profilesByPrefecture).filter((c) => profilesByPrefecture[c]?.length),
    [profilesByPrefecture],
  );
  const filledSet = useMemo(() => new Set(filledCodes), [filledCodes]);

  const hasOverseas = overseasUsers.length > 0;
  const extrudeLayers = [
    { dx: 2.4, dy: 6.5, fill: NAVY },
    { dx: 1.2, dy: 3.2, fill: '#24567f' },
  ];

  const isGlobe = popup?.anchor === 'globe';
  const coordAnchor = popup && popup.anchor !== 'globe' ? popup.anchor : null;
  const popupBelow = coordAnchor ? coordAnchor.yPct < 28 : true;

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none rounded-2xl bg-[#b9d6ec] p-3 ring-2 ring-[#10385f]/40"
      onMouseLeave={scheduleClose}
    >
      {/* 右上：海外用の地球儀 */}
      <button
        type="button"
        title="海外・その他のメンバー"
        aria-label={`海外・その他のメンバー（${overseasUsers.length}人）`}
        onMouseEnter={() => hasOverseas && !popup?.pinned && openOverseas(false)}
        onFocus={() => hasOverseas && !popup?.pinned && openOverseas(false)}
        onClick={() => {
          if (!hasOverseas) return;
          if (isGlobe && popup?.pinned) setPopup(null);
          else openOverseas(true);
        }}
        className={[
          'absolute left-3 top-3 z-[5] flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white shadow-md transition-transform',
          hasOverseas ? 'cursor-pointer border-brand-pink hover:scale-105' : 'cursor-default border-neutral-200 opacity-70',
        ].join(' ')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={hasOverseas ? PINK_DARK : '#94a3b8'} strokeWidth="1.7">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" />
        </svg>
        {hasOverseas && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-pink px-1 text-[10px] font-bold text-white">
            {overseasUsers.length}
          </span>
        )}
      </button>

      <svg
        ref={svgRef}
        viewBox={japanMap.viewBox}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="日本地図：塾生のいる都道府県"
        style={{ filter: 'drop-shadow(0 4px 4px rgba(16,56,95,0.35))' }}
      >
        {extrudeLayers.map((layer, i) => (
          <g key={`ex-${i}`} transform={`translate(${layer.dx}, ${layer.dy})`} className="pointer-events-none">
            {locations.map((loc) => (
              <path key={loc.id} d={loc.path} fill={layer.fill} stroke={layer.fill} strokeWidth={0.6} />
            ))}
          </g>
        ))}

        {locations.map((loc) => {
          const code = codeFor(loc.id);
          const filled = code ? filledSet.has(code) : false;
          const isActive = popup?.prefCode === code;
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
              onMouseEnter={() => enterPref(code)}
              onClick={() => clickPref(code)}
            >
              <title>{loc.name}</title>
            </path>
          );
        })}

        {filledCodes.map((code) => {
          const c = centers[code];
          if (!c) return null;
          // 隣接する登録県とタップ範囲が重ならないよう、最も近い登録県までの距離から半径を決める。
          let minD = Infinity;
          for (const other of filledCodes) {
            if (other === code) continue;
            const oc = centers[other];
            if (!oc) continue;
            const d = Math.hypot(oc.x - c.x, oc.y - c.y);
            if (d < minD) minD = d;
          }
          const r = Math.max(5, Math.min(22, minD / 2 - 1));
          return (
            <circle
              key={`hit-${code}`}
              cx={c.x}
              cy={c.y}
              r={r}
              fill="transparent"
              pointerEvents="all"
              className="cursor-pointer"
              onMouseEnter={() => enterPref(code)}
              onClick={() => clickPref(code)}
            />
          );
        })}
      </svg>

      {/* ポップアップ */}
      {popup && popup.users.length > 0 && (
        <>
          {/* スマホ：背景（タップで閉じる） */}
          <div className="fixed inset-0 z-10 bg-black/25 sm:hidden" onClick={() => setPopup(null)} />

          {/* スマホ：見える範囲に追従する固定サイズのカード */}
          <div
            ref={vpRef}
            className="fixed left-0 top-0 z-20 origin-top-left sm:hidden"
            style={{ width: '100vw', height: '100vh', pointerEvents: 'none' }}
          >
            <div className="pointer-events-auto absolute inset-x-3 bottom-3">
              <PrefecturePopup prefectureCode={popup.prefCode} title={popup.title} users={popup.users} />
            </div>
          </div>

          {/* PC：県付近／地球儀付近にフロート表示 */}
          <div
            className="absolute z-20 hidden sm:block"
            style={
              isGlobe
                ? { left: 12, top: 56 }
                : {
                    left: `${coordAnchor!.xPct}%`,
                    top: `${coordAnchor!.yPct}%`,
                    transform: `translate(-50%, ${popupBelow ? '12px' : 'calc(-100% - 12px)'})`,
                  }
            }
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleClose}
          >
            <PrefecturePopup prefectureCode={popup.prefCode} title={popup.title} users={popup.users} />
          </div>
        </>
      )}
    </div>
  );
}
