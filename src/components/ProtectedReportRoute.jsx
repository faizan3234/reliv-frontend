import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { API_BASE } from "../config/api";
import { useHealth } from "../context/HealthContext";

const ProtectedReportRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { update } = useHealth();

  // Keep the latest update() without making the authorization
  // fetch rerun every time HealthContext renders.
  const updateRef = useRef(update);

  useEffect(() => {
    updateRef.current = update;
  }, [update]);

  const [status, setStatus] = useState("LOADING");
  // LOADING | AUTHORIZED | DENIED

  const [errorMessage, setErrorMessage] = useState("");

  const sessionId =
    location.state?.sessionId ||
    localStorage.getItem("reliv_session_id") ||
    sessionStorage.getItem("reliv_session_id") ||
    "";

  useEffect(() => {
    const controller = new AbortController();

    const authorizeReport = async () => {
      if (!sessionId) {
        setErrorMessage(
          "No active health report session was found."
        );
        setStatus("DENIED");
        return;
      }

      setStatus("LOADING");
      setErrorMessage("");

      try {
        const response = await fetch(
          `${API_BASE}/api/sessions/${encodeURIComponent(sessionId)}/report/data`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result =
          await response.json().catch(() => ({}));

        if (
          !response.ok ||
          result.ok !== true ||
          result.paymentVerified !== true ||
          result.reportStatus !== "READY" ||
          !result.healthData
        ) {
          setErrorMessage(
            result.message ||
              "Your paid health report is not available."
          );

          setStatus("DENIED");
          return;
        }

        // Hydrate HealthContext from the authoritative SQLite snapshot.
        //
        // healthData is authoritative for measurements.
        // customerData supplies the persisted customer identity.
        const authoritativeHealthData = {
          ...result.healthData,

          sessionId: result.sessionId || sessionId,

          patient: {
            ...(result.healthData?.patient || {}),
            ...(result.customerData || {}),
          },
        };

        updateRef.current(authoritativeHealthData);

        setStatus("AUTHORIZED");
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error(
          "[ProtectedReportRoute] Report authorization failed:",
          err
        );

        setErrorMessage(
          "Could not verify this health report. Please try again."
        );

        setStatus("DENIED");
      }
    };

    authorizeReport();

    return () => {
      controller.abort();
    };
  }, [sessionId]);

  if (status === "LOADING") {
    return (
      <div className="h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900">
            Loading your health report...
          </div>

          <div className="mt-3 text-gray-500">
            Verifying payment and report status.
          </div>
        </div>
      </div>
    );
  }

  if (status === "DENIED") {
    return (
      <div className="h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <div className="text-3xl font-bold text-gray-900">
            Report unavailable
          </div>

          <div className="mt-4 text-lg text-gray-600">
            {errorMessage}
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/payment", {
                replace: true,
              })
            }
            className="mt-8 bg-[#F28C38] text-white font-semibold text-lg px-10 py-4 rounded-2xl cursor-pointer"
          >
            Return to Payment
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedReportRoute;
