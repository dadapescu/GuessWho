// ─────────────────────────────────────────────────────────────
//  Schema eliminatorii FIFA World Cup 2026 (48 echipe)
//  32 echipe trec mai departe: locurile 1 si 2 din fiecare grupa
//  + cele mai bune 8 locuri 3 din 12 grupe.
//  Ore: Romania (EEST = UTC+3)
// ─────────────────────────────────────────────────────────────

export const GROUP_LETTERS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

// ── Schema oficiala Round of 32 (16-imi) ─────────────────────
export const R32 = [
  { id:"r32_73", num:73, s1:"2A", s2:"2B",       kickoff:"2026-06-28T22:00", label:"M73" },
  { id:"r32_74", num:74, s1:"1E", s2:"3ABCDF",   kickoff:"2026-06-28T23:30", label:"M74" },
  { id:"r32_75", num:75, s1:"1C", s2:"2F",        kickoff:"2026-06-30T00:00", label:"M75" },
  { id:"r32_76", num:76, s1:"2E", s2:"2I",        kickoff:"2026-06-30T20:00", label:"M76" },
  { id:"r32_77", num:77, s1:"1I", s2:"3CDFGH",   kickoff:"2026-07-01T00:00", label:"M77" },
  { id:"r32_78", num:78, s1:"1F", s2:"2C",        kickoff:"2026-07-01T04:00", label:"M78" },
  { id:"r32_79", num:79, s1:"1A", s2:"3CEFHI",   kickoff:"2026-07-01T04:00", label:"M79" },
  { id:"r32_80", num:80, s1:"1L", s2:"3EHIJK",   kickoff:"2026-07-01T19:00", label:"M80" },
  { id:"r32_81", num:81, s1:"1G", s2:"3AEHIJ",   kickoff:"2026-07-02T03:00", label:"M81" },
  { id:"r32_82", num:82, s1:"1D", s2:"3BEFIJ",   kickoff:"2026-07-02T07:00", label:"M82" },
  { id:"r32_83", num:83, s1:"2K", s2:"2L",        kickoff:"2026-07-03T02:00", label:"M83" },
  { id:"r32_84", num:84, s1:"1H", s2:"2J",        kickoff:"2026-07-03T22:00", label:"M84" },
  { id:"r32_85", num:85, s1:"1B", s2:"3EFGIJ",   kickoff:"2026-07-04T06:00", label:"M85" },
  { id:"r32_86", num:86, s1:"1J", s2:"2H",        kickoff:"2026-07-04T01:00", label:"M86" },
  { id:"r32_87", num:87, s1:"1K", s2:"3DEIJL",   kickoff:"2026-07-04T04:30", label:"M87" },
  { id:"r32_88", num:88, s1:"2D", s2:"2G",        kickoff:"2026-07-03T21:00", label:"M88" },
];

// ── Optimi ───────────────────────────────────────────────────
export const R16 = [
  { id:"r16_89", num:89, s1:"W86", s2:"W88", kickoff:"2026-07-05T00:00", label:"M89" },
  { id:"r16_90", num:90, s1:"W74", s2:"W77", kickoff:"2026-07-04T20:00", label:"M90" },
  { id:"r16_91", num:91, s1:"W76", s2:"W78", kickoff:"2026-07-04T23:00", label:"M91" },
  { id:"r16_92", num:92, s1:"W79", s2:"W80", kickoff:"2026-07-05T03:00", label:"M92" },
  { id:"r16_93", num:93, s1:"W73", s2:"W75", kickoff:"2026-07-05T22:00", label:"M93" },
  { id:"r16_94", num:94, s1:"W85", s2:"W87", kickoff:"2026-07-06T03:00", label:"M94" },
  { id:"r16_95", num:95, s1:"W83", s2:"W84", kickoff:"2026-07-06T22:00", label:"M95" },
  { id:"r16_96", num:96, s1:"W81", s2:"W82", kickoff:"2026-07-07T03:00", label:"M96" },
];

// ── Sferturi ──────────────────────────────────────────────────
export const QF = [
  { id:"qf_97",  num:97,  s1:"W91", s2:"W92", kickoff:"2026-07-09T23:00", label:"M97"  },
  { id:"qf_98",  num:98,  s1:"W93", s2:"W94", kickoff:"2026-07-10T22:00", label:"M98"  },
  { id:"qf_99",  num:99,  s1:"W89", s2:"W90", kickoff:"2026-07-12T00:00", label:"M99"  },
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

// ── Clasament o grupa ─────────────────────────────────────────
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

function isGroupComplete(letter, groupMatches) {
  const gm = groupMatches.filter(m => m.group === "Grupa " + letter);
  return gm.length >= 6 && gm.every(m => m.result);
}

function getPlace(letter, place, groupMatches) {
  if (!isGroupComplete(letter, groupMatches)) return null;
  const s = computeStandings(letter, groupMatches);
  return s[place - 1] ? s[place - 1].team : null;
}

// ── Cele mai bune 8 locuri 3 ─────────────────────────────────
// Returneaza un map { slot -> grupa } pentru sloturile "3XXXXX"
function getBestThirds(groupMatches) {
  const thirds = GROUP_LETTERS
    .filter(g => isGroupComplete(g, groupMatches))
    .map(g => {
      const s = computeStandings(g, groupMatches);
      return s[2] ? { group: g, ...s[2] } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.group.localeCompare(b.group));

  if (thirds.length < 8) return {}; // nu toate grupele s-au terminat

  const qualified = thirds.slice(0, 8).map(t => t.group);
  const slots = ["3ABCDF","3BEFIJ","3CDFGH","3CEFHI","3AEHIJ","3EHIJK","3EFGIJ","3DEIJL"];

  // Greedy: fiecare slot primeste prima grupa calificata compatibila (in ordinea ranking-ului)
  const assignment = {};
  const used = new Set();
  // Sortam sloturile dupa nr de optiuni (cele mai restrictive primele)
  const byConstraint = [...slots].sort((a, b) => a.length - b.length);
  for (const slot of byConstraint) {
    const letters = slot.slice(1).split("");
    for (const g of qualified) {
      if (used.has(g)) continue;
      if (letters.includes(g)) { assignment[slot] = g; used.add(g); break; }
    }
  }
  return assignment;
}

// ── Rezolva un slot la o echipa concreta ─────────────────────
function resolveSlot(slot, groupMatches, koResults, overrides) {
  if (overrides && overrides[slot]) return overrides[slot];

  // Locul 1 sau 2 dintr-o grupa
  const m12 = slot.match(/^([12])([A-L])$/);
  if (m12) return getPlace(m12[2], parseInt(m12[1]), groupMatches);

  // Locul 3 dintr-un set de grupe
  if (slot.startsWith("3")) {
    const assignment = getBestThirds(groupMatches);
    const g = assignment[slot];
    if (!g) return null;
    return getPlace(g, 3, groupMatches);
  }

  // Castigator/pierzator al unui meci eliminator
  const wl = slot.match(/^([WL])(\d+)$/);
  if (wl) {
    const targetNum = parseInt(wl[2]);
    const ko = ALL_KO.find(k => k.num === targetNum);
    if (!ko) return null;
    const r = koResults[ko.id];
    if (!r || !r.pick) return null;
    // in eliminatorii nu exista egal (X); pick-ul e "1" sau "2"
    const winner = r.pick === "1" ? r.home : r.away;
    const loser  = r.pick === "1" ? r.away : r.home;
    return wl[1] === "W" ? winner : loser;
  }

  return null;
}

// ── Genereaza lista completa de meciuri KO cu echipele rezolvate ──
export function generateKO(groupMatches, koResults, overrides = {}) {
  return ALL_KO.map(ko => {
    const r = koResults[ko.id];
    // Daca avem deja un rezultat stocat cu echipele, folosim acelea direct
    const homeStored = r && r.home;
    const awayStored = r && r.away;
    const home = homeStored || resolveSlot(ko.s1, groupMatches, koResults, overrides) || `(${slotLabel(ko.s1)})`;
    const away = awayStored || resolveSlot(ko.s2, groupMatches, koResults, overrides) || `(${slotLabel(ko.s2)})`;
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

function slotLabel(slot) {
  const m = slot.match(/^([12])([A-L])$/);
  if (m) return `locul ${m[1]} gr.${m[2]}`;
  if (slot.startsWith("3")) return `locul 3 (${slot.slice(1)})`;
  const wl = slot.match(/^([WL])(\d+)$/);
  if (wl) return `${wl[1] === "W" ? "castigator" : "pierzator"} M${wl[2]}`;
  return slot;
}
