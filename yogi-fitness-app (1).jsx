import { useState, useRef, useEffect } from "react";

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────
const Storage = {
  async get(key) {
    try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; }
    catch { return null; }
  },
  async set(key, value) {
    try { await window.storage.set(key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  async delete(key) {
    try { await window.storage.delete(key); return true; }
    catch { return false; }
  }
};

const MOCK_CLIENTS = [
  { id: "c1", name: "Sophie Martin", email: "sophie@email.com", plan: "Premium", avatar: "👩", joined: "Jan 2025", customPrompt: "Sophie a 38 ans, objectif perte de poids (-8kg). Genou droit opéré en 2023 (ménisque). Pas de saut, pas de squat profond. Végétarienne. Stress élevé au travail. Encourage-la souvent.", healthData: [{ type: "Bilan sanguin", date: "15/01/2025", summary: "Fer bas (ferritine 12), vitamine D insuffisante (18 ng/mL), glycémie normale." }], subscription: { status: "active", since: "Jan 2025", nextBill: "Mar 2025", amount: "29€/mois" } },
  { id: "c2", name: "Thomas Dubois", email: "thomas@email.com", plan: "Starter", avatar: "👨", joined: "Fév 2025", customPrompt: "Thomas a 25 ans, objectif prise de masse musculaire. Débutant en musculation. Disponible 4x/semaine, 1h par séance. A une barre et des haltères à la maison. Omnivore, budget alimentaire limité.", healthData: [], subscription: { status: "active", since: "Fév 2025", nextBill: "Mar 2025", amount: "9€/mois" } },
  { id: "c3", name: "Marie Leroy", email: "marie@email.com", plan: "Premium", avatar: "👩‍🦰", joined: "Déc 2024", customPrompt: "Marie a 52 ans, ménopause récente. Objectif: mobilité, bien-être, équilibre hormonal naturel. Intéressée par l'ayurvéda. Hernies discales L4-L5. Pas de port de charge > 5kg.", healthData: [{ type: "Bilan hormonal", date: "10/12/2024", summary: "FSH élevé (87 UI/L), estradiol bas (18 pg/mL). Ostéopénie légère densité osseuse -1.2 T-score." }, { type: "IRM lombaire", date: "05/01/2025", summary: "Hernies discales L4-L5 et L5-S1. Pas de compression radiculaire. Repos relatif conseillé." }], subscription: { status: "active", since: "Déc 2024", nextBill: "Mar 2025", amount: "29€/mois" } }
];

const PLANS = [
  { id: "starter", name: "Starter", price: "9€/mois", color: "#6c757d", features: ["Chat illimité", "Programmes fitness", "Recettes basiques"], icon: "🌱" },
  { id: "premium", name: "Premium", price: "29€/mois", color: "#FF6B35", features: ["Tout Starter +", "Analyse données santé", "Programmes personnalisés", "Recettes macros", "Ayurvéda avancé"], icon: "⭐", popular: true },
  { id: "pro", name: "Pro Coach", price: "79€/mois", color: "#6f42c1", features: ["Tout Premium +", "Suivi hebdomadaire", "Accès multi-clients", "Backoffice coach", "Export rapports PDF"], icon: "👑" }
];

const BASE_SYSTEM = `Tu es Yogi Fitness, un coach de santé holistique expert, bienveillant et motivant.

LANGUE : Détecte automatiquement la langue utilisée par le client et réponds TOUJOURS dans cette même langue. Si le client écrit en anglais réponds en anglais. En arabe en arabe. En espagnol en espagnol. En français en français. Adapte-toi naturellement si la langue change.

Tu es expert dans 3 domaines :
1. FITNESS : programmes sur mesure (contraintes mécaniques, logistiques, temporelles)
2. NUTRITION : recettes avec macros, adaptation aux objectifs
3. AYURVEDA : remèdes maison, doshas, plantes, équilibre énergétique

REGLE MEDICALE ABSOLUE : Pour toute question médicale, diagnostic, interprétation de résultats, symptômes, médicaments, renvoie TOUJOURS vers un médecin. Ne joue jamais au médecin.

STYLE : Chaleureux, précis, motivant. Réponses pratiques et actionnables.`;

const formatTime = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const formatDate = () => new Date().toLocaleDateString("fr-FR");

const Badge = ({ color, children }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{children}</span>
);

const TypingDots = () => (
  <div style={{ display: "flex", gap: 5, padding: "12px 16px", background: "#fff", borderRadius: "18px 18px 18px 4px", width: "fit-content", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
    {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#128C7E", animation: "bounce 1.2s infinite", animationDelay: `${i*0.2}s` }} />)}
  </div>
);

const ChatBubble = ({ msg }) => {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", margin: "3px 14px" }}>
      {!isUser && <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #25D366, #128C7E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginRight: 8, alignSelf: "flex-end", flexShrink: 0 }}>🧘</div>}
      <div style={{ maxWidth: "76%" }}>
        <div style={{ background: isUser ? "#DCF8C6" : "#fff", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 13px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", fontSize: 14, lineHeight: 1.55, color: "#1a1a1a", whiteSpace: "pre-wrap" }}>
          {msg.content}
          {msg.isHealth && <div style={{ marginTop: 8, padding: "6px 10px", background: "#fff3cd", borderRadius: 8, fontSize: 12, color: "#856404" }}>Données santé analysées</div>}
        </div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 2, textAlign: isUser ? "right" : "left" }}>{msg.time}{isUser && " ✓✓"}</div>
      </div>
    </div>
  );
};

function ChatView({ client, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [history, setHistory] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadText, setUploadText] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [loaded, setLoaded] = useState(false);
  const endRef = useRef(null);
  const storageKey = `chat:${client.id}`;

  const systemPrompt = `${BASE_SYSTEM}\n\nPROFIL DU CLIENT :\n${client.customPrompt}\n\n${client.healthData.length > 0 ? `DONNEES DE SANTE :\n${client.healthData.map(d => `- ${d.type} (${d.date}): ${d.summary}`).join("\n")}\nAdapte TOUJOURS tes recommandations à ces données. Pour toute interprétation médicale, renvoie vers le médecin.` : ""}`;

  useEffect(() => {
    const load = async () => {
      const saved = await Storage.get(storageKey);
      if (saved?.messages?.length > 0) {
        setMessages(saved.messages);
        setHistory(saved.apiHistory || []);
      } else {
        setTimeout(() => {
          const greet = { role: "assistant", content: `Namasté ${client.name.split(" ")[0]} 🙏\n\nContent de te retrouver ! Je suis prêt à t'accompagner.\n\nQu'est-ce qu'on travaille ensemble ? 💪`, time: formatTime() };
          setMessages([greet]);
          setHistory([{ role: "assistant", content: greet.content }]);
        }, 400);
      }
      setLoaded(true);
    };
    load();
  }, [client.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const save = async (msgs, hist) => {
    setSaveStatus("saving");
    const ok = await Storage.set(storageKey, { messages: msgs, apiHistory: hist, lastUpdated: new Date().toISOString() });
    setSaveStatus(ok ? "saved" : "error");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const send = async (text) => {
    const txt = text || input.trim();
    if (!txt || typing) return;
    setInput("");
    const userMsg = { role: "user", content: txt, time: formatTime() };
    const newMsgs = [...messages, userMsg];
    const newHist = [...history, { role: "user", content: txt }];
    setMessages(newMsgs);
    setHistory(newHist);
    setTyping(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: systemPrompt, messages: newHist }) });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("\n") || "Une erreur s'est produite.";
      const aMsg = { role: "assistant", content: reply, time: formatTime() };
      const finalMsgs = [...newMsgs, aMsg];
      const finalHist = [...newHist, { role: "assistant", content: reply }];
      setMessages(finalMsgs);
      setHistory(finalHist);
      await save(finalMsgs, finalHist);
    } catch { setMessages(p => [...p, { role: "assistant", content: "Erreur de connexion.", time: formatTime() }]); }
    setTyping(false);
  };

  const sendHealth = async () => {
    if (!uploadText.trim()) return;
    setShowUpload(false);
    const userMsg = { role: "user", content: "J'ai de nouvelles données santé à partager.", time: formatTime() };
    const newMsgs = [...messages, userMsg];
    const newHist = [...history, { role: "user", content: `[DONNEES SANTE]\n${uploadText}` }];
    setMessages(newMsgs); setHistory(newHist); setTyping(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: systemPrompt, messages: newHist }) });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("\n") || "";
      const aMsg = { role: "assistant", content: reply, time: formatTime(), isHealth: true };
      const finalMsgs = [...newMsgs, aMsg];
      const finalHist = [...newHist, { role: "assistant", content: reply }];
      setMessages(finalMsgs); setHistory(finalHist);
      await save(finalMsgs, finalHist);
    } catch {}
    setTyping(false); setUploadText("");
  };

  const clearHistory = async () => {
    await Storage.delete(storageKey);
    const greet = { role: "assistant", content: "Nouvelle conversation démarrée 🌱\n\nComment puis-je t'aider ?", time: formatTime() };
    setMessages([greet]); setHistory([{ role: "assistant", content: greet.content }]);
  };

  const QUICK = ["💪 Mon programme du jour", "🥗 Recette avec mes ingrédients", "🌿 Remède ayurvédique", "📊 Mes macros"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#ECE5DD" }}>
      <div style={{ background: "linear-gradient(135deg, #075E54, #128C7E)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#a8e6cf", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{client.avatar}</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
            {client.name}
            {saveStatus === "saving" && <span style={{ fontSize: 10, color: "#FF6B35" }}>💾 saving...</span>}
            {saveStatus === "saved" && <span style={{ fontSize: 10, color: "#25D366" }}>✅ saved</span>}
          </div>
          <div style={{ color: "#a8e6cf", fontSize: 11 }}>🌍 Multilingue · {client.plan}</div>
        </div>
        <button onClick={() => setShowUpload(true)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 16, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>📋 Santé</button>
        <button onClick={clearHistory} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#a8e6cf", borderRadius: 16, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>🗑️</button>
      </div>

      <div style={{ background: "rgba(37,211,102,0.12)", borderBottom: "1px solid rgba(37,211,102,0.2)", padding: "4px 14px" }}>
        <span style={{ fontSize: 11, color: "#075E54" }}>🌍 Écris dans ta langue — I speak your language · أتحدث لغتك · Hablo tu idioma</span>
      </div>

      {showUpload && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, width: "100%", maxWidth: 400 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>📋 Partager des données santé</h3>
            <p style={{ fontSize: 12, color: "#666", margin: "0 0 12px" }}>Copie-colle tes résultats d'analyses, bilans sanguins, compte-rendus...</p>
            <textarea value={uploadText} onChange={e => setUploadText(e.target.value)} placeholder="Ex: Bilan sanguin — Ferritine: 45 µg/L, Vitamine D: 32 ng/mL..." style={{ width: "100%", height: 120, border: "1px solid #ddd", borderRadius: 8, padding: 10, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setShowUpload(false)} style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 8, background: "#f5f5f5", cursor: "pointer" }}>Annuler</button>
              <button onClick={sendHealth} style={{ flex: 2, padding: 10, border: "none", borderRadius: 8, background: "linear-gradient(135deg, #25D366, #128C7E)", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Analyser & Sauvegarder</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
        <div style={{ textAlign: "center", margin: "6px 0 10px" }}>
          <span style={{ background: "rgba(255,255,255,0.8)", fontSize: 11, color: "#666", padding: "3px 10px", borderRadius: 10 }}>{formatDate()} · Historique sauvegardé 💾</span>
        </div>
        {!loaded && <div style={{ textAlign: "center", padding: 20, color: "#888", fontSize: 13 }}>Chargement...</div>}
        {messages.map((m, i) => <ChatBubble key={i} msg={m} />)}
        {typing && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "3px 14px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #25D366, #128C7E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🧘</div>
            <TypingDots />
          </div>
        )}
        {messages.length <= 1 && loaded && !typing && (
          <div style={{ padding: "10px 14px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {QUICK.map((q, i) => <button key={i} onClick={() => send(q)} style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(18,140,126,0.3)", borderRadius: 20, padding: "6px 12px", fontSize: 12, cursor: "pointer", color: "#075E54", fontWeight: 500 }}>{q}</button>)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ background: "#F0F0F0", padding: "8px 10px", display: "flex", alignItems: "flex-end", gap: 8 }}>
        <div style={{ flex: 1, background: "#fff", borderRadius: 22, display: "flex", alignItems: "flex-end", padding: "7px 14px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }}}
            placeholder="Message / رسالة / Mensaje / संदेश..." rows={1}
            style={{ flex: 1, border: "none", fontSize: 14, fontFamily: "inherit", background: "transparent", resize: "none", maxHeight: 100, outline: "none" }}
            onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }} />
        </div>
        <button onClick={() => send()} disabled={!input.trim() || typing} style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: input.trim() && !typing ? "linear-gradient(135deg, #25D366, #128C7E)" : "#ccc", color: "#fff", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>➤</button>
      </div>
    </div>
  );
}

function AdminView({ clients, setClients }) {
  const [selected, setSelected] = useState(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("clients");
  const [chatStats, setChatStats] = useState({});

  useEffect(() => {
    const loadStats = async () => {
      const stats = {};
      for (const c of clients) {
        const data = await Storage.get(`chat:${c.id}`);
        stats[c.id] = data ? { messages: (data.messages || []).length, lastActive: data.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString("fr-FR") : "—" } : { messages: 0, lastActive: "Jamais" };
      }
      setChatStats(stats);
    };
    loadStats();
  }, []);

  const savePrompt = async () => {
    setClients(prev => prev.map(c => c.id === selected.id ? { ...c, customPrompt: editPrompt } : c));
    setSelected(prev => ({ ...prev, customPrompt: editPrompt }));
    await Storage.set(`admin:prompt:${selected.id}`, { prompt: editPrompt, updatedAt: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const totalMRR = clients.reduce((s, c) => s + parseInt(c.subscription.amount), 0);
  const totalMsgs = Object.values(chatStats).reduce((s, v) => s + (v.messages || 0), 0);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f8f9fa" }}>
      <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 22 }}>⚙️</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Backoffice Coach</div>
          <div style={{ color: "#a0b4c8", fontSize: 11 }}>Yogi Fitness Admin · Stockage actif 💾</div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {[{ val: clients.length, label: "clients", color: "#25D366" }, { val: `${totalMRR}€`, label: "MRR", color: "#FF6B35" }, { val: totalMsgs, label: "msgs", color: "#a8e6cf" }].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ color: s.color, fontWeight: 700, fontSize: 15 }}>{s.val}</div>
              <div style={{ color: "#a0b4c8", fontSize: 10 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid #eee" }}>
        {["clients", "stockage", "plans"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "11px", border: "none", background: "none", cursor: "pointer", fontSize: 12, fontWeight: tab === t ? 700 : 400, color: tab === t ? "#128C7E" : "#666", borderBottom: tab === t ? "2px solid #128C7E" : "2px solid transparent" }}>
            {t === "clients" ? "👥 Clients" : t === "stockage" ? "💾 Stockage" : "💳 Offres"}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {tab === "clients" && !selected && clients.map(c => (
          <div key={c.id} onClick={() => { setSelected(c); setEditPrompt(c.customPrompt); }} style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", marginBottom: 10, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 28 }}>{c.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{c.email}</div>
              <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge color={c.plan === "Premium" ? "#FF6B35" : "#6c757d"}>{c.plan}</Badge>
                {c.healthData.length > 0 && <Badge color="#128C7E">📋 {c.healthData.length} analyse(s)</Badge>}
                {chatStats[c.id] && <Badge color="#6f42c1">💬 {chatStats[c.id].messages} msgs</Badge>}
              </div>
              {chatStats[c.id] && <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>Dernière activité : {chatStats[c.id].lastActive}</div>}
            </div>
            <div style={{ color: "#128C7E", fontSize: 18 }}>›</div>
          </div>
        ))}

        {tab === "clients" && selected && (
          <div>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#128C7E", cursor: "pointer", fontSize: 13, marginBottom: 12, padding: 0 }}>← Retour</button>
            <div style={{ background: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
                <div style={{ fontSize: 32 }}>{selected.avatar}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>Depuis {selected.joined} · <Badge color={selected.plan === "Premium" ? "#FF6B35" : "#6c757d"}>{selected.plan}</Badge></div>
                  {chatStats[selected.id] && <div style={{ fontSize: 11, color: "#666" }}>💬 {chatStats[selected.id].messages} messages · Actif le {chatStats[selected.id].lastActive}</div>}
                </div>
              </div>
              {selected.healthData.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>📋 Données santé :</div>
                  {selected.healthData.map((d, i) => (
                    <div key={i} style={{ background: "#f0faf5", borderLeft: "3px solid #25D366", padding: "8px 10px", borderRadius: "0 8px 8px 0", marginBottom: 6, fontSize: 12 }}>
                      <strong>{d.type}</strong> — {d.date}<br /><span style={{ color: "#555" }}>{d.summary}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>🎯 Prompt personnalisé :</div>
              <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)} style={{ width: "100%", height: 150, border: "1px solid #ddd", borderRadius: 8, padding: 10, fontSize: 12, resize: "vertical", boxSizing: "border-box" }} />
              <button onClick={savePrompt} style={{ width: "100%", marginTop: 10, padding: 11, background: saved ? "#25D366" : "linear-gradient(135deg, #128C7E, #075E54)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                {saved ? "✅ Sauvegardé !" : "💾 Sauvegarder le prompt"}
              </button>
            </div>
          </div>
        )}

        {tab === "stockage" && (
          <div>
            {[
              { env: "🧪 Démo (actuel)", tech: "window.storage (Claude)", detail: "Stockage persistant intégré à l'artifact. Données sauvegardées entre sessions. Gratuit, zéro config.", color: "#25D366", status: "Actif" },
              { env: "🚀 Production MVP", tech: "Supabase (PostgreSQL)", detail: "BDD managée gratuite jusqu'à 500MB. Tables: users, chats, health_data, prompts. Authentification incluse.", color: "#FF6B35", status: "Recommandé" },
              { env: "📈 Scale", tech: "Supabase Pro + AWS S3", detail: "Fichiers PDF/images médicaux sur S3 chiffrés AES-256. BDD scalable. Conformité RGPD.", color: "#6f42c1", status: "Futur" },
            ].map((item, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, border: `2px solid ${item.color}33` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{item.env}</span>
                  <Badge color={item.color}>{item.status}</Badge>
                </div>
                <div style={{ fontWeight: 600, fontSize: 12, color: item.color, marginBottom: 4 }}>{item.tech}</div>
                <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>{item.detail}</div>
              </div>
            ))}
            <div style={{ background: "#fff", borderRadius: 12, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📊 Données stockées actuellement</div>
              {[
                { icon: "💬", label: "Historiques de chat", key: "chat:clientId" },
                { icon: "🎯", label: "Prompts personnalisés coach", key: "admin:prompt:clientId" },
                { icon: "📋", label: "Données santé clients", key: "health:clientId" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < 2 ? "1px solid #f5f5f5" : "none", alignItems: "center" }}>
                  <span>{item.icon}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{item.label}</span>
                  <code style={{ fontSize: 10, color: "#128C7E", background: "#f0faf5", padding: "2px 6px", borderRadius: 4 }}>{item.key}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "plans" && PLANS.map(p => (
          <div key={p.id} style={{ background: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: p.popular ? `2px solid ${p.color}` : "1px solid #f0f0f0", position: "relative" }}>
            {p.popular && <div style={{ position: "absolute", top: -10, right: 14, background: p.color, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 10 }}>POPULAIRE</div>}
            <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
              <span style={{ fontSize: 24 }}>{p.icon}</span>
              <div><div style={{ fontWeight: 700 }}>{p.name}</div><div style={{ color: p.color, fontWeight: 700 }}>{p.price}</div></div>
            </div>
            {p.features.map((f, i) => <div key={i} style={{ fontSize: 13, color: "#444", padding: "3px 0" }}>✓ {f}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function LandingView({ onEnterApp }) {
  return (
    <div style={{ height: "100%", overflowY: "auto", background: "linear-gradient(160deg, #0a1628 0%, #0d2137 50%, #0a2e1e 100%)" }}>
      <div style={{ padding: "30px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🧘</div>
        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 900, margin: "0 0 4px" }}>Yogi Fitness</h1>
        <p style={{ color: "#25D366", fontSize: 12, margin: "0 0 6px", letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>Coach holistique IA</p>
        <p style={{ color: "#a8e6cf", fontSize: 12, margin: "0 0 24px" }}>🌍 Français · English · Español · العربية · हिंदी</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["💪 Fitness", "🥗 Nutrition", "🌿 Ayurvéda"].map((t, i) => (
            <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 4px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{t}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 12, padding: "10px 14px", marginBottom: 20, textAlign: "left" }}>
          <div style={{ color: "#25D366", fontWeight: 700, fontSize: 12, marginBottom: 3 }}>💾 Données persistantes</div>
          <div style={{ color: "#a8e6cf", fontSize: 11 }}>Conversations et données santé sauvegardées automatiquement entre chaque session.</div>
        </div>
        {PLANS.map(p => (
          <div key={p.id} onClick={() => onEnterApp(p.id)} style={{ background: p.popular ? "linear-gradient(135deg, #FF6B35, #e65c2a)" : "rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px", marginBottom: 10, cursor: "pointer", border: p.popular ? "none" : "1px solid rgba(255,255,255,0.12)", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 28 }}>{p.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{p.name} — {p.price}</div>
              <div style={{ color: p.popular ? "rgba(255,255,255,0.8)" : "#888", fontSize: 12, marginTop: 2 }}>{p.features.slice(0, 2).join(" · ")}</div>
            </div>
            {p.popular && <Badge color="#fff">Populaire</Badge>}
          </div>
        ))}
        <button onClick={() => onEnterApp("demo")} style={{ width: "100%", marginTop: 8, padding: 14, background: "rgba(37,211,102,0.15)", border: "1px solid #25D366", borderRadius: 12, color: "#25D366", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
          👀 Demo gratuite
        </button>
      </div>
    </div>
  );
}

export default function YogiFitnessApp() {
  const [view, setView] = useState("landing");
  const [clients, setClients] = useState(MOCK_CLIENTS);
  const [activeClient, setActiveClient] = useState(null);
  const [navTab, setNavTab] = useState("chat");

  const demoClient = { id: "demo", name: "Vous (Demo)", email: "demo@yogifitness.app", plan: "Premium", avatar: "🙋", customPrompt: "Utilisateur en mode démo. Présente toutes les fonctionnalités. Sois enthousiaste. Réponds dans la langue de l'utilisateur.", healthData: [], subscription: { status: "demo", since: "Aujourd'hui", nextBill: "-", amount: "Gratuit" } };

  const handleEnterApp = (plan) => {
    setActiveClient(plan === "demo" ? demoClient : { ...demoClient, plan: plan.charAt(0).toUpperCase() + plan.slice(1) });
    setView("app"); setNavTab("chat");
  };

  if (view === "landing") return <div style={{ height: "100vh", maxWidth: 480, margin: "0 auto", overflow: "hidden" }}><LandingView onEnterApp={handleEnterApp} /></div>;

  return (
    <div style={{ height: "100vh", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}} textarea{resize:none;} textarea:focus{outline:none;} ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:4px} *{box-sizing:border-box}`}</style>
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {navTab === "chat" && activeClient && <ChatView client={activeClient} onBack={() => setView("landing")} />}
        {navTab === "admin" && <AdminView clients={clients} setClients={setClients} />}
        {navTab === "profile" && (
          <div style={{ height: "100%", background: "#f8f9fa", display: "flex", flexDirection: "column" }}>
            <div style={{ background: "linear-gradient(135deg, #075E54, #128C7E)", padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 6 }}>{activeClient?.avatar}</div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>{activeClient?.name}</div>
              <div style={{ color: "#a8e6cf", fontSize: 13, marginTop: 4 }}><Badge color="#a8e6cf">{activeClient?.plan}</Badge></div>
            </div>
            <div style={{ padding: 16, flex: 1, overflowY: "auto" }}>
              <div style={{ background: "#f0faf5", borderRadius: 12, padding: 14, marginBottom: 12, border: "1px solid #c3e6d4" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#128C7E", marginBottom: 6 }}>💾 Stockage des données</div>
                <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>Tes conversations sont sauvegardées automatiquement. Efface-les depuis le chat (🗑️).</div>
              </div>
              {activeClient && (
                <div style={{ background: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Mon abonnement</div>
                  {Object.entries(activeClient.subscription).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}>
                      <span style={{ color: "#888", textTransform: "capitalize" }}>{k}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setView("landing")} style={{ width: "100%", padding: 12, background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 10, cursor: "pointer", color: "#666", fontSize: 13 }}>← Changer de compte</button>
            </div>
          </div>
        )}
      </div>
      <div style={{ background: "#fff", borderTop: "1px solid #eee", display: "flex", padding: "6px 0" }}>
        {[{ id: "chat", label: "Chat", icon: "💬" }, { id: "admin", label: "Backoffice", icon: "⚙️" }, { id: "profile", label: "Profil", icon: "👤" }].map(t => (
          <button key={t.id} onClick={() => setNavTab(t.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "6px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ fontSize: 20 }}>{t.icon}</div>
            <div style={{ fontSize: 10, color: navTab === t.id ? "#128C7E" : "#999", fontWeight: navTab === t.id ? 700 : 400 }}>{t.label}</div>
            {navTab === t.id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#128C7E" }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
