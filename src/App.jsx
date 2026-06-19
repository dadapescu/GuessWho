import React, { useState, useEffect, useCallback, useRef } from "react";
import { FLAGS, SEED_MATCHES } from "./seed";
import { getState, saveState, joinUser, savePick, resetUserPicks, resetAllPicks, subscribeState, subscribeUsers } from "./firebase";

// ── Culori ──────────────────────────────────────────────────
const C = {
  bg:"#F4F5FA", card:"#FFFFFF", ink:"#13182B", soft:"#5B6172", line:"#DEE1EC",
  navy:"#0B1F4B", navyD:"#071536", green:"#1D8A4E", greenP:"#E5F3EA",
  red:"#D32638", redP:"#FBE7E9", gold:"#D99A1B", goldP:"#FBF1DA",
};

const flag = (t) => FLAGS[t] || "⚽";

const PHASES = [
  {id:"grupe",label:"Grupe"},{id:"16imi",label:"16-imi"},{id:"optimi",label:"Optimi"},
  {id:"sferturi",label:"Sferturi"},{id:"semi",label:"Semifinale"},{id:"finala",label:"Finala"},
  {id:"rezultate",label:"Rezultate"},
];

const phaseLabel = (id) => (PHASES.find(p=>p.id===id)||{}).label||id;

// Stocare locala DOAR pentru numele utilizatorului — nimic altceva
const lsGet = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const fmtDate = (iso) => {
  const d = new Date(iso); if(isNaN(d)) return iso;
  const zile=["dum","lun","mar","mie","joi","vin","sam"];
  const luni=["ian","feb","mar","apr","mai","iun","iul","aug","sep","oct","nov","dec"];
  return `${zile[d.getDay()]} ${d.getDate()} ${luni[d.getMonth()]}, ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
};

const LOCK_OFFSET = 60 * 60 * 1000; // 1h inainte de meci

// ── Clasament grupe ──────────────────────────────────────────
const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];
function groupStandings(letter, matches) {
  const gm = matches.filter(m=>m.group==="Grupa "+letter);
  const stats = {};
  gm.forEach(m=>{
    [m.home,m.away].forEach(t=>{ if(!stats[t]) stats[t]={team:t,played:0,won:0,draw:0,lost:0,gf:0,ga:0,gd:0,pts:0}; });
    if(!m.result||!m.result.score) return;
    const sc = m.result.score.match(/(\d+)\s*[-:]\s*(\d+)/);
    if(!sc) return;
    const [hg,ag]=[parseInt(sc[1]),parseInt(sc[2])];
    const h=stats[m.home], a=stats[m.away];
    if(!h||!a) return;
    h.played++; a.played++; h.gf+=hg; h.ga+=ag; a.gf+=ag; a.ga+=hg;
    if(hg>ag){h.won++;h.pts+=3;a.lost++;}
    else if(hg<ag){a.won++;a.pts+=3;h.lost++;}
    else{h.draw++;a.draw++;h.pts++;a.pts++;}
  });
  Object.values(stats).forEach(s=>s.gd=s.gf-s.ga);
  return Object.values(stats).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf||a.team.localeCompare(b.team));
}

// ── App ──────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("loading");
  const [me, setMe] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [matches, setMatches] = useState([]);
  const [usersData, setUsersData] = useState({});
  const [tab, setTab] = useState("grupe");
  const [nameInput, setNameInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [now, setNow] = useState(Date.now());
  const seeded = useRef(false);

  const isAdmin = me && admin && me === admin;
  const users = Object.keys(usersData).sort();
  const myPicks = (usersData[me]||{}).picks || {};

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null),2800); };

  // ── Init ──
  useEffect(() => {
    const savedName = lsGet("me");
    let unsubState, unsubUsers;
    (async () => {
      // Seed inicial
      if (!seeded.current) {
        seeded.current = true;
        const state = await getState();
        if (!state || !state.matches || state.matches.length === 0) {
          await saveState({ matches: SEED_MATCHES, koResults: {}, overrides: {} });
        }
      }
      unsubState = subscribeState((s) => {
        if (s) {
          if (s.matches) setMatches(s.matches.filter(m=>m.phase==="grupe"));
          if (s.admin) setAdmin(s.admin);
        }
      });
      unsubUsers = subscribeUsers((u) => setUsersData(u));
      if (savedName) { setMe(savedName); setScreen("main"); }
      else setScreen("onboard");
    })();
    return () => { unsubState&&unsubState(); unsubUsers&&unsubUsers(); };
  }, []);

  // Ceas
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Inscriere ──
  const register = async () => {
    const name = nameInput.trim();
    if (name.length < 2) return showToast("Minim 2 caractere.");
    if (/[/\\'".#$[\]]/.test(name)) return showToast("Fara caractere speciale.");
    setBusy(true);
    try {
      await joinUser(name);
      const state = await getState();
      if (!state || !state.admin) { await saveState({ admin: name }); setAdmin(name); }
      lsSet("me", name);
      setMe(name);
      setScreen("main");
    } catch { showToast("Eroare de conectare."); }
    setBusy(false);
  };

  // ── Pariere — 100% in Firebase, zero localStorage ──
  const placeBet = async (matchId, pick) => {
    const match = matches.find(m=>m.id===matchId);
    if (!match) return;
    if (new Date(match.kickoff).getTime() - LOCK_OFFSET <= Date.now())
      return showToast("Pariurile s-au inchis cu 1h inainte de meci.");
    const current = myPicks[matchId];
    const newPick = current === pick ? null : pick; // toggle
    // Update optimist local
    setUsersData(prev => ({
      ...prev,
      [me]: { ...(prev[me]||{}), picks: { ...(prev[me]||{}).picks, [matchId]: newPick } }
    }));
    try { await savePick(me, matchId, newPick); }
    catch { showToast("Nu s-a putut salva."); }
  };

  // ── Sterge pariurile mele ──
  const resetMine = async () => {
    setUsersData(prev => ({ ...prev, [me]: { ...(prev[me]||{}), picks: {} } }));
    try { await resetUserPicks(me); showToast("Pariurile tale au fost sterse."); }
    catch { showToast("Eroare."); }
  };

  // ── Sterge pariurile tuturor (admin) ──
  const resetAll = async () => {
    try { await resetAllPicks(); showToast("Reset complet efectuat."); }
    catch { showToast("Eroare."); }
  };

  // ── Salveaza meciuri (admin) ──
  const saveMatches = async (next) => {
    setMatches(next);
    try { await saveState({ matches: next }); showToast("Salvat."); }
    catch { showToast("Eroare."); }
  };

  // ── Clasament ──
  const finished = matches.filter(m=>m.result);
  const standings = users.map(u => {
    const picks = (usersData[u]||{}).picks || {};
    let pts=0, played=0;
    const hits = [];
    finished.forEach(m => {
      const p = picks[m.id];
      if (p) {
        played++;
        const ok = p === m.result.pick;
        if (ok) pts++;
        hits.push({ match: m, pick: p, ok });
      }
    });
    return { name: u, pts, played, hits };
  }).sort((a,b)=>b.pts-a.pts||a.played-b.played||a.name.localeCompare(b.name));

  // ── Meciul urmator ──
  const nextMatch = matches.filter(m=>!m.result&&new Date(m.kickoff).getTime()>now)
    .sort((a,b)=>new Date(a.kickoff)-new Date(b.kickoff))[0];

  // ── Screens ──
  if (screen==="loading") return <Shell><div style={{textAlign:"center",padding:"120px 20px",color:C.soft}}>Se incalzeste gazonul...</div></Shell>;

  if (screen==="onboard") return (
    <Shell>
      <div style={{maxWidth:420,margin:"0 auto",padding:"64px 20px"}}>
        <div style={{fontSize:44}}>🏆</div>
        <h1 style={{...st.h1,color:C.navy}}>Cup of Guesses</h1>
        <p style={{color:C.soft,margin:"10px 0 6px",fontStyle:"italic",fontSize:13}}>by fire alarm enthusiasts</p>
        <p style={{color:C.soft,margin:"0 0 28px",lineHeight:1.55,fontSize:14}}>
          Miza: respectul colegilor. Alegi 1/X/2 inainte de start. Scuzele de dupa nu puncteaza.
        </p>
        <label style={st.label}>Cum te stiu colegii</label>
        <input style={st.input} value={nameInput} onChange={e=>setNameInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&register()} placeholder="ex: Dada" maxLength={24} />
        <button style={{...st.btnPrimary,width:"100%",marginTop:14}} onClick={register} disabled={busy}>
          {busy?"Intru pe teren...":"Intra in joc"}
        </button>
      </div>
    </Shell>
  );

  const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate()-1);
  const twoDaysAgoStart = new Date(todayStart); twoDaysAgoStart.setDate(twoDaysAgoStart.getDate()-2);
  const isOld = (m) => {
    if (!m.result) return false;
    const k = new Date(m.kickoff);
    if (k >= yesterdayStart) return false; // azi sau ieri -> ramane mereu sus
    if (k >= twoDaysAgoStart) return k.getHours() < 15; // acum 2 zile: doar cele de seara raman sus
    return true; // mai vechi de 2 zile -> mereu la coada
  };
  const tabMatches = matches.filter(m=>m.phase===tab).sort((a,b)=>{
    const ao=isOld(a)?1:0, bo=isOld(b)?1:0;
    if(ao!==bo) return ao-bo;
    return new Date(a.kickoff)-new Date(b.kickoff);
  });

  return (
    <Shell>
      <header style={{background:`linear-gradient(135deg,${C.navyD},${C.navy})`,color:"#fff",padding:"18px 16px 0"}}>
        <div style={{maxWidth:760,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <div>
              <div style={{fontSize:11,letterSpacing:"0.18em",opacity:0.7,textTransform:"uppercase"}}>FIFA World Cup 26™ · neoficial</div>
              <h1 style={{...st.h1,color:"#fff",margin:"2px 0 0"}}>Cup of Guesses</h1>
              <div style={{fontSize:11,opacity:0.6,fontStyle:"italic",marginTop:3}}>by fire alarm enthusiasts</div>
            </div>
            <div style={{textAlign:"right",fontSize:13,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
              <div>
                <span style={{opacity:0.7}}>{isAdmin?"arbitru · ":""}</span>
                <strong>{me}</strong>
                <button onClick={()=>{lsSet("me",null);setMe(null);setNameInput("");setScreen("onboard");}}
                  style={{background:"none",border:"none",color:"#fff",opacity:0.5,cursor:"pointer",marginLeft:8,fontSize:12,textDecoration:"underline"}}>
                  iesi
                </button>
              </div>
              <button onClick={resetMine}
                style={{background:"none",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",opacity:0.7,cursor:"pointer",fontSize:11,borderRadius:6,padding:"3px 8px"}}>
                sterge pariurile mele
              </button>
            </div>
          </div>
          {nextMatch && <NextBanner match={nextMatch} now={now} />}
          <nav style={{display:"flex",gap:4,marginTop:10,overflowX:"auto"}}>
            {[...PHASES,{id:"clasament",label:"🏆 Clasament"},{id:"funfacts",label:"✨ Fun Facts"},...(isAdmin?[{id:"admin",label:"⚙ Arbitru"}]:[])]
              .map(p=>(
                <button key={p.id} onClick={()=>setTab(p.id)}
                  style={{border:"none",cursor:"pointer",whiteSpace:"nowrap",padding:"9px 14px",fontSize:13,fontWeight:600,borderRadius:"8px 8px 0 0",
                    background:tab===p.id?C.bg:"rgba(255,255,255,0.08)",color:tab===p.id?C.navy:"rgba(255,255,255,0.85)"}}>
                  {p.label}
                </button>
              ))}
          </nav>
        </div>
      </header>

      <main style={{maxWidth:760,margin:"0 auto",padding:"20px 16px 60px"}}>
        {tab==="clasament" ? <Leaderboard standings={standings} finishedCount={finished.length} me={me}/> :
         tab==="rezultate" ? <GroupStandings matches={matches}/> :
         tab==="funfacts" ? <FunFacts matches={matches} usersData={usersData} users={users}/> :
         tab==="admin" ? <AdminPanel matches={matches} onSave={saveMatches} onResetAll={resetAll} allMatches={matches} now={now}/> :
         tabMatches.length===0 ? <div style={st.empty}>Niciun meci la {phaseLabel(tab)} inca.</div> :
         tabMatches.map(m=><MatchCard key={m.id} match={m} me={me} myPick={myPicks[m.id]||null} usersData={usersData} users={users} now={now} onPick={placeBet}/>)}
      </main>

      {toast && <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:C.navy,color:"#fff",padding:"10px 18px",borderRadius:10,fontSize:14,boxShadow:"0 6px 20px rgba(0,0,0,0.25)",zIndex:50}}>{toast}</div>}
    </Shell>
  );
}

// ── Banner meci urmator ─────────────────────────────────────
function NextBanner({match,now}) {
  const ms = Math.max(0, new Date(match.kickoff).getTime()-now);
  const total = Math.floor(ms/1000);
  const d=Math.floor(total/86400), h=Math.floor((total%86400)/3600), m=Math.floor((total%3600)/60), s=total%60;
  const imminent = total<3600&&total>0;
  const Seg=({n,l})=>(
    <span style={{display:"inline-flex",flexDirection:"column",alignItems:"center",minWidth:36}}>
      <span style={{fontFamily:"'Saira Condensed',monospace",fontSize:22,fontWeight:800,color:imminent?C.gold:"#fff",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{String(n).padStart(2,"0")}</span>
      <span style={{fontSize:9,opacity:0.6,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:2}}>{l}</span>
    </span>
  );
  return (
    <div style={{marginTop:10,padding:"10px 14px",borderRadius:10,background:imminent?"rgba(217,154,27,0.18)":"rgba(255,255,255,0.08)",border:`1px solid ${imminent?"rgba(217,154,27,0.5)":"rgba(255,255,255,0.12)"}`,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
      <div style={{fontSize:10,letterSpacing:"0.16em",opacity:0.75,textTransform:"uppercase",fontWeight:700}}>{imminent?"🔥 Incepe in":"Urmeaza"}</div>
      <div style={{fontSize:14,fontWeight:700,textAlign:"center"}}>{flag(match.home)} {match.home} <span style={{opacity:0.5}}>vs</span> {match.away} {flag(match.away)}</div>
      <div style={{display:"flex",gap:8}}>
        {d>0&&<Seg n={d} l="zile"/>}
        <Seg n={h} l="ore"/><Seg n={m} l="min"/><Seg n={s} l="sec"/>
      </div>
    </div>
  );
}

// ── Card meci ───────────────────────────────────────────────
function MatchCard({match,me,myPick,usersData,users,now,onPick}) {
  const lockAt = new Date(match.kickoff).getTime()-LOCK_OFFSET;
  const locked = lockAt<=now;
  const done = !!match.result;
  const betsCount = users.filter(u=>(usersData[u]||{}).picks&&(usersData[u].picks)[match.id]).length;
  const msToLock = lockAt-now;
  const showAlarm = !done&&!locked&&!myPick&&msToLock>0&&msToLock<=LOCK_OFFSET;
  const alMin=Math.floor(msToLock/60000), alSec=Math.floor((msToLock%60000)/1000);

  const status = done?{txt:"Final",bg:"#E8EBF5",col:C.navy}:locked?{txt:"Pariuri inchise",bg:C.goldP,col:"#8A6510"}:{txt:"Deschis",bg:C.greenP,col:C.green};

  return (
    <div style={st.card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <span style={{fontSize:12,color:C.soft,fontWeight:600,letterSpacing:"0.04em"}}>{match.group||phaseLabel(match.phase)} · {fmtDate(match.kickoff)}</span>
        <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:99,background:status.bg,color:status.col,textTransform:"uppercase",letterSpacing:"0.06em"}}>{status.txt}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:26}}>{flag(match.home)}</span>
          <span style={{fontSize:15,fontWeight:700,color:C.ink}}>{match.home}</span>
        </div>
        <div style={{textAlign:"center",minWidth:64}}>
          {done&&match.result.score?<span style={{fontSize:24,fontWeight:800,color:C.navy}}>{match.result.score}</span>:<span style={{fontSize:13,color:C.soft,fontWeight:600}}>vs</span>}
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8,flexDirection:"row-reverse"}}>
          <span style={{fontSize:26}}>{flag(match.away)}</span>
          <span style={{fontSize:15,fontWeight:700,color:C.ink,textAlign:"right"}}>{match.away}</span>
        </div>
      </div>

      {!done && (
        <>
          {showAlarm&&(
            <div style={{marginTop:14,padding:"10px 14px",borderRadius:10,background:C.red,color:"#fff",fontWeight:700,fontSize:13,boxShadow:`0 0 0 3px ${C.redP}`}}>
              ⏰ Mai ai {alMin>0?`${alMin} min `:""}{String(alSec).padStart(2,"0")} sec sa votezi!
            </div>
          )}
          <div style={{display:"flex",gap:8,marginTop:14}}>
            {["1","X","2"].map((v,i)=>{
              const labels=[match.home,"egal",match.away];
              const active=myPick===v;
              return (
                <button key={v} onClick={()=>!locked&&!myPick&&onPick(match.id,v)} disabled={locked||!!myPick}
                  style={{flex:1,padding:"12px 0",borderRadius:10,fontSize:15,fontWeight:700,cursor:(locked||myPick)?"default":"pointer",border:`2px solid ${active?C.navy:C.line}`,background:active?C.navy:"#fff",color:active?"#fff":(locked||(!active&&myPick))?C.line:C.ink,transition:"all .15s",opacity:(!active&&myPick)?0.4:1}}>
                  <div>{v}</div>
                  <div style={{fontSize:10,fontWeight:500,opacity:0.8}}>{labels[i]}</div>
                </button>
              );
            })}
          </div>
          <div style={{marginTop:10,fontSize:12,color:C.soft,display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
            <span>{betsCount===0?"Niciun bilet inca":`${betsCount} ${betsCount===1?"coleg a pariat":"colegi au pariat"} 🔒`}</span>
            {myPick&&<span style={{color:C.green,fontWeight:700}}>Biletul tau: {myPick}</span>}
          </div>
        </>
      )}
      {done&&<Reveal match={match} users={users} usersData={usersData} me={me}/>}
    </div>
  );
}

// ── Reveal dupa meci ────────────────────────────────────────
function Reveal({match,users,usersData,me}) {
  const r=match.result;
  const winLabel=r.pick==="1"?match.home:r.pick==="2"?match.away:"Egal";
  const rows=users.map(u=>({name:u,pick:((usersData[u]||{}).picks||{})[match.id]})).filter(x=>x.pick);
  return (
    <div style={{marginTop:14,borderTop:`1px dashed ${C.line}`,paddingTop:12}}>
      <div style={{fontSize:13,marginBottom:10}}>Rezultat: <strong>{winLabel}</strong> ({r.pick}{r.score?` · ${r.score}`:""})</div>
      {rows.length===0?<div style={{fontSize:13,color:C.soft}}>Nimeni nu a pariat pe meciul asta. Lasi.</div>:
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {rows.map(x=>{
            const hit=x.pick===r.pick;
            return (
              <div key={x.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",borderRadius:8,fontSize:13,background:hit?C.greenP:C.redP,border:x.name===me?`1.5px solid ${hit?C.green:C.red}`:"1.5px solid transparent"}}>
                <span style={{fontWeight:x.name===me?800:600}}>{x.name===me?`${x.name} (tu)`:x.name}</span>
                <span style={{fontWeight:700,color:hit?C.green:C.red}}>{x.pick} {hit?"✓ +1p":"✗"}</span>
              </div>
            );
          })}
        </div>}
    </div>
  );
}

// ── Clasament ───────────────────────────────────────────────
function Leaderboard({standings,finishedCount,me}) {
  const [open,setOpen]=useState(null);
  return (
    <div style={st.card}>
      <h2 style={st.h2}>Fire Alarm Enthusiasts</h2>
      <p style={{color:C.soft,fontSize:13,margin:"4px 0 16px"}}>1 punct per pronostic corect · {finishedCount} {finishedCount===1?"meci jucat":"meciuri jucate"}</p>
      {standings.length===0?<div style={st.empty}>Inca nu s-a inscris nimeni.</div>:
        standings.map((s,i)=>{
          const isOpen=open===s.name;
          return (
            <div key={s.name} style={{marginBottom:6}}>
              <div onClick={()=>s.hits.length>0&&setOpen(isOpen?null:s.name)}
                style={{display:"flex",alignItems:"center",gap:12,padding:"11px 12px",borderRadius:isOpen?"10px 10px 0 0":10,background:i===0&&s.pts>0?C.goldP:s.name===me?"#E8EBF5":"transparent",border:`1px solid ${i===0&&s.pts>0?"#EAD9AC":s.name===me?C.line:"transparent"}`,cursor:s.hits.length>0?"pointer":"default"}}>
                <span style={{width:26,fontWeight:800,color:i===0?C.gold:C.soft,fontSize:15}}>{i===0&&s.pts>0?"🏆":i+1}</span>
                <span style={{flex:1,fontWeight:s.name===me?800:600,fontSize:14}}>{s.name===me?`${s.name} (tu)`:s.name}</span>
                <span style={{fontSize:12,color:C.soft}}>{s.played} bilete</span>
                <span style={{fontWeight:800,fontSize:16,minWidth:44,textAlign:"right"}}>{s.pts} p</span>
                {s.hits.length>0&&<span style={{fontSize:11,color:C.soft,width:12}}>{isOpen?"▴":"▾"}</span>}
              </div>
              {isOpen&&(
                <div style={{border:`1px solid ${C.line}`,borderTop:"none",borderBottomLeftRadius:10,borderBottomRightRadius:10,background:"#FAFBFD",padding:"8px 12px"}}>
                  {s.hits.map((h,idx)=>(
                    <div key={idx} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",fontSize:12,borderTop:idx===0?"none":`1px dashed ${C.line}`}}>
                      <span style={{color:C.soft}}>{h.match.home} – {h.match.away}</span>
                      <span style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:11,color:C.soft}}>{h.match.result.score||""}</span>
                        <span style={{fontWeight:700,color:h.ok?C.green:C.red,minWidth:40,textAlign:"right"}}>{h.pick} {h.ok?"✓ +1":"✗"}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

// ── Clasamente grupe ────────────────────────────────────────
function GroupStandings({matches}) {
  return (
    <>
      <div style={{...st.card,background:"#E8EBF5"}}>
        <div style={{fontSize:13,color:C.navy,lineHeight:1.5}}>📊 <strong>Clasamentele celor 12 grupe</strong>, actualizate dupa fiecare meci inchis.</div>
      </div>
      {GROUPS.map(g=>{
        const s=groupStandings(g,matches);
        const done=matches.filter(m=>m.group==="Grupa "+g).every(m=>m.result);
        return (
          <div key={g} style={st.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
              <h3 style={{...st.h2,fontSize:18}}>Grupa {g}</h3>
              <span style={{fontSize:11,color:done?C.green:C.soft,fontWeight:700,textTransform:"uppercase"}}>{done?"Final":"In desfasurare"}</span>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{color:C.soft,fontSize:11,textTransform:"uppercase"}}>
                <th style={{textAlign:"left",padding:"6px 4px"}}>#</th>
                <th style={{textAlign:"left",padding:"6px 4px"}}>Echipa</th>
                <th style={{textAlign:"center",padding:"6px 4px"}}>J</th>
                <th style={{textAlign:"center",padding:"6px 4px"}}>V-E-I</th>
                <th style={{textAlign:"center",padding:"6px 4px"}}>GD</th>
                <th style={{textAlign:"center",padding:"6px 4px",fontWeight:800}}>P</th>
              </tr></thead>
              <tbody>{s.map((r,i)=>(
                <tr key={r.team} style={{borderTop:`1px solid ${C.line}`,background:i<2?C.greenP:i===2?C.goldP:"transparent"}}>
                  <td style={{padding:"8px 4px",color:C.soft,fontWeight:700}}>{i+1}</td>
                  <td style={{padding:"8px 4px",fontWeight:600}}>{flag(r.team)} {r.team}</td>
                  <td style={{padding:"8px 4px",textAlign:"center"}}>{r.played}</td>
                  <td style={{padding:"8px 4px",textAlign:"center"}}>{r.won}-{r.draw}-{r.lost}</td>
                  <td style={{padding:"8px 4px",textAlign:"center",color:r.gd>0?C.green:r.gd<0?C.red:C.ink}}>{r.gd>0?"+":""}{r.gd}</td>
                  <td style={{padding:"8px 4px",textAlign:"center",fontWeight:800,fontSize:14}}>{r.pts}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        );
      })}
    </>
  );
}

// ── Fun Facts ───────────────────────────────────────────────
function FunFacts({matches,usersData,users}) {
  const finished=matches.filter(m=>m.result);
  const stats=[];
  if(finished.length===0) return <div style={st.card}><div style={{fontSize:13,color:C.soft,fontStyle:"italic",textAlign:"center",padding:20}}>Inca nu s-au jucat destule meciuri. Reveniti.</div></div>;
  const userHits={};
  users.forEach(u=>{
    const picks=(usersData[u]||{}).picks||{};
    userHits[u]=finished.filter(m=>picks[m.id]).map(m=>({m,pick:picks[m.id],ok:picks[m.id]===m.result.pick}));
  });
  // Streak
  let best={user:null,len:0};
  Object.entries(userHits).forEach(([u,hits])=>{let cur=0,max=0;hits.forEach(h=>{if(h.ok){cur++;max=Math.max(max,cur);}else cur=0;});if(max>best.len)best={user:u,len:max};});
  if(best.len>=2)stats.push({emoji:"🔥",title:"Cel mai lung streak",value:`${best.user} cu ${best.len} pronosticuri corecte la rand.`});
  // Underdog hero
  finished.forEach(m=>{
    const betters=users.map(u=>({u,pick:((usersData[u]||{}).picks||{})[m.id]})).filter(x=>x.pick);
    if(betters.length<3)return;
    const correct=betters.filter(x=>x.pick===m.result.pick);
    if(correct.length===1)stats.push({emoji:"🦸",title:`${correct[0].u} a crezut singura/singurul`,value:`La ${m.home} – ${m.away}. Restul (${betters.length-1}) au gresit.`});
  });
  // Surpriza casei
  finished.forEach(m=>{
    const betters=users.map(u=>({u,pick:((usersData[u]||{}).picks||{})[m.id]})).filter(x=>x.pick);
    if(betters.length<3)return;
    const wrong=betters.filter(x=>x.pick!==m.result.pick);
    const pickSet=new Set(betters.map(x=>x.pick));
    if(wrong.length===betters.length&&pickSet.size===1)stats.push({emoji:"🤯",title:"Surpriza casei",value:`La ${m.home} – ${m.away}, toti ${betters.length} au pariat ${betters[0].pick} si toti au gresit.`});
  });
  // Profil
  Object.entries(userHits).forEach(([u,hits])=>{
    if(hits.length<4)return;
    const t={"1":0,"X":0,"2":0};hits.forEach(h=>{t[h.pick]=(t[h.pick]||0)+1;});
    const dom=Object.entries(t).sort((a,b)=>b[1]-a[1])[0];
    if(dom[1]/hits.length>=0.65){const lb={"1":"gazda","X":"egal","2":"oaspeti"};stats.push({emoji:dom[0]==="X"?"🤝":dom[0]==="1"?"🏠":"✈️",title:`${u} voteaza mereu la fel`,value:`${Math.round(dom[1]/hits.length*100)}% din pariuri sunt ${dom[0]} (${lb[dom[0]]}).`});}
  });
  // Cel mai distrat
  const plays=users.map(u=>({u,n:userHits[u].length}));
  if(plays.length>=2&&finished.length>=3){const mn=plays.sort((a,b)=>a.n-b.n)[0],mx=plays[plays.length-1];if(mx.n-mn.n>=3)stats.push({emoji:"🛋",title:"Cel mai distrat",value:`${mn.u} a pariat la ${mn.n} din ${finished.length} meciuri terminate.`});}

  return (
    <div style={st.card}>
      <h2 style={st.h2}>✨ Fun Facts</h2>
      <p style={{color:C.soft,fontSize:13,margin:"4px 0 16px"}}>Statistici live din pariurile voastre.</p>
      {stats.length===0?<div style={{fontSize:13,color:C.soft,fontStyle:"italic"}}>Nu sunt inca suficiente date. Reveniti dupa mai multe meciuri.</div>:
        stats.map((s,i)=>(
          <div key={i} style={{padding:"12px 0",borderTop:i===0?"none":`1px solid ${C.line}`}}>
            <div style={{fontSize:11,color:C.soft,letterSpacing:"0.04em",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>{s.emoji} {s.title}</div>
            <div style={{fontSize:14,color:C.ink,lineHeight:1.45}}>{s.value}</div>
          </div>
        ))}
    </div>
  );
}

// ── Admin ───────────────────────────────────────────────────
function AdminPanel({matches,onSave,onResetAll,now}) {
  const [draft,setDraft]=useState({});
  const [resetConfirm,setResetConfirm]=useState(false);
  const unclosed=matches.filter(m=>!m.result&&new Date(m.kickoff).getTime()+2*60*60*1000<=Date.now());
  const setRes=(id)=>{const d=draft[id];if(!d||!d.pick)return;onSave(matches.map(m=>m.id===id?{...m,result:{pick:d.pick,score:(d.score||"").trim()}}:m));};
  const clrRes=(id)=>onSave(matches.map(m=>m.id===id?{...m,result:undefined}:m));
  const sorted=[...matches].sort((a,b)=>new Date(a.kickoff)-new Date(b.kickoff));
  return (
    <>
      {unclosed.length>0&&(
        <div style={{...st.card,background:C.redP,border:`2px solid ${C.red}`}}>
          <div style={{fontSize:14,color:C.red,fontWeight:700,marginBottom:6}}>⚠ {unclosed.length} {unclosed.length===1?"meci terminat dar neinchis":"meciuri terminate dar neinchise"}</div>
          <ul style={{margin:"4px 0 0",paddingLeft:18,fontSize:12}}>{unclosed.map(m=><li key={m.id}><strong>{m.home} – {m.away}</strong> ({fmtDate(m.kickoff)})</li>)}</ul>
        </div>
      )}
      <div style={{...st.card,background:"#E8EBF5"}}>
        <div style={{fontSize:13,color:C.navy,lineHeight:1.5}}><strong>Tu esti arbitrul.</strong> Inchizi meciurile cu 1/X/2 + scor. Pariurile tuturor sunt vizibile imediat dupa ce inchizi meciul.</div>
      </div>
      <div style={st.card}>
        <h2 style={st.h2}>Meciuri ({sorted.length})</h2>
        {sorted.map(m=>(
          <div key={m.id} style={{borderTop:`1px solid ${C.line}`,padding:"12px 0"}}>
            <div style={{fontSize:14}}>
              <strong>{flag(m.home)} {m.home} – {m.away} {flag(m.away)}</strong>
              <div style={{fontSize:12,color:C.soft}}>{m.group||phaseLabel(m.phase)} · {fmtDate(m.kickoff)}{m.result&&<strong style={{color:C.navy}}> · Final: {m.result.pick} {m.result.score}</strong>}</div>
            </div>
            {!m.result?(
              <div style={{display:"flex",gap:8,marginTop:10,alignItems:"center",flexWrap:"wrap"}}>
                {["1","X","2"].map(v=>(
                  <button key={v} onClick={()=>setDraft(p=>({...p,[m.id]:{...(p[m.id]||{}),pick:v}}))}
                    style={{...st.btnSmall,background:(draft[m.id]||{}).pick===v?C.navy:"#fff",color:(draft[m.id]||{}).pick===v?"#fff":C.ink}}>{v}</button>
                ))}
                <input style={{...st.input,width:90,padding:"8px 10px"}} placeholder="scor 2-1"
                  value={(draft[m.id]||{}).score||""} onChange={e=>setDraft(p=>({...p,[m.id]:{...(p[m.id]||{}),score:e.target.value}}))}/>
                <button style={st.btnSmallP} onClick={()=>setRes(m.id)}>Inchide meciul</button>
                <input type="datetime-local" style={{...st.input,width:190,padding:"8px 10px"}} value={m.kickoff}
                  onChange={e=>onSave(matches.map(x=>x.id===m.id?{...x,kickoff:e.target.value}:x))}/>
              </div>
            ):(
              <button style={st.btnGhost} onClick={()=>clrRes(m.id)}>anuleaza rezultatul</button>
            )}
          </div>
        ))}
      </div>
      <div style={st.card}>
        <h2 style={st.h2}>Reset pariuri (toti)</h2>
        <p style={{fontSize:13,color:C.soft,margin:"8px 0 14px",lineHeight:1.5}}>Sterge pariurile tuturor si pune clasamentul la 0. Meciurile si rezultatele raman.</p>
        {!resetConfirm?(
          <button style={{...st.btnSmall,color:C.red,borderColor:C.red}} onClick={()=>setResetConfirm(true)}>Reseteaza pariurile tuturor</button>
        ):(
          <div style={{display:"flex",gap:8}}>
            <button style={st.btnSmall} onClick={()=>setResetConfirm(false)}>Anuleaza</button>
            <button style={{...st.btnSmallP,background:C.red}} onClick={()=>{onResetAll();setResetConfirm(false);}}>Da, sterge tot</button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Shell + stiluri ─────────────────────────────────────────
function Shell({children}) {
  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.ink,fontFamily:"'Inter',-apple-system,'Segoe UI',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@700;800&family=Inter:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;}body{margin:0;}
        input:focus,select:focus{outline:2px solid ${C.navy};outline-offset:1px;}
        button:focus-visible{outline:2px solid ${C.navy};outline-offset:2px;}
      `}</style>
      {children}
    </div>
  );
}

const st = {
  h1:{fontFamily:"'Saira Condensed','Arial Narrow',sans-serif",fontSize:34,fontWeight:800,letterSpacing:"0.01em",margin:"14px 0 0",textTransform:"uppercase"},
  h2:{fontFamily:"'Saira Condensed','Arial Narrow',sans-serif",fontSize:22,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.02em",margin:0,color:C.navy},
  card:{background:C.card,border:`1px solid ${C.line}`,borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 1px 3px rgba(11,31,75,0.06)"},
  label:{display:"block",fontSize:12,fontWeight:700,color:C.soft,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"},
  input:{width:"100%",padding:"11px 12px",borderRadius:10,border:`1.5px solid ${C.line}`,fontSize:15,background:"#fff",color:C.ink},
  btnPrimary:{padding:"12px 22px",borderRadius:10,border:"none",background:C.red,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"},
  btnSmall:{padding:"8px 16px",borderRadius:8,border:`1.5px solid ${C.line}`,fontSize:14,fontWeight:700,cursor:"pointer",background:"#fff"},
  btnSmallP:{padding:"8px 16px",borderRadius:8,border:"none",background:C.navy,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"},
  btnGhost:{padding:"6px 10px",borderRadius:8,border:"none",background:"transparent",color:C.red,fontSize:12,fontWeight:600,cursor:"pointer",textDecoration:"underline",marginTop:8},
  empty:{background:C.card,border:`1px dashed ${C.line}`,borderRadius:14,padding:"36px 20px",textAlign:"center",color:C.soft,fontSize:14},
};
