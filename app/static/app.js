/* ==========================================================================
   Bibliothèque Inter-Universitaire — Interface React (par site)
   React 18 + Babel (CDN, transpilation navigateur) + Tailwind.
   Une même codebase tourne sur les 3 sites : le thème et le nom du site sont
   déduits de GET /api/stats (champ "site").
   Direction visuelle : minimal clair (fond blanc, une couleur d'accent par
   site utilisée avec parcimonie), avec un système d'icônes cohérent (traits
   fins, pas d'emoji dans le chrome de l'interface) et une profondeur subtile
   (ombres légères, pas de dégradés).
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

/* Compteur animé (0 -> valeur) pour les stats */
function useCountUp(value, duration = 700) {
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

/* ------------------------------- Icônes ---------------------------------- */
/* Petit set d'icônes traits fins (style Feather/Lucide), auto-suffisant :
   pas de dépendance externe, `currentColor` hérite de la couleur du texte
   parent (ex. theme.iconBg = "bg-blue-50 text-blue-600"). */

const ICON_PATHS = {
  book: "M12 7c-1.7-1.3-4.2-2-7-2v13c2.8 0 5.3.7 7 2 1.7-1.3 4.2-2 7-2V5c-2.8 0-5.3.7-7 2Z|M12 7v13",
  dashboard: "M4 19h16|M7 19v-5|M12 19V9|M17 19v-8",
  cap: "M12 4 2 9l10 5 10-5-10-5Z|M6 11v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4",
  refresh: "M20 11A8 8 0 1 0 18.6 16|M20 5.5V11h-5.5",
  pen: "M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 16v4Z|M13.5 7.5l3 3",
  gear: "M12 2v3|M12 19v3|M4.2 4.2l2.1 2.1|M17.7 17.7l2.1 2.1|M2 12h3|M19 12h3|M4.2 19.8l2.1-2.1|M17.7 6.3l2.1-2.1|circle:12,12,3",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|M16 17l5-5-5-5|M21 12H9",
  menu: "M4 6h16|M4 12h16|M4 18h16",
  x: "M18 6 6 18|M6 6l12 12",
  search: "circle:11,11,7|M21 21l-4.3-4.3",
  alert: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z|M12 9v4|M12 17h.01",
  check: "M20 6 9 17l-5-5",
  link: "M9 17H7a5 5 0 0 1 0-10h2|M15 7h2a5 5 0 1 1 0 10h-2|M8 12h8",
  shield: "M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5l-8-3Z",
  info: "circle:12,12,9|M12 11v5|M12 8h.01"
};
function Icon({
  name,
  className = "w-4 h-4"
}) {
  const spec = ICON_PATHS[name];
  if (!spec) return null;
  const parts = spec.split("|");
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: cx("shrink-0", className)
  }, parts.map((p, i) => p.startsWith("circle:") ? (([cx_, cy_, r_]) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: cx_,
    cy: cy_,
    r: r_
  }))(p.slice(7).split(",")) : /*#__PURE__*/React.createElement("path", {
    key: i,
    d: p
  })));
}

/* Thèmes par université : une seule couleur d'accent, utilisée avec
   parcimonie (chaînes Tailwind complètes -> scannées dans le DOM). */
const THEMES = {
  UGB: {
    label: "Université Gaston Berger",
    ville: "Saint-Louis",
    solid: "bg-blue-600 hover:bg-blue-700",
    soft: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    ring: "focus:ring-blue-500 focus:border-blue-500",
    border: "border-blue-200",
    iconBg: "bg-blue-50 text-blue-600",
    chip: "bg-blue-600 text-white",
    tint: "bg-blue-50/60",
    activeNav: "bg-blue-600 text-white shadow-sm",
    activeBar: "bg-blue-600",
    dot: "bg-blue-500",
    hex: "#2563eb"
  },
  UCAD: {
    label: "Université Cheikh Anta Diop",
    ville: "Dakar",
    solid: "bg-emerald-600 hover:bg-emerald-700",
    soft: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    ring: "focus:ring-emerald-500 focus:border-emerald-500",
    border: "border-emerald-200",
    iconBg: "bg-emerald-50 text-emerald-600",
    chip: "bg-emerald-600 text-white",
    tint: "bg-emerald-50/60",
    activeNav: "bg-emerald-600 text-white shadow-sm",
    activeBar: "bg-emerald-600",
    dot: "bg-emerald-500",
    hex: "#059669"
  },
  UADB: {
    label: "Université Alioune Diop de Bambey",
    ville: "Bambey",
    solid: "bg-amber-600 hover:bg-amber-700",
    soft: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    ring: "focus:ring-amber-500 focus:border-amber-500",
    border: "border-amber-200",
    iconBg: "bg-amber-50 text-amber-600",
    chip: "bg-amber-600 text-white",
    tint: "bg-amber-50/60",
    activeNav: "bg-amber-600 text-white shadow-sm",
    activeBar: "bg-amber-600",
    dot: "bg-amber-500",
    hex: "#d97706"
  }
};
const SITE_BADGE = {
  UGB: "bg-blue-50 text-blue-700 border-blue-200",
  UCAD: "bg-emerald-50 text-emerald-700 border-emerald-200",
  UADB: "bg-amber-50 text-amber-700 border-amber-200"
};
const SITE_DOT = {
  UGB: "bg-blue-500",
  UCAD: "bg-emerald-500",
  UADB: "bg-amber-500"
};
const SITE_IMAGE = {
  UGB: "/img/ugb.jpg",
  UCAD: "/img/ucad.jpg",
  UADB: "/img/uadb.jpeg"
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
    success: "check",
    error: "x",
    info: "info",
    warn: "alert"
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed top-4 right-4 z-50 space-y-2 w-80 max-w-[90vw]"
  }, toasts.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    className: cx("animate-slidein relative overflow-hidden text-white text-sm font-medium pl-4 pr-4 py-3 rounded-lg shadow-lg flex items-start gap-2.5", styles[t.type] || styles.info)
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-5 h-5 shrink-0 rounded-full bg-white/20 flex items-center justify-center mt-0.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icons[t.type] || icons.info,
    className: "w-3 h-3"
  })), /*#__PURE__*/React.createElement("span", {
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
    className: "skeleton h-4 rounded",
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
  className: cx("bg-white rounded-lg border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-150", hover && "hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)] hover:border-slate-300 hover:-translate-y-px", className)
}, children);
function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  icon
}) {
  const {
    theme
  } = useApp();
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg text-sm px-3.5 py-2 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-1 active:scale-[0.98]";
  const styles = {
    primary: cx("text-white shadow-sm hover:shadow", theme.solid),
    soft: theme.soft,
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "text-white bg-rose-600 hover:bg-rose-700 shadow-sm hover:shadow"
  };
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    onClick: onClick,
    disabled: disabled,
    className: cx(base, styles[variant])
  }, icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    className: "w-4 h-4"
  }), children);
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
    className: "block text-sm font-medium text-slate-700 mb-1.5"
  }, label), /*#__PURE__*/React.createElement("input", {
    ...props,
    className: cx("w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 transition-shadow focus:ring-1 outline-none", theme.ring)
  }));
}
function Modal({
  title,
  children,
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/40 animate-fadein",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Card, {
    className: "w-full max-w-md p-6 animate-scalein shadow-xl"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-5"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-semibold text-slate-900 tracking-tight"
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    className: "w-4 h-4"
  }))), children)));
}
const Badge = ({
  children,
  className
}) => /*#__PURE__*/React.createElement("span", {
  className: cx("inline-block px-2 py-0.5 text-xs font-medium rounded border", className)
}, children);
const SiteBadge = ({
  site
}) => /*#__PURE__*/React.createElement(Badge, {
  className: cx("inline-flex items-center gap-1.5", SITE_BADGE[site] || "bg-slate-50 text-slate-600 border-slate-200")
}, /*#__PURE__*/React.createElement("span", {
  className: cx("w-1.5 h-1.5 rounded-full", SITE_DOT[site] || "bg-slate-400")
}), site);
function DegradedBanner({
  sites
}) {
  if (!sites || sites.length === 0) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium px-4 py-3 rounded-lg flex items-center gap-2.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alert",
    className: "w-4 h-4 shrink-0"
  }), /*#__PURE__*/React.createElement("span", null, "Mode dégradé — site(s) injoignable(s) : ", /*#__PURE__*/React.createElement("b", null, sites.join(", ")), ". Données partielles."));
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
    className: "w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden"
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
      y: 34
    },
    UCAD: {
      x: 26,
      y: 166
    },
    UADB: {
      x: 174,
      y: 166
    }
  };
  const colorHex = {
    UGB: "#2563eb",
    UCAD: "#059669",
    UADB: "#d97706"
  };
  const pairs = [["UGB", "UCAD"], ["UGB", "UADB"], ["UCAD", "UADB"]];
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 200 200",
    className: "w-full max-w-[200px] mx-auto"
  }, pairs.map(([a, b]) => /*#__PURE__*/React.createElement("line", {
    key: a + b,
    x1: pos[a].x,
    y1: pos[a].y,
    x2: pos[b].x,
    y2: pos[b].y,
    stroke: "#cbd5e1",
    strokeWidth: "1.5",
    strokeDasharray: "4 4"
  })), sites.map(s => /*#__PURE__*/React.createElement("g", {
    key: s,
    transform: `translate(${pos[s].x}, ${pos[s].y})`
  }, s === site && /*#__PURE__*/React.createElement("circle", {
    r: "20",
    fill: colorHex[s],
    opacity: "0.1"
  }, /*#__PURE__*/React.createElement("animate", {
    attributeName: "r",
    values: "16;24;16",
    dur: "2.4s",
    repeatCount: "indefinite"
  }), /*#__PURE__*/React.createElement("animate", {
    attributeName: "opacity",
    values: "0.16;0.04;0.16",
    dur: "2.4s",
    repeatCount: "indefinite"
  })), /*#__PURE__*/React.createElement("circle", {
    r: "13",
    fill: s === site ? colorHex[s] : "white",
    stroke: colorHex[s],
    strokeWidth: "1.75"
  }), /*#__PURE__*/React.createElement("text", {
    y: "4",
    textAnchor: "middle",
    fontSize: "9",
    fontWeight: "700",
    fill: s === site ? "white" : colorHex[s]
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
    className: "min-h-screen flex flex-col bg-white"
  }, /*#__PURE__*/React.createElement("header", {
    className: "border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-6xl mx-auto w-full px-6 py-4 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("w-8 h-8 rounded-lg flex items-center justify-center text-white", theme.activeBar)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "book",
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("div", {
    className: "font-semibold text-slate-900 tracking-tight"
  }, "Réseau Inter-Universitaire")), /*#__PURE__*/React.createElement("button", {
    onClick: onLogin,
    className: "text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
  }, "Espace employé →"))), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("border-b border-slate-100", theme.tint)
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-4xl mx-auto w-full px-6 pt-16 sm:pt-20 pb-16 text-center animate-fadeup"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6 border bg-white", theme.border)
  }, /*#__PURE__*/React.createElement("span", {
    className: cx("w-1.5 h-1.5 rounded-full", theme.dot)
  }), " Site ", site, " — ", theme.ville), /*#__PURE__*/React.createElement("h1", {
    className: "text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 mb-5"
  }, theme.label), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-500 max-w-xl mx-auto text-lg leading-relaxed"
  }, "Empruntez dans n'importe quelle bibliothèque du réseau", " ", /*#__PURE__*/React.createElement("span", {
    className: "text-slate-700 font-medium"
  }, "UGB · UCAD · UADB"), ". Catalogue réparti, transactions garanties par validation à deux phases (2PC)."), /*#__PURE__*/React.createElement("div", {
    className: "mt-8"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onLogin,
    className: cx("text-white font-medium px-5 py-2.5 rounded-lg transition-all duration-150 cursor-pointer shadow-sm hover:shadow active:scale-[0.98]", theme.solid)
  }, "Accéder à l'espace de gestion")))), /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto w-full px-6 -mt-8 relative z-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rounded-xl overflow-hidden border border-slate-200 shadow-md animate-fadeup",
    style: {
      animationDelay: ".05s"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: SITE_IMAGE[site],
    alt: `Campus ${theme.label}`,
    className: "w-full h-56 sm:h-72 object-cover"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto w-full px-6 py-16 grid grid-cols-1 sm:grid-cols-3 gap-4"
  }, [{
    l: "Ouvrages du réseau",
    v: stats?.total_ouvrages,
    i: "book"
  }, {
    l: "Étudiants inscrits",
    v: stats?.total_etudiants,
    i: "cap"
  }, {
    l: "Prêts en cours",
    v: stats?.total_prets_encours,
    i: "refresh"
  }].map((s, idx) => /*#__PURE__*/React.createElement(Card, {
    key: s.l,
    hover: true,
    className: "p-6 text-center animate-fadeup",
    style: {
      animationDelay: `${idx * 0.06}s`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3", theme.chip)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: s.i,
    className: "w-5 h-5"
  })), /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-semibold text-slate-900 tabular-nums tracking-tight"
  }, /*#__PURE__*/React.createElement(StatValue, {
    value: s.v
  })), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-500 mt-1"
  }, s.l)))), /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto w-full px-6 py-16 border-t border-slate-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid lg:grid-cols-[.8fr_1.2fr] gap-10 items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "order-2 lg:order-1"
  }, /*#__PURE__*/React.createElement(ReseauVisuel, null)), /*#__PURE__*/React.createElement("div", {
    className: "order-1 lg:order-2 text-center lg:text-left"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-semibold text-slate-900 tracking-tight mb-2"
  }, "Une bibliothèque, trois campus"), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-500 mb-8 max-w-lg mx-auto lg:mx-0"
  }, "Une infrastructure de données distribuée pensée pour la cohérence et la continuité de service."), /*#__PURE__*/React.createElement("div", {
    className: "grid sm:grid-cols-1 gap-5 text-left"
  }, [{
    t: "Catalogue réparti",
    d: "Recherchez dans les 3 bibliothèques via les vues globales FEDERATED, ou dans votre seul fonds local.",
    i: "search"
  }, {
    t: "Emprunts inter-sites",
    d: "Un étudiant d'une université emprunte ailleurs : le compteur global est mis à jour en 2PC.",
    i: "link"
  }, {
    t: "Cohérence garantie",
    d: "Chaque écriture répartie est atomique (XA PREPARE / COMMIT) avec reprise sur panne.",
    i: "shield"
  }].map(f => /*#__PURE__*/React.createElement("div", {
    key: f.t,
    className: "flex gap-3.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("w-9 h-9 shrink-0 rounded-lg flex items-center justify-center", theme.chip)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: f.i,
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "font-medium text-slate-900"
  }, f.t), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500 leading-relaxed"
  }, f.d))))))))), /*#__PURE__*/React.createElement("footer", {
    className: "border-t border-slate-200 py-6 text-center text-xs text-slate-400"
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
    className: "min-h-screen flex items-center justify-center bg-slate-50 p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-sm animate-fadeup"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center mb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("w-10 h-10 rounded-lg flex items-center justify-center text-white mx-auto mb-4 shadow-sm", theme.activeBar)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "book",
    className: "w-5 h-5"
  })), /*#__PURE__*/React.createElement("h1", {
    className: "text-lg font-semibold text-slate-900 tracking-tight"
  }, "Espace employé — ", site), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500 mt-1"
  }, theme.label)), /*#__PURE__*/React.createElement(Card, {
    className: "p-6"
  }, /*#__PURE__*/React.createElement("form", {
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
  }, busy ? "Connexion…" : "Se connecter"))), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 text-center"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    className: "text-sm text-slate-500 hover:text-slate-800 cursor-pointer"
  }, "← Retour à l'accueil")), /*#__PURE__*/React.createElement("p", {
    className: "mt-3 text-center text-xs text-slate-400"
  }, "Démo : mot de passe ", /*#__PURE__*/React.createElement("code", {
    className: "bg-slate-100 px-1 rounded"
  }, "biblio123"))));
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
    className: "p-5"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-slate-900 mb-4 text-sm tracking-tight"
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
      className: cx("w-2 h-2 rounded-full", down ? "bg-rose-500" : "bg-emerald-500")
    }), /*#__PURE__*/React.createElement("span", {
      className: "font-medium text-slate-800"
    }, s), moi && /*#__PURE__*/React.createElement(Badge, {
      className: "bg-slate-50 text-slate-500 border-slate-200"
    }, "ce site")), /*#__PURE__*/React.createElement("span", {
      className: cx("text-xs font-medium", down ? "text-rose-600" : "text-emerald-600")
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
    i: "book"
  }, {
    l: "Étudiants (réseau)",
    v: stats?.total_etudiants,
    i: "cap"
  }, {
    l: "Prêts en cours",
    v: stats?.total_prets_encours,
    i: "refresh"
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-semibold text-slate-900 tracking-tight"
  }, saluer(), ", ", session.nom, " 👋"), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-500 mt-1"
  }, session.statut, " — Bibliothèque ", session.bibliotheque)), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-4"
  }, cards.map(c => /*#__PURE__*/React.createElement(Card, {
    key: c.l,
    hover: true,
    className: "p-5 flex items-center gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("w-11 h-11 shrink-0 rounded-lg flex items-center justify-center", theme.chip)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: c.i,
    className: "w-5 h-5"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-semibold text-slate-900 tabular-nums tracking-tight"
  }, /*#__PURE__*/React.createElement(StatValue, {
    value: c.v
  })), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-500"
  }, c.l))))), /*#__PURE__*/React.createElement("div", {
    className: "grid md:grid-cols-[1fr_.7fr] gap-4 items-start"
  }, /*#__PURE__*/React.createElement(Card, {
    className: "p-5"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-slate-900 mb-2 text-sm tracking-tight"
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
    className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    className: cx("w-full bg-white border border-slate-300 rounded-lg pl-9 pr-9 py-2 text-sm outline-none transition-shadow focus:ring-1", theme.ring)
  }), value && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onChange(""),
    className: "absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    className: "w-3 h-3"
  })));
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
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement(ScreenHead, {
    title: "Catalogue réparti",
    subtitle: "Recherche dans le réseau ou en local, et emprunt",
    icon: "book"
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
    className: "bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer"
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
      className: "font-medium text-slate-900"
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
    emptyIcon: "book"
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
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement(ScreenHead, {
    title: "Gestion des étudiants",
    subtitle: "Inscriptions et compteur d'emprunts (H4)",
    icon: "cap",
    action: /*#__PURE__*/React.createElement(Button, {
      icon: "cap",
      onClick: () => setModal(true)
    }, "Inscrire")
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
    className: "bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer"
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
      className: "font-medium text-slate-900"
    }, e.nom), /*#__PURE__*/React.createElement(SiteBadge, {
      site: e.universite
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-slate-600"
    }, e.specialite || "—"), /*#__PURE__*/React.createElement(EmpruntsBar, {
      n: e.nbre_emprunts
    })]),
    empty: "Aucun étudiant.",
    emptyIcon: "cap"
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
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement(ScreenHead, {
    title: "Gestion des prêts",
    subtitle: "Suivi des emprunts et retours",
    icon: "refresh",
    action: /*#__PURE__*/React.createElement(Button, {
      icon: "refresh",
      onClick: () => setModal(true)
    }, "Nouveau prêt")
  }), /*#__PURE__*/React.createElement(Card, {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-flex bg-slate-100 rounded-lg p-1"
  }, [["encours", "En cours"], ["tous", "Tous"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setFiltre(k),
    className: cx("px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors", filtre === k ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")
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
      className: "font-medium text-slate-900"
    }, ouvMap[p.id_ouv] || `#${p.id_ouv}`), /*#__PURE__*/React.createElement("span", {
      className: "text-slate-600"
    }, etuMap[p.id_etud] || `#${p.id_etud}`), /*#__PURE__*/React.createElement("span", {
      className: "text-slate-500 text-sm"
    }, fmtDate(p.date_emprunt)), p.date_retour ? /*#__PURE__*/React.createElement(Badge, {
      className: "bg-slate-50 text-slate-600 border-slate-200"
    }, "Rendu") : /*#__PURE__*/React.createElement(Badge, {
      className: "bg-emerald-50 text-emerald-700 border-emerald-200"
    }, "En cours"), p.date_retour ? null : /*#__PURE__*/React.createElement(Button, {
      variant: "soft",
      onClick: () => retour(p.id_pret)
    }, "Retour")]),
    empty: "Aucun prêt.",
    emptyIcon: "refresh"
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
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement(ScreenHead, {
    title: "Référentiel auteurs",
    subtitle: "Table répliquée — ajout par transaction XA à 3 branches",
    icon: "pen"
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
    icon: "pen",
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
      className: "font-medium text-slate-900"
    }, a.nom_auteur)]),
    empty: "Aucun auteur.",
    emptyIcon: "pen"
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
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement(ScreenHead, {
    title: "Console de validation répartie",
    subtitle: "Transactions douteuses (XA RECOVER) et résolution via le journal 2PC",
    icon: "gear",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "soft",
      icon: "refresh",
      onClick: load
    }, "Rafraîchir")
  }), /*#__PURE__*/React.createElement(Card, {
    className: "p-4 sm:p-5"
  }, loading ? /*#__PURE__*/React.createElement(TableSkeleton, {
    cols: 5
  }) : data && data.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-center gap-2 py-10 text-emerald-700"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    className: "w-5 h-5"
  })), /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-sm"
  }, "Aucune transaction douteuse — cohérence ACID OK")) : /*#__PURE__*/React.createElement(Table, {
    head: ["Transaction (txid)", "Hôte", "Site", "Décision journalisée", ""],
    rows: (data || []).map(t => [/*#__PURE__*/React.createElement("span", {
      className: "font-mono text-xs text-rose-700"
    }, t.txid), /*#__PURE__*/React.createElement("span", {
      className: "text-slate-600 text-sm"
    }, t.hote), /*#__PURE__*/React.createElement("span", {
      className: "text-slate-500 text-sm"
    }, t.site), /*#__PURE__*/React.createElement(Badge, {
      className: "bg-slate-100 text-slate-700 border-slate-200"
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
    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("w-9 h-9 shrink-0 rounded-lg flex items-center justify-center", theme.chip)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    className: "w-5 h-5"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-semibold text-slate-900 tracking-tight"
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
    className: "flex items-center gap-1 font-medium uppercase tracking-wide hover:text-slate-800 cursor-pointer group"
  }, label, /*#__PURE__*/React.createElement("span", {
    className: cx("text-[10px] transition-all", active ? "opacity-100 text-slate-700" : "opacity-0 group-hover:opacity-40")
  }, dir === "desc" ? "▼" : "▲"));
}
function Table({
  head,
  rows,
  empty,
  emptyIcon = "search",
  hideMobile = []
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto -mx-1 px-1"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm text-left"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "text-xs text-slate-500 uppercase border-b border-slate-200 bg-slate-50"
  }, /*#__PURE__*/React.createElement("tr", null, head.map((h, i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    className: cx("px-4 py-2.5 font-medium whitespace-nowrap", hideMobile.includes(i) && "hidden sm:table-cell")
  }, h)))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, rows.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: head.length,
    className: "px-4 py-14 text-center text-slate-400"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-2.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: emptyIcon,
    className: "w-5 h-5 text-slate-300"
  })), empty)) : rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: "hover:bg-slate-50 transition-colors"
  }, r.map((c, j) => /*#__PURE__*/React.createElement("td", {
    key: j,
    className: cx("px-4 py-3 align-middle", hideMobile.includes(j) && "hidden sm:table-cell")
  }, c)))))));
}
const NAV = [{
  key: "dashboard",
  label: "Tableau de bord",
  icon: "dashboard",
  comp: Dashboard
}, {
  key: "catalogue",
  label: "Catalogue",
  icon: "book",
  comp: Catalogue
}, {
  key: "etudiants",
  label: "Étudiants",
  icon: "cap",
  comp: Etudiants
}, {
  key: "prets",
  label: "Prêts",
  icon: "refresh",
  comp: Prets
}, {
  key: "auteurs",
  label: "Auteurs",
  icon: "pen",
  comp: Auteurs
}, {
  key: "admin",
  label: "Admin 2PC",
  icon: "gear",
  comp: AdminXA
}];
function initiales(nom) {
  return (nom || "?").trim().split(/\s+/).slice(0, 2).map(s => s[0]).join("").toUpperCase();
}

/* Header qui gagne une ombre légère dès que le contenu défile en dessous
   (détail premium type Linear/Vercel/Notion). */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, {
      passive: true
    });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
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
  const scrolled = useScrolled();
  const logout = () => {
    localStorage.removeItem("biblio_session");
    setSession(null);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen flex bg-slate-50"
  }, /*#__PURE__*/React.createElement("aside", {
    className: cx("fixed inset-y-0 left-0 lg:sticky lg:top-0 lg:h-screen z-30 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200", openNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-14 shrink-0 px-4 flex items-center gap-2.5 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0", theme.activeBar)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "book",
    className: "w-3.5 h-3.5"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-slate-900 font-semibold text-sm leading-tight truncate tracking-tight"
  }, "Biblio ", site)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpenNav(false),
    className: "lg:hidden w-7 h-7 shrink-0 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 cursor-pointer"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    className: "w-4 h-4"
  }))), /*#__PURE__*/React.createElement("nav", {
    className: "flex-1 p-2.5 space-y-0.5 overflow-y-auto"
  }, NAV.map(n => {
    const isActive = tab === n.key;
    return /*#__PURE__*/React.createElement("button", {
      key: n.key,
      onClick: () => {
        setTab(n.key);
        setOpenNav(false);
      },
      className: cx("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer", isActive ? theme.activeNav : "text-slate-600 hover:bg-slate-100")
    }, /*#__PURE__*/React.createElement(Icon, {
      name: n.icon,
      className: "w-4 h-4"
    }), n.label);
  })), /*#__PURE__*/React.createElement("div", {
    className: "p-2.5 border-t border-slate-200 shrink-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5 px-2.5 py-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold text-white", theme.activeBar)
  }, initiales(session.nom)), /*#__PURE__*/React.createElement("div", {
    className: "min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-900 font-medium truncate"
  }, session.nom), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-500 truncate"
  }, session.statut))), /*#__PURE__*/React.createElement("button", {
    onClick: logout,
    className: "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "logout",
    className: "w-4 h-4"
  }), " Déconnexion"))), openNav && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-20 bg-slate-900/20 lg:hidden animate-fadein",
    onClick: () => setOpenNav(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0 flex flex-col"
  }, /*#__PURE__*/React.createElement("header", {
    className: cx("h-14 shrink-0 bg-white/90 backdrop-blur px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10 transition-shadow duration-200 border-b", scrolled ? "border-slate-200 shadow-[0_2px_8px_rgba(15,23,42,0.05)]" : "border-transparent")
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpenNav(true),
    className: "lg:hidden w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 cursor-pointer transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "menu",
    className: "w-5 h-5"
  })), /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:flex items-center gap-2 text-slate-800 font-semibold text-sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: active.icon,
    className: "w-4 h-4 text-slate-500"
  }), active.label), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-300 hidden sm:inline"
  }, "/"), /*#__PURE__*/React.createElement(SiteBadge, {
    site: site
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-1.5 h-1.5 rounded-full bg-emerald-500"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500 hidden sm:inline"
  }, "Connecté"))), /*#__PURE__*/React.createElement("main", {
    key: tab,
    className: "flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto animate-fadein"
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
    className: "min-h-screen bg-white"
  }, content), /*#__PURE__*/React.createElement(ToastHost, {
    toasts: toasts
  }));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));