import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BookOpen,
  ScanLine,
  Sparkles,
  UserRound,
  Plus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import {
  dayKey,
  readCare,
  saveProfile,
  profileFrom,
  saveEntries,
  removeEntry,
  clearCare,
  totals,
  number,
} from "./data";
import { MealEditor } from "./MealEditor";
import { InstallApp } from "../components/InstallApp";
import "./care.css";
export function CareNavigation({ section, onSection }) {
  return (
    <nav className="care-nav" aria-label="Main navigation">
      {[
        ["health", "Data", Activity],
        ["diary", "Diary", BookOpen],
        ["scan", "Scan", ScanLine],
        ["ai", "AI", Sparkles],
        ["me", "Me", UserRound],
      ].map(([key, label, Icon]) => (
        <button
          key={key}
          aria-current={section === key ? "page" : undefined}
          onClick={() => onSection(key)}
          className={key === "scan" ? "care-scan" : ""}
        >
          <Icon size={23} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
function Ring({ value = 0, label }) {
  return (
    <svg
      viewBox="0 0 44 44"
      role="img"
      aria-label={label}
      className="care-ring"
    >
      <circle
        cx="22"
        cy="22"
        r="18"
        fill="none"
        stroke="#f1f2f4"
        strokeWidth="4"
      />
      <circle
        cx="22"
        cy="22"
        r="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${Math.min(100, Math.max(0, value)) * 1.131} 113.1`}
        transform="rotate(-90 22 22)"
      />
    </svg>
  );
}
const initial = {
  name: "",
  age: "",
  height: "",
  weight: "",
  target: "",
  goal: "maintain",
  kiosk: false,
  water: 2000,
  calories: "",
  protein: "",
};
function Setup({ profile, onSave, onClose }) {
  const [form, setForm] = useState(profile || initial),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  return (
    <form
      className="care-card care-setup"
      onSubmit={async (e) => {
        e.preventDefault();
        if (lock.current) return;
        lock.current = true;
        setBusy(true);
        try {
          await onSave(profileFrom(form));
        } catch (err) {
          setError(err.message);
        } finally {
          lock.current = false;
          setBusy(false);
        }
      }}
    >
      <div className="care-heading">
        <h2>Your app, your goals</h2>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
      <p>
        Fitness setup is optional. This tracker is designed for adults. Your
        details stay on this device.
      </p>
      <label>
        Your name
        <input
          required
          maxLength={60}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>
      <div className="care-two">
        {[
          ["age", "Age (18+)"],
          ["height", "Height (cm)"],
          ["weight", "Current weight (kg)"],
          ["target", "Target weight (kg)"],
        ].map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              step={key === "age" ? "1" : "0.1"}
              required
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <label>
        Your goal
        <select
          value={form.goal}
          onChange={(e) => setForm({ ...form, goal: e.target.value })}
        >
          <option value="maintain">Maintain weight</option>
          <option value="lose">Lose weight</option>
          <option value="gain">Gain weight</option>
        </select>
      </label>
      <label className="care-check">
        <input
          type="checkbox"
          checked={form.kiosk}
          onChange={(e) => setForm({ ...form, kiosk: e.target.checked })}
        />{" "}
        I have used a Reliv kiosk
      </label>
      <details>
        <summary>Optional daily logging targets</summary>
        <p>
          Use goals agreed with your healthcare professional. These are logging
          goals, not medical recommendations.
        </p>
        <div className="care-two">
          {[
            ["calories", "Calories (kcal)"],
            ["protein", "Protein (g)"],
            ["water", "Water (ml)"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                value={form[key] ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
      </details>
      {error && (
        <p role="alert" className="care-error">
          {error}
        </p>
      )}
      <button className="care-primary" disabled={busy}>
        {busy ? "Saving…" : "Save my setup"} <ArrowRight size={18} />
      </button>
    </form>
  );
}
export function CareHome({ section, onSection, onRecords, onHealth }) {
  const [data, setData] = useState({ profile: null, entries: [] }),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [setup, setSetup] = useState(false),
    [editor, setEditor] = useState(null),
    [tab, setTab] = useState("overview"),
    [page, setPage] = useState(0),
    [expanded, setExpanded] = useState(null),
    [range, setRange] = useState("week"),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const lock = useRef(false),
    alive = useRef(true);
  const p = data.profile;
  useEffect(() => {
    alive.current = true;
    let seq = 0;
    const load = async () => {
      const n = ++seq;
      try {
        const next = await readCare();
        if (alive.current && n === seq) {
          setData(next);
          setLoaded(true);
        }
      } catch (e) {
        if (alive.current) {
          setError(e.message);
          setLoaded(true);
        }
      }
    };
    load();
    window.addEventListener("reliv-fitness-changed", load);
    return () => {
      alive.current = false;
      window.removeEventListener("reliv-fitness-changed", load);
    };
  }, []);
  useEffect(() => {
    setEditor(null);
    setNotice("");
    return () => window.speechSynthesis?.cancel();
  }, [section]);
  useEffect(() => {
    if (!editor) return;
    const frame = requestAnimationFrame(() =>
      document
        .querySelector(".care-editor, .care-weight-editor")
        ?.scrollIntoView({ block: "start", behavior: "auto" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [editor]);
  const today = totals(data.entries),
    days = useMemo(
      () => [...new Set(data.entries.map((e) => e.day))].sort().reverse(),
      [data.entries],
    );
  const weights = data.entries.filter((e) => e.kind === "weight");
  const weight = weights.at(-1)?.amount ?? p?.weight;
  const completion =
    ((Number(today.meals > 0) +
      Number(today.water > 0) +
      Number(today.weights > 0)) /
      3) *
    100;
  const action = async (fn) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const save = (entries) => saveEntries(entries);
  const exportData = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ version: 1, ...data }, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `reliv-fitness-${dayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (!loaded) return <p role="status">Opening your app…</p>;
  if (setup)
    return (
      <div className="care">
        <Setup
          profile={p}
          onClose={() => setSetup(false)}
          onSave={async (profile) => {
            await saveProfile(profile);
            setSetup(false);
            onSection("health");
          }}
        />
      </div>
    );
  const welcome = (
    <section className="care-welcome">
      <span className="care-eyebrow">YOUR EVERYDAY WELLNESS COMPANION</span>
      <h1>
        Healthy choices.
        <br />
        <em>Made simple.</em>
      </h1>
      <p>Pay at Reliv, or make space for healthier habits. Start your way.</p>
      <img
        src="/assets/berry-bowl.jpg"
        alt="A bowl of fresh berries"
        className="care-hero"
      />
      <button className="care-primary" onClick={() => onSection("scan")}>
        <ScanLine /> Scan & Pay <ArrowRight />
      </button>
      <small>Scan the QR on the kiosk to open payment.</small>
      <button className="care-secondary" onClick={() => setSetup(true)}>
        <UserRound /> Set up my app <ArrowRight />
      </button>
      <small>Optional · Track meals, water and weight.</small>
      <button className="care-secondary" onClick={onRecords}>
        My saved health reports
      </button>
      <InstallApp availableOnly />
    </section>
  );
  return (
    <div className="care">
      {error && (
        <p role="alert" className="care-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="care-notice">
          {notice}
        </p>
      )}
      {!p ? (
        welcome
      ) : (
        <>
          {section === "me" ? (
            <>
              <div className="care-title">
                <span className="care-eyebrow">MY RELIV</span>
                <h1>Hello, {p.name}</h1>
                <p>Your goals. Your preferences. Your data.</p>
              </div>
              <section className="care-card">
                <h2>Your setup</h2>
                <p>
                  {p.goal === "gain"
                    ? "Gain"
                    : p.goal === "lose"
                      ? "Lose"
                      : "Maintain"}{" "}
                  weight · {p.target} kg goal
                </p>
                <button
                  className="care-secondary"
                  onClick={() => setSetup(true)}
                >
                  Edit details / Change setup
                </button>
                <button
                  className="care-secondary"
                  disabled={busy}
                  onClick={() =>
                    action(async () => {
                      await saveProfile(null);
                      onSection("health");
                    })
                  }
                >
                  Use Scan & Pay only
                </button>
                <small>
                  Fitness history stays on this device until you delete it.
                </small>
              </section>
              <section className="care-card">
                <h2>Your data on this device</h2>
                <p>
                  No password is required. Anyone using this unlocked browser
                  can view these logs. Clearing browser data or losing this
                  phone may remove them. Cross-device sync is not connected.
                </p>
                <button className="care-secondary" onClick={exportData}>
                  <Download size={18} /> Export fitness data
                </button>
                <button className="care-secondary" onClick={onRecords}>
                  Manage saved kiosk reports
                </button>
                <button
                  className="care-danger"
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Delete your fitness setup and all meals, water and weight logs on this device? Kiosk reports are managed separately.",
                      )
                    )
                      action(() => clearCare());
                  }}
                >
                  Delete fitness data
                </button>
              </section>
              <InstallApp availableOnly />
            </>
          ) : section === "ai" ? (
            <>
              <div className="care-title">
                <span className="care-eyebrow">RELIV ASSISTANT</span>
                <h1>
                  A little help,
                  <br />
                  when you need it.
                </h1>
                <p>Start with a food photo, or review today’s logs.</p>
              </div>
              <section className="care-card">
                <h2>Your day so far</h2>
                <p>
                  You have logged {today.meals} meal entries,{" "}
                  {Math.round(today.kcal)} kcal, {Math.round(today.protein)} g
                  protein and {today.water} ml water today.
                </p>
                <small>
                  Nutrition is estimated. This summary only describes your logs;
                  it does not diagnose your health.
                </small>
                <button
                  className="care-secondary"
                  onClick={() => {
                    if (!window.speechSynthesis) {
                      setNotice(
                        "Spoken responses are unavailable in this browser.",
                      );
                      return;
                    }
                    window.speechSynthesis.cancel();
                    const speech = new SpeechSynthesisUtterance(
                      `You have logged ${today.meals} meal entries, ${Math.round(today.kcal)} calories, ${Math.round(today.protein)} grams of protein and ${today.water} millilitres of water today. These are estimates from your logs.`,
                    );
                    speech.lang = "en-IN";
                    speech.onerror = () =>
                      setNotice(
                        "Audio unavailable. Your summary is shown above.",
                      );
                    window.speechSynthesis.speak(speech);
                  }}
                >
                  Read my summary
                </button>
                <button
                  className="care-primary"
                  onClick={() => setEditor("meal")}
                >
                  Open food logging assistant
                </button>
                <p>
                  Use text, microphone or a photo to prepare a meal entry. This
                  helper uses the nutrition service; it does not diagnose health
                  or change logs without your confirmation.
                </p>
              </section>
            </>
          ) : (
            <>
              <div className="care-title">
                <span className="care-eyebrow">
                  {section === "diary"
                    ? "YOUR DAILY DIARY"
                    : "YOUR WELLNESS, AT A GLANCE"}
                </span>
                <h1>
                  {section === "diary"
                    ? "Small steps. Real progress."
                    : `Welcome, ${p.name} 👋`}
                </h1>
                <p>
                  {new Date().toLocaleDateString(undefined, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  ·{" "}
                  {p.goal === "gain"
                    ? "Weight gain"
                    : p.goal === "lose"
                      ? "Weight loss"
                      : "Maintain weight"}
                </p>
              </div>
              {section === "health" && (
                <div className="care-tabs" aria-label="Fitness views">
                  {[
                    ["overview", "Overview"],
                    ["charts", "Charts"],
                    ["recipes", "Recipes"],
                    ["reports", "Daily reports"],
                  ].map(([key, label]) => (
                    <button
                      aria-pressed={tab === key}
                      key={key}
                      onClick={() => {
                        setTab(key);
                        setEditor(null);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {section === "diary" || tab === "overview" ? (
                <>
                  {section !== "diary" && (
                    <>
                      <section className="care-card care-goal">
                        <div className="care-heading">
                          <h2>
                            {p.goal === "maintain" ? "Maintain" : "Your goal"} ·{" "}
                            {p.target} kg
                          </h2>
                          <span className="care-tag">Self-reported</span>
                        </div>
                        <div className="care-weight">
                          <strong>
                            {weight} <small>kg</small>
                          </strong>
                          <span>
                            Latest weight
                            <br />
                            <small>{weights.at(-1)?.day || "From setup"}</small>
                          </span>
                        </div>
                        <p>
                          Start: {p.weight} kg · Goal: {p.target} kg
                        </p>
                        <button
                          className="care-secondary"
                          onClick={() => setEditor("weight")}
                        >
                          ＋ Log weight
                        </button>
                      </section>
                      <div className="care-metrics">
                        {[
                          ["🔥", "Calories", today.kcal, p.calories, "kcal"],
                          ["🥚", "Protein", today.protein, p.protein, "g"],
                          ["🌾", "Carbs", today.carbs, null, "g"],
                          ["💧", "Water", today.water, p.water, "ml"],
                        ].map(([icon, label, value, target, unit]) => (
                          <section
                            key={label}
                            className="care-card care-metric"
                          >
                            <span>
                              {icon} {label}
                            </span>
                            <div>
                              <strong>
                                {Math.round(value)} <small>{unit}</small>
                              </strong>
                              {target && (
                                <Ring
                                  value={(value / target) * 100}
                                  label={`${label}: ${Math.round(value)} of ${target} ${unit}`}
                                />
                              )}
                            </div>
                            <small>
                              {target
                                ? `of ${target} ${unit} logging goal`
                                : "Logged today · estimated"}
                            </small>
                          </section>
                        ))}
                      </div>
                      <section className="care-card care-progress">
                        <Ring
                          value={completion}
                          label={`${Math.round(completion)}% of daily logging actions complete`}
                        />
                        <div>
                          <h2>Daily logging</h2>
                          <p>
                            {
                              [
                                today.meals > 0,
                                today.water > 0,
                                today.weights > 0,
                              ].filter(Boolean).length
                            }{" "}
                            of 3 actions recorded
                          </p>
                          <small>
                            Meal · Water · Weight. A logging reminder, not a
                            health score.
                          </small>
                        </div>
                      </section>
                      {p.kiosk && (
                        <section className="care-card">
                          <h2>Your kiosk measurements</h2>
                          <p>
                            Only saved kiosk readings appear in health reports.
                            Fitness logs stay separate.
                          </p>
                          <button className="care-secondary" onClick={onHealth}>
                            View health measurements
                          </button>
                          <button
                            className="care-secondary"
                            onClick={onRecords}
                          >
                            Health reports
                          </button>
                          <small>
                            Use the verified payment/report flow to save a kiosk
                            report. Standalone health QR import is not connected
                            yet.
                          </small>
                        </section>
                      )}
                    </>
                  )}
                  <section className="care-card care-water">
                    <div className="care-heading">
                      <h2>💧 Water today</h2>
                      <strong>{today.water} ml</strong>
                    </div>
                    <p>
                      Quickly record a glass. Your logging goal: {p.water} ml.
                    </p>
                    <button
                      disabled={busy}
                      className="care-secondary"
                      onClick={() =>
                        action(async () => {
                          await save([
                            {
                              kind: "water",
                              amount: 250,
                              source: "Self-reported",
                            },
                          ]);
                          setNotice(
                            "250 ml water added. Remove an incorrect entry in your diary.",
                          );
                        })
                      }
                    >
                      ＋ Add 250 ml
                    </button>
                  </section>
                  <div className="care-heading">
                    <h2>
                      {section === "diary" ? "Your entries" : "Meals today"}
                    </h2>
                    <button
                      className="care-pill"
                      onClick={() => setEditor("meal")}
                    >
                      <Plus size={16} /> Add meal
                    </button>
                  </div>
                  {section === "diary" && (
                    <button
                      className="care-secondary"
                      onClick={() => setEditor("weight")}
                    >
                      ＋ Log weight
                    </button>
                  )}
                  {!data.entries.length && (
                    <section className="care-card">
                      <h2>Your first entry starts here</h2>
                      <p>
                        Log a meal, glass of water or weight. Your dashboard
                        fills with your own data.
                      </p>
                    </section>
                  )}
                  {data.entries
                    .filter(
                      (e) =>
                        section === "diary" ||
                        (e.day === dayKey() && e.kind === "meal"),
                    )
                    .slice()
                    .reverse()
                    .slice(0, section === "diary" ? 30 : 10)
                    .map((e) => (
                      <article className="care-card care-entry" key={e.id}>
                        <div>
                          <strong>
                            {e.kind === "meal"
                              ? e.name
                              : e.kind === "water"
                                ? "💧 Water"
                                : "⚖️ Weight"}
                          </strong>
                          <p>
                            {e.kind === "meal"
                              ? `${Math.round(e.kcal)} kcal · ${Math.round(e.protein)} g protein`
                              : `${e.amount} ${e.kind === "water" ? "ml" : "kg"}`}
                          </p>
                          <small>
                            {e.day} ·{" "}
                            {e.source === "illustrative_starter_not_verified"
                              ? "Illustrative nutrition estimate"
                              : e.source}
                          </small>
                        </div>
                        <button
                          aria-label={`Delete ${e.name || e.kind} entry`}
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Remove this entry from your diary?",
                              )
                            )
                              action(() => removeEntry(e.id));
                          }}
                        >
                          Remove
                        </button>
                      </article>
                    ))}
                  {section === "diary" && data.entries.length > 30 && (
                    <p>
                      Showing the latest 30 entries. Older days remain in Daily
                      reports and your export.
                    </p>
                  )}
                </>
              ) : tab === "recipes" ? (
                <>
                  <section className="care-card">
                    <img
                      className="care-recipe-photo"
                      src="/assets/berry-bowl.jpg"
                      alt="Fresh ingredients for a meal"
                    />
                    <h2>From your kitchen</h2>
                    <p>
                      Search ingredients you have, adjust their amounts, and
                      confirm what you ate. Each ingredient is logged separately
                      so you can review it.
                    </p>
                    <button
                      className="care-primary"
                      onClick={() => setEditor("recipe")}
                    >
                      Build a meal with ingredients
                    </button>
                    <small>
                      Nutrition estimates depend on ingredients and portions. No
                      promises of faster weight change.
                    </small>
                  </section>
                </>
              ) : tab === "reports" ? (
                <>
                  <h2>Your daily summaries</h2>
                  <p>Fitness logs only. Five recorded days per page.</p>
                  {days.slice(page * 5, page * 5 + 5).map((day) => {
                    const t = totals(data.entries, day);
                    return (
                      <section className="care-card" key={day}>
                        <button
                          className="care-report-toggle"
                          aria-expanded={expanded === day}
                          onClick={() =>
                            setExpanded(expanded === day ? null : day)
                          }
                        >
                          <strong>{day}</strong>
                          <span>
                            {Math.round(t.kcal)} kcal · {Math.round(t.protein)}{" "}
                            g protein
                          </span>
                          <span>{expanded === day ? "−" : "+"}</span>
                        </button>
                        {expanded === day && (
                          <div>
                            <p>
                              {t.water} ml water · {t.meals} meal entries ·{" "}
                              {t.weights} weight entries
                            </p>
                            {data.entries
                              .filter((e) => e.day === day)
                              .map((e) => (
                                <p key={e.id}>
                                  {e.name || e.kind}:{" "}
                                  {e.kind === "meal"
                                    ? `${Math.round(e.kcal)} kcal`
                                    : e.amount}
                                </p>
                              ))}
                          </div>
                        )}
                      </section>
                    );
                  })}
                  {!days.length && (
                    <p className="care-card">
                      Your first logged day will appear here.
                    </p>
                  )}
                  <div className="care-heading">
                    <button
                      disabled={!page}
                      onClick={() => {
                        setPage(page - 1);
                        setExpanded(null);
                      }}
                    >
                      <ChevronLeft /> Newer
                    </button>
                    <button
                      disabled={(page + 1) * 5 >= days.length}
                      onClick={() => {
                        setPage(page + 1);
                        setExpanded(null);
                      }}
                    >
                      Older <ChevronRight />
                    </button>
                  </div>
                </>
              ) : (
                <section className="care-card">
                  <h2>Weight over time</h2>
                  <label>
                    Time range
                    <select
                      value={range}
                      onChange={(e) => setRange(e.target.value)}
                    >
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                      <option value="all">All time</option>
                    </select>
                  </label>
                  <WeightChart entries={weights} range={range} />
                  <p>
                    Self-reported weight. Target: {p.target} kg. Use consistent
                    weighing conditions when comparing readings.
                  </p>
                </section>
              )}
            </>
          )}
          {editor === "meal" || editor === "recipe" ? (
            <MealEditor
              assistant={section === "ai"}
              recipe={editor === "recipe"}
              onSave={save}
              onClose={() => setEditor(null)}
            />
          ) : editor === "weight" ? (
            <form
              className="care-card care-weight-editor"
              onSubmit={(e) => {
                e.preventDefault();
                const amount = e.currentTarget.elements.weight.value;
                action(async () => {
                  await save([
                    {
                      kind: "weight",
                      amount: number(amount, 25, 350, "weight"),
                      source: "Self-reported",
                    },
                  ]);
                  setEditor(null);
                  setNotice("Weight saved.");
                });
              }}
            >
              <h2>Log your weight</h2>
              <label>
                Weight (kg)
                <input
                  name="weight"
                  type="number"
                  min="25"
                  max="350"
                  step="0.1"
                  required
                  defaultValue={weight}
                />
              </label>
              <button className="care-primary" disabled={busy}>
                Save weight
              </button>
              <button type="button" onClick={() => setEditor(null)}>
                Cancel
              </button>
            </form>
          ) : null}
        </>
      )}
    </div>
  );
}
function WeightChart({ entries, range }) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (range === "week" ? 7 : 30));
  const points = entries
    .filter((e) => range === "all" || new Date(e.at) >= cutoff)
    .slice(-60);
  if (points.length < 2)
    return (
      <p className="care-empty">
        Log weight on two occasions to see a trend. A single reading cannot show
        change.
      </p>
    );
  const min = Math.min(...points.map((e) => e.amount)) - 1,
    max = Math.max(...points.map((e) => e.amount)) + 1;
  return (
    <>
      <svg
        viewBox="0 0 320 160"
        role="img"
        aria-label="Weight trend, with exact readings listed below"
        className="care-chart"
      >
        <polyline
          fill="none"
          stroke="#ed640c"
          strokeWidth="3"
          points={points
            .map(
              (e, i) =>
                `${12 + (i * 296) / (points.length - 1)},${145 - ((e.amount - min) / (max - min)) * 130}`,
            )
            .join(" ")}
        />
        {points.map((e, i) => (
          <circle
            key={e.id}
            cx={12 + (i * 296) / (points.length - 1)}
            cy={145 - ((e.amount - min) / (max - min)) * 130}
            r="4"
            fill="#ed640c"
          >
            <title>
              {e.day}: {e.amount} kg
            </title>
          </circle>
        ))}
      </svg>
      <details>
        <summary>View exact readings ({points.length})</summary>
        {points.map((e) => (
          <p key={e.id}>
            {e.day}: {e.amount} kg
          </p>
        ))}
      </details>
      {entries.length > 60 && (
        <small>
          Chart limited to the latest 60 readings in this range. All entries
          remain in your export.
        </small>
      )}
    </>
  );
}
