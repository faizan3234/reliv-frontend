import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE } from '../config/api';
import { requestJSON } from '../utils/request';

export function useReportDelivery(sessionId) {
  const [state, setState] = useState({ busy: false, ready: false, error: '' });
  const current = useRef(null);
  const prepare = useCallback(async () => {
    if (!sessionId || ['current', 'default', 'RELIV-001'].includes(sessionId)) {
      setState({ busy: false, ready: false, error: 'No active report session. Please ask the kiosk administrator for help.' });
      return;
    }
    if (current.current) return;
    const controller = new AbortController();
    current.current = controller;
    setState({ busy: true, ready: false, error: '' });
    try {
      const result = await requestJSON(`${API_BASE}/api/sessions/${encodeURIComponent(sessionId)}/report`, {
        method: 'POST', signal: controller.signal, timeoutMs: 30000,
      });
      if (controller.signal.aborted || current.current !== controller) return;
      if (result.ok !== true || !result.reportId) throw new Error('The report is not ready. Please retry.');
      setState({ busy: false, ready: true, error: '', sessionId });
    } catch (error) {
      if (current.current === controller && (!controller.signal.aborted || error.name === 'TimeoutError')) {
        setState({ busy: false, ready: false, error: error.message || 'Unable to prepare the report. Please retry.' });
      }
    } finally {
      if (current.current === controller) current.current = null;
    }
  }, [sessionId]);
  useEffect(() => {
    void prepare();
    return () => { current.current?.abort(); current.current = null; };
  }, [prepare]);
  const ready = state.ready && state.sessionId === sessionId;
  return { ...state, ready, prepare, downloadUrl: ready
    ? `${API_BASE}/api/sessions/${encodeURIComponent(sessionId)}/report/download` : '' };
}
