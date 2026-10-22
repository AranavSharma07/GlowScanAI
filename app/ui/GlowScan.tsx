"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Camera, Check, ChevronDown, CircleHelp, Clock3, FlaskConical,
  Heart, Leaf, LockKeyhole, Menu, RotateCcw, ShieldCheck, Sparkles, Upload,
  Sun, Moon, Trash2, X, Droplets, ScanFace, Award, Download, BadgeCheck
} from "lucide-react";

type ScanRecord = { date: string; score: number; summary: string; concerns: string[] } ;
type LeaderboardEntry = { id: string; name: string; score: number; certified: boolean; date: string };
type PublicLeaderboardRow = { id: string; display_name: string; score: number; certificate_eligible: boolean; created_at: string };

type Analysis = {
  mode: "real_ai" | "demo";
  score: number | null;
  scoreLabel?: string;
  leaderboardToken?: string | null;
  summary: string;
  concerns: { name: string; level: string; detail: string }[];
  ingredients: { name: string; why: string; howToStart: string; caution: string }[];
  morning: string[];
  evening: string[];
  productTypes?: string[];
  limitations?: string[];
  caution?: string;
  setupRequired?: boolean;
  error?: string;
};

const translations = {
  en: {
    nav: "Your skin, understood.", heroTag: "YOUR PERSONAL SKIN COMPANION",
    title1: "A little more care.", title2: "A lot more you.",
    subtitle: "Get thoughtful skin insights and a routine built around your needs — not beauty standards.",
    upload: "Start skin check", privacy: "Private by design", noSave: "Your photo stays in this session",
    how: "A simple ritual, made personal", howSub: "Three small steps toward a routine that feels right.",
    step1: "Share a selfie", step1sub: "Use clear, natural light with no filters.", step2: "Explore your insights", step2sub: "Review visible features with thoughtful caveats.", step3: "Build your ritual", step3sub: "Explore gentle ingredients and everyday care.",
    analyze: "Analyze my selfie", analyzing: "Reviewing visible skin features…", choose: "Choose a selfie", remove: "Remove photo",
    skinType: "How does your skin usually feel?", dry: "Dry / tight", balanced: "Balanced", oily: "Oily / shiny", combo: "Combination", sensitive: "Sensitive / easily irritated",
    concernsQ: "What would you like help with?", acne: "Breakouts", spots: "Dark spots / uneven tone", texture: "Texture / pores", dryness: "Dryness", glow: "Dullness",
    ageNote: "Optional context helps personalize general cosmetic guidance. Don't upload anyone else's photo without permission.",
    results: "Your skin notes", estimated: "Estimated appearance indicator", real: "AI image analysis", demo: "Guidance only — no AI image analysis",
    concerns: "Visible features", ingredients: "Ingredients to explore", morning: "Your morning ritual", evening: "Your evening ritual", products: "Product types to consider",
    limitations: "Keep in mind", reset: "Start again", delete: "Delete photo & results", routine: "Consistency over perfection", routineSub: "Keep it simple. Introduce one new active at a time and patch test first.",
    footer: "Skincare guidance, with care.", disclaimer: "GlowScan AI offers cosmetic education, not medical diagnosis or treatment. A selfie cannot reliably determine your skin type or diagnose a condition. Consult a dermatologist for persistent, painful, scarring or worsening concerns.",
    faq: "Your privacy matters", faqSub: "The selfie is sent to the configured AI provider only when you request analysis. GlowScan AI does not save it to a database; this browser page may keep it in memory until you remove it or close the page. The provider's API data policies apply.",
    empty: "Upload a selfie to begin your personal skin check.", tryAgain: "Try again"
  },
  hi: {
    nav: "Aapki skin, behtar samajh ke saath.", heroTag: "AAPKA PERSONAL SKIN COMPANION",
    title1: "Thodi aur care.", title2: "Aur zyada aap.",
    subtitle: "Apni skin ke visible features samjhein aur apni needs ke hisaab se simple routine banayein — beauty standards ke pressure ke bina.",
    upload: "Skin check shuru karein", privacy: "Privacy ko dhyan mein rakhkar", noSave: "Aapki photo is session mein rehti hai",
    how: "Simple routine, aapke liye personal", howSub: "Ek aisi skincare routine ke liye teen chhote steps jo aapko suit kare.",
    step1: "Selfie upload karein", step1sub: "Natural light use karein, filters nahi.", step2: "Insights dekhein", step2sub: "Visible features ko limitations ke saath samjhein.", step3: "Apna routine banayein", step3sub: "Gentle ingredients aur daily care explore karein.",
    analyze: "Meri selfie analyze karein", analyzing: "Visible skin features check ho rahe hain…", choose: "Selfie choose karein", remove: "Photo hatayein",
    skinType: "Aapki skin aam taur par kaisi feel hoti hai?", dry: "Dry / khinchi hui", balanced: "Balanced", oily: "Oily / shiny", combo: "Combination", sensitive: "Sensitive / jaldi irritate hoti hai",
    concernsQ: "Aap kis cheez mein help chahte hain?", acne: "Pimples / breakouts", spots: "Dark spots / uneven tone", texture: "Texture / pores", dryness: "Dryness", glow: "Dullness",
    ageNote: "Optional details se general cosmetic guidance personal ho sakti hai. Kisi aur ki photo bina permission upload na karein.",
    results: "Aapki skin notes", estimated: "Estimated appearance indicator", real: "AI image analysis", demo: "Sirf general guidance — AI analysis nahi hua",
    concerns: "Visible features", ingredients: "Explore karne layak ingredients", morning: "Morning routine", evening: "Night routine", products: "Product types jo consider kar sakte hain",
    limitations: "Kuch zaroori baatein", reset: "Dobara shuru karein", delete: "Photo aur results delete karein", routine: "Perfection nahi, consistency", routineSub: "Routine simple rakhein. Ek waqt mein ek naya active shuru karein aur pehle patch test karein.",
    footer: "Skincare guidance, care ke saath.", disclaimer: "GlowScan AI cosmetic education deta hai, medical diagnosis ya treatment nahi. Selfie se skin type ya condition ka pakka diagnosis nahi hota. Persistent, painful, scarring ya badhti problem ke liye dermatologist se consult karein.",
    faq: "Aapki privacy zaroori hai", faqSub: "Selfie sirf analysis request karne par configured AI provider ko bheji jaati hai. GlowScan AI ise database mein save nahi karta; page khula rehne tak photo browser memory mein reh sakti hai. Provider ki API data policies apply hoti hain.",
    empty: "Apna personal skin check shuru karne ke liye selfie upload karein.", tryAgain: "Phir try karein"
  }
};

export default function GlowScan() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [skinFeel, setSkinFeel] = useState("balanced");
  const [goals, setGoals] = useState<string[]>(["glow"]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [certificateName, setCertificateName] = useState("");
  const [certificateEmail, setCertificateEmail] = useState("");
  const [certificateConsent, setCertificateConsent] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [photoConsent, setPhotoConsent] = useState(false);
  const [photoQuality, setPhotoQuality] = useState<{ ok: boolean; issues: string[] } | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardName, setLeaderboardName] = useState("");
  const [leaderboardSaved, setLeaderboardSaved] = useState(false);
  const [publicLeaderboardConsent, setPublicLeaderboardConsent] = useState(false);
  const [routineDone, setRoutineDone] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("glowscan-history-v1");
      const savedRoutine = localStorage.getItem("glowscan-routine-v1");
      if (savedHistory) setScanHistory(JSON.parse(savedHistory));
      if (savedRoutine) setRoutineDone(JSON.parse(savedRoutine));
    } catch { /* Ignore unavailable or invalid local browser storage. */ }
    setHistoryReady(true);
  }, []);

  useEffect(() => {
    if (!historyReady) return;
    try { localStorage.setItem("glowscan-history-v1", JSON.stringify(scanHistory.slice(0, 12))); } catch { /* Local history is optional. */ }
  }, [scanHistory, historyReady]);

  useEffect(() => {
    if (!historyReady) return;
    try { localStorage.setItem("glowscan-routine-v1", JSON.stringify(routineDone)); } catch { /* Routine checklist is optional. */ }
  }, [routineDone, historyReady]);

  useEffect(() => {
    let active = true;
    fetch("/api/leaderboard", { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load leaderboard");
        return data.entries as PublicLeaderboardRow[];
      })
      .then(rows => {
        if (active) setLeaderboard(rows.map(row => ({
          id: row.id, name: row.display_name, score: row.score,
          certified: row.certificate_eligible, date: row.created_at
        })));
      })
      .catch(() => { /* The UI shows setup guidance when the public board is unavailable. */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    return () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); };
  }, [preview]);

  function chooseFile(f?: File) {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError(lang === "hi" ? "JPG, PNG ya WebP image choose karein." : "Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError(lang === "hi" ? "Image 5 MB se chhoti honi chahiye." : "Please choose an image under 5 MB.");
      return;
    }
    setError("");
    setAnalysis(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setPhotoQuality(null);
  }

  async function checkPhotoQuality(fileToCheck: File): Promise<{ ok: boolean; issues: string[] }> {
    const issues: string[] = [];
    try {
      const bitmap = await createImageBitmap(fileToCheck);
      if (bitmap.width < 600 || bitmap.height < 600) issues.push(lang === "hi" ? "Photo ka resolution kam hai; 600×600 ya usse zyada use karein." : "Image resolution is low; use at least 600×600 pixels.");
      const canvas = document.createElement("canvas");
      const w = 160, h = Math.max(1, Math.round(bitmap.height * (w / bitmap.width)));
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let sum = 0, sumSq = 0, n = 0;
        for (let i = 0; i < data.length; i += 16) {
          const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          sum += lum; sumSq += lum * lum; n++;
        }
        const mean = sum / n;
        const variance = Math.max(0, sumSq / n - mean * mean);
        if (mean < 45) issues.push(lang === "hi" ? "Photo bahut dark lag rahi hai; soft natural light mein dobara lein." : "The photo appears very dark; retake in soft natural light.");
        if (mean > 225) issues.push(lang === "hi" ? "Photo bahut bright/overexposed lag rahi hai; direct flash se bachein." : "The photo appears overexposed; avoid direct flash.");
        if (variance < 170) issues.push(lang === "hi" ? "Photo low-contrast ya blur ho sakti hai; camera clean karke dobara lein." : "The photo may be blurry or low-contrast; clean the camera and retake.");
      }
      bitmap.close();
    } catch {
      issues.push(lang === "hi" ? "Photo quality check complete nahi ho paya; clear photo use karein." : "Could not complete the quality check; please use a clear image.");
    }
    return { ok: issues.length === 0, issues };
  }

  function removePhoto() {
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(""); setFile(null); setAnalysis(null); setError(""); setPhotoQuality(null); setPhotoConsent(false); setUserMessage("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function analyze() {
    if (!file) {
      setError(lang === "hi" ? "Pehle selfie upload karein." : "Please upload a selfie first.");
      return;
    }
    if (!photoConsent) {
      setError(lang === "hi" ? "Analysis se pehle photo processing ke liye consent dein." : "Please consent to image processing before analysis.");
      return;
    }
    setLoading(true); setError(""); setAnalysis(null);
    try {
      const quality = await checkPhotoQuality(file);
      setPhotoQuality(quality);
      if (!quality.ok) {
        setLoading(false);
        setError(lang === "hi" ? "Photo quality recommendations follow karein aur phir analysis dobara start karein. Agar aap phir bhi continue karna chahte hain, pehle photo retake karein." : "Please follow the photo quality tips and retake your selfie before analysis for more reliable observations.");
        return;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read image"));
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, answers: { skinFeel, goals, language: lang, userMessage: userMessage.trim() } })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Analysis failed");
      setAnalysis(result);
      if (result.mode === "real_ai" && typeof result.score === "number") {
        const record: ScanRecord = { date: new Date().toISOString(), score: result.score, summary: String(result.summary || "Skin check completed"), concerns: Array.isArray(result.concerns) ? result.concerns.slice(0, 6).map((c: {name?: string}) => String(c.name || "Visible feature")) : [] };
        setScanHistory(old => [record, ...old.filter(item => item.date.slice(0, 10) !== record.date.slice(0, 10))].slice(0, 12));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally { setLoading(false); }
  }

  async function submitLeaderboardEntry() {
    if (!publicLeaderboardConsent) {
      setError(lang === "hi" ? "Leaderboard par naam aur score public dikhane ke liye consent dein." : "Please consent to displaying your name and score publicly before joining the leaderboard.");
      return;
    }
    if (!analysis || analysis.mode !== "real_ai" || typeof analysis.score !== "number" || !analysis.leaderboardToken) {
      setError(lang === "hi" ? "Public leaderboard ke liye valid AI scan token zaroori hai. Server setup check karein aur naya scan karein." : "A verified AI scan token is required. Check server setup and run a new scan.");
      return;
    }
    const name = leaderboardName.trim().replace(/[<>]/g, "").slice(0, 32);
    if (!name) {
      setError(lang === "hi" ? "Leaderboard mein naam dikhane ke liye apna display name likhein." : "Enter a display name to join the leaderboard.");
      return;
    }
    setError("");
    try {
      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name, token: analysis.leaderboardToken })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Leaderboard submission failed");
      const row = data.entry as PublicLeaderboardRow;
      if (row) {
        const entry: LeaderboardEntry = { id: row.id, name: row.display_name, score: row.score, certified: row.certificate_eligible, date: row.created_at };
        setLeaderboard(old => [entry, ...old.filter(item => item.id !== entry.id)]
          .sort((a, b) => b.score - a.score || Number(b.certified) - Number(a.certified) || a.date.localeCompare(b.date)).slice(0, 50));
      }
      setLeaderboardSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Leaderboard submission failed");
    }
  }

  function downloadCertificate() {
    if (!analysis || analysis.mode !== "real_ai" || analysis.score === null || analysis.score < 80) return;
    if (!certificateName.trim() || !certificateConsent) {
      setError(lang === "hi" ? "Certificate ke liye naam aur consent zaroori hai." : "Please enter your name and consent to create the certificate.");
      return;
    }
    const safeName = certificateName.trim().replace(/[<>&"]/g, "");
    const date = new Date().toLocaleDateString(lang === "hi" ? "en-IN" : "en-US", { year: "numeric", month: "long", day: "numeric" });
    const score = analysis.score;
    const certificateId = "GSAI-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + Math.random().toString(36).slice(2,8).toUpperCase();
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>GlowScan AI Certificate</title><style>
      @page{size:A4 landscape;margin:0}*{box-sizing:border-box}body{margin:0;background:#f7f0ea;font-family:Arial,sans-serif;color:#332a28;display:grid;place-items:center;min-height:100vh}
      .sheet{width:1120px;height:790px;background:#fffdf9;border:2px solid #b98c7d;padding:28px;position:relative}
      .inner{height:100%;border:1px solid #d9b9ac;padding:45px 65px;text-align:center;position:relative;overflow:hidden}
      .brand{font-size:22px;letter-spacing:2px;font-weight:bold}.brand span{color:#b47e70}.eyebrow{font-size:11px;letter-spacing:4px;color:#9b7467;margin-top:42px}
      h1{font-family:Georgia,serif;font-size:51px;font-weight:normal;margin:17px 0;color:#382d2a}.subtitle{font-size:15px;color:#82736b}
      .name{font-family:Georgia,serif;font-size:42px;color:#9d6e61;border-bottom:1px solid #c8a398;display:inline-block;min-width:430px;padding:12px 25px;margin:24px 0 14px}
      .desc{font-size:14px;line-height:1.8;max-width:690px;margin:0 auto;color:#685b55}.score{font-size:24px;margin:23px 0 8px}.score strong{font-size:38px;color:#9b6d60}
      .note{font-size:10px;color:#91837b;max-width:740px;margin:17px auto 0;line-height:1.6}
      .bottom{position:absolute;bottom:35px;left:65px;right:65px;display:flex;justify-content:space-between;align-items:end;font-size:10px;color:#76665e}
      .seal{width:75px;height:75px;border:2px solid #b98c7d;border-radius:50%;display:grid;place-items:center;color:#9b6d60;font-size:10px;line-height:1.3;font-weight:bold}
      .signature{border-top:1px solid #bfa59b;padding-top:8px;min-width:170px}.id{font-size:9px;margin-top:5px}
      @media print{body{background:white}.sheet{width:100vw;height:100vh}}
      </style></head><body><main class="sheet"><div class="inner">
      <div class="brand">✦ GlowScan<span> AI</span></div><div class="eyebrow">CERTIFICATE OF SKINCARE SELF-CARE</div>
      <h1>Certificate of Recognition</h1><div class="subtitle">Presented with appreciation for your commitment to personal skincare</div>
      <div class="name">${safeName.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
      <p class="desc">This certificate recognizes your participation in the GlowScan AI skincare check and your interest in building a thoughtful, consistent self-care routine.</p>
      <div class="score">GlowScan AI result: <strong>${score}/100</strong></div>
      <p class="desc">Keep caring for your skin with patience, kindness, and evidence-informed choices.</p>
      <p class="note">This is a non-medical, digitally generated participation/recognition certificate. The score is an AI-estimated visible-skin appearance indicator, not an objective beauty ranking, medical assessment, or proof of skin health. Results may be affected by lighting, image quality, makeup, and other factors.</p>
      <div class="bottom"><div><div class="signature">GlowScan AI · Digital Certificate</div><div class="id">Certificate ID: ${certificateId}</div><div>Issued: ${date}</div></div><div class="seal">GLOW<br>WITH<br>CARE</div></div>
      </div></main><script>window.onload=()=>setTimeout(()=>window.print(),350)</script></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "GlowScan-AI-Certificate.html";
    a.click();
    URL.revokeObjectURL(url);
    setError("");
  }

  const labels: Record<string, string> = {
    dry: t.dry, balanced: t.balanced, oily: t.oily, combo: t.combo, sensitive: t.sensitive,
    acne: t.acne, spots: t.spots, texture: t.texture, dryness: t.dryness, glow: t.glow
  };
  const goalOptions = ["acne", "spots", "texture", "dryness", "glow"];

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#" aria-label="GlowScan AI home">
          <span className="brand-mark"><Sparkles size={20}/></span>
          <span>GlowScan<span className="brand-ai"> AI</span><small>SKINCARE, MADE PERSONAL</small></span>
        </a>
        <nav className={menuOpen ? "nav-links open" : "nav-links"}>
          <a href="#how">{lang === "hi" ? "Kaise kaam karta hai" : "How it works"}</a>
          <a href="#leaderboard">{lang === "hi" ? "Ranking" : "Leaderboard"}</a>
          <a href="#privacy">{lang === "hi" ? "Privacy" : "Privacy"}</a>
          <button className="lang-toggle" onClick={() => setLang(lang === "en" ? "hi" : "en")}>{lang === "en" ? "हिंदी" : "English"}</button>
        </nav>
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X/> : <Menu/>}</button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot"/>{t.heroTag}</div>
          <h1>{t.title1}<br/><em>{t.title2}</em></h1>
          <p>{t.subtitle}</p>
          <a className="primary-btn" href="#scanner">{t.upload}<ArrowRight size={18}/></a>
          <div className="trust-row"><span><LockKeyhole size={15}/>{t.privacy}</span><span><ShieldCheck size={15}/>{t.noSave}</span></div>
        </div>
        <div className="hero-art">
          <div className="hero-glow"/>
          <div className="portrait-frame">
            <img src="https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=900&q=85" alt="Skincare portrait" />
            <div className="scan-line"/>
            <div className="floating-tag tag-top"><Sparkles size={15}/> Thoughtful skin insights</div>
            <div className="floating-tag tag-bottom"><Heart size={15}/> Care, not comparison</div>
          </div>
          <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
          <span className="art-sparkle s1">✳</span><span className="art-sparkle s2">✦</span>
        </div>
      </section>

      <section className="feature-strip">
        <div><ScanFace/><span><b>{lang === "hi" ? "Visible features" : "Visible features"}</b><small>{lang === "hi" ? "Photo se milne wale clues" : "Image-based observations"}</small></span></div>
        <div><FlaskConical/><span><b>{lang === "hi" ? "Ingredient guidance" : "Ingredient guidance"}</b><small>{lang === "hi" ? "Simple aur thoughtful" : "Simple, considered choices"}</small></span></div>
        <div><ShieldCheck/><span><b>{lang === "hi" ? "Privacy-first" : "Privacy-first"}</b><small>{lang === "hi" ? "No account required" : "No account required"}</small></span></div>
      </section>

      <section className="how-section section-wrap" id="how">
        <div className="section-heading"><div className="eyebrow">{lang === "hi" ? "AASAN PROCESS" : "THE GLOWSCAN WAY"}</div><h2>{t.how}</h2><p>{t.howSub}</p></div>
        <div className="steps-grid">
          <article className="step-card"><span className="step-number">01</span><div className="step-icon peach"><Camera/></div><h3>{t.step1}</h3><p>{t.step1sub}</p></article>
          <article className="step-card"><span className="step-number">02</span><div className="step-icon lilac"><Sparkles/></div><h3>{t.step2}</h3><p>{t.step2sub}</p></article>
          <article className="step-card"><span className="step-number">03</span><div className="step-icon sage"><Leaf/></div><h3>{t.step3}</h3><p>{t.step3sub}</p></article>
        </div>
      </section>

      <section className="advanced-section section-wrap" aria-labelledby="advanced-title">
        <div className="section-heading"><div className="eyebrow">BUILT FOR EVERYDAY CARE</div><h2 id="advanced-title">Smarter tools. Gentler skincare.</h2><p>Useful features designed to make your routine clearer, more consistent, and easier to use on any screen.</p></div>
        <div className="advanced-grid">
          <article><span><ScanFace/></span><h3>Photo quality gate</h3><p>Basic resolution, brightness and contrast checks before the AI request.</p></article>
          <article><span><Sparkles/></span><h3>Personal context</h3><p>Add your goals, routine and product reactions to guide general recommendations.</p></article>
          <article><span><Clock3/></span><h3>Private progress log</h3><p>Save score summaries locally in this browser; photos and notes are not stored in the log.</p></article>
          <article><span><Check/></span><h3>Routine checklist</h3><p>Tick off daily AM/PM steps and keep the checklist on this device.</p></article>
          <article><span><Download/></span><h3>Shareable recognition</h3><p>Create a non-medical recognition certificate when eligible.</p></article>
          <article><span><ShieldCheck/></span><h3>Privacy controls</h3><p>Remove the photo, clear local progress, and choose whether to send a selfie for analysis.</p></article>
        </div>
      </section>

      <section className="scanner-section" id="scanner">
        <div className="section-wrap scanner-wrap">
          <div className="section-heading scanner-heading"><div className="eyebrow"><span className="eyebrow-dot"/> PERSONAL SKIN CHECK</div><h2>{lang === "hi" ? "Aapki skin ki kahani." : "Let's get to know your skin."}</h2><p>{t.empty}</p></div>
          <div className="scanner-grid">
            <div className="upload-card">
              <div className="card-topline"><span>01 / PHOTO</span><span className="soft-pill"><LockKeyhole size={12}/> PRIVATE SESSION</span></div>
              {!preview ? <button className="upload-zone" onClick={() => inputRef.current?.click()}>
                <span className="upload-icon"><Upload/></span><strong>{t.choose}</strong><span>JPG, PNG or WebP · Max 5 MB</span><span className="browse-btn">{lang === "hi" ? "Photo browse karein" : "Browse photo"}</span>
              </button> : <div className="preview-zone"><img src={preview} alt="Your uploaded selfie preview"/><div className="preview-shade"/><span className="photo-ready"><Check size={14}/> Photo ready</span><button className="remove-photo" onClick={removePhoto}><Trash2 size={15}/>{t.remove}</button></div>}
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => chooseFile(e.target.files?.[0])}/>
              <p className="upload-hint"><CircleHelp size={14}/> {lang === "hi" ? "Natural light, face seedha, filters ke bina." : "Natural light, face forward, no beauty filters."}</p>
              <div className="photo-safety"><ShieldCheck size={17}/><span>{lang === "hi" ? "Photo is page se automatically save nahi hoti. Delete button se preview hata sakte hain." : "The photo is not automatically saved by this page. Remove the preview any time."}</span></div>
            </div>
            <div className="question-card">
              <div className="card-topline"><span>02 / YOUR ROUTINE</span><span className="optional-label">OPTIONAL</span></div>
              <h3>{t.skinType}</h3>
              <div className="choice-list">
                {["dry", "balanced", "oily", "combo", "sensitive"].map(v => <button key={v} className={skinFeel === v ? "choice selected" : "choice"} onClick={() => setSkinFeel(v)}><span className="choice-dot"/>{labels[v]}{skinFeel === v && <Check size={15}/>}</button>)}
              </div>
              <div className="question-divider"/>
              <h3>{t.concernsQ}</h3>
              <div className="goal-list">{goalOptions.map(v => <button key={v} className={goals.includes(v) ? "goal selected" : "goal"} onClick={() => setGoals(old => old.includes(v) ? old.filter(x => x !== v) : [...old, v])}>{labels[v]}{goals.includes(v) && <Check size={13}/>}</button>)}</div>
              <p className="small-note">{t.ageNote}</p>
            </div>
          </div>
          <div className="quality-message-grid">
            <section className="quality-card">
              <div className="card-topline"><span>03 / PHOTO QUALITY</span><span className="soft-pill"><ScanFace size={12}/> CAREFUL SCAN</span></div>
              <h3>{lang === "hi" ? "Best result ke liye selfie kaise lein?" : "Help us review your photo carefully"}</h3>
              <ul className="quality-tips">
                <li><Check size={15}/>{lang === "hi" ? "Face seedha, poora face frame mein aur bina filter ke." : "Face forward, fully in frame, without beauty filters."}</li>
                <li><Check size={15}/>{lang === "hi" ? "Soft natural daylight; direct flash aur heavy shadows se bachein." : "Soft natural daylight; avoid direct flash and strong shadows."}</li>
                <li><Check size={15}/>{lang === "hi" ? "Camera lens saaf ho aur image sharp ho." : "Clean camera lens and keep the image sharp."}</li>
                <li><Check size={15}/>{lang === "hi" ? "Makeup ya filters visible features ko chhupa sakte hain." : "Makeup and filters can obscure visible features."}</li>
              </ul>
              {photoQuality && <div className={photoQuality.ok ? "quality-status good" : "quality-status warning"}>{photoQuality.ok ? (lang === "hi" ? "Basic image quality checks pass hue. Isse medical accuracy guarantee nahi hoti." : "Basic image-quality checks passed. This does not guarantee medical accuracy.") : photoQuality.issues.join(" ")}</div>}
            </section>
            <section className="message-card">
              <div className="card-topline"><span>04 / YOUR NOTES</span><span className="optional-label">OPTIONAL</span></div>
              <h3>{lang === "hi" ? "Aap kya batana chahenge?" : "Anything you'd like us to know?"}</h3>
              <p>{lang === "hi" ? "Apni concerns, routine, product reactions ya goal likhein. Isse guidance ko context milega, lekin AI isse diagnosis nahi karega." : "Share your concerns, current routine, product reactions, or goals. This adds context, but does not enable diagnosis."}</p>
              <textarea value={userMessage} onChange={e => setUserMessage(e.target.value.slice(0, 700))} maxLength={700} rows={4} placeholder={lang === "hi" ? "Jaise: meri skin jaldi dry ho jaati hai; mujhe gentle routine chahiye..." : "For example: my skin feels dry after cleansing; I'd like a gentle routine..."} />
              <div className="char-count">{userMessage.length}/700</div>
            </section>
          </div>
          <label className="consent-line photo-consent"><input type="checkbox" checked={photoConsent} onChange={e => setPhotoConsent(e.target.checked)}/><span>{lang === "hi" ? "Main consent deta/deti hoon ki meri selfie analysis ke liye configured AI provider ko bheji jaaye. Main samajhta/samajhti hoon ki photo se genuine medical diagnosis guarantee nahi hota." : "I consent to sending my selfie to the configured AI provider for analysis. I understand a photo cannot guarantee a genuine medical diagnosis."}</span></label>
          {error && <div className="error-message" role="alert">{error}</div>}
          <button className="analyze-btn" disabled={!file || loading} onClick={analyze}>{loading ? <><span className="spinner"/>{t.analyzing}</> : <>{t.analyze}<ArrowRight size={18}/></>}</button>
          <p className="under-button"><LockKeyhole size={13}/> {lang === "hi" ? "Analysis request karne par hi photo server ko bheji jaati hai." : "Your image is sent for processing only when you request analysis."}</p>
        </div>
      </section>

      {analysis && <section className="results-section section-wrap" id="results">
        <div className="result-header"><div><div className="eyebrow">{t.results.toUpperCase()}</div><h2>{lang === "hi" ? "Aapke liye, aapki skin ke hisaab se." : "A little insight. A gentler routine."}</h2></div><button className="outline-btn" onClick={() => {setAnalysis(null); document.getElementById("scanner")?.scrollIntoView({behavior:"smooth"});}}><RotateCcw size={15}/>{t.reset}</button></div>
        <div className={analysis.mode === "real_ai" ? "mode-banner real-mode" : "mode-banner demo-mode"}><span className="mode-dot"/><span><b>{analysis.mode === "real_ai" ? t.real : t.demo}</b><small>{analysis.mode === "real_ai" ? "AI-generated observations — not a diagnosis" : "No score has been fabricated. Configure the server AI key for real analysis."}</small></span></div>
        {analysis.score !== null && <div className="score-card">
          <div className="score-ring" style={{"--score": `${analysis.score * 3.6}deg`} as React.CSSProperties}><div><strong>{analysis.score}</strong><small>/100</small></div></div>
          <div className="score-copy"><span className="score-label">{t.estimated}</span><h3>{analysis.score >= 80 ? (lang === "hi" ? "Aapki routine ko support karein" : "Keep supporting your skin") : analysis.score >= 60 ? (lang === "hi" ? "Chhote steps se shuru karein" : "Small steps can help") : (lang === "hi" ? "Gentle care se shuru karein" : "Start with gentle care")}</h3><p>{analysis.summary}</p><small>Not a measure of beauty, health, or personal worth.</small></div>
        </div>}
        <p className="result-summary">{analysis.summary}</p>
        {userMessage.trim() && <p className="context-note"><Check size={14}/> {lang === "hi" ? "Aapke notes ko routine guidance ke context ke roop mein consider kiya gaya. Ye independently verify nahi hue." : "Your note was considered as context for routine guidance; it was not independently verified."}</p>}
        {analysis.concerns?.length > 0 && <div className="result-block"><h3><ScanFace/>{t.concerns}</h3><div className="concern-grid">{analysis.concerns.map((c,i)=><article key={i} className="concern-item"><span className="concern-level">{c.level}</span><h4>{c.name}</h4><p>{c.detail}</p></article>)}</div></div>}
        {analysis.ingredients?.length > 0 && <div className="result-block"><h3><FlaskConical/>{t.ingredients}</h3><div className="ingredient-grid">{analysis.ingredients.map((item,i)=><article key={i} className="ingredient-item"><div className="ingredient-icon"><Droplets/></div><h4>{item.name}</h4><p>{item.why}</p><small><b>How to start:</b> {item.howToStart}</small><small className="caution-text"><b>Care note:</b> {item.caution}</small></article>)}</div></div>}
        <div className="routine-grid">
          <article className="routine-card morning"><div className="routine-title"><span><Sun/></span><div><small>EVERY MORNING</small><h3>{t.morning}</h3></div></div><ol>{(analysis.morning || []).map((s,i)=><li key={i}><span>{String(i+1).padStart(2,"0")}</span>{s}</li>)}</ol><div className="routine-checks"><b>Today's checklist</b>{(analysis.morning || []).map((step,i)=>{const key=`${new Date().toISOString().slice(0,10)}-am-${i}`;return <label key={key}><input type="checkbox" checked={!!routineDone[key]} onChange={e=>setRoutineDone(old=>({...old,[key]:e.target.checked}))}/>{step}</label>})}</div></article>
          <article className="routine-card evening"><div className="routine-title"><span><Moon/></span><div><small>EVERY EVENING</small><h3>{t.evening}</h3></div></div><ol>{(analysis.evening || []).map((s,i)=><li key={i}><span>{String(i+1).padStart(2,"0")}</span>{s}</li>)}</ol><div className="routine-checks"><b>Tonight's checklist</b>{(analysis.evening || []).map((step,i)=>{const key=`${new Date().toISOString().slice(0,10)}-pm-${i}`;return <label key={key}><input type="checkbox" checked={!!routineDone[key]} onChange={e=>setRoutineDone(old=>({...old,[key]:e.target.checked}))}/>{step}</label>})}</div></article>
        </div>
        {analysis.productTypes && analysis.productTypes.length > 0 && <div className="result-block"><h3><Heart/>{t.products}</h3><div className="product-chips">{analysis.productTypes.map((p,i)=><span key={i}>{p}</span>)}</div></div>}
        {analysis.limitations && analysis.limitations.length > 0 && <div className="limitations"><h3><CircleHelp/>{t.limitations}</h3><ul>{analysis.limitations.map((l,i)=><li key={i}>{l}</li>)}</ul></div>}
        {analysis.mode === "real_ai" && analysis.score !== null && analysis.score >= 80 && <section className="certificate-card">
          <div className="certificate-ornament"><Award size={30}/></div>
          <div className="eyebrow">{lang === "hi" ? "SPECIAL RECOGNITION" : "SPECIAL RECOGNITION"}</div>
          <h3>{lang === "hi" ? "Aapka Glow Recognition Certificate" : "Your Glow Recognition Certificate"}</h3>
          <p>{lang === "hi" ? "Agar aapka real AI score 80 ya usse zyada hai, toh aap apne naam ke saath ek professional digital certificate bana sakte hain." : "With a real AI score of 80 or above, you can generate a professional digital recognition certificate with your name."}</p>
          <div className="certificate-form">
            <label>{lang === "hi" ? "Certificate par naam" : "Name on certificate"}
              <input value={certificateName} onChange={e => setCertificateName(e.target.value)} maxLength={70} placeholder={lang === "hi" ? "Apna poora naam likhein" : "Enter your full name"} />
            </label>
            <label>{lang === "hi" ? "Email (optional; saved nahi hota)" : "Email (optional; not stored)"}
              <input value={certificateEmail} onChange={e => setCertificateEmail(e.target.value)} maxLength={120} type="email" placeholder="you@example.com" />
            </label>
          </div>
          <label className="consent-line"><input type="checkbox" checked={certificateConsent} onChange={e => setCertificateConsent(e.target.checked)}/><span>{lang === "hi" ? "Main samajhta/samajhti hoon ki yeh non-medical recognition certificate hai, official qualification ya skin-health certification nahi." : "I understand this is a non-medical recognition certificate, not an official qualification or skin-health certification."}</span></label>
          <button className="certificate-btn" onClick={downloadCertificate}><Download size={17}/>{lang === "hi" ? "Certificate banayein / Print karein" : "Create certificate / Print"}</button>
          <small className="certificate-disclaimer"><BadgeCheck size={14}/> {lang === "hi" ? "Sirf real AI analysis aur score 80+ par available. Demo result par certificate nahi milega." : "Available only for real AI analysis with a score of 80+. Demo results do not qualify."}</small>
        </section>}
        <div className="routine-reminder"><Sparkles/><div><b>{t.routine}</b><p>{t.routineSub}</p></div></div>
        <p className="medical-note">{analysis.caution || t.disclaimer}</p>
        <button className="delete-results" onClick={removePhoto}><Trash2 size={15}/>{t.delete}</button>
      </section>}

      <section className="leaderboard-section section-wrap" id="leaderboard">
        <div className="section-heading">
          <div className="eyebrow">FRIENDLY SELF-CARE CHALLENGE</div>
          <h2>{lang === "hi" ? "Glow leaderboard" : "Glow leaderboard"}</h2>
          <p>{lang === "hi" ? "Sabhi users ke verified real-AI scores ki public ranking. 80+ score par certificate eligibility tie-breaker hai." : "Public rankings combine verified real-AI scores from all users. Certificate eligibility at 80+ is used as a tie-breaker."}</p>
        </div>
        {analysis?.mode === "real_ai" && typeof analysis.score === "number" && (
          <div className="leaderboard-submit">
            <label>{lang === "hi" ? "Aapka display name" : "Your display name"}
              <input value={leaderboardName} onChange={e => { setLeaderboardName(e.target.value); setLeaderboardSaved(false); }} maxLength={32} placeholder={lang === "hi" ? "Jaise: GlowStar" : "e.g. GlowStar"} />
            </label>
            <label className="leaderboard-consent"><input type="checkbox" checked={publicLeaderboardConsent} onChange={e => setPublicLeaderboardConsent(e.target.checked)} /><span>{lang === "hi" ? "Main samajhta/samajhti hoon ki mera display name aur score sab visitors ko public dikhai dega. Main apna legal name use karne ke liye majboor nahi hoon." : "I understand my display name and score will be public to all visitors. I do not need to use my legal name."}</span></label>
            <button className="certificate-btn" onClick={submitLeaderboardEntry}><Award size={17}/>{leaderboardSaved ? (lang === "hi" ? "Ranking update karein" : "Update leaderboard entry") : (lang === "hi" ? "Leaderboard mein shamil hon" : "Join leaderboard")}</button>
            {leaderboardSaved && <small className="leaderboard-note"><Check size={14}/> {lang === "hi" ? "Entry public leaderboard par dikh rahi hai." : "Your entry is visible on the public leaderboard."}</small>}
          </div>
        )}
        {leaderboard.length > 0 ? (
          <div className="leaderboard-list">
            {[...leaderboard].sort((a, b) => b.score - a.score || Number(b.certified) - Number(a.certified) || a.date.localeCompare(b.date)).slice(0, 10).map((entry, index) => (
              <article className={"leaderboard-row" + (entry.name.toLowerCase() === leaderboardName.trim().toLowerCase() ? " leaderboard-self" : "")} key={entry.id}>
                <span className={"leaderboard-rank rank-" + (index + 1)}>{index + 1}</span>
                <div className="leaderboard-person"><b>{entry.name}</b><small>{new Date(entry.date).toLocaleDateString(lang === "hi" ? "en-IN" : "en-US", {day:"numeric", month:"short", year:"numeric"})}{entry.certified ? " · Certificate eligible" : ""}</small></div>
                <strong className="leaderboard-score">{entry.score}<small>/100</small></strong>
              </article>
            ))}
          </div>
        ) : (
          <div className="history-empty"><Award size={24}/><h3>{lang === "hi" ? "Abhi leaderboard khaali hai" : "The public leaderboard is waiting for its first entry"}</h3><p>{lang === "hi" ? "Agar entries nahi dikh rahi, database configuration baaki ho sakta hai. Real AI scan karke display name ke saath score add karein." : "If no entries appear, the public leaderboard database may still need configuration. Complete a real AI scan and add a display name."}</p></div>
        )}
        <p className="history-footnote">{lang === "hi" ? "Important: Yeh public leaderboard hai. Display name aur score sab visitors dekh sakte hain; identity verify nahi hoti. Score skin health ya beauty ka measure nahi hai." : "Important: This is a public leaderboard. Display names and scores are visible to visitors; identities are not verified. A score is not a measure of skin health or beauty."}</p>
      </section>

      <section className="history-section section-wrap" id="progress">
        <div className="result-header"><div><div className="eyebrow">YOUR DEVICE-ONLY DASHBOARD</div><h2>{lang === "hi" ? "Aapka progress log" : "Your progress, at a glance"}</h2><p className="history-intro">{lang === "hi" ? "Sirf score, date aur short summary is browser mein save hote hain — photo aur personal notes nahi." : "Only score, date and a short summary are stored in this browser — not your selfie or personal notes."}</p></div>{scanHistory.length > 0 && <button className="outline-btn" onClick={() => {setScanHistory([]);setRoutineDone({});try{localStorage.removeItem("glowscan-history-v1");localStorage.removeItem("glowscan-routine-v1");}catch{}}}><Trash2 size={15}/>{lang === "hi" ? "History clear karein" : "Clear local history"}</button>}</div>
        {scanHistory.length ? <div className="history-grid">{scanHistory.slice(0,6).map((record,i)=><article className="history-card" key={record.date}><div className="history-top"><span>{new Date(record.date).toLocaleDateString(lang === "hi" ? "en-IN" : "en-US",{day:"numeric",month:"short",year:"numeric"})}</span><b>{record.score}/100</b></div><div className="history-meter"><span style={{width:`${Math.max(0,Math.min(100,record.score))}%`}}/></div><p>{record.summary}</p>{record.concerns.length>0&&<small>{record.concerns.join(" · ")}</small>}</article>)}</div> : <div className="history-empty"><Clock3 size={24}/><h3>{lang === "hi" ? "Abhi koi saved scan nahi" : "No saved scans yet"}</h3><p>{lang === "hi" ? "Configured AI se real scan karne par score history yahan dikh sakti hai." : "After a real scan with AI configured, your score history can appear here."}</p><a className="text-link" href="#scanner">{lang === "hi" ? "Pehla scan karein" : "Start your first scan"} <ArrowRight size={15}/></a></div>}
        <p className="history-footnote">{lang === "hi" ? "Note: Yeh trend medical progress ka proof nahi hai. Lighting aur photo conditions score ko badal sakti hain. Local history browser/device change ya storage clear karne par nahi rahegi." : "This trend is not proof of medical progress. Lighting and photo conditions can change scores. Local history may disappear if browser storage is cleared or you change devices."}</p>
      </section>

      <section className="privacy-section section-wrap" id="privacy">
        <div className="privacy-icon"><ShieldCheck/></div><div><div className="eyebrow">{t.faq}</div><h2>{lang === "hi" ? "Aapki photo, aapka control." : "Your face is personal. So is your data."}</h2><p>{t.faqSub}</p></div>
      </section>
      <section className="closing section-wrap"><div className="closing-flower">✳</div><div className="eyebrow">GLOW AT YOUR OWN PACE</div><h2>{lang === "hi" ? "Care aapke liye hai." : "Care looks different on everyone."}</h2><p>{t.disclaimer}</p><a href="#scanner" className="text-link">{lang === "hi" ? "Apna skin check shuru karein" : "Begin your skin check"} <ArrowRight size={16}/></a></section>
      <footer><a className="brand footer-brand" href="#"><span className="brand-mark"><Sparkles size={18}/></span><span>GlowScan<span className="brand-ai"> AI</span><small>SKINCARE, MADE PERSONAL</small></span></a><span>© {new Date().getFullYear()} GlowScan AI</span><span className="footer-disclaimer">{t.footer}</span></footer>
    </main>
  );
}
