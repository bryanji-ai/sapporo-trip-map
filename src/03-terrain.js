/* ══ 수채 질감을 위한 필터·그라데이션 (두 지역이 함께 쓴다) ══ */
function defs(id){
  return `<defs>
    <linearGradient id="${id}-land" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--land)"/><stop offset="1" stop-color="var(--land-2)"/></linearGradient>
    <linearGradient id="${id}-wtr" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="var(--water)"/><stop offset="1" stop-color="var(--water-2)"/></linearGradient>
    <linearGradient id="${id}-sea" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="var(--sea)"/><stop offset="1" stop-color="var(--sea-2)"/></linearGradient>
    <radialGradient id="${id}-glow"><stop offset="0" stop-color="#fff" stop-opacity=".5"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}-shade"><stop offset="0" stop-color="var(--wash-shade)" stop-opacity=".2"/>
      <stop offset="1" stop-color="var(--wash-shade)" stop-opacity="0"/></radialGradient>

    <!-- 밭 이랑 — 갈아놓은 결 -->
    <pattern id="${id}-row" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
      <path d="M0,0 V7" stroke="#8A7550" stroke-opacity=".13" stroke-width="1.6"/></pattern>

    <!-- 바다 잔물결 — 바다 폴리곤을 이 무늬로 한 번 더 덮는다 -->
    <pattern id="${id}-wave" width="34" height="30" patternUnits="userSpaceOnUse">
      <path d="M-17,9 q8.5,-5.5 17,0 t17,0" fill="none" stroke="var(--water-line)"
            stroke-opacity=".30" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M0,23 q8.5,-5.5 17,0 t17,0" fill="none" stroke="var(--water-line)"
            stroke-opacity=".20" stroke-width="1.1" stroke-linecap="round"/></pattern>

    <!-- 손으로 그린 듯 윤곽을 살짝 흔든다 -->
    <filter id="${id}-hand" x="-3%" y="-3%" width="106%" height="106%">
      <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed="11" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <!-- 물감이 번진 가장자리 -->
    <filter id="${id}-bleed" x="-8%" y="-8%" width="116%" height="116%">
      <feGaussianBlur stdDeviation="2.6"/>
    </filter>
    <!-- 언덕 — 고도 격자를 뭉개 부드러운 수채 워시로 -->
    <filter id="${id}-hill" x="-6%" y="-6%" width="112%" height="112%">
      <feGaussianBlur stdDeviation="15"/>
    </filter>
    <!-- 종이 결 -->
    <filter id="${id}-grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="5"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>`;
}

/* 빛과 구름 그림자 — 평평해 보이지 않게 크게 흩뿌린다 */
function washes(map){
  const spots=[[0.22,0.14,0.30],[0.72,0.09,0.24],[0.15,0.52,0.28],[0.80,0.44,0.26],
               [0.45,0.30,0.22],[0.62,0.72,0.30],[0.24,0.85,0.26],[0.86,0.86,0.22]];
  return spots.map(([fx,fy,fr],i)=>{
    const r=map.w*fr;
    return `<ellipse cx="${(map.w*fx).toFixed(0)}" cy="${(map.h*fy).toFixed(0)}"
      rx="${r.toFixed(0)}" ry="${(r*0.72).toFixed(0)}"
      fill="url(#bm-${i%2?'glow':'shade'})" opacity="${i%2?0.34:0.42}"/>`;
  }).join('');
}

/* ══ 비에이 언덕 — SRTM 고도 격자를 그림으로 ══
   1) 고도별 색 워시 (순위 백분위로 색을 고르게 퍼뜨린다)
   2) 북서쪽 광원 기준 음영 — 능선이 실제로 도드라진다
   3) 100 m 등고선 (마칭 스퀘어)                                     */
function hills(dem, map){
  const {nx,ny,z} = dem;
  const flat = z.flat().slice().sort((a,b)=>a-b);
  const pct = v => {                      // 값 → 0~1 백분위
    let lo=0, hi=flat.length;
    while (lo<hi){ const m=(lo+hi)>>1; if (flat[m]<v) lo=m+1; else hi=m; }
    return lo/(flat.length-1);
  };
  const RAMP = [[0,[246,236,212]],[0.34,[235,224,192]],[0.60,[221,208,168]],
                [0.81,[203,191,150]],[1,[178,169,133]]];
  const col = t => {
    for (let i=1;i<RAMP.length;i++){
      if (t <= RAMP[i][0]){
        const [t0,c0]=RAMP[i-1], [t1,c1]=RAMP[i];
        const u=(t-t0)/(t1-t0);
        return `rgb(${c0.map((c,j)=>Math.round(c+(c1[j]-c)*u)).join(',')})`;
      }
    }
    return `rgb(${RAMP[RAMP.length-1][1].join(',')})`;
  };
  const cw = map.w/nx, ch = map.h/ny;
  const at = (x,y) => z[Math.max(0,Math.min(ny-1,y))][Math.max(0,Math.min(nx-1,x))];

  let wash='', shade='';
  for (let y=0;y<ny;y++) for (let x=0;x<nx;x++){
    const X=(x*cw).toFixed(1), Y=(y*ch).toFixed(1);
    const W=(cw+1.4).toFixed(1), H=(ch+1.4).toFixed(1);
    wash += `<rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="${col(pct(at(x,y)))}"/>`;
    // 북서 광원 — 서쪽·북쪽이 높으면 그늘, 낮으면 빛
    const s = ((at(x-1,y)-at(x+1,y)) + (at(x,y-1)-at(x,y+1))) / 260;
    const o = Math.min(0.5, Math.abs(s));
    if (o > 0.03)
      shade += `<rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="${s<0?'#FFFFFF':'#7A6A4C'}" opacity="${o.toFixed(2)}"/>`;
  }

  // 등고선 — 격자 셀 가운데를 잇는다
  const cx = ix => (ix+0.5)*cw, cy = iy => (iy+0.5)*ch;
  let iso = '';
  for (let lv = 300; lv <= flat[flat.length-1]; lv += 100){
    let d = '';
    for (let y=0;y<ny-1;y++) for (let x=0;x<nx-1;x++){
      const c = [[cx(x),cy(y),z[y][x]],[cx(x+1),cy(y),z[y][x+1]],
                 [cx(x+1),cy(y+1),z[y+1][x+1]],[cx(x),cy(y+1),z[y+1][x]]];
      const hit = [];
      for (let e=0;e<4;e++){
        const [ax,ay,av]=c[e], [bx,by,bv]=c[(e+1)%4];
        if ((av<lv) === (bv<lv)) continue;
        const u=(lv-av)/(bv-av);
        hit.push([ax+(bx-ax)*u, ay+(by-ay)*u]);
      }
      for (let i=0;i+1<hit.length;i+=2)
        d += `M${hit[i][0].toFixed(1)},${hit[i][1].toFixed(1)} L${hit[i+1][0].toFixed(1)},${hit[i+1][1].toFixed(1)} `;
    }
    if (d) iso += `<path d="${d}"/>`;
  }

  return `<g filter="url(#bm-hill)">${wash}${shade}</g>`
       + `<g fill="none" stroke="var(--hill-line)" stroke-width="0.8" opacity=".38" stroke-linecap="round">${iso}</g>`;
}

/* 밭 패치워크 — 밀·라벤더·감자 3색 + 갈아놓은 이랑 결 */
function farmland(map){
  const F = map.farm;
  if (!F || !F.length) return '';
  const faces = F.map(([d,c]) => `<path class="fm f${c}" d="${d}"/>`).join('');
  const rows  = F.map(([d]) => `<path d="${d}"/>`).join('');
  return faces + `<g fill="url(#bm-row)" stroke="none">${rows}</g>`;
}

/* ══ 오타루 바다 ══
   sea 는 해안선을 타일 둘레로 닫아 만든 폴리곤, isle 은 그 안의 섬이다.
   바다를 깔고 → 잔물결을 바다 안쪽에만 넣고 → 섬을 뭍 색으로 되덮는다. */
function seaLayer(R){
  const map = R.map;
  if (!map.sea || !map.sea.length) return '';
  const j = a => a.map(d => `<path d="${d}"/>`).join('');
  let s = '';

  // 물감이 번진 가장자리 → 본색 → 잔물결 무늬
  s += `<g fill="var(--sea-2)" opacity=".5" filter="url(#bm-bleed)" transform="translate(1.8,2.6)">${j(map.sea)}</g>`;
  s += `<g fill="url(#bm-sea)" stroke="var(--water-line)" stroke-width="1.5" stroke-linejoin="round">${j(map.sea)}</g>`;
  s += `<g fill="url(#bm-wave)" stroke="none">${j(map.sea)}</g>`;

  // 섬 · 암초 — 다시 뭍으로
  if (map.isle && map.isle.length)
    s += `<g fill="url(#bm-land)" stroke="var(--water-line)" stroke-width="1.1" stroke-linejoin="round">${j(map.isle)}</g>`;
  return s;
}

/* 방파제 · 부두 — 바다 위로 뻗은 콘크리트 */
function piers(map){
  const P = map.layers.pier;
  if (!P || !P.length) return '';
  const j = a => a.map(d => `<path d="${d}"/>`).join('');
  return `<g fill="none" stroke="var(--pier-case)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">${j(P)}</g>`
       + `<g fill="none" stroke="var(--pier)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${j(P)}</g>`;
}

/* 폴리곤 목록의 큰 것들에서 대략 중심·크기를 뽑는다 */
function blobs(paths, minSide){
  const out = [];
  paths.forEach(d => {
    const nums = d.match(/-?\d+(?:\.\d+)?/g);
    if (!nums || nums.length < 8) return;
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    for (let i=0;i<nums.length-1;i+=2){
      const x=+nums[i], y=+nums[i+1];
      if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y;
    }
    const w=x1-x0, h=y1-y0;
    if (w<minSide || h<minSide) return;
    out.push({cx:(x0+x1)/2, cy:(y0+y1)/2, w, h, a:w*h});
  });
  return out.sort((a,b)=>b.a-a.a);
}

/* 공원 위에 흩뿌릴 둥근 나무 (삿포로) */
const TREE = ['var(--t0)','var(--t1)','var(--t2)'];
function parkTrees(map){
  let g='';
  blobs(map.layers.green, 13).slice(0,70).forEach((b,i)=>{
    const n = b.a > 9000 ? 5 : b.a > 3000 ? 3 : 2;
    for (let t=0;t<n;t++){
      const jx = ((i*37+t*53)%100/100 - .5) * b.w * .26;
      const jy = ((i*61+t*29)%100/100 - .5) * b.h * .26;
      const r  = 4 + ((i*13 + t*7) % 9) * 0.5;              // 4 ~ 8
      const c  = TREE[(i*3 + t*5) % 3];
      g += `<g transform="translate(${(b.cx+jx).toFixed(1)},${(b.cy+jy).toFixed(1)})">
        <ellipse cx="${(r*0.15).toFixed(1)}" cy="${(r*0.9).toFixed(1)}" rx="${(r*0.9).toFixed(1)}" ry="${(r*0.32).toFixed(1)}" fill="var(--t2)" opacity=".26"/>
        <circle cx="0" cy="0" r="${r.toFixed(1)}" fill="${c}"/>
        <circle cx="${(-r*0.26).toFixed(1)}" cy="${(-r*0.28).toFixed(1)}" r="${(r*0.58).toFixed(1)}" fill="var(--t1)" opacity=".5"/></g>`;
    }
  });
  return g;
}

/* 숲 위에 흩뿌릴 침엽수 (비에이) */
const CONI = ['#3F6B52','#33604A','#4C7A5E'];
function coniferBelt(map){
  let g='';
  blobs(map.layers.green, 11).slice(0,120).forEach((b,i)=>{
    const n = b.a > 4000 ? 4 : b.a > 900 ? 2 : 1;
    for (let t=0;t<n;t++){
      const jx = ((i*41+t*67)%100/100 - .5) * b.w * .62;
      const jy = ((i*53+t*31)%100/100 - .5) * b.h * .62;
      g += conifer(b.cx+jx, b.cy+jy, 0.30 + ((i*7+t*11)%6)*0.035, CONI[(i*3+t*5)%3]);
    }
  });
  return g;
}

/* ══ 지형 SVG ══ */
function terrain(R){
  const map = R.map, P = map.layers;
  const j = a => a.map(d=>`<path d="${d}"/>`).join('');
  const rural = R.kind === 'rural';
  const coast = R.kind === 'coast';
  let s = '';

  const PAD = 60;   // 살짝 번져 나가는 여백만
  const OX = (-PAD).toFixed(0), OW = (map.w+PAD*2).toFixed(0), OH = (map.h+PAD*2).toFixed(0);
  s += `<rect x="${OX}" y="${OX}" width="${OW}" height="${OH}" fill="url(#bm-land)"/>`;
  if (rural && R.dem) s += hills(R.dem, map);
  else s += washes(map);

  s += `<g filter="url(#bm-hand)">`;

  // 바다는 뭍 바로 위 · 다른 모든 것 아래 — 해안선이 도시의 밑그림이 된다
  if (coast) s += seaLayer(R);

  if (rural) s += farmland(map);

  // 초록 — 번진 밑색 위에 공원색, 그 위에 밝은 중간톤을 살짝 어긋나게
  s += `<g fill="var(--park-wash)" opacity=".34" filter="url(#bm-bleed)" transform="translate(1.5,2)">${j(P.green)}</g>`;
  s += `<g fill="var(--green)" stroke="var(--green-line)" stroke-width="1" stroke-linejoin="round">${j(P.green)}</g>`;
  s += `<g fill="var(--park-mid)" opacity=".42" transform="translate(-1.2,-1.8)">${j(P.green)}</g>`;

  // 물
  s += `<g fill="var(--water-line)" opacity=".4" filter="url(#bm-bleed)" transform="translate(1.5,2.5)">${j(P.water)}</g>`;
  s += `<g fill="url(#bm-wtr)" stroke="var(--water-line)" stroke-width="1.2" stroke-linejoin="round">${j(P.water)}</g>`;
  const rw = rural ? [4.2,2.8] : [9.4,7.2];
  s += `<g fill="none" stroke="var(--water-line)" stroke-width="${rw[0]}" stroke-linecap="round" stroke-linejoin="round">${j(P.river)}</g>`;
  s += `<g fill="none" stroke="var(--water)" stroke-width="${rw[1]}" stroke-linecap="round" stroke-linejoin="round">${j(P.river)}</g>`;
  // 실개천 — 지도를 덮지 않게 아주 얇고 흐리게
  if (P.stream && P.stream.length)
    s += `<g fill="none" stroke="var(--water-line)" stroke-width="1.1" opacity=".42" stroke-linecap="round" stroke-linejoin="round">${j(P.stream)}</g>`;

  // 흙길
  const ribbon = (arr,cw,fw,fill) =>
    `<g fill="none" stroke="var(--road-case)" stroke-width="${cw}" stroke-linecap="round" stroke-linejoin="round">${j(arr)}</g>` +
    `<g fill="none" stroke="${fill}" stroke-width="${fw}" stroke-linecap="round" stroke-linejoin="round">${j(arr)}</g>`;
  if (rural){
    s += ribbon(P.road3, 1.5, 0.9, 'var(--road-min)');
    s += ribbon(P.road2, 2.6, 1.7, 'var(--road-fill)');
    s += ribbon(P.road1, 4.6, 3.2, 'var(--road-fill)');
  } else {
    s += ribbon(P.road3, 2.4, 1.5, 'var(--road-min)');
    s += ribbon(P.road2, 4.4, 3.2, 'var(--road-fill)');
    s += ribbon(P.road1, 6.8, 5.2, 'var(--road-fill)');
  }

  if (coast) s += piers(map);

  s += `<g fill="none" stroke="var(--rail)" stroke-width="1.7" stroke-linecap="round">${j(P.rail)}</g>`;
  s += `<g fill="none" stroke="var(--land)" stroke-width="0.9" stroke-dasharray="3 4">${j(P.rail)}</g>`;

  if (map.bldg && map.bldg.length)
    s += map.bldg.map(([d,h,ci]) => `<path class="bd r${ci}" d="${d}"/>`).join('');

  s += rural ? coniferBelt(map) : parkTrees(map);
  s += `</g>`;

  // 종이 결
  s += `<rect x="${OX}" y="${OX}" width="${OW}" height="${OH}"
          filter="url(#bm-grain)" opacity=".075" style="mix-blend-mode:multiply"/>`;
  return s;
}

/* 지형은 지역마다 한 번만 그려 캐시한다 */
function terrainOf(R){
  if (!R._terrain) R._terrain = terrain(R);
  return R._terrain;
}

/* ── 랜드마크 그림 (핀 아래 레이어) ── */
function landmarkArt(R, scale){
  return R.marks.map(m => {
    const [x,y] = R.px(m.lat,m.lon);
    const k = m.s * scale * 1.18;
    return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
      <ellipse cx="0" cy="${(1.5*k).toFixed(1)}" rx="${(9*k).toFixed(1)}" ry="${(2.6*k).toFixed(1)}" fill="var(--icon)" opacity=".13"/>
      ${ICON[m.ic](k)}
    </g>`;
  }).join('');
}
/* 이름표 — 흰 배경 둥근 라벨. 핀보다 위에 그려 항상 읽히게 한다 */
function landmarkLabels(R, scale){
  return R.marks.filter(m => !m.bare).map(m => {
    const [x,y] = R.px(m.lat,m.lon);
    const k = m.s * scale * 1.18;
    const fs = 11.2*k, w = tw(m.n)*fs + 11*k, h = fs*1.62;
    const lx = x + (m.dx||0)*k, ly = y + (13.5 + (m.dy||0))*k;
    return `<g transform="translate(${lx.toFixed(1)},${ly.toFixed(1)})">
      <rect x="${(-w/2).toFixed(1)}" y="${(-h*0.72).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"
            rx="${(h/2).toFixed(1)}" fill="var(--map-halo)" stroke="#D6C4A2" stroke-width="${(1*k).toFixed(2)}"/>
      <text class="pill-t" x="0" y="0" font-size="${fs.toFixed(1)}" text-anchor="middle">${m.n}</text></g>`;
  }).join('');
}
