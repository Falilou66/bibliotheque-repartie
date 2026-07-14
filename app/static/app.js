/* ==========================================================================
   Bibliothèque Inter-Universitaire — Interface React (par site)
   React 18 + Babel (CDN, transpilation navigateur) + Tailwind.
   Une même codebase tourne sur les 3 sites : le thème et le nom du site sont
   déduits de GET /api/stats (champ "site").
   ========================================================================== */

const {
  useState,
  useEffect,
  useCallback,
  useContext,
  createContext,
  useRef
} = React;

/* ------------------------------- Helpers -------------------------------- */

async function api(path, {
  method = "GET",
  body
} = {}) {
  const opt = {
    method,
    headers: {}
  };
  if (body !== undefined) {
    opt.headers["Content-Type"] = "application/json";
    opt.body = JSON.stringify(body);
  }
  const res = await fetch("/api" + path, opt);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {/* pas de corps JSON */}
  if (!res.ok) {
    const err = new Error(data && data.detail || res.statusText || "Erreur");
    err.status = res.status;
    throw err;
  }
  return data;
}
const cx = (...c) => c.filter(Boolean).join(" ");
const fmtDate = s => s ? new Date(s).toLocaleString("fr-FR", {
  dateStyle: "short",
  timeStyle: "short"
}) : "—";

/* Compteur animé (0 -> valeur) pour les stats premium des écrans publics */
function useCountUp(value, duration = 900) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (value === null || value === undefined || isNaN(value)) {
      setN(0);
      return;
    }
    const from = 0,
      to = Number(value),
      start = performance.now();
    cancelAnimationFrame(ref.current);
    const tick = now => {
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
    label: "Université Gaston Berger",
    ville: "Saint-Louis",
    grad: "from-blue-600 via-blue-700 to-indigo-800",
    meshA: "bg-blue-500",
    meshB: "bg-indigo-400",
    meshC: "bg-sky-400",
    navActive: "bg-blue-600 text-white shadow",
    btn: "bg-blue-600 hover:bg-blue-500",
    btnSoft: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    ring: "focus:ring-blue-500",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
    accentBar: "bg-blue-600",
    iconBg: "bg-blue-50 text-blue-600",
    solid: "bg-blue-600",
    glow: "shadow-blue-500/30"
  },
  UCAD: {
    label: "Université Cheikh Anta Diop",
    ville: "Dakar",
    grad: "from-emerald-600 via-emerald-700 to-teal-800",
    meshA: "bg-emerald-500",
    meshB: "bg-teal-400",
    meshC: "bg-lime-400",
    navActive: "bg-emerald-600 text-white shadow",
    btn: "bg-emerald-600 hover:bg-emerald-500",
    btnSoft: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    ring: "focus:ring-emerald-500",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
    accentBar: "bg-emerald-600",
    iconBg: "bg-emerald-50 text-emerald-600",
    solid: "bg-emerald-600",
    glow: "shadow-emerald-500/30"
  },
  UADB: {
    label: "Université Alioune Diop de Bambey",
    ville: "Bambey",
    grad: "from-amber-500 via-amber-600 to-orange-700",
    meshA: "bg-amber-500",
    meshB: "bg-orange-400",
    meshC: "bg-yellow-400",
    navActive: "bg-amber-600 text-white shadow",
    btn: "bg-amber-600 hover:bg-amber-500",
    btnSoft: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    ring: "focus:ring-amber-500",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    accentBar: "bg-amber-600",
    iconBg: "bg-amber-50 text-amber-600",
    solid: "bg-amber-600",
    glow: "shadow-amber-500/30"
  }
};
const SITE_BADGE = {
  UGB: "bg-blue-100 text-blue-800 border-blue-200",
  UCAD: "bg-emerald-100 text-emerald-800 border-emerald-200",
  UADB: "bg-amber-100 text-amber-800 border-amber-200"
};
const SITE_DOT = {
  UGB: "bg-blue-500",
  UCAD: "bg-emerald-500",
  UADB: "bg-amber-500"
};

/* ------------------------------ Contexte -------------------------------- */

const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

/* ------------------------------ Toasts ---------------------------------- */

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, {
      id,
      type,
      message
    }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200);
  }, []);
  return {
    toasts,
    push
  };
}
function ToastHost({
  toasts
}) {
  const styles = {
    success: "bg-emerald-600",
    error: "bg-rose-600",
    info: "bg-slate-800",
    warn: "bg-amber-600"
  };
  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warn: "⚠"
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed top-4 right-4 z-50 space-y-2.5 w-80 max-w-[90vw]"
  }, toasts.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    className: cx("animate-slidein relative overflow-hidden text-white text-sm font-medium pl-4 pr-4 py-3 rounded-xl shadow-lg shadow-black/10 flex items-start gap-2.5", styles[t.type] || styles.info)
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-5 h-5 shrink-0 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold mt-0.5"
  }, icons[t.type] || icons.info), /*#__PURE__*/React.createElement("span", {
    className: "leading-snug"
  }, t.message), /*#__PURE__*/React.createElement("div", {
    className: "absolute left-0 bottom-0 h-0.5 bg-white/40",
    style: {
      animation: "toastbar 4.2s linear forwards"
    }
  }))));
}

/* --------------------------- UI primitives ------------------------------ */

/* Lignes de squelette animées pour un chargement perçu plus premium qu'un simple spinner */
function TableSkeleton({
  cols = 4,
  rows = 5
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-3 py-1"
  }, Array.from({
    length: rows
  }).map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "flex items-center gap-4 px-1"
  }, Array.from({
    length: cols
  }).map((__, j) => /*#__PURE__*/React.createElement("div", {
    key: j,
    className: "skeleton h-4 rounded-md",
    style: {
      width: j === 0 ? "10%" : `${18 + (i + j) % 3 * 8}%`
    }
  })))));
}
const Card = ({
  children,
  className,
  hover,
  style
}) => /*#__PURE__*/React.createElement("div", {
  style: style,
  className: cx("bg-white rounded-2xl shadow-sm shadow-slate-200/60 border border-slate-200/70 transition-all duration-200", hover && "hover:shadow-lg hover:shadow-slate-200/80 hover:-translate-y-0.5", className)
}, children);
function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled
}) {
  const {
    theme
  } = useApp();
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl text-sm px-4 py-2.5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none cursor-pointer active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const styles = {
    primary: cx("text-white shadow-md hover:shadow-lg hover:-translate-y-0.5", theme.btn, theme.glow),
    soft: cx(theme.btnSoft, "hover:-translate-y-0.5"),
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "text-white bg-rose-600 hover:bg-rose-500 shadow-md hover:shadow-lg shadow-rose-500/20 hover:-translate-y-0.5"
  };
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    onClick: onClick,
    disabled: disabled,
    className: cx(base, styles[variant])
  }, children);
}
function Field({
  label,
  ...props
}) {
  const {
    theme
  } = useApp();
  return /*#__PURE__*/React.createElement("label", {
    className: "block"
  }, /*#__PURE__*/React.createElement("span", {
    className: "block text-sm font-semibold text-slate-700 mb-1.5"
  }, label), /*#__PURE__*/React.createElement("input", {
    ...props,
    className: cx("w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 transition-shadow focus:ring-2 focus:border-transparent outline-none", theme.ring)
  }));
}
function Modal({
  title,
  children,
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadein",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Card, {
    className: "w-full max-w-md p-6 animate-scalein shadow-2xl"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-5"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-bold text-slate-900"
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-xl leading-none cursor-pointer transition-colors"
  }, "×")), children)));
}
const Badge = ({
  children,
  className
}) => /*#__PURE__*/React.createElement("span", {
  className: cx("inline-block px-2.5 py-0.5 text-xs font-bold rounded-md border", className)
}, children);
const SiteBadge = ({
  site
}) => /*#__PURE__*/React.createElement(Badge, {
  className: cx("inline-flex items-center gap-1.5", SITE_BADGE[site] || "bg-slate-100 text-slate-700 border-slate-200")
}, /*#__PURE__*/React.createElement("span", {
  className: cx("w-1.5 h-1.5 rounded-full", SITE_DOT[site] || "bg-slate-400")
}), site);
function DegradedBanner({
  sites
}) {
  if (!sites || sites.length === 0) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeup"
  }, /*#__PURE__*/React.createElement("span", null, "⚠️"), " Mode dégradé — site(s) injoignable(s) : ", /*#__PURE__*/React.createElement("b", null, sites.join(", ")), ". Données partielles.");
}

/* Barre d'emprunts x/5 */
function EmpruntsBar({
  n
}) {
  const pct = Math.min(100, n / 5 * 100);
  const color = n >= 5 ? "bg-rose-500" : n >= 4 ? "bg-amber-500" : "bg-emerald-500";
  return /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-20 h-2 bg-slate-200 rounded-full overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("h-full rounded-full transition-all duration-700 ease-out", color),
    style: {
      width: pct + "%"
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-mono text-slate-500"
  }, n, "/5"));
}

/* =========================== ÉCRAN : LANDING ============================= */

function StatValue({
  value,
  suffix
}) {
  const n = useCountUp(value);
  return /*#__PURE__*/React.createElement(React.Fragment, null, value === null || value === undefined ? "—" : n.toLocaleString("fr-FR"), suffix);
}

/* Visuel réseau : les 3 sites reliés entre eux, le site courant mis en avant */
function ReseauVisuel() {
  const {
    site
  } = useApp();
  const sites = ["UGB", "UCAD", "UADB"];
  const pos = {
    UGB: {
      x: 100,
      y: 40
    },
    UCAD: {
      x: 30,
      y: 170
    },
    UADB: {
      x: 170,
      y: 170
    }
  };
  const colorHex = {
    UGB: "#2563eb",
    UCAD: "#059669",
    UADB: "#d97706"
  };
  const pairs = [["UGB", "UCAD"], ["UGB", "UADB"], ["UCAD", "UADB"]];
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 200 210",
    className: "w-full max-w-[220px] mx-auto"
  }, pairs.map(([a, b]) => /*#__PURE__*/React.createElement("line", {
    key: a + b,
    x1: pos[a].x,
    y1: pos[a].y,
    x2: pos[b].x,
    y2: pos[b].y,
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeDasharray: "5 5",
    className: "text-white/30"
  })), sites.map(s => /*#__PURE__*/React.createElement("g", {
    key: s,
    transform: `translate(${pos[s].x}, ${pos[s].y})`
  }, s === site && /*#__PURE__*/React.createElement("circle", {
    r: "22",
    fill: "white",
    opacity: "0.15"
  }, /*#__PURE__*/React.createElement("animate", {
    attributeName: "r",
    values: "18;26;18",
    dur: "2.4s",
    repeatCount: "indefinite"
  }), /*#__PURE__*/React.createElement("animate", {
    attributeName: "opacity",
    values: "0.25;0.05;0.25",
    dur: "2.4s",
    repeatCount: "indefinite"
  })), /*#__PURE__*/React.createElement("circle", {
    r: "14",
    fill: colorHex[s],
    stroke: "white",
    strokeWidth: s === site ? 3 : 1.5
  }), /*#__PURE__*/React.createElement("text", {
    y: "34",
    textAnchor: "middle",
    fontSize: "11",
    fontWeight: "700",
    fill: "white",
    opacity: s === site ? 1 : 0.7
  }, s))));
}
function Landing({
  stats,
  onLogin
}) {
  const {
    theme,
    site
  } = useApp();
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-full flex flex-col"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("relative overflow-hidden bg-gradient-to-br text-white", theme.grad)
  }, /*#__PURE__*/React.createElement("div", {
    className: "pointer-events-none absolute inset-0 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("animate-float absolute -top-24 -left-20 w-96 h-96 rounded-full blur-3xl opacity-30", theme.meshA)
  }), /*#__PURE__*/React.createElement("div", {
    className: cx("animate-float absolute top-10 right-0 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-20", theme.meshB),
    style: {
      animationDelay: "-3s"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: cx("animate-float absolute bottom-0 left-1/3 w-80 h-80 rounded-full blur-3xl opacity-20", theme.meshC),
    style: {
      animationDelay: "-5s"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 opacity-[0.05]",
    style: {
      backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
      backgroundSize: "42px 42px"
    }
  })), /*#__PURE__*/React.createElement("header", {
    className: "relative max-w-6xl mx-auto w-full px-6 py-5 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-xl border border-white/10"
  }, "📚"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-bold leading-tight"
  }, "Réseau Inter-Universitaire"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-white/70"
  }, "Système Réparti de Bibliothèques"))), /*#__PURE__*/React.createElement("button", {
    onClick: onLogin,
    className: "bg-white/15 hover:bg-white/25 backdrop-blur text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 border border-white/10 cursor-pointer"
  }, "Espace employé →")), /*#__PURE__*/React.createElement("div", {
    className: "relative max-w-6xl mx-auto w-full px-6 pt-10 pb-24 grid lg:grid-cols-[1.3fr_.7fr] gap-10 items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center lg:text-left animate-fadeup"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold mb-6 border border-white/10"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-white animate-pulse"
  }), " Site ", site, " — ", theme.ville), /*#__PURE__*/React.createElement("h1", {
    className: "text-4xl sm:text-5xl font-black tracking-tight mb-4"
  }, theme.label), /*#__PURE__*/React.createElement("p", {
    className: "text-white/80 max-w-2xl mx-auto lg:mx-0 text-lg leading-relaxed"
  }, "Empruntez dans n'importe quelle bibliothèque du réseau ", /*#__PURE__*/React.createElement("b", {
    className: "text-white"
  }, "UGB · UCAD · UADB"), ". Catalogue réparti, transactions garanties par validation à deux phases (2PC)."), /*#__PURE__*/React.createElement("div", {
    className: "mt-8 flex items-center justify-center lg:justify-start gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onLogin,
    className: "bg-white text-slate-900 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all cursor-pointer"
  }, "Accéder à l'espace de gestion"))), /*#__PURE__*/React.createElement("div", {
    className: "max-w-[180px] sm:max-w-[220px] mx-auto lg:max-w-none animate-fadeup",
    style: {
      animationDelay: ".15s"
    }
  }, /*#__PURE__*/React.createElement(ReseauVisuel, null)))), /*#__PURE__*/React.createElement("div", {
    className: "max-w-6xl mx-auto w-full px-6 -mt-14 grid grid-cols-1 sm:grid-cols-3 gap-5 relative z-10"
  }, [{
    l: "Ouvrages du réseau",
    v: stats?.total_ouvrages,
    i: "📖"
  }, {
    l: "Étudiants inscrits",
    v: stats?.total_etudiants,
    i: "🎓"
  }, {
    l: "Prêts en cours",
    v: stats?.total_prets_encours,
    i: "🔄"
  }].map((s, idx) => /*#__PURE__*/React.createElement(Card, {
    key: s.l,
    hover: true,
    className: "p-6 text-center animate-fadeup",
    style: {
      animationDelay: `${idx * 0.08}s`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3", theme.iconBg)
  }, s.i), /*#__PURE__*/React.createElement("div", {
    className: "text-4xl font-black text-slate-900 tabular-nums"
  }, /*#__PURE__*/React.createElement(StatValue, {
    value: s.v
  })), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-500 mt-1"
  }, s.l)))), /*#__PURE__*/React.createElement("div", {
    className: "max-w-6xl mx-auto w-full px-6 py-20"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center mb-12"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl sm:text-3xl font-black text-slate-900"
  }, "Une bibliothèque, trois campus"), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-500 mt-2 max-w-xl mx-auto"
  }, "Une infrastructure de données distribuée pensée pour la cohérence et la continuité de service.")), /*#__PURE__*/React.createElement("div", {
    className: "grid sm:grid-cols-3 gap-6"
  }, [{
    t: "Catalogue réparti",
    d: "Recherchez dans les 3 bibliothèques via les vues globales FEDERATED, ou dans votre seul fonds local.",
    i: "🔍"
  }, {
    t: "Emprunts inter-sites",
    d: "Un étudiant d'une université emprunte ailleurs : le compteur global est mis à jour en 2PC.",
    i: "🤝"
  }, {
    t: "Cohérence garantie",
    d: "Chaque écriture répartie est atomique (XA PREPARE / COMMIT) avec reprise sur panne.",
    i: "🛡️"
  }].map((f, idx) => /*#__PURE__*/React.createElement(Card, {
    key: f.t,
    hover: true,
    className: "p-6 animate-fadeup",
    style: {
      animationDelay: `${idx * 0.1}s`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4", theme.iconBg)
  }, f.i), /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-slate-900 mb-1.5"
  }, f.t), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500 leading-relaxed"
  }, f.d))))), /*#__PURE__*/React.createElement("footer", {
    className: "mt-auto border-t border-slate-200 py-6 text-center text-xs text-slate-400"
  }, "Master 2 Systèmes d'Information — UADB / UFR SATIC · Projet BDR"));
}

/* ============================ ÉCRAN : LOGIN ============================= */

function Login({
  onBack
}) {
  const {
    theme,
    site,
    setSession,
    push
  } = useApp();
  const [login, setLogin] = useState("");
  const [mdp, setMdp] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      const emp = await api("/auth/login", {
        method: "POST",
        body: {
          login,
          mot_de_passe: mdp
        }
      });
      localStorage.setItem("biblio_session", JSON.stringify(emp));
      setSession(emp);
      push("success", `Bienvenue, ${emp.nom}`);
    } catch (err) {
      push("error", err.status === 401 ? "Identifiants invalides" : "Erreur de connexion");
    } finally {
      setBusy(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-full flex items-center justify-center bg-slate-100 p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-3xl grid md:grid-cols-2 bg-white rounded-3xl shadow-2xl shadow-slate-300/50 overflow-hidden animate-scalein"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("relative hidden md:flex flex-col justify-between p-8 text-white bg-gradient-to-br overflow-hidden", theme.grad)
  }, /*#__PURE__*/React.createElement("div", {
    className: "pointer-events-none absolute inset-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("animate-float absolute -top-10 -left-10 w-56 h-56 rounded-full blur-3xl opacity-30", theme.meshA)
  }), /*#__PURE__*/React.createElement("div", {
    className: cx("animate-float absolute bottom-0 -right-10 w-56 h-56 rounded-full blur-3xl opacity-25", theme.meshB),
    style: {
      animationDelay: "-3s"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-11 h-11 rounded-xl bg-white/15 backdrop-blur border border-white/10 flex items-center justify-center text-xl mb-8"
  }, "📚"), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black leading-tight mb-2"
  }, theme.label), /*#__PURE__*/React.createElement("p", {
    className: "text-white/70 text-sm"
  }, theme.ville, " · Réseau UGB · UCAD · UADB")), /*#__PURE__*/React.createElement("div", {
    className: "relative text-xs text-white/60"
  }, "Cohérence garantie par validation à deux phases (2PC)")), /*#__PURE__*/React.createElement("div", {
    className: "p-8 sm:p-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-7"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xl mb-4 md:hidden"
  }, "📚"), /*#__PURE__*/React.createElement("h1", {
    className: "text-xl font-bold text-slate-900"
  }, "Espace employé — ", site), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500 mt-1"
  }, "Connectez-vous pour gérer la bibliothèque")), /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Identifiant",
    value: login,
    onChange: e => setLogin(e.target.value),
    placeholder: "ex. awa",
    autoFocus: true,
    required: true
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Mot de passe",
    type: "password",
    value: mdp,
    onChange: e => setMdp(e.target.value),
    placeholder: "••••••••",
    required: true
  }), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    disabled: busy
  }, busy ? "Connexion…" : "Se connecter")), /*#__PURE__*/React.createElement("div", {
    className: "mt-5 text-center"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    className: "text-sm text-slate-500 hover:text-slate-800 cursor-pointer"
  }, "← Retour à l'accueil")), /*#__PURE__*/React.createElement("p", {
    className: "mt-4 text-center text-xs text-slate-400"
  }, "Démo : mot de passe ", /*#__PURE__*/React.createElement("code", {
    className: "bg-slate-100 px-1 rounded"
  }, "biblio123")))));
}

/* ========================= ÉCRAN : TABLEAU DE BORD ====================== */

function ReseauStatus({
  indisponibles
}) {
  const {
    site
  } = useApp();
  const sites = ["UGB", "UCAD", "UADB"];
  return /*#__PURE__*/React.createElement(Card, {
    className: "p-6"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-slate-900 mb-4"
  }, "État du réseau"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, sites.map(s => {
    const moi = s === site;
    const down = indisponibles.includes(s);
    return /*#__PURE__*/React.createElement("div", {
      key: s,
      className: "flex items-center justify-between text-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: cx("w-2 h-2 rounded-full", down ? "bg-rose-500" : "bg-emerald-500 animate-pulse")
    }), /*#__PURE__*/React.createElement("span", {
      className: "font-semibold text-slate-800"
    }, s), moi && /*#__PURE__*/React.createElement(Badge, {
      className: "bg-slate-100 text-slate-500 border-slate-200"
    }, "ce site")), /*#__PURE__*/React.createElement("span", {
      className: cx("text-xs font-semibold", down ? "text-rose-600" : "text-emerald-600")
    }, down ? "Injoignable" : "En ligne"));
  })));
}
function Dashboard() {
  const {
    session,
    theme
  } = useApp();
  const [stats, setStats] = useState(null);
  const [indispo, setIndispo] = useState([]);
  useEffect(() => {
    api("/stats").then(setStats).catch(() => {});
    api("/ouvrages?scope=global&q=").then(r => setIndispo(r.sites_indisponibles || [])).catch(() => {});
  }, []);
  const cards = [{
    l: "Ouvrages (réseau)",
    v: stats?.total_ouvrages,
    i: "📖"
  }, {
    l: "Étudiants (réseau)",
    v: stats?.total_etudiants,
    i: "🎓"
  }, {
    l: "Prêts en cours",
    v: stats?.total_prets_encours,
    i: "🔄"
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("relative overflow-hidden rounded-2xl p-6 text-white bg-gradient-to-br animate-fadeup", theme.grad)
  }, /*#__PURE__*/React.createElement("div", {
    className: "pointer-events-none absolute inset-0 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("animate-float absolute -top-16 -right-10 w-64 h-64 rounded-full blur-3xl opacity-25", theme.meshA)
  })), /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black"
  }, saluer(), ", ", session.nom, " 👋"), /*#__PURE__*/React.createElement("p", {
    className: "text-white/80 mt-1"
  }, session.statut, " — Bibliothèque ", session.bibliotheque))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-5"
  }, cards.map((c, idx) => /*#__PURE__*/React.createElement(Card, {
    key: c.l,
    hover: true,
    className: "p-6 flex items-center gap-4 animate-fadeup",
    style: {
      animationDelay: `${idx * 0.06}s`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-2xl", theme.iconBg)
  }, c.i), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-black text-slate-900 tabular-nums"
  }, /*#__PURE__*/React.createElement(StatValue, {
    value: c.v
  })), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-500"
  }, c.l))))), /*#__PURE__*/React.createElement("div", {
    className: "grid md:grid-cols-[1fr_.7fr] gap-5 items-start"
  }, /*#__PURE__*/React.createElement(Card, {
    className: "p-6"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-slate-900 mb-2"
  }, "À propos de ce site"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-600 leading-relaxed"
  }, "Cette application pilote la base MySQL locale de ", /*#__PURE__*/React.createElement("b", null, session.bibliotheque), " et interroge les deux autres bibliothèques via les tables ", /*#__PURE__*/React.createElement("b", null, "FEDERATED"), ". Les emprunts d'étudiants d'autres universités déclenchent le ", /*#__PURE__*/React.createElement("b", null, "coordinateur 2PC"), " (validation à deux phases).")), /*#__PURE__*/React.createElement(ReseauStatus, {
    indisponibles: indispo
  })));
}

/* =========================== ÉCRAN : CATALOGUE ========================== */

function EmpruntModal({
  ouvrage,
  onClose,
  onDone
}) {
  const {
    push
  } = useApp();
  const [idEtud, setIdEtud] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api("/prets", {
        method: "POST",
        body: {
          id_ouv: ouvrage.id_ouv,
          id_etud: parseInt(idEtud, 10)
        }
      });
      push("success", r.mode === "2pc" ? `Emprunt inter-sites validé (2PC) — ${r.txid}` : "Emprunt local enregistré");
      onDone();
      onClose();
    } catch (err) {
      push("error", err.status === 409 ? err.message || "Refusé (limite atteinte / stock)" : err.message);
    } finally {
      setBusy(false);
    }
  };
  return /*#__PURE__*/React.createElement(Modal, {
    title: `Emprunter — ${ouvrage.titre}`,
    onClose: onClose
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-500"
  }, "Ouvrage ", /*#__PURE__*/React.createElement("b", null, "#", ouvrage.id_ouv), " · site ", ouvrage.site, " · stock ", ouvrage.stock), /*#__PURE__*/React.createElement(Field, {
    label: "ID de l'étudiant",
    type: "number",
    value: idEtud,
    onChange: e => setIdEtud(e.target.value),
    placeholder: "ex. 5",
    autoFocus: true,
    required: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 justify-end"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: onClose
  }, "Annuler"), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    disabled: busy
  }, busy ? "Validation…" : "Valider l'emprunt"))));
}
function useDebounced(value, delay = 350) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}
function SearchInput({
  value,
  onChange,
  placeholder,
  className
}) {
  const {
    theme
  } = useApp();
  return /*#__PURE__*/React.createElement("div", {
    className: cx("relative", className)
  }, /*#__PURE__*/React.createElement("span", {
    className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"
  }, "🔎"), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    className: cx("w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:border-transparent", theme.ring)
  }), value && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onChange(""),
    className: "absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 text-xs cursor-pointer transition-colors"
  }, "✕"));
}
function Catalogue() {
  const [scope, setScope] = useState("global");
  const [q, setQ] = useState("");
  const qd = useDebounced(q);
  const [data, setData] = useState(null);
  const [indispo, setIndispo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emprunt, setEmprunt] = useState(null);
  const [sort, setSort] = useState({
    key: "titre",
    dir: "asc"
  });
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api(`/ouvrages?scope=${scope}&q=${encodeURIComponent(qd)}`);
      setData(r.ouvrages);
      setIndispo(r.sites_indisponibles || []);
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [scope, qd]);
  useEffect(() => {
    load();
  }, [scope, qd]);
  const toggleSort = key => setSort(s => ({
    key,
    dir: s.key === key && s.dir === "asc" ? "desc" : "asc"
  }));
  const sorted = [...(data || [])].sort((a, b) => {
    const [x, y] = [a[sort.key], b[sort.key]];
    const cmp = typeof x === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""));
    return sort.dir === "asc" ? cmp : -cmp;
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4 animate-fadein"
  }, /*#__PURE__*/React.createElement(ScreenHead, {
    title: "Catalogue réparti",
    subtitle: "Recherche dans le réseau ou en local, et emprunt",
    icon: "📚"
  }), /*#__PURE__*/React.createElement(Card, {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3"
  }, /*#__PURE__*/React.createElement(SearchInput, {
    value: q,
    onChange: setQ,
    placeholder: "Rechercher un titre… (mise à jour instantanée)"
  }), /*#__PURE__*/React.createElement("select", {
    value: scope,
    onChange: e => setScope(e.target.value),
    className: "bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none cursor-pointer"
  }, /*#__PURE__*/React.createElement("option", {
    value: "global"
  }, "Tout le réseau"), /*#__PURE__*/React.createElement("option", {
    value: "local"
  }, "Ce site uniquement")))), /*#__PURE__*/React.createElement(Card, {
    className: "p-4 sm:p-5"
  }, /*#__PURE__*/React.createElement(DegradedBanner, {
    sites: indispo
  }), loading ? /*#__PURE__*/React.createElement(TableSkeleton, {
    cols: 5
  }) : /*#__PURE__*/React.createElement(Table, {
    hideMobile: [1],
    head: [/*#__PURE__*/React.createElement(SortTh, {
      label: "Titre",
      active: sort.key === "titre",
      dir: sort.dir,
      onClick: () => toggleSort("titre")
    }), "Auteur", "Site", /*#__PURE__*/React.createElement(SortTh, {
      label: "Stock",
      active: sort.key === "stock",
      dir: sort.dir,
      onClick: () => toggleSort("stock")
    }), ""],
    rows: sorted.map(o => [/*#__PURE__*/React.createElement("span", {
      className: "font-semibold text-slate-900"
    }, o.titre), /*#__PURE__*/React.createElement("span", {
      className: "text-slate-600"
    }, o.nom_auteur), /*#__PURE__*/React.createElement(SiteBadge, {
      site: o.site
    }), /*#__PURE__*/React.createElement("span", {
      className: "font-mono"
    }, o.stock), /*#__PURE__*/React.createElement(Button, {
      variant: "soft",
      disabled: o.stock <= 0,
      onClick: () => setEmprunt(o)
    }, "Emprunter")]),
    empty: "Aucun ouvrage.",
    emptyIcon: "📚"
  })), emprunt && /*#__PURE__*/React.createElement(EmpruntModal, {
    ouvrage: emprunt,
    onClose: () => setEmprunt(null),
    onDone: load
  }));
}

/* =========================== ÉCRAN : ÉTUDIANTS ========================== */

function EtudiantModal({
  onClose,
  onDone
}) {
  const {
    push,
    site
  } = useApp();
  const [f, setF] = useState({
    nom: "",
    adresse: "",
    specialite: ""
  });
  const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api("/etudiants", {
        method: "POST",
        body: f
      });
      push("success", `Étudiant inscrit à ${site} (id ${r.id_etud})`);
      onDone();
      onClose();
    } catch (err) {
      push("error", err.message);
    } finally {
      setBusy(false);
    }
  };
  return /*#__PURE__*/React.createElement(Modal, {
    title: `Inscrire un étudiant — ${site}`,
    onClose: onClose
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Nom complet",
    value: f.nom,
    onChange: e => setF({
      ...f,
      nom: e.target.value
    }),
    autoFocus: true,
    required: true
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Adresse",
    value: f.adresse,
    onChange: e => setF({
      ...f,
      adresse: e.target.value
    })
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Spécialité",
    value: f.specialite,
    onChange: e => setF({
      ...f,
      specialite: e.target.value
    })
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 justify-end"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: onClose
  }, "Annuler"), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    disabled: busy
  }, busy ? "…" : "Inscrire"))));
}
function Etudiants() {
  const [scope, setScope] = useState("global");
  const [data, setData] = useState(null);
  const [indispo, setIndispo] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [sort, setSort] = useState({
    key: "nom",
    dir: "asc"
  });
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api(`/etudiants?scope=${scope}`);
      setData(r.etudiants);
      setIndispo(r.sites_indisponibles || []);
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [scope]);
  useEffect(() => {
    load();
  }, [scope]);
  const toggleSort = key => setSort(s => ({
    key,
    dir: s.key === key && s.dir === "asc" ? "desc" : "asc"
  }));
  const rows = (data || []).filter(e => e.nom.toLowerCase().includes(q.toLowerCase())).sort((a, b) => {
    const [x, y] = [a[sort.key], b[sort.key]];
    const cmp = typeof x === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""));
    return sort.dir === "asc" ? cmp : -cmp;
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4 animate-fadein"
  }, /*#__PURE__*/React.createElement(ScreenHead, {
    title: "Gestion des étudiants",
    subtitle: "Inscriptions et compteur d'emprunts (H4)",
    icon: "🎓",
    action: /*#__PURE__*/React.createElement(Button, {
      onClick: () => setModal(true)
    }, "+ Inscrire")
  }), /*#__PURE__*/React.createElement(Card, {
    className: "p-4 flex flex-col sm:flex-row gap-3"
  }, /*#__PURE__*/React.createElement(SearchInput, {
    value: q,
    onChange: setQ,
    placeholder: "Filtrer par nom…",
    className: "flex-1"
  }), /*#__PURE__*/React.createElement("select", {
    value: scope,
    onChange: e => setScope(e.target.value),
    className: "bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none cursor-pointer"
  }, /*#__PURE__*/React.createElement("option", {
    value: "global"
  }, "Tout le réseau"), /*#__PURE__*/React.createElement("option", {
    value: "local"
  }, "Ce site uniquement"))), /*#__PURE__*/React.createElement(Card, {
    className: "p-4 sm:p-5"
  }, /*#__PURE__*/React.createElement(DegradedBanner, {
    sites: indispo
  }), loading ? /*#__PURE__*/React.createElement(TableSkeleton, {
    cols: 5
  }) : /*#__PURE__*/React.createElement(Table, {
    hideMobile: [3],
    head: ["ID", /*#__PURE__*/React.createElement(SortTh, {
      label: "Nom",
      active: sort.key === "nom",
      dir: sort.dir,
      onClick: () => toggleSort("nom")
    }), "Université", "Spécialité", /*#__PURE__*/React.createElement(SortTh, {
      label: "Emprunts",
      active: sort.key === "nbre_emprunts",
      dir: sort.dir,
      onClick: () => toggleSort("nbre_emprunts")
    })],
    rows: rows.map(e => [/*#__PURE__*/React.createElement("span", {
      className: "font-mono text-slate-500"
    }, e.id_etud), /*#__PURE__*/React.createElement("span", {
      className: "font-semibold text-slate-900"
    }, e.nom), /*#__PURE__*/React.createElement(SiteBadge, {
      site: e.universite
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-slate-600"
    }, e.specialite || "—"), /*#__PURE__*/React.createElement(EmpruntsBar, {
      n: e.nbre_emprunts
    })]),
    empty: "Aucun étudiant.",
    emptyIcon: "🎓"
  })), modal && /*#__PURE__*/React.createElement(EtudiantModal, {
    onClose: () => setModal(false),
    onDone: load
  }));
}

/* ============================= ÉCRAN : PRÊTS ============================ */

function PretModal({
  onClose,
  onDone
}) {
  const {
    push
  } = useApp();
  const [f, setF] = useState({
    id_ouv: "",
    id_etud: ""
  });
  const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api("/prets", {
        method: "POST",
        body: {
          id_ouv: parseInt(f.id_ouv, 10),
          id_etud: parseInt(f.id_etud, 10)
        }
      });
      push("success", r.mode === "2pc" ? `Prêt inter-sites validé (2PC)` : "Prêt local enregistré");
      onDone();
      onClose();
    } catch (err) {
      push("error", err.message);
    } finally {
      setBusy(false);
    }
  };
  return /*#__PURE__*/React.createElement(Modal, {
    title: "Nouveau prêt",
    onClose: onClose
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "ID ouvrage (local à ce site)",
    type: "number",
    value: f.id_ouv,
    onChange: e => setF({
      ...f,
      id_ouv: e.target.value
    }),
    autoFocus: true,
    required: true
  }), /*#__PURE__*/React.createElement(Field, {
    label: "ID étudiant",
    type: "number",
    value: f.id_etud,
    onChange: e => setF({
      ...f,
      id_etud: e.target.value
    }),
    required: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 justify-end"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: onClose
  }, "Annuler"), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    disabled: busy
  }, busy ? "…" : "Créer le prêt"))));
}
function Prets() {
  const {
    push
  } = useApp();
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
      const [p, o, e] = await Promise.all([api("/prets?scope=global"), api("/ouvrages?scope=global"), api("/etudiants?scope=global")]);
      setPrets(p.prets);
      setIndispo([...(p.sites_indisponibles || []), ...(o.sites_indisponibles || [])]);
      const om = {};
      (o.ouvrages || []).forEach(x => om[x.id_ouv] = x.titre);
      setOuvMap(om);
      const em = {};
      (e.etudiants || []).forEach(x => em[x.id_etud] = x.nom);
      setEtuMap(em);
    } catch (err) {
      setPrets([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, []);
  const retour = async id => {
    try {
      const r = await api(`/prets/${id}/retour`, {
        method: "POST"
      });
      push("success", r.mode === "2pc" ? "Retour inter-sites validé (2PC)" : "Retour enregistré");
      load();
    } catch (err) {
      push("error", err.message);
    }
  };
  const rows = (prets || []).filter(p => filtre === "encours" ? !p.date_retour : true);
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4 animate-fadein"
  }, /*#__PURE__*/React.createElement(ScreenHead, {
    title: "Gestion des prêts",
    subtitle: "Suivi des emprunts et retours",
    icon: "🔄",
    action: /*#__PURE__*/React.createElement(Button, {
      onClick: () => setModal(true)
    }, "+ Nouveau prêt")
  }), /*#__PURE__*/React.createElement(Card, {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-flex bg-slate-100 rounded-xl p-1"
  }, [["encours", "En cours"], ["tous", "Tous"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setFiltre(k),
    className: cx("px-4 py-1.5 text-sm font-semibold rounded-lg cursor-pointer transition-all duration-150", filtre === k ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700")
  }, l)))), /*#__PURE__*/React.createElement(Card, {
    className: "p-4 sm:p-5"
  }, /*#__PURE__*/React.createElement(DegradedBanner, {
    sites: [...new Set(indispo)]
  }), loading ? /*#__PURE__*/React.createElement(TableSkeleton, {
    cols: 6
  }) : /*#__PURE__*/React.createElement(Table, {
    hideMobile: [3],
    head: ["#", "Ouvrage", "Étudiant", "Emprunté le", "Statut", ""],
    rows: rows.map(p => [/*#__PURE__*/React.createElement("span", {
      className: "font-mono text-slate-500"
    }, p.id_pret), /*#__PURE__*/React.createElement("span", {
      className: "font-semibold text-slate-900"
    }, ouvMap[p.id_ouv] || `#${p.id_ouv}`), /*#__PURE__*/React.createElement("span", {
      className: "text-slate-600"
    }, etuMap[p.id_etud] || `#${p.id_etud}`), /*#__PURE__*/React.createElement("span", {
      className: "text-slate-500 text-sm"
    }, fmtDate(p.date_emprunt)), p.date_retour ? /*#__PURE__*/React.createElement(Badge, {
      className: "bg-slate-100 text-slate-600 border-slate-200"
    }, "Rendu") : /*#__PURE__*/React.createElement(Badge, {
      className: "bg-emerald-100 text-emerald-700 border-emerald-200"
    }, "En cours"), p.date_retour ? null : /*#__PURE__*/React.createElement(Button, {
      variant: "soft",
      onClick: () => retour(p.id_pret)
    }, "Retour")]),
    empty: "Aucun prêt.",
    emptyIcon: "🔄"
  })), modal && /*#__PURE__*/React.createElement(PretModal, {
    onClose: () => setModal(false),
    onDone: load
  }));
}

/* ============================ ÉCRAN : AUTEURS =========================== */

function Auteurs() {
  const {
    push
  } = useApp();
  const [data, setData] = useState(null);
  const [nom, setNom] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api("/auteurs?scope=local");
      setData(r.auteurs);
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, []);
  const add = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api("/auteurs", {
        method: "POST",
        body: {
          nom_auteur: nom
        }
      });
      push("success", `Auteur répliqué sur les 3 sites (XA) — id ${r.id_aut}`);
      setNom("");
      load();
    } catch (err) {
      push("error", err.message);
    } finally {
      setBusy(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4 animate-fadein"
  }, /*#__PURE__*/React.createElement(ScreenHead, {
    title: "Référentiel auteurs",
    subtitle: "Table répliquée — ajout par transaction XA à 3 branches",
    icon: "✍️"
  }), /*#__PURE__*/React.createElement(Card, {
    className: "p-5"
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: add,
    className: "flex flex-col sm:flex-row gap-3 items-end"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1 w-full"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Nouvel auteur (réplication synchrone)",
    value: nom,
    onChange: e => setNom(e.target.value),
    placeholder: "ex. Boubacar Boris Diop",
    required: true
  })), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    disabled: busy
  }, busy ? "Réplication…" : "Ajouter (XA 3 branches)"))), /*#__PURE__*/React.createElement(Card, {
    className: "p-4 sm:p-5"
  }, loading ? /*#__PURE__*/React.createElement(TableSkeleton, {
    cols: 2
  }) : /*#__PURE__*/React.createElement(Table, {
    head: ["ID", "Nom de l'auteur"],
    rows: (data || []).map(a => [/*#__PURE__*/React.createElement("span", {
      className: "font-mono text-slate-500"
    }, a.id_aut), /*#__PURE__*/React.createElement("span", {
      className: "font-semibold text-slate-900"
    }, a.nom_auteur)]),
    empty: "Aucun auteur.",
    emptyIcon: "✍️"
  })));
}

/* ========================== ÉCRAN : ADMIN 2PC ========================== */

function AdminXA() {
  const {
    push
  } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api("/admin/xa"));
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, []);
  const resoudre = async txid => {
    try {
      const r = await api(`/admin/xa/${txid}/resoudre`, {
        method: "POST"
      });
      push("success", `${r.action} appliqué (${r.hotes_resolus.length} base(s))`);
      load();
    } catch (err) {
      push("error", err.message);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4 animate-fadein"
  }, /*#__PURE__*/React.createElement(ScreenHead, {
    title: "Console de validation répartie",
    subtitle: "Transactions douteuses (XA RECOVER) et résolution via le journal 2PC",
    icon: "⚙️",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "soft",
      onClick: load
    }, "↻ Rafraîchir")
  }), /*#__PURE__*/React.createElement(Card, {
    className: "p-4 sm:p-5"
  }, loading ? /*#__PURE__*/React.createElement(TableSkeleton, {
    cols: 5
  }) : data && data.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-10 bg-emerald-50/50 rounded-xl text-emerald-700 font-semibold animate-fadeup"
  }, "✓ Aucune transaction douteuse — cohérence ACID OK") : /*#__PURE__*/React.createElement(Table, {
    head: ["Transaction (txid)", "Hôte", "Site", "Décision journalisée", ""],
    rows: (data || []).map(t => [/*#__PURE__*/React.createElement("span", {
      className: "font-mono text-xs text-rose-700"
    }, t.txid), /*#__PURE__*/React.createElement("span", {
      className: "text-slate-600 text-sm"
    }, t.hote), /*#__PURE__*/React.createElement("span", {
      className: "text-slate-500 text-sm"
    }, t.site), /*#__PURE__*/React.createElement(Badge, {
      className: "bg-slate-200 text-slate-800 border-slate-300"
    }, t.decision), /*#__PURE__*/React.createElement(Button, {
      variant: "danger",
      onClick: () => resoudre(t.txid)
    }, "Forcer résolution")]),
    empty: "—"
  })));
}

/* ---------------------- Composants de mise en page ---------------------- */

function ScreenHead({
  title,
  subtitle,
  icon,
  action
}) {
  const {
    theme
  } = useApp();
  return /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-start justify-between gap-4 animate-fadeup"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center text-xl", theme.iconBg)
  }, icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-bold text-slate-900"
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500"
  }, subtitle))), action);
}

/* Petite flèche de tri cliquable pour un en-tête de colonne */
function SortTh({
  label,
  active,
  dir,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    className: "flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-slate-800 cursor-pointer group"
  }, label, /*#__PURE__*/React.createElement("span", {
    className: cx("text-[10px] transition-all", active ? "opacity-100 text-slate-700" : "opacity-0 group-hover:opacity-40")
  }, dir === "desc" ? "▼" : "▲"));
}
function Table({
  head,
  rows,
  empty,
  emptyIcon = "🗂️",
  hideMobile = []
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto -mx-1 px-1"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm text-left"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "text-xs text-slate-500 uppercase border-b border-slate-200 bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("tr", null, head.map((h, i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    className: cx("px-4 py-3 font-semibold whitespace-nowrap", hideMobile.includes(i) && "hidden sm:table-cell")
  }, h)))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, rows.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: head.length,
    className: "px-4 py-14 text-center text-slate-400"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-3xl mb-2"
  }, emptyIcon), empty)) : rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: "hover:bg-slate-50/70 transition-colors animate-fadein",
    style: {
      animationDelay: `${Math.min(i, 8) * 0.03}s`
    }
  }, r.map((c, j) => /*#__PURE__*/React.createElement("td", {
    key: j,
    className: cx("px-4 py-3 align-middle", hideMobile.includes(j) && "hidden sm:table-cell")
  }, c)))))));
}
const NAV = [{
  key: "dashboard",
  label: "Tableau de bord",
  icon: "📊",
  comp: Dashboard
}, {
  key: "catalogue",
  label: "Catalogue",
  icon: "📚",
  comp: Catalogue
}, {
  key: "etudiants",
  label: "Étudiants",
  icon: "🎓",
  comp: Etudiants
}, {
  key: "prets",
  label: "Prêts",
  icon: "🔄",
  comp: Prets
}, {
  key: "auteurs",
  label: "Auteurs",
  icon: "✍️",
  comp: Auteurs
}, {
  key: "admin",
  label: "Admin 2PC",
  icon: "⚙️",
  comp: AdminXA
}];
function initiales(nom) {
  return (nom || "?").trim().split(/\s+/).slice(0, 2).map(s => s[0]).join("").toUpperCase();
}
function Shell() {
  const {
    session,
    setSession,
    theme,
    site
  } = useApp();
  const [tab, setTab] = useState("dashboard");
  const [openNav, setOpenNav] = useState(false);
  const active = NAV.find(n => n.key === tab) || NAV[0];
  const Active = active.comp;
  const logout = () => {
    localStorage.removeItem("biblio_session");
    setSession(null);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-full flex bg-slate-100"
  }, /*#__PURE__*/React.createElement("aside", {
    className: cx("fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300", openNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-5 flex items-center gap-3 border-b border-slate-800/80"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg shadow-lg", theme.accentBar, theme.glow)
  }, "📚"), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-white font-bold leading-tight"
  }, "Biblio ", site), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400"
  }, "Réseau réparti")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpenNav(false),
    className: "lg:hidden w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-lg cursor-pointer transition-colors"
  }, "✕")), /*#__PURE__*/React.createElement("nav", {
    className: "flex-1 p-3 space-y-1"
  }, NAV.map(n => {
    const isActive = tab === n.key;
    return /*#__PURE__*/React.createElement("button", {
      key: n.key,
      onClick: () => {
        setTab(n.key);
        setOpenNav(false);
      },
      className: cx("relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer", isActive ? theme.navActive : "text-slate-300 hover:bg-slate-800 hover:text-white hover:pl-4")
    }, isActive && /*#__PURE__*/React.createElement("span", {
      className: "absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-white/80"
    }), /*#__PURE__*/React.createElement("span", null, n.icon), " ", n.label);
  })), /*#__PURE__*/React.createElement("div", {
    className: "p-3 border-t border-slate-800/80"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5 px-3 py-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white", theme.accentBar)
  }, initiales(session.nom)), /*#__PURE__*/React.createElement("div", {
    className: "min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-white font-semibold truncate"
  }, session.nom), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400 truncate"
  }, session.statut))), /*#__PURE__*/React.createElement("button", {
    onClick: logout,
    className: "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors"
  }, /*#__PURE__*/React.createElement("span", null, "🚪"), " Déconnexion"))), openNav && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-20 bg-black/40 lg:hidden animate-fadein",
    onClick: () => setOpenNav(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0 flex flex-col"
  }, /*#__PURE__*/React.createElement("header", {
    className: "bg-white/90 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpenNav(true),
    className: "lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 text-lg cursor-pointer transition-colors"
  }, "☰"), /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:flex items-center gap-2 text-slate-800 font-bold"
  }, /*#__PURE__*/React.createElement("span", null, active.icon), active.label), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-300 hidden sm:inline"
  }, "/"), /*#__PURE__*/React.createElement(SiteBadge, {
    site: site
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-600 hidden sm:inline"
  }, "Connecté"))), /*#__PURE__*/React.createElement("main", {
    key: tab,
    className: "flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto"
  }, /*#__PURE__*/React.createElement(Active, null))));
}

/* -------------------------------- App ----------------------------------- */

function App() {
  const [boot, setBoot] = useState({
    loading: true,
    site: null,
    stats: null
  });
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("biblio_session"));
    } catch (e) {
      return null;
    }
  });
  const [publicView, setPublicView] = useState("landing");
  const {
    toasts,
    push
  } = useToasts();
  useEffect(() => {
    api("/stats").then(s => setBoot({
      loading: false,
      site: s.site,
      stats: s
    })).catch(() => setBoot({
      loading: false,
      site: "UGB",
      stats: null
    }));
  }, []);
  if (boot.loading) return /*#__PURE__*/React.createElement("div", {
    className: "boot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ring"
  }));
  const site = boot.site || "UGB";
  const theme = THEMES[site] || THEMES.UGB;
  const ctx = {
    site,
    theme,
    session,
    setSession,
    push
  };
  let content;
  if (session) content = /*#__PURE__*/React.createElement(Shell, null);else if (publicView === "login") content = /*#__PURE__*/React.createElement(Login, {
    onBack: () => setPublicView("landing")
  });else content = /*#__PURE__*/React.createElement(Landing, {
    stats: boot.stats,
    onLogin: () => setPublicView("login")
  });
  return /*#__PURE__*/React.createElement(AppCtx.Provider, {
    value: ctx
  }, /*#__PURE__*/React.createElement("div", {
    className: "min-h-full bg-slate-100"
  }, content), /*#__PURE__*/React.createElement(ToastHost, {
    toasts: toasts
  }));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));