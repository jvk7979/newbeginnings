// src/pages/Atlas/APMap.jsx
import { useEffect, useMemo, useState } from 'react';
import { C } from '../../tokens';
import { AP_DISTRICTS, AP_DISTRICT_CENTROIDS } from './cropData';
import {
  buildPathGen, fetchGeoJSON, AP_GEOJSON_URLS,
  districtNameOf, intensityColor,
} from './geoHelpers';

const W = 1000, H = 1000;

export default function APMap({ filter, hovered, selected, onHover, onSelect }) {
  const [geo, setGeo] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    fetchGeoJSON(AP_GEOJSON_URLS).then((json) => {
      if (cancelled) return;
      if (json?.features?.length) { setGeo(json); setStatus('ok'); }
      else setStatus('fallback');
    });
    return () => { cancelled = true; };
  }, []);

  const districtMetric = (name) => {
    const d = AP_DISTRICTS[name];
    if (!d) return 0;
    // Single-crop mode — colour by the chosen crop alone. District rows
    // carry no national-share column, so 'share' falls back to production.
    if (filter.crop) {
      const row = d.crops.find((c) => c[0] === filter.crop);
      return row ? (filter.metric === 'area' ? row[3] : row[2]) : 0;
    }
    const crops = filter.category === 'all' ? d.crops : d.crops.filter((c) => c[1] === filter.category);
    return crops.reduce((s, c) => s + (filter.metric === 'area' ? c[3] : c[2]), 0);
  };

  const maxV = Math.max(...Object.keys(AP_DISTRICTS).map(districtMetric), 1);
  const intensityFor = (name) => {
    const v = districtMetric(name);
    if (v === 0) return 0;
    return Math.log(v + 1) / Math.log(maxV + 1);
  };

  const pathGen = useMemo(() => (geo ? buildPathGen(geo, W, H, 60) : null), [geo]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
         style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <pattern id="apgrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke={C.bg3} strokeWidth="0.5" opacity="0.55"/>
        </pattern>
        <radialGradient id="apvignette" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="rgba(246,241,231,0)"/>
          <stop offset="100%" stopColor="rgba(47,107,79,0.06)"/>
        </radialGradient>
        <filter id="ap-glow">
          <feGaussianBlur stdDeviation="2"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width={W} height={H} fill={C.bg0}/>
      <rect x="0" y="0" width={W} height={H} fill="url(#apgrid)"/>

      <text x="900" y="780" fill="var(--c-h-river)" fontSize="11"
            fontFamily="'Cormorant Garamond', 'Playfair Display', Georgia, serif"
            fontStyle="italic" textAnchor="end" opacity="0.85" letterSpacing="0.15em">
        Bay of Bengal
      </text>

      <g transform="translate(40, 60)">
        <text fill={C.fg2} fontSize="11" fontFamily="'DM Sans', sans-serif"
              fontWeight="700" letterSpacing="0.2em">ANDHRA PRADESH · DISTRICTS</text>
        <text y="22" fill={C.fg3} fontSize="9"
              fontFamily="'JetBrains Mono', monospace" opacity="0.95">
          12 priority districts shown · Godavari belt highlighted
        </text>
      </g>

      {status === 'loading' && (
        <text x={W/2} y={H/2} fill={C.fg2} fontSize="13"
              fontFamily="'DM Sans', sans-serif" textAnchor="middle">
          Loading district boundaries…
        </text>
      )}

      {status === 'ok' && pathGen && geo.features.map((f, i) => {
        const name = districtNameOf(f.properties);
        const hasData = !!AP_DISTRICTS[name];
        const t = hasData ? intensityFor(name) : 0;
        const isHover = hovered === name;
        const isSel = selected === name;
        const isHome = name === 'Konaseema';
        return (
          <path key={i}
                d={pathGen.path(f)}
                fill={hasData ? intensityColor(t) : C.bg2}
                stroke={isSel ? 'var(--c-accent-dim)' : isHome ? 'var(--c-h-gold)' : isHover ? C.accent : C.borderLight}
                strokeWidth={isSel ? 1.75 : isHome ? 1.6 : isHover ? 1.1 : 0.6}
                strokeDasharray={isHome && !isSel ? '4 2' : '0'}
                style={{
                  cursor: hasData ? 'pointer' : 'default',
                  transition: 'stroke 120ms',
                  filter: isSel || isHome ? 'url(#ap-glow)' : 'none',
                }}
                onMouseEnter={(e) => hasData && onHover?.(name, e)}
                onMouseMove={(e) => hasData && onHover?.(name, e)}
                onMouseLeave={() => onHover?.(null)}
                onClick={() => hasData && onSelect?.(name)}
          />
        );
      })}

      {/* Fallback view — stylised AP outline + bubbles */}
      {status === 'fallback' && (
        <g opacity="0.55" pointerEvents="none">
          <path d="M 850,110 Q 870,180 880,260 Q 870,340 800,410 Q 730,460 720,520 Q 720,600 660,680 Q 580,780 520,830 Q 460,860 360,890 Q 250,890 180,830 Q 130,750 130,650 Q 130,540 150,470 Q 180,400 180,330 Q 200,250 250,190 Q 350,120 500,110 Q 700,90 850,110 Z"
                fill={C.bg1} stroke={C.borderLight} strokeWidth="1" strokeDasharray="3 4"/>
          <path d="M 460,300 Q 540,330 600,360 Q 670,390 720,420" fill="none"
                stroke="var(--c-h-river)" strokeWidth="3" strokeLinecap="round" opacity="0.85"/>
          <text x="510" y="295" fill="var(--c-h-river)" fontSize="10"
                fontFamily="'Cormorant Garamond', 'Playfair Display', Georgia, serif"
                fontStyle="italic" opacity="0.9">Godavari</text>
          <path d="M 280,520 Q 360,540 430,540 Q 480,540 510,510" fill="none"
                stroke="var(--c-h-river)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
          <text x="340" y="515" fill="var(--c-h-river)" fontSize="10"
                fontFamily="'Cormorant Garamond', 'Playfair Display', Georgia, serif"
                fontStyle="italic" opacity="0.85">Krishna</text>
        </g>
      )}

      {status === 'fallback' && Object.entries(AP_DISTRICT_CENTROIDS).map(([name, [cx, cy]]) => {
        const t = intensityFor(name);
        const r = 14 + t * 32;
        const isHome = name === 'Konaseema';
        const isHover = hovered === name;
        const isSel = selected === name;
        return (
          <g key={name} style={{ cursor: 'pointer' }}
             onMouseEnter={(e) => onHover?.(name, e)}
             onMouseMove={(e) => onHover?.(name, e)}
             onMouseLeave={() => onHover?.(null)}
             onClick={() => onSelect?.(name)}>
            <circle cx={cx} cy={cy} r={r + 6} fill={intensityColor(t)} opacity="0.22"/>
            <circle cx={cx} cy={cy} r={r} fill={intensityColor(t)}
                    stroke={isSel ? 'var(--c-accent-dim)' : isHome ? 'var(--c-h-gold)' : isHover ? C.accent : C.borderLight}
                    strokeWidth={isSel ? 1.75 : isHome ? 1.6 : 1}
                    strokeDasharray={isHome && !isSel ? '4 2' : '0'}/>
            <text x={cx} y={cy + r + 14}
                  fill={isHome ? 'var(--c-h-gold)' : C.fg2}
                  fontSize="10" fontFamily="'JetBrains Mono', monospace"
                  textAnchor="middle" fontWeight={isHome ? 700 : 500}
                  letterSpacing="0.05em">
              {name.toUpperCase()}
            </text>
            {isHome && (
              <text x={cx} y={cy + 4} fill={C.bg1} fontSize="14"
                    fontFamily="'DM Sans', sans-serif" fontWeight="700"
                    textAnchor="middle">★</text>
            )}
          </g>
        );
      })}

      <rect x="0" y="0" width={W} height={H} fill="url(#apvignette)" pointerEvents="none"/>
    </svg>
  );
}
