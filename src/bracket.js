// ─────────────────────────────────────────────────────────────
//  Schema eliminatorii FIFA World Cup 2026 (48 echipe)
//  16-imi: echipe hardcodate cu rezultatele reale din grupe
//  De la optimi incolo: calculat automat din rezultatele arbitrului
//  Ore: Romania (EEST = UTC+3)
// ─────────────────────────────────────────────────────────────

export const GROUP_LETTERS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

// ── 16-imi — echipe hardcodate dupa rezultatele reale ────────
export const R32 = [
  { id:"r32_73", num:73, home:"Africa de Sud", away:"Canada",        kickoff:"2026-06-28T22:00", label:"M73" },
  { id:"r32_74", num:74, home:"Germania",      away:"Paraguay",      kickoff:"2026-06-29T23:30", label:"M74" },
  { id:"r32_75", num:75, home:"Olanda",        away:"Maroc",         kickoff:"2026-06-30T04:00", label:"M75" },
  { id:"r32_76", num:76, home:"Brazilia",      away:"Japonia",       kickoff:"2026-06-29T20:00", label:"M76" },
  { id:"r32_77", num:77, home:"Franta",        away:"Suedia",        kickoff:"2026-07-01T00:00", label:"M77" },
  { id:"r32_78", num:78, home:"Coasta de Fildes", away:"Norvegia",   kickoff:"2026-06-30T20:00", label:"M78" },
  { id:"r32_79", num:79, home:"Mexic",         away:"Ecuador",       kickoff:"2026-07-01T04:00", label:"M79" },
  { id:"r32_80", num:80, home:"Anglia",        away:"DR Congo",      kickoff:"2026-07-01T19:00", label:"M80" },
  { id:"r32_81", num:81, home:"SUA",           away:"Bosnia",        kickoff:"2026-07-02T03:00", label:"M81" },
  { id:"r32_82", num:82, home:"Belgia",        away:"Senegal",       kickoff:"2026-07-01T23:00", label:"M82" },
  { id:"r32_83", num:83, home:"Portugalia",    away:"Croatia",       kickoff:"2026-07-03T02:00", label:"M83" },
  { id:"r32_84", num:84, home:"Spania",        away:"Austria",       kickoff:"2026-07-02T22:00", label:"M84" },
  { id:"r32_85", num:85, home:"Elvetia",       away:"Algeria",       kickoff:"2026-07-03T06:00", label:"M85" },
  { id:"r32_86", num:86, home:"Argentina",     away:"Capul Verde",   kickoff:"2026-07-04T01:00", label:"M86" },
  { id:"r32_87", num:87, home:"Columbia",      away:"Ghana",         kickoff:"2026-07-04T04:30", label:"M87" },
  { id:"r32_88", num:88, home:"Australia",     away:"Egipt",         kickoff:"2026-07-03T21:00", label:"M88" },
];

// ── Optimi — calculat automat din rezultatele 16-imilor ──────
export const R16 = [
  { id:"r16_89", num:89, s1:"W74", s2:"W77", kickoff:"2026-07-05T00:00", label:"M89" },
  { id:"r16_90", num:90, s1:"W73", s2:"W75", kickoff:"2026-07-04T20:00", label:"M90" },
  { id:"r16_91", num:91, s1:"W76", s2:"W78", kickoff:"2026-07-05T01:00", label:"M91" },
  { id:"r16_92", num:92, s1:"W79", s2:"W80", kickoff:"2026-07-06T03:00", label:"M92" },
  { id:"r16_93", num:93, s1:"W81", s2:"W82", kickoff:"2026-07-07T03:00", label:"M93" },
  { id:"r16_94", num:94, s1:"W83", s2:"W84", kickoff:"2026-07-06T22:00", label:"M94" },
  { id:"r16_95", num:95, s1:"W85", s2:"W87", kickoff:"2026-07-07T23:00", label:"M95" },
  { id:"r16_96", num:96, s1:"W86", s2:"W88", kickoff:"2026-07-07T19:00", label:"M96" },
];

// ── Sferturi ──────────────────────────────────────────────────
export const QF = [
  { id:"qf_97",  num:97,  s1:"W89", s2:"W90", kickoff:"2026-07-09T23:00", label:"M97"  },
  { id:"qf_98",  num:98,  s1:"W91", s2:"W92", kickoff:"2026-07-10T22:00", label:"M98"  },
  { id:"qf_99",  num:99,  s1:"W93", s2:"W94", kickoff:"2026-07-12T00:00", label:"M99"  },
  { id:"qf_100", num:100, s1:"W95", s2:"W96", kickoff:"2026-07-12T04:00", label:"M100" },
];

// ── Semifinale ────────────────────────────────────────────────
export const SF = [
  { id:"sf_101", num:101, s1:"W97",  s2:"W98",  kickoff:"2026-07-14T22:00", label:"M101" },
  { id:"sf_102", num:102, s1:"W99",  s2:"W100", kickoff:"2026-07-15T22:00", label:"M102" },
];

// ── Finala mica + Finala ──────────────────────────────────────
export const FINAL = [
  { id:"f_103", num:103, s1:"L101", s2:"L102", kickoff:"2026-07-19T00:00", label:"M103 · Locul 3" },
  { id:"f_104", num:104, s1:"W101", s2:"W102", kickoff:"2026-07-19T22:00", label:"M104 · FINALA"  },
];

export const ALL_KO = [
  ...R32.map(m=>({...m, phase:"16imi"})),
  ...R16.map(m=>({...m, phase:"optimi"})),
  ...QF.map(m=>({...m, phase:"sferturi"})),
  ...SF.map(m=>({...m, phase:"semi"})),
  ...FINAL.map(m=>({...m, phase:"finala"})),
];

// ── Clasament o grupa (folosit in tabul Rezultate) ────────────
export function computeStandings(letter, groupMatches) {
  const gm = groupMatches.filter(m => m.group === "Grupa " + letter);
  const stats = {};
  gm.forEach(m => {
    [m.home, m.away].forEach(t => {
      if (!stats[t]) stats[t] = { team:t, played:0, won:0, draw:0, lost:0, gf:0, ga:0, gd:0, pts:0 };
    });
    if (!m.result || !m.result.score) return;
    const sc = m.result.score.match(/(\d+)\s*[-:]\s*(\d+)/);
    if (!sc) return;
    const [hg, ag] = [parseInt(sc[1]), parseInt(sc[2])];
    const h = stats[m.home], a = stats[m.away];
    if (!h || !a) return;
    h.played++; a.played++; h.gf += hg; h.ga += ag; a.gf += ag; a.ga += hg;
    if (hg > ag)      { h.won++; h.pts += 3; a.lost++; }
    else if (hg < ag) { a.won++; a.pts += 3; h.lost++; }
    else              { h.draw++; a.draw++; h.pts++; a.pts++; }
  });
  Object.values(stats).forEach(s => s.gd = s.gf - s.ga);
  return Object.values(stats).sort((a, b) =>
    b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team)
  );
}

// ── Rezolva un slot W/L la echipa concreta ────────────────────
function resolveSlot(slot, koResults) {
  const wl = slot.match(/^([WL])(\d+)$/);
  if (!wl) return null;
  const targetNum = parseInt(wl[2]);
  const ko = ALL_KO.find(k => k.num === targetNum);
  if (!ko) return null;
  const r = koResults[ko.id];
  if (!r || !r.pick) return null;
  const winner = r.pick === "1" ? r.home : r.away;
  const loser  = r.pick === "1" ? r.away : r.home;
  return wl[1] === "W" ? winner : loser;
}

function slotLabel(slot) {
  const wl = slot.match(/^([WL])(\d+)$/);
  if (wl) return `${wl[1] === "W" ? "castigator" : "pierzator"} M${wl[2]}`;
  return slot;
}

// ── Genereaza lista completa de meciuri KO cu echipele rezolvate ──
export function generateKO(groupMatches, koResults, overrides = {}) {
  return ALL_KO.map(ko => {
    const r = koResults[ko.id];

    // 16-imi: echipele sunt hardcodate direct
    if (ko.phase === "16imi") {
      return {
        id: ko.id,
        phase: ko.phase,
        group: ko.label,
        home: ko.home,
        away: ko.away,
        kickoff: ko.kickoff,
        matchNum: ko.num,
        isPlaceholder: false,
        result: r ? { pick: r.pick, score: r.score } : undefined,
      };
    }

    // Optimi si mai departe: calculat din rezultatele anterioare
    const homeOverride = overrides && overrides[ko.s1];
    const awayOverride = overrides && overrides[ko.s2];
    const storedHome = r && r.home;
    const storedAway = r && r.away;
    const home = homeOverride || storedHome || resolveSlot(ko.s1, koResults) || `(${slotLabel(ko.s1)})`;
    const away = awayOverride || storedAway || resolveSlot(ko.s2, koResults) || `(${slotLabel(ko.s2)})`;
    const isPlaceholder = home.startsWith("(") || away.startsWith("(");

    return {
      id: ko.id,
      phase: ko.phase,
      group: ko.label,
      home,
      away,
      kickoff: ko.kickoff,
      matchNum: ko.num,
      isPlaceholder,
      result: r ? { pick: r.pick, score: r.score } : undefined,
    };
  });
}
