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

/* Thèmes par université (chaînes Tailwind complètes -> scannées dans le DOM) */
const THEMES = {
  UGB: {
    label: "Université Gaston Berger", ville: "Saint-Louis",
    grad: "from-blue-600 via-blue-700 to-indigo-800",
    navActive: "bg-blue-600 text-white shadow",
    btn: "bg-blue-600 hover:bg-blue-700",
    btnSoft: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    ring: "focus:ring-blue-500", text: "text-blue-700",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    dot: "bg-blue-500", accentBar: "bg-blue-600",
  },
  UCAD: {
    label: "Université Cheikh Anta Diop", ville: "Dakar",
    grad: "from-emerald-600 via-emerald-700 to-teal-800",
    navActive: "bg-emerald-600 text-white shadow",
    btn: "bg-emerald-600 hover:bg-emerald-700",
    btnSoft: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    ring: "focus:ring-emerald-500", text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500", accentBar: "bg-emerald-600",
  },
  UADB: {
    label: "Université Alioune Diop de Bambey", ville: "Bambey",
    grad: "from-amber-500 via-amber-600 to-orange-700",
    navActive: "bg-amber-600 text-white shadow",
    btn: "bg-amber-600 hover:bg-amber-700",
    btnSoft: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    ring: "focus:ring-amber-500", text: "text-amber-700",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500", accentBar: "bg-amber-600",
  },
};
const SITE_BADGE = {
  UGB: "bg-blue-100 text-blue-800 border-blue-200",
  UCAD: "bg-emerald-100 text-emerald-800 border-emerald-200",
  UADB: "bg-amber-100 text-amber-800 border-amber-200",
};

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
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-80 max-w-[90vw]">
      {toasts.map((t) => (
        <div key={t.id} className={cx("text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg", styles[t.type] || styles.info)}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* --------------------------- UI primitives ------------------------------ */

const Spinner = ({ label }) => (
  <div className="flex items-center justify-center gap-3 py-12 text-slate-400">
    <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
    {label && <span className="text-sm">{label}</span>}
  </div>
);

const Card = ({ children, className }) => (
  <div className={cx("bg-white rounded-2xl shadow-sm border border-slate-200/70", className)}>{children}</div>
);

function Button({ children, onClick, variant = "primary", type = "button", disabled }) {
  const { theme } = useApp();
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl text-sm px-4 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer";
  const styles = {
    primary: cx("text-white", theme.btn),
    soft: theme.btnSoft,
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "text-white bg-rose-600 hover:bg-rose-700",
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={cx(base, styles[variant])}>{children}</button>;
}

function Field({ label, ...props }) {
  const { theme } = useApp();
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</span>
      <input {...props} className={cx("w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:border-transparent outline-none", theme.ring)} />
    </label>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-md p-6" >
        <div onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none cursor-pointer">×</button>
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

const SiteBadge = ({ site }) => <Badge className={SITE_BADGE[site] || "bg-slate-100 text-slate-700 border-slate-200"}>{site}</Badge>;

function DegradedBanner({ sites }) {
  if (!sites || sites.length === 0) return null;
  return (
    <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2">
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
        <div className={cx("h-full rounded-full", color)} style={{ width: pct + "%" }} />
      </div>
      <span className="text-xs font-mono text-slate-500">{n}/5</span>
    </div>
  );
}

/* =========================== ÉCRAN : LANDING ============================= */

function Landing({ stats, onLogin }) {
  const { theme, site } = useApp();
  return (
    <div className="min-h-full flex flex-col">
      <div className={cx("bg-gradient-to-br text-white", theme.grad)}>
        <header className="max-w-6xl mx-auto w-full px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-xl">📚</div>
            <div>
              <div className="font-bold leading-tight">Réseau Inter-Universitaire</div>
              <div className="text-xs text-white/70">Système Réparti de Bibliothèques</div>
            </div>
          </div>
          <button onClick={onLogin} className="bg-white/15 hover:bg-white/25 backdrop-blur text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer">
            Espace employé →
          </button>
        </header>

        <div className="max-w-6xl mx-auto w-full px-6 pt-10 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Site {site} — {theme.ville}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">{theme.label}</h1>
          <p className="text-white/80 max-w-2xl mx-auto text-lg">
            Empruntez dans n'importe quelle bibliothèque du réseau <b>UGB · UCAD · UADB</b>.
            Catalogue réparti, transactions garanties par validation à deux phases (2PC).
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button onClick={onLogin} className="bg-white text-slate-900 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              Accéder à l'espace de gestion
            </button>
          </div>
        </div>
      </div>

      {/* Stats publiques */}
      <div className="max-w-6xl mx-auto w-full px-6 -mt-12 grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { l: "Ouvrages du réseau", v: stats?.total_ouvrages, i: "📖" },
          { l: "Étudiants inscrits", v: stats?.total_etudiants, i: "🎓" },
          { l: "Prêts en cours", v: stats?.total_prets_encours, i: "🔄" },
        ].map((s) => (
          <Card key={s.l} className="p-6 text-center">
            <div className="text-3xl mb-2">{s.i}</div>
            <div className="text-4xl font-black text-slate-900">{s.v ?? "—"}</div>
            <div className="text-sm text-slate-500 mt-1">{s.l}</div>
          </Card>
        ))}
      </div>

      <div className="max-w-6xl mx-auto w-full px-6 py-16">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { t: "Catalogue réparti", d: "Recherchez dans les 3 bibliothèques via les vues globales FEDERATED, ou dans votre seul fonds local.", i: "🔍" },
            { t: "Emprunts inter-sites", d: "Un étudiant d'une université emprunte ailleurs : le compteur global est mis à jour en 2PC.", i: "🤝" },
            { t: "Cohérence garantie", d: "Chaque écriture répartie est atomique (XA PREPARE / COMMIT) avec reprise sur panne.", i: "🛡️" },
          ].map((f) => (
            <div key={f.t}>
              <div className="text-2xl mb-3">{f.i}</div>
              <h3 className="font-bold text-slate-900 mb-1.5">{f.t}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.d}</p>
            </div>
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
    <div className={cx("min-h-full flex items-center justify-center bg-gradient-to-br p-4", theme.grad)}>
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl mx-auto mb-4">📚</div>
          <h1 className="text-xl font-bold text-slate-900">Espace employé — {site}</h1>
          <p className="text-sm text-slate-500 mt-1">{theme.label}</p>
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
      </Card>
    </div>
  );
}

/* ========================= ÉCRAN : TABLEAU DE BORD ====================== */

function Dashboard() {
  const { session, theme } = useApp();
  const [stats, setStats] = useState(null);

  useEffect(() => { api("/stats").then(setStats).catch(() => {}); }, []);

  const cards = [
    { l: "Ouvrages (réseau)", v: stats?.total_ouvrages, i: "📖" },
    { l: "Étudiants (réseau)", v: stats?.total_etudiants, i: "🎓" },
    { l: "Prêts en cours", v: stats?.total_prets_encours, i: "🔄" },
  ];

  return (
    <div className="space-y-6">
      <div className={cx("rounded-2xl p-6 text-white bg-gradient-to-br", theme.grad)}>
        <h2 className="text-2xl font-black">Bonjour, {session.nom} 👋</h2>
        <p className="text-white/80 mt-1">{session.statut} — Bibliothèque {session.bibliotheque}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {cards.map((c) => (
          <Card key={c.l} className="p-6 flex items-center gap-4">
            <div className="text-3xl">{c.i}</div>
            <div>
              <div className="text-3xl font-black text-slate-900">{c.v ?? "—"}</div>
              <div className="text-sm text-slate-500">{c.l}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="font-bold text-slate-900 mb-2">À propos de ce site</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          Cette application pilote la base MySQL locale de <b>{session.bibliotheque}</b> et interroge
          les deux autres bibliothèques via les tables <b>FEDERATED</b>. Les emprunts d'étudiants d'autres
          universités déclenchent le <b>coordinateur 2PC</b> (validation à deux phases).
        </p>
      </Card>
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

function Catalogue() {
  const [scope, setScope] = useState("global");
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [indispo, setIndispo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emprunt, setEmprunt] = useState(null);
  const { theme } = useApp();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api(`/ouvrages?scope=${scope}&q=${encodeURIComponent(q)}`);
      setData(r.ouvrages); setIndispo(r.sites_indisponibles || []);
    } catch (e) { setData([]); } finally { setLoading(false); }
  }, [scope, q]);
  useEffect(() => { load(); }, [scope]);

  return (
    <div className="space-y-4">
      <ScreenHead title="Catalogue réparti" subtitle="Recherche dans le réseau ou en local, et emprunt" icon="📚" />
      <Card className="p-4">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un titre…"
            className={cx("bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:border-transparent", theme.ring)} />
          <select value={scope} onChange={(e) => setScope(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none">
            <option value="global">Tout le réseau</option>
            <option value="local">Ce site uniquement</option>
          </select>
          <Button type="submit">Rechercher</Button>
        </form>
      </Card>

      <Card className="p-4 sm:p-5">
        <DegradedBanner sites={indispo} />
        {loading ? <Spinner label="Chargement du catalogue…" /> : (
          <Table
            head={["Titre", "Auteur", "Site", "Stock", ""]}
            rows={(data || []).map((o) => [
              <span className="font-semibold text-slate-900">{o.titre}</span>,
              <span className="text-slate-600">{o.nom_auteur}</span>,
              <SiteBadge site={o.site} />,
              <span className="font-mono">{o.stock}</span>,
              <Button variant="soft" disabled={o.stock <= 0} onClick={() => setEmprunt(o)}>Emprunter</Button>,
            ])}
            empty="Aucun ouvrage."
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api(`/etudiants?scope=${scope}`);
      setData(r.etudiants); setIndispo(r.sites_indisponibles || []);
    } catch (e) { setData([]); } finally { setLoading(false); }
  }, [scope]);
  useEffect(() => { load(); }, [scope]);

  const rows = (data || []).filter((e) => e.nom.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <ScreenHead title="Gestion des étudiants" subtitle="Inscriptions et compteur d'emprunts (H4)" icon="🎓"
        action={<Button onClick={() => setModal(true)}>+ Inscrire</Button>} />
      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer par nom…"
          className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none" />
        <select value={scope} onChange={(e) => setScope(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none">
          <option value="global">Tout le réseau</option>
          <option value="local">Ce site uniquement</option>
        </select>
      </Card>
      <Card className="p-4 sm:p-5">
        <DegradedBanner sites={indispo} />
        {loading ? <Spinner /> : (
          <Table
            head={["ID", "Nom", "Université", "Spécialité", "Emprunts"]}
            rows={rows.map((e) => [
              <span className="font-mono text-slate-500">{e.id_etud}</span>,
              <span className="font-semibold text-slate-900">{e.nom}</span>,
              <SiteBadge site={e.universite} />,
              <span className="text-slate-600">{e.specialite || "—"}</span>,
              <EmpruntsBar n={e.nbre_emprunts} />,
            ])}
            empty="Aucun étudiant."
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
    <div className="space-y-4">
      <ScreenHead title="Gestion des prêts" subtitle="Suivi des emprunts et retours" icon="🔄"
        action={<Button onClick={() => setModal(true)}>+ Nouveau prêt</Button>} />
      <Card className="p-4">
        <div className="inline-flex bg-slate-100 rounded-xl p-1">
          {[["encours", "En cours"], ["tous", "Tous"]].map(([k, l]) => (
            <button key={k} onClick={() => setFiltre(k)}
              className={cx("px-4 py-1.5 text-sm font-semibold rounded-lg cursor-pointer", filtre === k ? "bg-white shadow text-slate-900" : "text-slate-500")}>{l}</button>
          ))}
        </div>
      </Card>
      <Card className="p-4 sm:p-5">
        <DegradedBanner sites={[...new Set(indispo)]} />
        {loading ? <Spinner /> : (
          <Table
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
            empty="Aucun prêt."
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
    <div className="space-y-4">
      <ScreenHead title="Référentiel auteurs" subtitle="Table répliquée — ajout par transaction XA à 3 branches" icon="✍️" />
      <Card className="p-5">
        <form onSubmit={add} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full"><Field label="Nouvel auteur (réplication synchrone)" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex. Boubacar Boris Diop" required /></div>
          <Button type="submit" disabled={busy}>{busy ? "Réplication…" : "Ajouter (XA 3 branches)"}</Button>
        </form>
      </Card>
      <Card className="p-4 sm:p-5">
        {loading ? <Spinner /> : (
          <Table head={["ID", "Nom de l'auteur"]}
            rows={(data || []).map((a) => [
              <span className="font-mono text-slate-500">{a.id_aut}</span>,
              <span className="font-semibold text-slate-900">{a.nom_auteur}</span>,
            ])} empty="Aucun auteur." />
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
    <div className="space-y-4">
      <ScreenHead title="Console de validation répartie" subtitle="Transactions douteuses (XA RECOVER) et résolution via le journal 2PC" icon="⚙️"
        action={<Button variant="soft" onClick={load}>↻ Rafraîchir</Button>} />
      <Card className="p-4 sm:p-5">
        {loading ? <Spinner /> : (data && data.length === 0) ? (
          <div className="text-center py-10 bg-emerald-50/50 rounded-xl text-emerald-700 font-semibold">
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
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function Table({ head, rows, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase border-b border-slate-200">
          <tr>{head.map((h, i) => <th key={i} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr><td colSpan={head.length} className="px-4 py-8 text-center text-slate-400">{empty}</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-50/70">
              {r.map((c, j) => <td key={j} className="px-4 py-3 align-middle">{c}</td>)}
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

function Shell() {
  const { session, setSession, theme, site } = useApp();
  const [tab, setTab] = useState("dashboard");
  const [openNav, setOpenNav] = useState(false);
  const Active = (NAV.find((n) => n.key === tab) || NAV[0]).comp;

  const logout = () => { localStorage.removeItem("biblio_session"); setSession(null); };

  return (
    <div className="min-h-full flex bg-slate-100">
      {/* Sidebar */}
      <aside className={cx(
        "fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform",
        openNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="p-5 flex items-center gap-3 border-b border-slate-800">
          <div className={cx("w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg", theme.accentBar)}>📚</div>
          <div>
            <div className="text-white font-bold leading-tight">Biblio {site}</div>
            <div className="text-xs text-slate-400">Réseau réparti</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => (
            <button key={n.key} onClick={() => { setTab(n.key); setOpenNav(false); }}
              className={cx("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                tab === n.key ? theme.navActive : "text-slate-300 hover:bg-slate-800 hover:text-white")}>
              <span>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <div className="px-3 py-2 text-xs text-slate-400">{session.nom} · {session.statut}</div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer">
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      {openNav && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setOpenNav(false)} />}

      {/* Contenu */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpenNav(true)} className="lg:hidden text-slate-500 text-xl cursor-pointer">☰</button>
            <SiteBadge site={site} />
            <span className="text-sm text-slate-500 hidden sm:inline">{theme.label}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Connecté</span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto"><Active /></main>
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
