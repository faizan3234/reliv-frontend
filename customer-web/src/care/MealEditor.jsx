import React, { useEffect, useRef, useState } from "react";
import { nutrition, photoData } from "./nutrition";
import { confirmedFood, number } from "./data";
export function MealEditor({
  initialText = "",
  onSave,
  onClose,
  recipe = false,
  assistant = false,
}) {
  const [query, setQuery] = useState(initialText),
    [matches, setMatches] = useState([]),
    [items, setItems] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [manual, setManual] = useState({
    name: "",
    kcal: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const recognition = useRef();
  const request = useRef(),
    saving = useRef(false),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      request.current?.abort();
      recognition.current?.abort();
    };
  }, []);
  const run = async (action) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    try {
      await action(controller.signal);
    } catch (e) {
      if (alive.current && !controller.signal.aborted) setError(e.message);
    } finally {
      if (alive.current && request.current === controller) setBusy(false);
    }
  };
  const search = () =>
    run(async (signal) => {
      const data = await nutrition(
        `/api/foods?q=${encodeURIComponent(query)}&limit=12`,
        null,
        signal,
      );
      if (!signal.aborted) setMatches(data.items || []);
    });
  const photo = (file) =>
    run(async (signal) => {
      const image = await photoData(file);
      const data = await nutrition(
        "/api/analyze",
        { image_base64: image },
        signal,
      );
      if (signal.aborted) return;
      if (!Array.isArray(data.items) || !data.items.length)
        throw Error(
          "No food identified. Try better lighting, search by name or enter it manually.",
        );
      setItems(
        data.items.map((item) => ({
          food: item.food,
          amount: item.grams || "",
          percent: 100,
          name: item.detected_name,
        })),
      );
    });
  const parse = () =>
    run(async (signal) => {
      const data = await nutrition("/api/parse-text", { text: query }, signal);
      if (signal.aborted) return;
      if (data.kind !== "generic_food")
        throw Error(data.message || "Search for the exact food variety.");
      setItems((old) => [
        ...old,
        {
          food: data.food,
          amount: data.grams || "",
          percent: 100,
          name: data.food.name,
        },
      ]);
    });
  const dictate = () => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) {
      setError(
        "Voice input is not available in this browser. Type your meal instead.",
      );
      return;
    }
    recognition.current?.abort();
    const speech = new Speech();
    recognition.current = speech;
    speech.lang = navigator.language || "en-IN";
    speech.onresult = (e) => {
      if (alive.current) setQuery(e.results[0][0].transcript.slice(0, 250));
    };
    speech.onerror = () => {
      if (alive.current)
        setError("Microphone unavailable. Type your meal instead.");
    };
    try {
      speech.start();
    } catch {
      setError("Microphone could not start.");
    }
  };
  const add = (food) => {
    setItems((value) => [
      ...value,
      {
        food,
        amount: food.default_grams || 100,
        percent: 100,
        name: food.name,
      },
    ]);
    setMatches([]);
  };
  const update = (index, key, value) =>
    setItems((old) =>
      old.map((x, i) => (i === index ? { ...x, [key]: value } : x)),
    );
  const submit = async (entries) => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await onSave(entries);
      onClose();
    } catch (e) {
      if (alive.current) setError(e.message);
    } finally {
      saving.current = false;
      if (alive.current) setBusy(false);
    }
  };
  return (
    <section className="care-card care-editor">
      <div className="care-heading">
        <h2>{recipe ? "Build a recipe" : "Add a meal"}</h2>
        <button onClick={onClose} aria-label="Close meal editor">
          ✕
        </button>
      </div>
      <p>
        Review the food and portion before saving. Nutrition is an estimate, not
        a measurement.
      </p>
      {!recipe && (
        <label className="care-upload">
          📷 Photograph your meal
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files[0];
              if (f) photo(f);
              e.target.value = "";
            }}
          />
          <small>
            The selected photo is sent to the configured nutrition service for
            analysis.
          </small>
        </label>
      )}
      {assistant && (
        <div>
          <p>
            Describe one food, for example “I ate 100 g paneer”. Review the
            portion before logging. This is a food logging helper, not medical
            advice.
          </p>
          <label>
            What did you eat?
            <input
              value={query}
              maxLength={250}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button
            className="care-secondary"
            disabled={busy || !query.trim()}
            onClick={parse}
          >
            Review my meal
          </button>
          <button className="care-secondary" onClick={dictate}>
            Use microphone
          </button>
          <small>
            Your browser may send speech to its recognition service. Nothing is
            logged until you confirm.
          </small>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
        className="care-inline"
      >
        <label>
          Find {recipe ? "an ingredient" : "a food"}
          <input
            value={query}
            maxLength={100}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Paneer, oats, curd…"
            required
          />
        </label>
        <button disabled={busy || !query.trim()}>Search</button>
      </form>
      {matches.map((food) => (
        <button className="care-result" key={food.id} onClick={() => add(food)}>
          {food.name} <span>Add +</span>
        </button>
      ))}
      {items.map((item, i) => (
        <div className="care-food-review" key={i}>
          <strong>{item.food?.name || item.name || "Unknown food"}</strong>
          <button
            onClick={() => setItems((old) => old.filter((_, n) => n !== i))}
            aria-label={`Remove ${item.name}`}
          >
            Remove
          </button>
          {!item.food ? (
            <p>
              Not matched. Remove this item and search for the correct food.
            </p>
          ) : (
            <>
              <div className="care-two">
                <label>
                  Portion (
                  {item.food.serving_unit ||
                    (/drink|mocktail/i.test(item.food.category) ? "ml" : "g")}
                  )
                  <input
                    type="number"
                    min="1"
                    max="3000"
                    value={item.amount}
                    onChange={(e) => update(i, "amount", e.target.value)}
                  />
                </label>
                <label>
                  Eaten (%)
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={item.percent}
                    onChange={(e) => update(i, "percent", e.target.value)}
                  />
                </label>
              </div>
              <small>
                {item.food.source === "illustrative_starter_not_verified"
                  ? "Illustrative catalogue — not verified nutrition"
                  : item.food.source || "Catalogue estimate"}{" "}
                · Check ingredients and portion.
              </small>
            </>
          )}
        </div>
      ))}
      {!!items.length && (
        <button
          className="care-primary"
          disabled={busy}
          onClick={() => {
            try {
              const entries = items.map((i) =>
                confirmedFood(i.food, i.amount, i.percent),
              );
              submit(entries);
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          Confirm & log {recipe ? "ingredients" : "meal"}
        </button>
      )}
      <details>
        <summary>Enter nutrition myself</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              if (!manual.name.trim()) throw Error("Enter a meal name.");
              const entry = {
                kind: "meal",
                name: manual.name.trim(),
                source: "User-entered nutrition",
                estimated: true,
              };
              for (const key of ["kcal", "protein", "carbs", "fat"])
                entry[key] = number(
                  manual[key],
                  0,
                  key === "kcal" ? 10000 : 1000,
                  key,
                );
              submit([entry]);
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <label>
            Meal name
            <input
              maxLength={120}
              required
              value={manual.name}
              onChange={(e) => setManual({ ...manual, name: e.target.value })}
            />
          </label>
          <div className="care-two">
            {["kcal", "protein", "carbs", "fat"].map((key) => (
              <label key={key}>
                {key === "kcal" ? "Calories (kcal)" : `${key} (g)`}
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  value={manual[key]}
                  onChange={(e) =>
                    setManual({ ...manual, [key]: e.target.value })
                  }
                />
              </label>
            ))}
          </div>
          <button className="care-primary" disabled={busy}>
            Confirm & log
          </button>
        </form>
      </details>
      {busy && (
        <p role="status">
          Working… Your meal is saved only after confirmation.
        </p>
      )}
      {error && (
        <p className="care-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
