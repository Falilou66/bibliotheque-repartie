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

/* Thèmes par université (chaînes Tailwind complètes -> scannées dans le DOM) */
const THEMES = {
  UGB: {
    label: "Université Gaston Berger",
    ville: "Saint-Louis",
    grad: "from-blue-600 via-blue-700 to-indigo-800",
    navActive: "bg-blue-600 text-white shadow",
    btn: "bg-blue-600 hover:bg-blue-700",
    btnSoft: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    ring: "focus:ring-blue-500",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
    accentBar: "bg-blue-600"
  },
  UCAD: {
    label: "Université Cheikh Anta Diop",
    ville: "Dakar",
    grad: "from-emerald-600 via-emerald-700 to-teal-800",
    navActive: "bg-emerald-600 text-white shadow",
    btn: "bg-emerald-600 hover:bg-emerald-700",
    btnSoft: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    ring: "focus:ring-emerald-500",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
    accentBar: "bg-emerald-600"
  },
  UADB: {
    label: "Université Alioune Diop de Bambey",
    ville: "Bambey",
    grad: "from-amber-500 via-amber-600 to-orange-700",
    navActive: "bg-amber-600 text-white shadow",
    btn: "bg-amber-600 hover:bg-amber-700",
    btnSoft: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    ring: "focus:ring-amber-500",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    accentBar: "bg-amber-600"
  }
};
const SITE_BADGE = {
  UGB: "bg-blue-100 text-blue-800 border-blue-200",
  UCAD: "bg-emerald-100 text-emerald-800 border-emerald-200",
  UADB: "bg-amber-100 text-amber-800 border-amber-200"
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
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed top-4 right-4 z-50 space-y-2 w-80 max-w-[90vw]"
  }, toasts.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    className: cx("text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg", styles[t.type] || styles.info)
  }, t.message)));
}

/* --------------------------- UI primitives ------------------------------ */

const Spinner = ({
  label
}) => /*#__PURE__*/React.createElement("div", {
  className: "flex items-center justify-center gap-3 py-12 text-slate-400"
}, /*#__PURE__*/React.createElement("div", {
  className: "w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"
}), label && /*#__PURE__*/React.createElement("span", {
  className: "text-sm"
}, label));
const Card = ({
  children,
  className
}) => /*#__PURE__*/React.createElement("div", {
  className: cx("bg-white rounded-2xl shadow-sm border border-slate-200/70", className)
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
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl text-sm px-4 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer";
  const styles = {
    primary: cx("text-white", theme.btn),
    soft: theme.btnSoft,
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "text-white bg-rose-600 hover:bg-rose-700"
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
    className: cx("w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:border-transparent outline-none", theme.ring)
  }));
}
function Modal({
  title,
  children,
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Card, {
    className: "w-full max-w-md p-6"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-5"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-bold text-slate-900"
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "text-slate-400 hover:text-slate-700 text-xl leading-none cursor-pointer"
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
  className: SITE_BADGE[site] || "bg-slate-100 text-slate-700 border-slate-200"
}, site);
function DegradedBanner({
  sites
}) {
  if (!sites || sites.length === 0) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2"
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
    className: cx("h-full rounded-full", color),
    style: {
      width: pct + "%"
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-mono text-slate-500"
  }, n, "/5"));
}

/* =========================== ÉCRAN : LANDING ============================= */

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
    className: cx("bg-gradient-to-br text-white", theme.grad)
  }, /*#__PURE__*/React.createElement("header", {
    className: "max-w-6xl mx-auto w-full px-6 py-5 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-xl"
  }, "📚"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-bold leading-tight"
  }, "Réseau Inter-Universitaire"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-white/70"
  }, "Système Réparti de Bibliothèques"))), /*#__PURE__*/React.createElement("button", {
    onClick: onLogin,
    className: "bg-white/15 hover:bg-white/25 backdrop-blur text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer"
  }, "Espace employé →")), /*#__PURE__*/React.createElement("div", {
    className: "max-w-6xl mx-auto w-full px-6 pt-10 pb-20 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold mb-6"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-white animate-pulse"
  }), " Site ", site, " — ", theme.ville), /*#__PURE__*/React.createElement("h1", {
    className: "text-4xl sm:text-5xl font-black tracking-tight mb-4"
  }, theme.label), /*#__PURE__*/React.createElement("p", {
    className: "text-white/80 max-w-2xl mx-auto text-lg"
  }, "Empruntez dans n'importe quelle bibliothèque du réseau ", /*#__PURE__*/React.createElement("b", null, "UGB · UCAD · UADB"), ". Catalogue réparti, transactions garanties par validation à deux phases (2PC)."), /*#__PURE__*/React.createElement("div", {
    className: "mt-8 flex items-center justify-center gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onLogin,
    className: "bg-white text-slate-900 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
  }, "Accéder à l'espace de gestion")))), /*#__PURE__*/React.createElement("div", {
    className: "max-w-6xl mx-auto w-full px-6 -mt-12 grid grid-cols-1 sm:grid-cols-3 gap-5"
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
  }].map(s => /*#__PURE__*/React.createElement(Card, {
    key: s.l,
    className: "p-6 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-3xl mb-2"
  }, s.i), /*#__PURE__*/React.createElement("div", {
    className: "text-4xl font-black text-slate-900"
  }, s.v ?? "—"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-500 mt-1"
  }, s.l)))), /*#__PURE__*/React.createElement("div", {
    className: "max-w-6xl mx-auto w-full px-6 py-16"
  }, /*#__PURE__*/React.createElement("div", {
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
  }].map(f => /*#__PURE__*/React.createElement("div", {
    key: f.t
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl mb-3"
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
    className: cx("min-h-full flex items-center justify-center bg-gradient-to-br p-4", theme.grad)
  }, /*#__PURE__*/React.createElement(Card, {
    className: "w-full max-w-md p-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center mb-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl mx-auto mb-4"
  }, "📚"), /*#__PURE__*/React.createElement("h1", {
    className: "text-xl font-bold text-slate-900"
  }, "Espace employé — ", site), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500 mt-1"
  }, theme.label)), /*#__PURE__*/React.createElement("form", {
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
  }, "biblio123"))));
}

/* ========================= ÉCRAN : TABLEAU DE BORD ====================== */

function Dashboard() {
  const {
    session,
    theme
  } = useApp();
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api("/stats").then(setStats).catch(() => {});
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
    className: cx("rounded-2xl p-6 text-white bg-gradient-to-br", theme.grad)
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-black"
  }, "Bonjour, ", session.nom, " 👋"), /*#__PURE__*/React.createElement("p", {
    className: "text-white/80 mt-1"
  }, session.statut, " — Bibliothèque ", session.bibliotheque)), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-5"
  }, cards.map(c => /*#__PURE__*/React.createElement(Card, {
    key: c.l,
    className: "p-6 flex items-center gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-3xl"
  }, c.i), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-black text-slate-900"
  }, c.v ?? "—"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-500"
  }, c.l))))), /*#__PURE__*/React.createElement(Card, {
    className: "p-6"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-slate-900 mb-2"
  }, "À propos de ce site"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-600 leading-relaxed"
  }, "Cette application pilote la base MySQL locale de ", /*#__PURE__*/React.createElement("b", null, session.bibliotheque), " et interroge les deux autres bibliothèques via les tables ", /*#__PURE__*/React.createElement("b", null, "FEDERATED"), ". Les emprunts d'étudiants d'autres universités déclenchent le ", /*#__PURE__*/React.createElement("b", null, "coordinateur 2PC"), " (validation à deux phases).")));
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
function Catalogue() {
  const [scope, setScope] = useState("global");
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [indispo, setIndispo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emprunt, setEmprunt] = useState(null);
  const {
    theme
  } = useApp();
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api(`/ouvrages?scope=${scope}&q=${encodeURIComponent(q)}`);
      setData(r.ouvrages);
      setIndispo(r.sites_indisponibles || []);
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [scope, q]);
  useEffect(() => {
    load();
  }, [scope]);
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement(ScreenHead, {
    title: "Catalogue réparti",
    subtitle: "Recherche dans le réseau ou en local, et emprunt",
    icon: "📚"
  }), /*#__PURE__*/React.createElement(Card, {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      load();
    },
    className: "grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3"
  }, /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Rechercher un titre…",
    className: cx("bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:border-transparent", theme.ring)
  }), /*#__PURE__*/React.createElement("select", {
    value: scope,
    onChange: e => setScope(e.target.value),
    className: "bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none"
  }, /*#__PURE__*/React.createElement("option", {
    value: "global"
  }, "Tout le réseau"), /*#__PURE__*/React.createElement("option", {
    value: "local"
  }, "Ce site uniquement")), /*#__PURE__*/React.createElement(Button, {
    type: "submit"
  }, "Rechercher"))), /*#__PURE__*/React.createElement(Card, {
    className: "p-4 sm:p-5"
  }, /*#__PURE__*/React.createElement(DegradedBanner, {
    sites: indispo
  }), loading ? /*#__PURE__*/React.createElement(Spinner, {
    label: "Chargement du catalogue…"
  }) : /*#__PURE__*/React.createElement(Table, {
    head: ["Titre", "Auteur", "Site", "Stock", ""],
    rows: (data || []).map(o => [/*#__PURE__*/React.createElement("span", {
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
    empty: "Aucun ouvrage."
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
  const rows = (data || []).filter(e => e.nom.toLowerCase().includes(q.toLowerCase()));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement(ScreenHead, {
    title: "Gestion des étudiants",
    subtitle: "Inscriptions et compteur d'emprunts (H4)",
    icon: "🎓",
    action: /*#__PURE__*/React.createElement(Button, {
      onClick: () => setModal(true)
    }, "+ Inscrire")
  }), /*#__PURE__*/React.createElement(Card, {
    className: "p-4 flex flex-col sm:flex-row gap-3"
  }, /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Filtrer par nom…",
    className: "flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none"
  }), /*#__PURE__*/React.createElement("select", {
    value: scope,
    onChange: e => setScope(e.target.value),
    className: "bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none"
  }, /*#__PURE__*/React.createElement("option", {
    value: "global"
  }, "Tout le réseau"), /*#__PURE__*/React.createElement("option", {
    value: "local"
  }, "Ce site uniquement"))), /*#__PURE__*/React.createElement(Card, {
    className: "p-4 sm:p-5"
  }, /*#__PURE__*/React.createElement(DegradedBanner, {
    sites: indispo
  }), loading ? /*#__PURE__*/React.createElement(Spinner, null) : /*#__PURE__*/React.createElement(Table, {
    head: ["ID", "Nom", "Université", "Spécialité", "Emprunts"],
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
    empty: "Aucun étudiant."
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
    className: cx("px-4 py-1.5 text-sm font-semibold rounded-lg cursor-pointer", filtre === k ? "bg-white shadow text-slate-900" : "text-slate-500")
  }, l)))), /*#__PURE__*/React.createElement(Card, {
    className: "p-4 sm:p-5"
  }, /*#__PURE__*/React.createElement(DegradedBanner, {
    sites: [...new Set(indispo)]
  }), loading ? /*#__PURE__*/React.createElement(Spinner, null) : /*#__PURE__*/React.createElement(Table, {
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
    empty: "Aucun prêt."
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
  }, loading ? /*#__PURE__*/React.createElement(Spinner, null) : /*#__PURE__*/React.createElement(Table, {
    head: ["ID", "Nom de l'auteur"],
    rows: (data || []).map(a => [/*#__PURE__*/React.createElement("span", {
      className: "font-mono text-slate-500"
    }, a.id_aut), /*#__PURE__*/React.createElement("span", {
      className: "font-semibold text-slate-900"
    }, a.nom_auteur)]),
    empty: "Aucun auteur."
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
    icon: "⚙️",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "soft",
      onClick: load
    }, "↻ Rafraîchir")
  }), /*#__PURE__*/React.createElement(Card, {
    className: "p-4 sm:p-5"
  }, loading ? /*#__PURE__*/React.createElement(Spinner, null) : data && data.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-10 bg-emerald-50/50 rounded-xl text-emerald-700 font-semibold"
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
  return /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl"
  }, icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-bold text-slate-900"
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500"
  }, subtitle))), action);
}
function Table({
  head,
  rows,
  empty
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm text-left"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "text-xs text-slate-500 uppercase border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("tr", null, head.map((h, i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    className: "px-4 py-3 font-semibold"
  }, h)))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, rows.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: head.length,
    className: "px-4 py-8 text-center text-slate-400"
  }, empty)) : rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: "hover:bg-slate-50/70"
  }, r.map((c, j) => /*#__PURE__*/React.createElement("td", {
    key: j,
    className: "px-4 py-3 align-middle"
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
function Shell() {
  const {
    session,
    setSession,
    theme,
    site
  } = useApp();
  const [tab, setTab] = useState("dashboard");
  const [openNav, setOpenNav] = useState(false);
  const Active = (NAV.find(n => n.key === tab) || NAV[0]).comp;
  const logout = () => {
    localStorage.removeItem("biblio_session");
    setSession(null);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-full flex bg-slate-100"
  }, /*#__PURE__*/React.createElement("aside", {
    className: cx("fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform", openNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-5 flex items-center gap-3 border-b border-slate-800"
  }, /*#__PURE__*/React.createElement("div", {
    className: cx("w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg", theme.accentBar)
  }, "📚"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-white font-bold leading-tight"
  }, "Biblio ", site), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400"
  }, "Réseau réparti"))), /*#__PURE__*/React.createElement("nav", {
    className: "flex-1 p-3 space-y-1"
  }, NAV.map(n => /*#__PURE__*/React.createElement("button", {
    key: n.key,
    onClick: () => {
      setTab(n.key);
      setOpenNav(false);
    },
    className: cx("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer", tab === n.key ? theme.navActive : "text-slate-300 hover:bg-slate-800 hover:text-white")
  }, /*#__PURE__*/React.createElement("span", null, n.icon), " ", n.label))), /*#__PURE__*/React.createElement("div", {
    className: "p-3 border-t border-slate-800"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-3 py-2 text-xs text-slate-400"
  }, session.nom, " · ", session.statut), /*#__PURE__*/React.createElement("button", {
    onClick: logout,
    className: "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
  }, /*#__PURE__*/React.createElement("span", null, "🚪"), " Déconnexion"))), openNav && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-20 bg-black/40 lg:hidden",
    onClick: () => setOpenNav(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0 flex flex-col"
  }, /*#__PURE__*/React.createElement("header", {
    className: "bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpenNav(true),
    className: "lg:hidden text-slate-500 text-xl cursor-pointer"
  }, "☰"), /*#__PURE__*/React.createElement(SiteBadge, {
    site: site
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-slate-500 hidden sm:inline"
  }, theme.label)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-emerald-500"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-600"
  }, "Connecté"))), /*#__PURE__*/React.createElement("main", {
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