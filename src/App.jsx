import { useState, useEffect, useCallback } from "react";

const SB_URL = "https://aphdhxukrqsqccozwbeu.supabase.co";
const SB_KEY = "sb_publishable_li9MAmRBu7VWw3m06HdikQ_i0Fbpmy3";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaGRoeHVrcnFzcWNjb3p3YmV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDQ2MjgsImV4cCI6MjA5MDcyMDYyOH0.mwD1brWgQ5jiWKJItJP4g7neVabQCymbFoULx3NPtZU";

const sbFetch = async (path, opts = {}, token = null) => {
  const res = await fetch(`${SB_URL}${path}`, {
    ...opts,
    headers: {
      "apikey": SB_KEY,
      "Authorization": `Bearer ${token || SB_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : null;
};

const signInWithGoogle = () => {
  const redirectTo = encodeURIComponent(window.location.origin);
  window.location.href = `${SB_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`;
};

const signOut = async (token) => {
  try { await sbFetch("/auth/v1/logout", { method: "POST" }, token); } catch {}
  localStorage.removeItem("sb_session");
};

const getRestaurants = (token) =>
  sbFetch("/rest/v1/restaurants?select=*&order=created_at.desc", {}, token);
const insertRestaurant = (data, token) =>
  sbFetch("/rest/v1/restaurants", { method: "POST", body: JSON.stringify(data) }, token);
const updateRestaurant = (id, data, token) =>
  sbFetch(`/rest/v1/restaurants?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(data) }, token);
const deleteRestaurant = (id, token) =>
  sbFetch(`/rest/v1/restaurants?id=eq.${id}`, { method: "DELETE", headers: { "Prefer": "" } }, token);

const CATEGORIES = [
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "sushi", label: "Sushi", emoji: "🍣" },
  { id: "japanese", label: "Japanese", emoji: "🍜" },
  { id: "korean", label: "Korean", emoji: "🥩" },
  { id: "thai", label: "Thai", emoji: "🍛" },
  { id: "chinese", label: "Chinese", emoji: "🥡" },
  { id: "mexican", label: "Mexican", emoji: "🌮" },
  { id: "italian", label: "Italian", emoji: "🍝" },
  { id: "greek", label: "Greek", emoji: "🫒" },
  { id: "burgers", label: "Burgers", emoji: "🍔" },
  { id: "fastfood", label: "Fast Food", emoji: "🍟" },
  { id: "healthy", label: "Healthy", emoji: "🥗" },
  { id: "dessert", label: "Dessert", emoji: "🍰" },
  { id: "breakfast", label: "Breakfast", emoji: "🥞" },
  { id: "soup", label: "Soup", emoji: "🍲" },
  { id: "seafood", label: "Seafood", emoji: "🦞" },
  { id: "steakhouse", label: "Steakhouse", emoji: "🔥" },
  { id: "vegan", label: "Vegan", emoji: "🌱" },
];

async function analyzeReel(url) {
  const res = await fetch(
    "https://aphdhxukrqsqccozwbeu.supabase.co/functions/v1/analyze",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ url }),
    }
  );
  if (!res.ok) throw new Error("Failed to analyze");
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  if (data.not_restaurant) throw new Error("not_restaurant");
  return data;
}

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=DM+Sans:wght@300;400;500&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #0d0d0d; color: #fff; font-family: 'DM Sans', sans-serif; }
      ::-webkit-scrollbar { width: 0; }
      @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
      @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
    `}</style>
  );
}

function StarRating({ value, onChange, readonly = false, size = 18 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s}
          onClick={() => !readonly && onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{ fontSize: size, cursor: readonly ? "default" : "pointer", userSelect: "none",
            color: s <= (hover || value) ? "#FF6B35" : "#2a2a2a", transition: "color 0.15s" }}>★</span>
      ))}
    </div>
  );
}

// ─── Category Selector ─────────────────────────────────────────
function CategorySelector({ selected, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {CATEGORIES.map((cat) => {
        const isSelected = selected.includes(cat.id);
        return (
          <button key={cat.id}
            onClick={() => {
              if (isSelected) onChange(selected.filter((c) => c !== cat.id));
              else onChange([...selected, cat.id]);
            }}
            style={{
              padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer",
              background: isSelected ? "linear-gradient(135deg,#FF6B35,#FF3D71)" : "rgba(255,255,255,0.07)",
              color: isSelected ? "#fff" : "#888",
              fontSize: 12, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 5,
              transform: isSelected ? "scale(1.05)" : "scale(1)",
              transition: "all 0.15s",
              boxShadow: isSelected ? "0 4px 12px rgba(255,107,53,0.35)" : "none",
            }}>
            {cat.emoji} {cat.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Input Field ───────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, required, error }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: error ? "#FF3D71" : "#FF6B35", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
        display: "flex", gap: 4 }}>
        {label} {required && <span style={{ color: "#FF3D71" }}>*</span>}
      </div>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "11px 14px", borderRadius: 12,
          background: "rgba(255,255,255,0.06)",
          border: `1px solid ${error ? "rgba(255,59,71,0.5)" : "rgba(255,255,255,0.09)"}`,
          color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
      {error && <div style={{ fontSize: 11, color: "#FF3D71", marginTop: 4 }}>{error}</div>}
    </div>
  );
}

// ─── Add Restaurant Modal ──────────────────────────────────────
function AddReelModal({ onClose, onAdd, currentUser }) {
  const [mode, setMode] = useState(null); // null | "link" | "manual"
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1=input, 2=form

  // Form fields
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [reelUrl, setReelUrl] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "El nombre es obligatorio";
    if (!type.trim()) e.type = "El tipo de comida es obligatorio";
    if (categories.length === 0) e.categories = "Selecciona al menos una categoría";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true); setError("");
    try {
      const result = await analyzeReel(url);
      setName(result.name || "");
      setType(result.type || "");
      setLocation(result.location || "");
      setDescription(result.description || "");
      setCategories(result.categories || []);
      setReelUrl(url);
      setStep(2);
    } catch (e) {
      if (e.message === "not_restaurant") {
        setError("❌ Este link no parece ser de un restaurante. Intenta con otro.");
      } else {
        setError("No se pudo analizar el link. Intenta de nuevo o agrégalo manualmente.");
      }
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setLoading(true);
    await onAdd({
      name: name.trim(),
      type: type.trim(),
      location: location.trim(),
      description: description.trim(),
      categories: categories.length ? categories : ["italian"],
      reel_url: reelUrl || url || "",
      added_by: currentUser?.user_metadata?.full_name || currentUser?.email || "Anónimo",
      added_by_id: currentUser?.id,
      visited: false, rating: 0, comments: "",
    });
    setLoading(false);
    onClose();
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 12,
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)",
    color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(12px)", display: "flex",
        alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#181818", borderRadius: "28px 28px 0 0",
        padding: "28px 24px 44px", width: "100%", maxWidth: 520,
        border: "1px solid rgba(255,255,255,0.09)", borderBottom: "none",
        maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: "#333", borderRadius: 2, margin: "0 auto 24px" }} />

        {/* Step 0 — Choose mode */}
        {!mode && (
          <>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 22, color: "#fff", marginBottom: 8 }}>
              ➕ Agregar Restaurante
            </h2>
            <p style={{ color: "#555", fontSize: 13, marginBottom: 28 }}>¿Cómo quieres agregarlo?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={() => setMode("link")}
                style={{ padding: "18px", borderRadius: 16, border: "1px solid rgba(255,107,53,0.3)",
                  background: "rgba(255,107,53,0.08)", cursor: "pointer", textAlign: "left" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: "#fff", marginBottom: 4 }}>
                  📸 Con link de Instagram
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  Pega el link del perfil o reel y la IA detectará la info
                </div>
              </button>
              <button onClick={() => { setMode("manual"); setStep(2); }}
                style={{ padding: "18px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.09)",
                  background: "rgba(255,255,255,0.04)", cursor: "pointer", textAlign: "left" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: "#fff", marginBottom: 4 }}>
                  ✍️ Agregar manualmente
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  Llena tú mismo la información del restaurante
                </div>
              </button>
            </div>
          </>
        )}

        {/* Step 1 — Link input */}
        {mode === "link" && step === 1 && (
          <>
            <button onClick={() => setMode(null)}
              style={{ background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
              ← Volver
            </button>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 22, color: "#fff", marginBottom: 8 }}>
              📸 Link de Instagram
            </h2>
            <p style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>
              Pega el link del perfil del restaurante o de un reel
            </p>
            <input value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/restaurante"
              style={{ ...inputStyle, marginBottom: 12 }} />
            {error && (
              <div style={{ background: "rgba(255,59,71,0.1)", border: "1px solid rgba(255,59,71,0.3)",
                borderRadius: 12, padding: "10px 14px", marginBottom: 12, color: "#FF3D71", fontSize: 13 }}>
                {error}
              </div>
            )}
            <button onClick={handleAnalyze} disabled={loading || !url.trim()}
              style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none",
                background: loading || !url.trim() ? "#1e1e1e" : "linear-gradient(135deg,#FF6B35,#FF3D71)",
                color: loading || !url.trim() ? "#444" : "#fff",
                fontSize: 15, fontWeight: 800, fontFamily: "'Syne',sans-serif",
                cursor: loading || !url.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading
                ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙️</span> Analizando...</>
                : "🤖 Analizar con IA"}
            </button>
          </>
        )}

        {/* Step 2 — Form (editable, both modes) */}
        {step === 2 && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <button onClick={() => { if (mode === "link") setStep(1); else setMode(null); }}
                style={{ background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                ← Volver
              </button>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 18, color: "#fff" }}>
                {mode === "link" ? "✨ Confirma y edita" : "✍️ Nuevo restaurante"}
              </h2>
              <div style={{ width: 60 }} />
            </div>

            {mode === "link" && (
              <div style={{ background: "rgba(255,107,53,0.07)", border: "1px solid rgba(255,107,53,0.2)",
                borderRadius: 12, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#FF8C61" }}>
                💡 La IA pre-llenó los campos. Edita lo que necesites antes de agregar.
              </div>
            )}

            <Field label="Nombre del restaurante" value={name} onChange={setName}
              placeholder="Ej. Nobu Tokyo" required error={errors.name} />
            <Field label="Tipo de comida" value={type} onChange={setType}
              placeholder="Ej. Japanese · Sushi" required error={errors.type} />
            <Field label="Ubicación" value={location} onChange={setLocation}
              placeholder="Ej. Polanco, CDMX" />
            <Field label="Descripción" value={description} onChange={setDescription}
              placeholder="Una frase sobre el restaurante" />

            {mode === "manual" && (
              <Field label="Link de Instagram (opcional)" value={reelUrl} onChange={setReelUrl}
                placeholder="https://www.instagram.com/restaurante" />
            )}

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: errors.categories ? "#FF3D71" : "#FF6B35",
                fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8,
                display: "flex", gap: 4 }}>
                Categorías <span style={{ color: "#FF3D71" }}>*</span>
              </div>
              <CategorySelector selected={categories} onChange={setCategories} />
              {errors.categories && (
                <div style={{ fontSize: 11, color: "#FF3D71", marginTop: 6 }}>{errors.categories}</div>
              )}
            </div>

            <button onClick={handleAdd} disabled={loading}
              style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none",
                background: "linear-gradient(135deg,#FF6B35,#FF3D71)", color: "#fff",
                fontSize: 15, fontWeight: 800, fontFamily: "'Syne',sans-serif",
                cursor: loading ? "not-allowed" : "pointer", marginTop: 8,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 6px 20px rgba(255,107,53,0.35)" }}>
              {loading
                ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙️</span> Guardando...</>
                : "✅ Agregar a la Lista"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Restaurant Card ───────────────────────────────────────────
function RestaurantCard({ r, onToggleVisited, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [localComment, setLocalComment] = useState(r.comments || "");
  const [saving, setSaving] = useState(false);
  const primaryCat = CATEGORIES.find((c) => c.id === r.categories?.[0]);

  const handleUpdate = async (updates) => {
    setSaving(true);
    await onUpdate(r.id, updates);
    setSaving(false);
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 20,
      border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
      <div onClick={() => setExpanded(!expanded)}
        style={{ padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 14, cursor: "pointer" }}>
        <div style={{ width: 50, height: 50, borderRadius: 14, flexShrink: 0,
          background: "linear-gradient(135deg,#FF6B35,#FF3D71)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
          {primaryCat?.emoji || "🍽️"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: "#fff",
            marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
          <div style={{ fontSize: 12, color: "#FF6B35", fontWeight: 600, marginBottom: 2 }}>{r.type}</div>
          {r.location && (
            <div style={{ fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 3 }}>
              <span>📍</span>{r.location}
            </div>
          )}
          {r.categories?.length > 1 && (
            <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
              {r.categories.map((cid) => {
                const c = CATEGORIES.find((x) => x.id === cid);
                return c ? (
                  <span key={cid} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20,
                    background: "rgba(255,107,53,0.12)", color: "#FF8C61",
                    fontWeight: 600, border: "1px solid rgba(255,107,53,0.2)" }}>
                    {c.emoji} {c.label}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          <button onClick={(e) => { e.stopPropagation(); onToggleVisited(r.id, !r.visited); }}
            style={{ width: 30, height: 30, borderRadius: 9, border: "none",
              background: r.visited ? "#22c55e" : "rgba(255,255,255,0.08)",
              cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {r.visited ? "✅" : "⬜"}
          </button>
          <StarRating value={r.rating || 0} readonly size={14} />
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 18px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ height: 12 }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
            {r.reel_url && (
              <a href={r.reel_url} target="_blank" rel="noreferrer"
                style={{ padding: "6px 12px", borderRadius: 20,
                  background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",
                  color: "#fff", textDecoration: "none", fontSize: 12, fontWeight: 700 }}>
                📸 Ver Instagram
              </a>
            )}
            <span style={{ padding: "6px 12px", borderRadius: 20,
              background: "rgba(255,255,255,0.06)", color: "#777", fontSize: 12 }}>
              👤 {r.added_by}
            </span>
            {saving && <span style={{ fontSize: 11, color: "#FF6B35", animation: "pulse 1s infinite" }}>Guardando...</span>}
          </div>
          {r.description && (
            <p style={{ fontSize: 13, color: "#bbb", marginBottom: 12, fontStyle: "italic", lineHeight: 1.5 }}>
              "{r.description}"
            </p>
          )}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "#555", marginBottom: 5, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.07em" }}>Rating</div>
            <StarRating value={r.rating || 0} onChange={(val) => handleUpdate({ rating: val })} />
          </div>
          <textarea value={localComment} rows={2}
            onChange={(e) => setLocalComment(e.target.value)}
            onBlur={() => handleUpdate({ comments: localComment })}
            placeholder="Añade un comentario..."
            style={{ width: "100%", padding: "8px 12px", borderRadius: 10,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#ddd", fontSize: 13, fontFamily: "inherit", resize: "none",
              outline: "none", boxSizing: "border-box" }} />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <button onClick={() => onDelete(r.id)}
              style={{ padding: "5px 12px", borderRadius: 8,
                border: "1px solid rgba(255,59,71,0.3)", background: "transparent",
                color: "#FF3D71", fontSize: 12, cursor: "pointer" }}>
              🗑 Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Login Screen ──────────────────────────────────────────────
function LoginScreen({ error }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 32,
      background: "radial-gradient(ellipse at 50% 0%, rgba(255,107,53,0.15) 0%, #0d0d0d 70%)" }}>
      <div style={{ textAlign: "center", maxWidth: 340 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🍽</div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 36,
          background: "linear-gradient(135deg,#FF6B35,#FF3D71)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}>
          Foodies List
        </h1>
        <p style={{ color: "#666", fontSize: 15, lineHeight: 1.6, marginBottom: 48 }}>
          La lista compartida de restaurantes de tu grupo.
        </p>
        {error && (
          <div style={{ background: "rgba(255,59,71,0.1)", border: "1px solid rgba(255,59,71,0.3)",
            borderRadius: 12, padding: "12px 16px", marginBottom: 20, color: "#FF3D71", fontSize: 13 }}>
            {error}
          </div>
        )}
        <button onClick={signInWithGoogle}
          style={{ width: "100%", padding: "16px 24px", borderRadius: 16, border: "none",
            background: "#fff", color: "#1a1a1a", fontSize: 15, fontWeight: 700,
            fontFamily: "'Syne',sans-serif", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continuar con Google
        </button>
        <p style={{ color: "#333", fontSize: 12, marginTop: 24 }}>
          Cualquier persona con el link puede unirse al grupo.
        </p>
      </div>
    </div>
  );
}

// ─── Category Detail Screen ────────────────────────────────────
function CategoryDetailScreen({ categoryId, restaurants, onBack, onToggleVisited, onUpdate, onDelete }) {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  const filtered = restaurants.filter((r) => r.categories?.includes(categoryId));
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", minHeight: "100vh", background: "#0d0d0d" }}>
      <div style={{ padding: "52px 24px 20px", background: "linear-gradient(180deg,#161616 0%,#0d0d0d 100%)", position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 12,
          color: "#aaa", fontSize: 14, fontWeight: 600, padding: "8px 14px",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 18 }}>← Volver</button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: "linear-gradient(135deg,#FF6B35,#FF3D71)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{cat?.emoji}</div>
          <div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 26, color: "#fff" }}>{cat?.label}</h1>
            <p style={{ color: "#555", fontSize: 13 }}>{filtered.length} restaurante{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>
      <div style={{ padding: "12px 24px 60px", display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>{cat?.emoji}</div>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: "#fff", marginBottom: 8 }}>Sin restaurantes aún</h3>
            <p style={{ color: "#555", fontSize: 14 }}>Agrega un lugar de {cat?.label?.toLowerCase()}</p>
          </div>
        ) : filtered.map((r, i) => (
          <div key={r.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
            <RestaurantCard r={r} onToggleVisited={onToggleVisited} onUpdate={onUpdate} onDelete={onDelete} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── All Screen ────────────────────────────────────────────────
function AllScreen({ restaurants, onSelectCategory }) {
  const withR = CATEGORIES.filter((c) => restaurants.some((r) => r.categories?.includes(c.id)));
  const without = CATEGORIES.filter((c) => !restaurants.some((r) => r.categories?.includes(c.id)));

  const CatTile = ({ cat, count, dimmed }) => (
    <button onClick={() => !dimmed && onSelectCategory(cat.id)}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 8, padding: "18px 10px", borderRadius: 20, position: "relative",
        border: dimmed ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(255,255,255,0.09)",
        background: dimmed ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
        cursor: dimmed ? "default" : "pointer", opacity: dimmed ? 0.3 : 1, transition: "all 0.2s" }}
      onMouseEnter={(e) => { if (!dimmed) { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.background = "rgba(255,255,255,0.09)"; } }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.background = dimmed ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)"; }}>
      <span style={{ fontSize: 30 }}>{cat.emoji}</span>
      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10,
        color: dimmed ? "#444" : "#bbb", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "center" }}>{cat.label}</span>
      {count > 0 && (
        <span style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%",
          background: "linear-gradient(135deg,#FF6B35,#FF3D71)", color: "#fff", fontSize: 10, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center" }}>{count}</span>
      )}
    </button>
  );

  return (
    <div style={{ padding: "16px 24px 120px" }}>
      <p style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>Toca una categoría para explorar</p>
      {withR.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#FF6B35", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 12 }}>Con restaurantes</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
            {withR.map((cat) => <CatTile key={cat.id} cat={cat} count={restaurants.filter((r) => r.categories?.includes(cat.id)).length} dimmed={false} />)}
          </div>
        </>
      )}
      {without.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 12 }}>Sin restaurantes aún</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {without.map((cat) => <CatTile key={cat.id} cat={cat} count={0} dimmed={true} />)}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      const expires_in = parseInt(params.get("expires_in") || "3600");
      if (access_token) {
        const sessionData = { access_token, refresh_token, expires_at: Math.floor(Date.now() / 1000) + expires_in };
        localStorage.setItem("sb_session", JSON.stringify(sessionData));
        window.history.replaceState({}, document.title, window.location.pathname);
        setSession(sessionData);
      }
    } else if (hash.includes("error")) {
      const params = new URLSearchParams(hash.substring(1));
      setAuthError(params.get("error_description") || "Error de autenticación");
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = localStorage.getItem("sb_session");
        if (stored) {
          const s = JSON.parse(stored);
          if (s.access_token) {
            setSession(s);
            const userData = await sbFetch("/auth/v1/user", {}, s.access_token);
            setUser(userData);
          }
        }
      } catch { localStorage.removeItem("sb_session"); }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!session?.access_token || user) return;
    sbFetch("/auth/v1/user", {}, session.access_token).then(setUser).catch(() => {});
  }, [session, user]);

  const loadRestaurants = useCallback(async () => {
    if (!session?.access_token) return;
    setSyncing(true);
    try { const data = await getRestaurants(session.access_token); setRestaurants(data || []); } catch {}
    setSyncing(false);
  }, [session]);

  useEffect(() => { loadRestaurants(); }, [loadRestaurants]);
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(loadRestaurants, 10000);
    return () => clearInterval(interval);
  }, [session, loadRestaurants]);

  const handleAdd = async (data) => {
    try {
      const result = await insertRestaurant(data, session.access_token);
      if (result?.[0]) setRestaurants((prev) => [result[0], ...prev]);
      else await loadRestaurants();
    } catch { await loadRestaurants(); }
  };

  const handleToggleVisited = async (id, visited) => {
    setRestaurants((prev) => prev.map((r) => r.id === id ? { ...r, visited } : r));
    await updateRestaurant(id, { visited }, session.access_token);
  };

  const handleUpdate = async (id, updates) => {
    setRestaurants((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r));
    await updateRestaurant(id, updates, session.access_token);
  };

  const handleDelete = async (id) => {
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
    await deleteRestaurant(id, session.access_token);
  };

  const handleSignOut = async () => {
    await signOut(session?.access_token);
    setSession(null); setUser(null); setRestaurants([]);
  };

  if (loading) {
    return (
      <>
        <GlobalStyles />
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 48 }}>🍽</div>
          <p style={{ color: "#555", fontSize: 14, animation: "pulse 1.5s infinite" }}>Cargando...</p>
        </div>
      </>
    );
  }

  if (!session) return <><GlobalStyles /><LoginScreen error={authError} /></>;

  const wishlist = restaurants.filter((r) => !r.visited);
  const visited = restaurants.filter((r) => r.visited);
  const listRestaurants = tab === "wishlist" ? wishlist : visited;
  const filteredList = listRestaurants.filter((r) =>
    !searchQuery || r.name?.toLowerCase().includes(searchQuery.toLowerCase()) || r.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedCategory) {
    return (
      <>
        <GlobalStyles />
        <CategoryDetailScreen categoryId={selectedCategory} restaurants={restaurants}
          onBack={() => setSelectedCategory(null)} onToggleVisited={handleToggleVisited}
          onUpdate={handleUpdate} onDelete={handleDelete} />
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div style={{ maxWidth: 520, margin: "0 auto", minHeight: "100vh", background: "#0d0d0d" }}>
        <div style={{ padding: "52px 24px 20px", background: "linear-gradient(180deg,#161616 0%,#0d0d0d 100%)", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 28,
                background: "linear-gradient(135deg,#FF6B35,#FF3D71)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🍽 Foodies List</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                <p style={{ color: "#555", fontSize: 12 }}>{wishlist.length} pendientes · {visited.length} visitados</p>
                {syncing && <span style={{ fontSize: 10, color: "#FF6B35", animation: "pulse 1s infinite" }}>● sync</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={handleSignOut}
                style={{ width: 36, height: 36, borderRadius: 10, border: "none",
                  background: "rgba(255,255,255,0.07)", cursor: "pointer", fontSize: 16,
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#777" }}>⏏</button>
              <button onClick={() => setShowModal(true)}
                style={{ width: 48, height: 48, borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg,#FF6B35,#FF3D71)", color: "#fff",
                  fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 6px 20px rgba(255,107,53,0.45)" }}>+</button>
            </div>
          </div>

          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
              padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)" }}>
              {user.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: "50%" }} />
              )}
              <span style={{ fontSize: 13, color: "#aaa" }}>
                Hola, <span style={{ color: "#fff", fontWeight: 600 }}>{user.user_metadata?.full_name?.split(" ")[0] || "Foodie"}</span> 👋
              </span>
            </div>
          )}

          {tab !== "all" && (
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#444" }}>🔍</span>
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar restaurante o ciudad..."
                style={{ width: "100%", padding: "11px 16px 11px 40px", borderRadius: 14,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          )}
          {tab === "all" && (
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>Explorar por categoría</h2>
          )}
        </div>

        {tab === "all" ? (
          <AllScreen restaurants={restaurants} onSelectCategory={setSelectedCategory} />
        ) : (
          <div style={{ padding: "12px 24px 120px", display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>{tab === "wishlist" ? "🌮" : "🏆"}</div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: "#fff", marginBottom: 8 }}>
                  {tab === "wishlist" ? "¡Lista vacía!" : "Sin visitados aún"}
                </h3>
                <p style={{ color: "#555", fontSize: 14, lineHeight: 1.6 }}>
                  {tab === "wishlist" ? "Agrega tu primer restaurante con el botón +" : "Marca restaurantes como visitados para verlos aquí"}
                </p>
              </div>
            ) : filteredList.map((r, i) => (
              <div key={r.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                <RestaurantCard r={r} onToggleVisited={handleToggleVisited} onUpdate={handleUpdate} onDelete={handleDelete} />
              </div>
            ))}
          </div>
        )}

        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 520, background: "rgba(13,13,13,0.97)", backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.07)", padding: "10px 24px 28px",
          display: "flex", justifyContent: "space-around" }}>
          {[
            { id: "all", icon: "🌍", label: "All" },
            { id: "wishlist", icon: "⭐", label: "Wish List" },
            { id: "visited", icon: "✅", label: "Visitados" },
          ].map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setSearchQuery(""); }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                background: "transparent", border: "none", cursor: "pointer", padding: "8px 16px", borderRadius: 14 }}>
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span style={{ fontSize: 10, fontFamily: "'Syne',sans-serif", fontWeight: 700,
                color: tab === t.id ? "#FF6B35" : "#3a3a3a", textTransform: "uppercase", letterSpacing: "0.07em" }}>{t.label}</span>
              {tab === t.id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#FF6B35" }} />}
            </button>
          ))}
        </div>
      </div>

      {showModal && <AddReelModal onClose={() => setShowModal(false)} onAdd={handleAdd} currentUser={user} />}
    </>
  );
}
