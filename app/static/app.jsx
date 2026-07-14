/* ==========================================================================
   Bibliothèque Inter-Universitaire — Interface React (par site)
   React 18 + Babel (CDN, transpilation navigateur) + Tailwind.
   Une même codebase tourne sur les 3 sites : le thème et le nom du site sont
   déduits de GET /api/stats (champ "site").
   ========================================================================== */

const { useState, useEffect, useCallback, useContext, createContext, useRef } = React;

/* ------------------------------- Helpers -------------------------------- */

async function api(path, { method = "GET", body } = {}) {
  const opt = { method, headers: {} };
  if (body !== undefined) {
    opt.headers["Content-Type"] = "application/json";
    opt.body = JSON.stringify(body);
  }
  const res = await fetch("/api" + path, opt);
  let data = null;
  try { data = await res.json(); } catch (e) { /* pas de corps JSON */ }
  if (!res.ok) {
    const err = new Error((data && data.detail) || res.statusText || "Erreur");
    err.status = res.status;
    throw err;
  }
  return data;
}

const cx = (...c) => c.filter(Boolean).join(" ");
const fmtDate = (s) => (s ? new Date(s).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");

/* Compteur animé (0 -> valeur) pour les stats premium des écrans publics */
function useCountUp(value, duration = 900) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (value === null || value === undefined || isNaN(value)) { setN(0); return; }
    const from = 0, to = Number(value), start = performance.now();
    cancelAnimationFrame(ref.current);
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (to - from) * eased));
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);
  return n;
}

const saluer = () => {
  const h = new Date().getHours();
  if (h < 5) return "Bonsoir";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
};

/* Thèmes par université (chaînes Tailwind complètes -> scannées dans le DOM) */
const THEMES = {
  UGB: {
    label: "Université Gaston Berger", ville: "Saint-Louis",
    grad: "from-blue-600 via-blue-700 to-indigo-800",
    meshA: "bg-blue-500", meshB: "bg-indigo-400", meshC: "bg-sky-400",
    navActive: "bg-blue-600 text-white shadow",
    btn: "bg-blue-600 hover:bg-blue-500",
    btnSoft: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    ring: "focus:ring-blue-500", text: "text-blue-700",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    dot: "bg-blue-500", accentBar: "bg-blue-600",
    iconBg: "bg-blue-50 text-blue-600", solid: "bg-blue-600",
    glow: "shadow-blue-500/30",
  },
  UCAD: {
    label: "Université Cheikh Anta Diop", ville: "Dakar",
    grad: "from-emerald-600 via-emerald-700 to-teal-800",
    meshA: "bg-emerald-500", meshB: "bg-teal-400", meshC: "bg-lime-400",
    navActive: "bg-emerald-600 text-white shadow",
    btn: "bg-emerald-600 hover:bg-emerald-500",
    btnSoft: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    ring: "focus:ring-emerald-500", text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500", accentBar: "bg-emerald-600",
    iconBg: "bg-emerald-50 text-emerald-600", solid: "bg-emerald-600",
    glow: "shadow-emerald-500/30",
  },
  UADB: {
    label: "Université Alioune Diop de Bambey", ville: "Bambey",
    grad: "from-amber-500 via-amber-600 to-orange-700",
    meshA: "bg-amber-500", meshB: "bg-orange-400", meshC: "bg-yellow-400",
    navActive: "bg-amber-600 text-white shadow",
    btn: "bg-amber-600 hover:bg-amber-500",
    btnSoft: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    ring: "focus:ring-amber-500", text: "text-amber-700",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500", accentBar: "bg-amber-600",
    iconBg: "bg-amber-50 text-amber-600", solid: "bg-amber-600",
    glow: "shadow-amber-500/30",
  },
};
const SITE_BADGE = {
  UGB: "bg-blue-100 text-blue-800 border-blue-200",
  UCAD: "bg-emerald-100 text-emerald-800 border-emerald-200",
  UADB: "bg-amber-100 text-amber-800 border-amber-200",
};
const SITE_DOT = { UGB: "bg-blue-500", UCAD: "bg-emerald-500", UADB: "bg-amber-500" };

/* ------------------------------ Contexte -------------------------------- */

const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

/* ------------------------------ Toasts ---------------------------------- */

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return { toasts, push };
}
function ToastHost({ toasts }) {
  const styles = {
    success: "bg-emerald-600", error: "bg-rose-600",
    info: "bg-slate-800", warn: "bg-amber-600",
  };
  const icons = { success: "✓", error: "✕", info: "ℹ", warn: "⚠" };
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2.5 w-80 max-w-[90vw]">
      {toasts.map((t) => (
        <div key={t.id} className={cx("animate-slidein relative overflow-hidden text-white text-sm font-medium pl-4 pr-4 py-3 rounded-xl shadow-lg shadow-black/10 flex items-start gap-2.5", styles[t.type] || styles.info)}>
          <span className="w-5 h-5 shrink-0 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold mt-0.5">{icons[t.type] || icons.info}</span>
          <span className="leading-snug">{t.message}</span>
          <div className="absolute left-0 bottom-0 h-0.5 bg-white/40" style={{ animation: "toastbar 4.2s linear forwards" }} />
        </div>
      ))}
    </div>
  );
}

/* --------------------------- UI primitives ------------------------------ */

/* Lignes de squelette animées pour un chargement perçu plus premium qu'un simple spinner */
function TableSkeleton({ cols = 4, rows = 5 }) {
  return (
    <div className="space-y-3 py-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-1">
          {Array.from({ length: cols }).map((__, j) => (
            <div key={j} className="skeleton h-4 rounded-md" style={{ width: j === 0 ? "10%" : `${18 + ((i + j) % 3) * 8}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

const Card = ({ children, className, hover, style }) => (
  <div style={style} className={cx(
    "bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-slate-200/70 transition-all duration-200",
    hover && "hover:shadow-lg hover:shadow-slate-200/80 hover:-translate-y-0.5",
    className)}>{children}</div>
);

function Button({ children, onClick, variant = "primary", type = "button", disabled }) {
  const { theme } = useApp();
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl text-sm px-4 py-2.5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none cursor-pointer active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const styles = {
    primary: cx("text-white shadow-md hover:shadow-lg hover:-translate-y-0.5", theme.btn, theme.glow),
    soft: cx(theme.btnSoft, "hover:-translate-y-0.5"),
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "text-white bg-rose-600 hover:bg-rose-500 shadow-md hover:shadow-lg shadow-rose-500/20 hover:-translate-y-0.5",
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={cx(base, styles[variant])}>{children}</button>;
}

function Field({ label, ...props }) {
  const { theme } = useApp();
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</span>
      <input {...props} className={cx("w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 transition-shadow focus:ring-2 focus:border-transparent outline-none", theme.ring)} />
    </label>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadein" onClick={onClose}>
      <Card className="w-full max-w-md p-6 animate-scalein shadow-2xl" >
        <div onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-xl leading-none cursor-pointer transition-colors">×</button>
          </div>
          {children}
        </div>
      </Card>
    </div>
  );
}

const Badge = ({ children, className }) => (
  <span className={cx("inline-block px-2.5 py-0.5 text-xs font-bold rounded-md border", className)}>{children}</span>
);

const SiteBadge = ({ site }) => (
  <Badge className={cx("inline-flex items-center gap-1.5", SITE_BADGE[site] || "bg-slate-100 text-slate-700 border-slate-200")}>
    <span className={cx("w-1.5 h-1.5 rounded-full", SITE_DOT[site] || "bg-slate-400")} />{site}
  </Badge>
);

function DegradedBanner({ sites }) {
  if (!sites || sites.length === 0) return null;
  return (
    <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeup">
      <span>⚠️</span> Mode dégradé — site(s) injoignable(s) : <b>{sites.join(", ")}</b>. Données partielles.
    </div>
  );
}

/* Barre d'emprunts x/5 */
function EmpruntsBar({ n }) {
  const pct = Math.min(100, (n / 5) * 100);
  const color = n >= 5 ? "bg-rose-500" : n >= 4 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={cx("h-full rounded-full transition-all duration-700 ease-out", color)} style={{ width: pct + "%" }} />
      </div>
      <span className="text-xs font-mono text-slate-500">{n}/5</span>
    </div>
  );
}

/* =========================== ÉCRAN : LANDING ============================= */

function StatValue({ value, suffix }) {
  const n = useCountUp(value);
  return <>{value === null || value === undefined ? "—" : n.toLocaleString("fr-FR")}{suffix}</>;
}

/* Visuel réseau : les 3 sites reliés entre eux, le site courant mis en avant */
function ReseauVisuel() {
  const { site } = useApp();
  const sites = ["UGB", "UCAD", "UADB"];
  const pos = { UGB: { x: 100, y: 40 }, UCAD: { x: 30, y: 170 }, UADB: { x: 170, y: 170 } };
  const colorHex = { UGB: "#2563eb", UCAD: "#059669", UADB: "#d97706" };
  const pairs = [["UGB", "UCAD"], ["UGB", "UADB"], ["UCAD", "UADB"]];
  return (
    <svg viewBox="0 0 200 210" className="w-full max-w-[220px] mx-auto">
      {pairs.map(([a, b]) => (
        <line key={a + b} x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y}
          stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" className="text-white/30" />
      ))}
      {sites.map((s) => (
        <g key={s} transform={`translate(${pos[s].x}, ${pos[s].y})`}>
          {s === site && <circle r="22" fill="white" opacity="0.15">
            <animate attributeName="r" values="18;26;18" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.25;0.05;0.25" dur="2.4s" repeatCount="indefinite" />
          </circle>}
          <circle r="14" fill={colorHex[s]} stroke="white" strokeWidth={s === site ? 3 : 1.5} />
          <text y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="white" opacity={s === site ? 1 : 0.7}>{s}</text>
        </g>
      ))}
    </svg>
  );
}

function Landing({ stats, onLogin }) {
  const { theme, site } = useApp();
  return (
    <div className="min-h-full flex flex-col">
      <div className={cx("relative overflow-hidden bg-gradient-to-br text-white", theme.grad)}>
        {/* Mesh de fond décoratif */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={cx("animate-float absolute -top-24 -left-20 w-96 h-96 rounded-full blur-3xl opacity-30", theme.meshA)} />
          <div className={cx("animate-float absolute top-10 right-0 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-20", theme.meshB)} style={{ animationDelay: "-3s" }} />
          <div className={cx("animate-float absolute bottom-0 left-1/3 w-80 h-80 rounded-full blur-3xl opacity-20", theme.meshC)} style={{ animationDelay: "-5s" }} />
          <div className="absolute inset-0 opacity-[0.05]" style={{
            backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }} />
        </div>

        <header className="relative max-w-6xl mx-auto w-full px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-xl border border-white/10">📚</div>
            <div>
              <div className="font-bold leading-tight">Réseau Inter-Universitaire</div>
              <div className="text-xs text-white/70">Système Réparti de Bibliothèques</div>
            </div>
          </div>
          <button onClick={onLogin} className="bg-white/15 hover:bg-white/25 backdrop-blur text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 border border-white/10 cursor-pointer">
            Espace employé →
          </button>
        </header>

        <div className="relative max-w-6xl mx-auto w-full px-6 pt-10 pb-24 grid lg:grid-cols-[1.3fr_.7fr] gap-10 items-center">
          <div className="text-center lg:text-left animate-fadeup">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold mb-6 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Site {site} — {theme.ville}
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">{theme.label}</h1>
            <p className="text-white/80 max-w-2xl mx-auto lg:mx-0 text-lg leading-relaxed">
              Empruntez dans n'importe quelle bibliothèque du réseau <b className="text-white">UGB · UCAD · UADB</b>.
              Catalogue réparti, transactions garanties par validation à deux phases (2PC).
            </p>
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-3">
              <button onClick={onLogin} className="bg-white text-slate-900 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all cursor-pointer">
                Accéder à l'espace de gestion
              </button>
            </div>
          </div>
          <div className="max-w-[180px] sm:max-w-[220px] mx-auto lg:max-w-none animate-fadeup" style={{ animationDelay: ".15s" }}>
            <ReseauVisuel />
          </div>
        </div>
      </div>

      {/* Stats publiques */}
      <div className="max-w-6xl mx-auto w-full px-6 -mt-14 grid grid-cols-1 sm:grid-cols-3 gap-5 relative z-10">
        {[
          { l: "Ouvrages du réseau", v: stats?.total_ouvrages, i: "📖" },
          { l: "Étudiants inscrits", v: stats?.total_etudiants, i: "🎓" },
          { l: "Prêts en cours", v: stats?.total_prets_encours, i: "🔄" },
        ].map((s, idx) => (
          <Card key={s.l} hover className="p-6 text-center animate-fadeup" style={{ animationDelay: `${idx * 0.08}s` }}>
            <div className={cx("w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3", theme.iconBg)}>{s.i}</div>
            <div className="text-4xl font-black text-slate-900 tabular-nums"><StatValue value={s.v} /></div>
            <div className="text-sm text-slate-500 mt-1">{s.l}</div>
          </Card>
        ))}
      </div>

      <div className="max-w-6xl mx-auto w-full px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Une bibliothèque, trois campus</h2>
          <p className="text-slate-500 mt-2 max-w-xl mx-auto">Une infrastructure de données distribuée pensée pour la cohérence et la continuité de service.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { t: "Catalogue réparti", d: "Recherchez dans les 3 bibliothèques via les vues globales FEDERATED, ou dans votre seul fonds local.", i: "🔍" },
            { t: "Emprunts inter-sites", d: "Un étudiant d'une université emprunte ailleurs : le compteur global est mis à jour en 2PC.", i: "🤝" },
            { t: "Cohérence garantie", d: "Chaque écriture répartie est atomique (XA PREPARE / COMMIT) avec reprise sur panne.", i: "🛡️" },
          ].map((f, idx) => (
            <Card key={f.t} hover className="p-6 animate-fadeup" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className={cx("w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4", theme.iconBg)}>{f.i}</div>
              <h3 className="font-bold text-slate-900 mb-1.5">{f.t}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.d}</p>
            </Card>
          ))}
        </div>
      </div>

      <footer className="mt-auto border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Master 2 Systèmes d'Information — UADB / UFR SATIC · Projet BDR
      </footer>
    </div>
  );
}

/* ============================ ÉCRAN : LOGIN ============================= */

function Login({ onBack }) {
  const { theme, site, setSession, push } = useApp();
  const [login, setLogin] = useState("");
  const [mdp, setMdp] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const emp = await api("/auth/login", { method: "POST", body: { login, mot_de_passe: mdp } });
      localStorage.setItem("biblio_session", JSON.stringify(emp));
      setSession(emp);
      push("success", `Bienvenue, ${emp.nom}`);
    } catch (err) {
      push("error", err.status === 401 ? "Identifiants invalides" : "Erreur de connexion");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-3xl grid md:grid-cols-2 bg-white rounded-3xl shadow-2xl shadow-slate-300/50 overflow-hidden animate-scalein">
        {/* Panneau de marque */}
        <div className={cx("relative hidden md:flex flex-col justify-between p-8 text-white bg-gradient-to-br overflow-hidden", theme.grad)}>
          <div className="pointer-events-none absolute inset-0">
            <div className={cx("animate-float absolute -top-10 -left-10 w-56 h-56 rounded-full blur-3xl opacity-30", theme.meshA)} />
            <div className={cx("animate-float absolute bottom-0 -right-10 w-56 h-56 rounded-full blur-3xl opacity-25", theme.meshB)} style={{ animationDelay: "-3s" }} />
          </div>
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur border border-white/10 flex items-center justify-center text-xl mb-8">📚</div>
            <h2 className="text-2xl font-black leading-tight mb-2">{theme.label}</h2>
            <p className="text-white/70 text-sm">{theme.ville} · Réseau UGB · UCAD · UADB</p>
          </div>
          <div className="relative text-xs text-white/60">Cohérence garantie par validation à deux phases (2PC)</div>
        </div>

        {/* Formulaire */}
        <div className="p-8 sm:p-10">
          <div className="mb-7">
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xl mb-4 md:hidden">📚</div>
            <h1 className="text-xl font-bold text-slate-900">Espace employé — {site}</h1>
            <p className="text-sm text-slate-500 mt-1">Connectez-vous pour gérer la bibliothèque</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Identifiant" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="ex. awa" autoFocus required />
            <Field label="Mot de passe" type="password" value={mdp} onChange={(e) => setMdp(e.target.value)} placeholder="••••••••" required />
            <Button type="submit" disabled={busy}>{busy ? "Connexion…" : "Se connecter"}</Button>
          </form>
          <div className="mt-5 text-center">
            <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800 cursor-pointer">← Retour à l'accueil</button>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">Démo : mot de passe <code className="bg-slate-100 px-1 rounded">biblio123</code></p>
        </div>
      </div>
    </div>
  );
}

/* ========================= ÉCRAN : TABLEAU DE BORD ====================== */

function ReseauStatus({ indisponibles }) {
  const { site } = useApp();
  const sites = ["UGB", "UCAD", "UADB"];
  return (
    <Card className="p-6">
      <h3 className="font-bold text-slate-900 mb-4">État du réseau</h3>
      <div className="space-y-3">
        {sites.map((s) => {
          const moi = s === site;
          const down = indisponibles.includes(s);
          return (
            <div key={s} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5">
                <span className={cx("w-2 h-2 rounded-full", down ? "bg-rose-500" : "bg-emerald-500 animate-pulse")} />
                <span className="font-semibold text-slate-800">{s}</span>
                {moi && <Badge className="bg-slate-100 text-slate-500 border-slate-200">ce site</Badge>}
              </div>
              <span className={cx("text-xs font-semibold", down ? "text-rose-600" : "text-emerald-600")}>
                {down ? "Injoignable" : "En ligne"}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Dashboard() {
  const { session, theme } = useApp();
  const [stats, setStats] = useState(null);
  const [indispo, setIndispo] = useState([]);

  useEffect(() => {
    api("/stats").then(setStats).catch(() => {});
    api("/ouvrages?scope=global&q=").then((r) => setIndispo(r.sites_indisponibles || [])).catch(() => {});
  }, []);

  const cards = [
    { l: "Ouvrages (réseau)", v: stats?.total_ouvrages, i: "📖" },
    { l: "Étudiants (réseau)", v: stats?.total_etudiants, i: "🎓" },
    { l: "Prêts en cours", v: stats?.total_prets_encours, i: "🔄" },
  ];

  return (
    <div className="space-y-6">
      <div className={cx("relative overflow-hidden rounded-2xl p-6 text-white bg-gradient-to-br animate-fadeup", theme.grad)}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={cx("animate-float absolute -top-16 -right-10 w-64 h-64 rounded-full blur-3xl opacity-25", theme.meshA)} />
        </div>
        <div className="relative">
          <h2 className="text-2xl font-black">{saluer()}, {session.nom} 👋</h2>
          <p className="text-white/80 mt-1">{session.statut} — Bibliothèque {session.bibliotheque}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {cards.map((c, idx) => (
          <Card key={c.l} hover className="p-6 flex items-center gap-4 animate-fadeup" style={{ animationDelay: `${idx * 0.06}s` }}>
            <div className={cx("w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-2xl", theme.iconBg)}>{c.i}</div>
            <div>
              <div className="text-3xl font-black text-slate-900 tabular-nums"><StatValue value={c.v} /></div>
              <div className="text-sm text-slate-500">{c.l}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-[1fr_.7fr] gap-5 items-start">
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 mb-2">À propos de ce site</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Cette application pilote la base MySQL locale de <b>{session.bibliotheque}</b> et interroge
            les deux autres bibliothèques via les tables <b>FEDERATED</b>. Les emprunts d'étudiants d'autres
            universités déclenchent le <b>coordinateur 2PC</b> (validation à deux phases).
          </p>
        </Card>
        <ReseauStatus indisponibles={indispo} />
      </div>
    </div>
  );
}

/* =========================== ÉCRAN : CATALOGUE ========================== */

function EmpruntModal({ ouvrage, onClose, onDone }) {
  const { push } = useApp();
  const [idEtud, setIdEtud] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api("/prets", { method: "POST", body: { id_ouv: ouvrage.id_ouv, id_etud: parseInt(idEtud, 10) } });
      push("success", r.mode === "2pc" ? `Emprunt inter-sites validé (2PC) — ${r.txid}` : "Emprunt local enregistré");
      onDone();
      onClose();
    } catch (err) {
      push("error", err.status === 409 ? (err.message || "Refusé (limite atteinte / stock)") : err.message);
    } finally { setBusy(false); }
  };
  return (
    <Modal title={`Emprunter — ${ouvrage.titre}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="text-sm text-slate-500">Ouvrage <b>#{ouvrage.id_ouv}</b> · site {ouvrage.site} · stock {ouvrage.stock}</div>
        <Field label="ID de l'étudiant" type="number" value={idEtud} onChange={(e) => setIdEtud(e.target.value)} placeholder="ex. 5" autoFocus required />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={busy}>{busy ? "Validation…" : "Valider l'emprunt"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function useDebounced(value, delay = 350) {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

function SearchInput({ value, onChange, placeholder, className }) {
  const { theme } = useApp();
  return (
    <div className={cx("relative", className)}>
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">🔎</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={cx("w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:border-transparent", theme.ring)} />
      {value && (
        <button type="button" onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 text-xs cursor-pointer transition-colors">✕</button>
      )}
    </div>
  );
}

function Catalogue() {
  const [scope, setScope] = useState("global");
  const [q, setQ] = useState("");
  const qd = useDebounced(q);
  const [data, setData] = useState(null);
  const [indispo, setIndispo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emprunt, setEmprunt] = useState(null);
  const [sort, setSort] = useState({ key: "titre", dir: "asc" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api(`/ouvrages?scope=${scope}&q=${encodeURIComponent(qd)}`);
      setData(r.ouvrages); setIndispo(r.sites_indisponibles || []);
    } catch (e) { setData([]); } finally { setLoading(false); }
  }, [scope, qd]);
  useEffect(() => { load(); }, [scope, qd]);

  const toggleSort = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  const sorted = [...(data || [])].sort((a, b) => {
    const [x, y] = [a[sort.key], b[sort.key]];
    const cmp = typeof x === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""));
    return sort.dir === "asc" ? cmp : -cmp;
  });

  return (
    <div className="space-y-4 animate-fadein">
      <ScreenHead title="Catalogue réparti" subtitle="Recherche dans le réseau ou en local, et emprunt" icon="📚" />
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          <SearchInput value={q} onChange={setQ} placeholder="Rechercher un titre… (mise à jour instantanée)" />
          <select value={scope} onChange={(e) => setScope(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none cursor-pointer">
            <option value="global">Tout le réseau</option>
            <option value="local">Ce site uniquement</option>
          </select>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <DegradedBanner sites={indispo} />
        {loading ? <TableSkeleton cols={5} /> : (
          <Table
            hideMobile={[1]}
            head={[
              <SortTh label="Titre" active={sort.key === "titre"} dir={sort.dir} onClick={() => toggleSort("titre")} />,
              "Auteur", "Site",
              <SortTh label="Stock" active={sort.key === "stock"} dir={sort.dir} onClick={() => toggleSort("stock")} />,
              "",
            ]}
            rows={sorted.map((o) => [
              <span className="font-semibold text-slate-900">{o.titre}</span>,
              <span className="text-slate-600">{o.nom_auteur}</span>,
              <SiteBadge site={o.site} />,
              <span className="font-mono">{o.stock}</span>,
              <Button variant="soft" disabled={o.stock <= 0} onClick={() => setEmprunt(o)}>Emprunter</Button>,
            ])}
            empty="Aucun ouvrage." emptyIcon="📚"
          />
        )}
      </Card>

      {emprunt && <EmpruntModal ouvrage={emprunt} onClose={() => setEmprunt(null)} onDone={load} />}
    </div>
  );
}

/* =========================== ÉCRAN : ÉTUDIANTS ========================== */

function EtudiantModal({ onClose, onDone }) {
  const { push, site } = useApp();
  const [f, setF] = useState({ nom: "", adresse: "", specialite: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api("/etudiants", { method: "POST", body: f });
      push("success", `Étudiant inscrit à ${site} (id ${r.id_etud})`);
      onDone(); onClose();
    } catch (err) { push("error", err.message); } finally { setBusy(false); }
  };
  return (
    <Modal title={`Inscrire un étudiant — ${site}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nom complet" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} autoFocus required />
        <Field label="Adresse" value={f.adresse} onChange={(e) => setF({ ...f, adresse: e.target.value })} />
        <Field label="Spécialité" value={f.specialite} onChange={(e) => setF({ ...f, specialite: e.target.value })} />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={busy}>{busy ? "…" : "Inscrire"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function Etudiants() {
  const [scope, setScope] = useState("global");
  const [data, setData] = useState(null);
  const [indispo, setIndispo] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [sort, setSort] = useState({ key: "nom", dir: "asc" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api(`/etudiants?scope=${scope}`);
      setData(r.etudiants); setIndispo(r.sites_indisponibles || []);
    } catch (e) { setData([]); } finally { setLoading(false); }
  }, [scope]);
  useEffect(() => { load(); }, [scope]);

  const toggleSort = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  const rows = (data || [])
    .filter((e) => e.nom.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      const [x, y] = [a[sort.key], b[sort.key]];
      const cmp = typeof x === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""));
      return sort.dir === "asc" ? cmp : -cmp;
    });

  return (
    <div className="space-y-4 animate-fadein">
      <ScreenHead title="Gestion des étudiants" subtitle="Inscriptions et compteur d'emprunts (H4)" icon="🎓"
        action={<Button onClick={() => setModal(true)}>+ Inscrire</Button>} />
      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Filtrer par nom…" className="flex-1" />
        <select value={scope} onChange={(e) => setScope(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none cursor-pointer">
          <option value="global">Tout le réseau</option>
          <option value="local">Ce site uniquement</option>
        </select>
      </Card>
      <Card className="p-4 sm:p-5">
        <DegradedBanner sites={indispo} />
        {loading ? <TableSkeleton cols={5} /> : (
          <Table
            hideMobile={[3]}
            head={[
              "ID",
              <SortTh label="Nom" active={sort.key === "nom"} dir={sort.dir} onClick={() => toggleSort("nom")} />,
              "Université", "Spécialité",
              <SortTh label="Emprunts" active={sort.key === "nbre_emprunts"} dir={sort.dir} onClick={() => toggleSort("nbre_emprunts")} />,
            ]}
            rows={rows.map((e) => [
              <span className="font-mono text-slate-500">{e.id_etud}</span>,
              <span className="font-semibold text-slate-900">{e.nom}</span>,
              <SiteBadge site={e.universite} />,
              <span className="text-slate-600">{e.specialite || "—"}</span>,
              <EmpruntsBar n={e.nbre_emprunts} />,
            ])}
            empty="Aucun étudiant." emptyIcon="🎓"
          />
        )}
      </Card>
      {modal && <EtudiantModal onClose={() => setModal(false)} onDone={load} />}
    </div>
  );
}

/* ============================= ÉCRAN : PRÊTS ============================ */

function PretModal({ onClose, onDone }) {
  const { push } = useApp();
  const [f, setF] = useState({ id_ouv: "", id_etud: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api("/prets", { method: "POST", body: { id_ouv: parseInt(f.id_ouv, 10), id_etud: parseInt(f.id_etud, 10) } });
      push("success", r.mode === "2pc" ? `Prêt inter-sites validé (2PC)` : "Prêt local enregistré");
      onDone(); onClose();
    } catch (err) { push("error", err.message); } finally { setBusy(false); }
  };
  return (
    <Modal title="Nouveau prêt" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="ID ouvrage (local à ce site)" type="number" value={f.id_ouv} onChange={(e) => setF({ ...f, id_ouv: e.target.value })} autoFocus required />
        <Field label="ID étudiant" type="number" value={f.id_etud} onChange={(e) => setF({ ...f, id_etud: e.target.value })} required />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={busy}>{busy ? "…" : "Créer le prêt"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function Prets() {
  const { push } = useApp();
  const [prets, setPrets] = useState(null);
  const [ouvMap, setOuvMap] = useState({});
  const [etuMap, setEtuMap] = useState({});
  const [indispo, setIndispo] = useState([]);
  const [filtre, setFiltre] = useState("encours");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, o, e] = await Promise.all([
        api("/prets?scope=global"), api("/ouvrages?scope=global"), api("/etudiants?scope=global"),
      ]);
      setPrets(p.prets);
      setIndispo([...(p.sites_indisponibles || []), ...(o.sites_indisponibles || [])]);
      const om = {}; (o.ouvrages || []).forEach((x) => (om[x.id_ouv] = x.titre)); setOuvMap(om);
      const em = {}; (e.etudiants || []).forEach((x) => (em[x.id_etud] = x.nom)); setEtuMap(em);
    } catch (err) { setPrets([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, []);

  const retour = async (id) => {
    try {
      const r = await api(`/prets/${id}/retour`, { method: "POST" });
      push("success", r.mode === "2pc" ? "Retour inter-sites validé (2PC)" : "Retour enregistré");
      load();
    } catch (err) { push("error", err.message); }
  };

  const rows = (prets || []).filter((p) => (filtre === "encours" ? !p.date_retour : true));

  return (
    <div className="space-y-4 animate-fadein">
      <ScreenHead title="Gestion des prêts" subtitle="Suivi des emprunts et retours" icon="🔄"
        action={<Button onClick={() => setModal(true)}>+ Nouveau prêt</Button>} />
      <Card className="p-4">
        <div className="inline-flex bg-slate-100 rounded-xl p-1">
          {[["encours", "En cours"], ["tous", "Tous"]].map(([k, l]) => (
            <button key={k} onClick={() => setFiltre(k)}
              className={cx("px-4 py-1.5 text-sm font-semibold rounded-lg cursor-pointer transition-all duration-150", filtre === k ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700")}>{l}</button>
          ))}
        </div>
      </Card>
      <Card className="p-4 sm:p-5">
        <DegradedBanner sites={[...new Set(indispo)]} />
        {loading ? <TableSkeleton cols={6} /> : (
          <Table hideMobile={[3]}
            head={["#", "Ouvrage", "Étudiant", "Emprunté le", "Statut", ""]}
            rows={rows.map((p) => [
              <span className="font-mono text-slate-500">{p.id_pret}</span>,
              <span className="font-semibold text-slate-900">{ouvMap[p.id_ouv] || `#${p.id_ouv}`}</span>,
              <span className="text-slate-600">{etuMap[p.id_etud] || `#${p.id_etud}`}</span>,
              <span className="text-slate-500 text-sm">{fmtDate(p.date_emprunt)}</span>,
              p.date_retour
                ? <Badge className="bg-slate-100 text-slate-600 border-slate-200">Rendu</Badge>
                : <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">En cours</Badge>,
              p.date_retour ? null : <Button variant="soft" onClick={() => retour(p.id_pret)}>Retour</Button>,
            ])}
            empty="Aucun prêt." emptyIcon="🔄"
          />
        )}
      </Card>
      {modal && <PretModal onClose={() => setModal(false)} onDone={load} />}
    </div>
  );
}

/* ============================ ÉCRAN : AUTEURS =========================== */

function Auteurs() {
  const { push } = useApp();
  const [data, setData] = useState(null);
  const [nom, setNom] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api("/auteurs?scope=local"); setData(r.auteurs); }
    catch (e) { setData([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const r = await api("/auteurs", { method: "POST", body: { nom_auteur: nom } });
      push("success", `Auteur répliqué sur les 3 sites (XA) — id ${r.id_aut}`);
      setNom(""); load();
    } catch (err) { push("error", err.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4 animate-fadein">
      <ScreenHead title="Référentiel auteurs" subtitle="Table répliquée — ajout par transaction XA à 3 branches" icon="✍️" />
      <Card className="p-5">
        <form onSubmit={add} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full"><Field label="Nouvel auteur (réplication synchrone)" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex. Boubacar Boris Diop" required /></div>
          <Button type="submit" disabled={busy}>{busy ? "Réplication…" : "Ajouter (XA 3 branches)"}</Button>
        </form>
      </Card>
      <Card className="p-4 sm:p-5">
        {loading ? <TableSkeleton cols={2} /> : (
          <Table head={["ID", "Nom de l'auteur"]}
            rows={(data || []).map((a) => [
              <span className="font-mono text-slate-500">{a.id_aut}</span>,
              <span className="font-semibold text-slate-900">{a.nom_auteur}</span>,
            ])} empty="Aucun auteur." emptyIcon="✍️" />
        )}
      </Card>
    </div>
  );
}

/* ========================== ÉCRAN : ADMIN 2PC ========================== */

function AdminXA() {
  const { push } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api("/admin/xa")); } catch (e) { setData([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, []);

  const resoudre = async (txid) => {
    try { const r = await api(`/admin/xa/${txid}/resoudre`, { method: "POST" }); push("success", `${r.action} appliqué (${r.hotes_resolus.length} base(s))`); load(); }
    catch (err) { push("error", err.message); }
  };

  return (
    <div className="space-y-4 animate-fadein">
      <ScreenHead title="Console de validation répartie" subtitle="Transactions douteuses (XA RECOVER) et résolution via le journal 2PC" icon="⚙️"
        action={<Button variant="soft" onClick={load}>↻ Rafraîchir</Button>} />
      <Card className="p-4 sm:p-5">
        {loading ? <TableSkeleton cols={5} /> : (data && data.length === 0) ? (
          <div className="text-center py-10 bg-emerald-50/50 rounded-xl text-emerald-700 font-semibold animate-fadeup">
            ✓ Aucune transaction douteuse — cohérence ACID OK
          </div>
        ) : (
          <Table head={["Transaction (txid)", "Hôte", "Site", "Décision journalisée", ""]}
            rows={(data || []).map((t) => [
              <span className="font-mono text-xs text-rose-700">{t.txid}</span>,
              <span className="text-slate-600 text-sm">{t.hote}</span>,
              <span className="text-slate-500 text-sm">{t.site}</span>,
              <Badge className="bg-slate-200 text-slate-800 border-slate-300">{t.decision}</Badge>,
              <Button variant="danger" onClick={() => resoudre(t.txid)}>Forcer résolution</Button>,
            ])} empty="—" />
        )}
      </Card>
    </div>
  );
}

/* ---------------------- Composants de mise en page ---------------------- */

function ScreenHead({ title, subtitle, icon, action }) {
  const { theme } = useApp();
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 animate-fadeup">
      <div className="flex items-center gap-3.5">
        <div className={cx("w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center text-xl", theme.iconBg)}>{icon}</div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* Petite flèche de tri cliquable pour un en-tête de colonne */
function SortTh({ label, active, dir, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-slate-800 cursor-pointer group">
      {label}
      <span className={cx("text-[10px] transition-all", active ? "opacity-100 text-slate-700" : "opacity-0 group-hover:opacity-40")}>
        {dir === "desc" ? "▼" : "▲"}
      </span>
    </button>
  );
}

function Table({ head, rows, empty, emptyIcon = "🗂️", hideMobile = [] }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 bg-slate-50/60">
          <tr>
            {head.map((h, i) => (
              <th key={i} className={cx("px-4 py-3 font-semibold whitespace-nowrap", hideMobile.includes(i) && "hidden sm:table-cell")}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr><td colSpan={head.length} className="px-4 py-14 text-center text-slate-400">
              <div className="text-3xl mb-2">{emptyIcon}</div>
              {empty}
            </td></tr>
          ) : rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-50/70 transition-colors animate-fadein" style={{ animationDelay: `${Math.min(i, 8) * 0.03}s` }}>
              {r.map((c, j) => <td key={j} className={cx("px-4 py-3 align-middle", hideMobile.includes(j) && "hidden sm:table-cell")}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const NAV = [
  { key: "dashboard", label: "Tableau de bord", icon: "📊", comp: Dashboard },
  { key: "catalogue", label: "Catalogue", icon: "📚", comp: Catalogue },
  { key: "etudiants", label: "Étudiants", icon: "🎓", comp: Etudiants },
  { key: "prets", label: "Prêts", icon: "🔄", comp: Prets },
  { key: "auteurs", label: "Auteurs", icon: "✍️", comp: Auteurs },
  { key: "admin", label: "Admin 2PC", icon: "⚙️", comp: AdminXA },
];

function initiales(nom) {
  return (nom || "?").trim().split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
}

function Shell() {
  const { session, setSession, theme, site } = useApp();
  const [tab, setTab] = useState("dashboard");
  const [openNav, setOpenNav] = useState(false);
  const active = NAV.find((n) => n.key === tab) || NAV[0];
  const Active = active.comp;

  const logout = () => { localStorage.removeItem("biblio_session"); setSession(null); };

  return (
    <div className="min-h-full flex bg-slate-100">
      {/* Sidebar */}
      <aside className={cx(
        "fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300",
        openNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
          <div className={cx("w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg shadow-lg", theme.accentBar, theme.glow)}>📚</div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold leading-tight">Biblio {site}</div>
            <div className="text-xs text-slate-400">Réseau réparti</div>
          </div>
          <button onClick={() => setOpenNav(false)} className="lg:hidden w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-lg cursor-pointer transition-colors">✕</button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => {
            const isActive = tab === n.key;
            return (
              <button key={n.key} onClick={() => { setTab(n.key); setOpenNav(false); }}
                className={cx("relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer",
                  isActive ? theme.navActive : "text-slate-300 hover:bg-slate-800 hover:text-white hover:pl-4")}>
                {isActive && <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-white/80" />}
                <span>{n.icon}</span> {n.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className={cx("w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white", theme.accentBar)}>
              {initiales(session.nom)}
            </div>
            <div className="min-w-0">
              <div className="text-sm text-white font-semibold truncate">{session.nom}</div>
              <div className="text-xs text-slate-400 truncate">{session.statut}</div>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors">
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      {openNav && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden animate-fadein" onClick={() => setOpenNav(false)} />}

      {/* Contenu */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white/90 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpenNav(true)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 text-lg cursor-pointer transition-colors">☰</button>
            <span className="hidden sm:flex items-center gap-2 text-slate-800 font-bold">
              <span>{active.icon}</span>{active.label}
            </span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <SiteBadge site={site} />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600 hidden sm:inline">Connecté</span>
          </div>
        </header>
        <main key={tab} className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto"><Active /></main>
      </div>
    </div>
  );
}

/* -------------------------------- App ----------------------------------- */

function App() {
  const [boot, setBoot] = useState({ loading: true, site: null, stats: null });
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem("biblio_session")); } catch (e) { return null; }
  });
  const [publicView, setPublicView] = useState("landing");
  const { toasts, push } = useToasts();

  useEffect(() => {
    api("/stats").then((s) => setBoot({ loading: false, site: s.site, stats: s }))
      .catch(() => setBoot({ loading: false, site: "UGB", stats: null }));
  }, []);

  if (boot.loading) return <div className="boot"><div className="ring" /></div>;

  const site = boot.site || "UGB";
  const theme = THEMES[site] || THEMES.UGB;
  const ctx = { site, theme, session, setSession, push };

  let content;
  if (session) content = <Shell />;
  else if (publicView === "login") content = <Login onBack={() => setPublicView("landing")} />;
  else content = <Landing stats={boot.stats} onLogin={() => setPublicView("login")} />;

  return (
    <AppCtx.Provider value={ctx}>
      <div className="min-h-full bg-slate-100">{content}</div>
      <ToastHost toasts={toasts} />
    </AppCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
