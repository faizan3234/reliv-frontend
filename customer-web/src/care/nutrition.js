const base = (import.meta.env.VITE_NUTRITION_API_URL || "").replace(/\/$/, "");
export async function nutrition(path, body, signal) {
  if (!base)
    throw Error(
      "The nutrition and conversation service is not connected yet. You can still log manually.",
    );
  const url = new URL(base, location.origin);
  if (
    url.protocol !== "https:" &&
    url.hostname !== "localhost" &&
    url.hostname !== "127.0.0.1"
  )
    throw Error("Nutrition requires a secure HTTPS service.");
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(cancel, 45000);
  try {
    const response = await fetch(`${base}${path}`, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: "omit",
    });
    if (!response.ok)
      throw Error(
        `Nutrition service unavailable (${response.status}). Your logs are unchanged.`,
      );
    return await response.json();
  } catch (e) {
    if (e.name === "AbortError")
      throw Error(
        "Food analysis stopped or timed out. Retry or enter your meal manually.",
      );
    throw e;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}
export { photoData } from "./imageUpload";
