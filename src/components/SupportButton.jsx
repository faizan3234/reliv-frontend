import React, { useState } from "react";
import { API_BASE } from "../config/api";

const ISSUE_OPTIONS = [
  { id: "bp", label: "Blood Pressure not working" },
  { id: "oxygen", label: "Oxygen sensor not working" },
  { id: "temperature", label: "Temperature sensor not working" },
  { id: "height", label: "Height not working / shown wrong" },
  { id: "weight", label: "Weight scale not working" },
  { id: "other", label: "Other issue" },
];

const SupportButton = ({ page }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [otherText, setOtherText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!selected) return;
    const issue = selected === "other" ? (otherText.trim() || "Other issue") : ISSUE_OPTIONS.find((o) => o.id === selected)?.label;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/support-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, issue }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setSent(true);
    } catch {
      setError("Could not send report. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelected(null);
    setOtherText("");
    setSent(false);
    setError(null);
  };

  return (
    <>
      {/* Floating Support Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[100] bg-[#F06922] hover:bg-[#d45a1a] text-white rounded-full shadow-lg px-5 py-3 flex items-center gap-2 text-base font-bold transition-all duration-200 active:scale-95"
        aria-label="Support"
      >
        <span className="text-xl">🛠️</span> Support
      </button>

      {/* Modal Overlay */}
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-[90vw] max-w-md p-8 relative animate-[fadeIn_0.2s_ease]">
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              aria-label="Close"
            >
              ✕
            </button>

            {sent ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <span className="text-5xl">✅</span>
                <h3 className="text-xl font-bold text-gray-800">Report Sent!</h3>
                <p className="text-gray-600 text-center">
                  Our team has been notified. We'll look into it as soon as possible.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-4 bg-[#F06922] hover:bg-[#d45a1a] text-white font-bold px-8 py-3 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <span className="text-2xl">🛠️</span> Report an Issue
                </h3>
                <p className="text-gray-500 text-sm mb-5">
                  Select the problem you are experiencing:
                </p>

                <div className="flex flex-col gap-3 mb-5 max-h-[45vh] overflow-y-auto">
                  {ISSUE_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selected === opt.id
                          ? "border-[#F06922] bg-orange-50"
                          : "border-gray-200 hover:border-orange-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="support-issue"
                        value={opt.id}
                        checked={selected === opt.id}
                        onChange={() => setSelected(opt.id)}
                        className="accent-[#F06922] w-5 h-5"
                      />
                      <span className="font-medium text-gray-800">{opt.label}</span>
                    </label>
                  ))}

                  {selected === "other" && (
                    <textarea
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      placeholder="Describe the issue..."
                      rows={3}
                      maxLength={500}
                      className="w-full border-2 border-gray-200 rounded-xl p-3 text-gray-800 focus:border-[#F06922] focus:outline-none resize-none"
                    />
                  )}
                </div>

                {error && (
                  <p className="text-red-600 text-sm mb-3 font-medium">{error}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!selected || sending}
                  className={`w-full py-3 rounded-xl font-bold text-white text-lg transition-all ${
                    !selected || sending
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-[#F06922] hover:bg-[#d45a1a] active:scale-[0.98]"
                  }`}
                >
                  {sending ? "Sending..." : "Submit Report"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SupportButton;
