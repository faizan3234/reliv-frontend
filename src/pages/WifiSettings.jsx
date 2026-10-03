import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  Lock,
  RefreshCw,
  Check,
  ChevronRight,
  Shield,
  Radio,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  X,
  ArrowLeft,
  Activity,
  Globe,
  Smartphone
} from 'lucide-react';
import { API_BASE } from '../config/api';

export default function WifiSettings() {
  const [status, setStatus] = useState(null);
  const [networks, setNetworks] = useState([]);
  const [savedNetworks, setSavedNetworks] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [isCustomSsid, setIsCustomSsid] = useState(false);
  const [selectedSsid, setSelectedSsid] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [customSsid, setCustomSsid] = useState('');

  const pollTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToastMsg = useCallback((msg, duration = 3500) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  const getApiUrl = (endpoint) => {
    return `${API_BASE || ''}${endpoint}`;
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/api/wifi/status'));
      const data = await res.json();
      if (data && data.success) {
        setStatus(data.status);
      }
    } catch (err) {
      console.warn('[WifiSettings] Error fetching status:', err);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const fetchSaved = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/api/wifi/saved'));
      const data = await res.json();
      if (data && data.success) {
        setSavedNetworks(data.saved || []);
      }
    } catch (err) {
      console.warn('[WifiSettings] Error fetching saved networks:', err);
    }
  }, []);

  const scanAvailable = useCallback(async (force = false) => {
    setScanning(true);
    try {
      const endpoint = force ? '/api/wifi/rescan' : '/api/wifi/scan';
      const method = force ? 'POST' : 'GET';
      const res = await fetch(getApiUrl(endpoint), { method });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.networks)) {
        setNetworks(data.networks);
      }
    } catch (err) {
      console.error('[WifiSettings] Error scanning networks:', err);
      showToastMsg('Failed to scan networks. Please retry.');
    } finally {
      setScanning(false);
    }
  }, [showToastMsg]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchStatus(), fetchSaved(), scanAvailable(false)]);
  }, [fetchStatus, fetchSaved, scanAvailable]);

  useEffect(() => {
    refreshAll();
    // Poll Wi-Fi status every 5 seconds so updates appear live
    pollTimerRef.current = setInterval(fetchStatus, 5000);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [refreshAll, fetchStatus]);

  // Connect handler
  const handleConnect = async (ssidToConnect, pass = '', hidden = false) => {
    if (!ssidToConnect) return;
    setActionLoading(true);
    showToastMsg(`Connecting to ${ssidToConnect}...`);

    try {
      const res = await fetch(getApiUrl('/api/wifi/connect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid: ssidToConnect, password: pass, hidden })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Connected to ${ssidToConnect}`);
        await refreshAll();
      } else {
        showToastMsg(`Connection failed: ${data.error || 'Check password'}`);
      }
    } catch (err) {
      showToastMsg('Connection timed out or failed');
    } finally {
      setActionLoading(false);
      setModalOpen(false);
    }
  };

  // Switch to saved network
  const handleSwitchSaved = async (ssidToSwitch) => {
    setActionLoading(true);
    showToastMsg(`Switching back to ${ssidToSwitch}...`);
    try {
      const res = await fetch(getApiUrl('/api/wifi/switch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid: ssidToSwitch })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Switched to ${ssidToSwitch}`);
        await refreshAll();
      } else {
        showToastMsg(`Switch failed: ${data.error || 'Network unavailable'}`);
      }
    } catch (err) {
      showToastMsg('Failed to switch network');
    } finally {
      setActionLoading(false);
    }
  };

  // Forget network
  const handleForget = async (ssidToForget) => {
    if (!window.confirm(`Forget Wi-Fi network "${ssidToForget}"?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/wifi/forget'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid: ssidToForget })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Forgot ${ssidToForget}`);
        await refreshAll();
      } else {
        showToastMsg(`Error: ${data.error || 'Could not forget'}`);
      }
    } catch (err) {
      showToastMsg('Failed to forget network');
    } finally {
      setActionLoading(false);
    }
  };

  // Disconnect network
  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect kiosk from current Wi-Fi?')) return;
    setActionLoading(true);
    showToastMsg('Disconnecting...');
    try {
      const res = await fetch(getApiUrl('/api/wifi/disconnect'), { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToastMsg('Disconnected from Wi-Fi');
        await refreshAll();
      }
    } catch (err) {
      showToastMsg('Disconnect failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (ssid, custom = false) => {
    setSelectedSsid(ssid);
    setIsCustomSsid(custom);
    setCustomSsid('');
    setPassword('');
    setShowPassword(false);
    setModalOpen(true);
  };

  const onNetworkClick = (net) => {
    if (status && status.connected && status.ssid === net.ssid) {
      showToastMsg(`Already connected to ${net.ssid}`);
      return;
    }
    if (net.isSaved) {
      handleSwitchSaved(net.ssid);
      return;
    }
    if (net.isOpen) {
      handleConnect(net.ssid, '', false);
      return;
    }
    openModal(net.ssid, false);
  };

  const isConnected = status && status.connected && status.ssid;

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-slate-900 pb-24 font-sans select-none antialiased">
      {/* HEADER BAR */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="p-1.5 -ml-1 text-slate-600 active:bg-slate-100 rounded-full transition"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                R
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                  Wi-Fi Settings
                </h1>
                <p className="text-[11px] text-slate-500 font-medium leading-none">
                  Kiosk AP: 192.168.50.1
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => scanAvailable(true)}
            disabled={scanning || actionLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-sky-600 shadow-sm active:bg-slate-50 transition ${
              scanning ? 'opacity-70' : ''
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning' : 'Scan'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-5">
        {/* CURRENT CONNECTION CARD */}
        <div>
          <div className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
            Current Connection
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div className="overflow-hidden">
                  <div className="text-lg font-bold text-slate-900 truncate">
                    {loadingStatus
                      ? 'Checking Wi-Fi...'
                      : isConnected
                      ? status.ssid
                      : 'Not Connected'}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    {isConnected
                      ? status.ip
                        ? `IP: ${status.ip}`
                        : 'Connected to Network'
                      : 'Kiosk is not connected to any external Wi-Fi'}
                  </div>
                </div>
              </div>

              {isConnected && (
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    status.internetReachable
                      ? 'bg-emerald-100/70 text-emerald-800'
                      : 'bg-amber-100/70 text-amber-800'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      status.internetReachable
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-amber-500'
                    }`}
                  />
                  <span>{status.internetReachable ? 'Online' : 'Local Only'}</span>
                </div>
              )}
            </div>

            {isConnected && (
              <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">
                    Signal Strength
                  </div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {status.signal || 0}% ({status.bars || '____'})
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">
                    Frequency Band
                  </div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {status.frequency || '2.4 GHz'}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">
                    Security Type
                  </div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {status.security || 'WPA2'}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">
                    Gateway Router
                  </div>
                  <div className="font-bold text-slate-800 mt-0.5 truncate">
                    {status.gateway || '--'}
                  </div>
                </div>

                <div className="col-span-2 pt-2">
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-rose-50 text-rose-600 rounded-xl font-semibold text-xs border border-rose-100 active:bg-rose-100 transition"
                  >
                    Disconnect Wi-Fi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SAVED NETWORKS CARD */}
        {savedNetworks.length > 0 && (
          <div>
            <div className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
              Saved Networks ({savedNetworks.length})
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden divide-y divide-slate-100">
              {savedNetworks.map((net) => {
                const isCurrent = isConnected && status.ssid === net.ssid;
                return (
                  <div
                    key={net.ssid}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 active:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'bg-sky-50 text-sky-600 font-bold'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Wifi className="w-3.5 h-3.5" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {net.ssid}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {isCurrent ? (
                            <span className="text-emerald-600 font-semibold">Active Connection</span>
                          ) : (
                            'Saved profile'
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleSwitchSaved(net.ssid)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-xs font-semibold bg-sky-50 text-sky-600 border border-sky-100 rounded-lg active:bg-sky-100 transition"
                        >
                          Switch Back
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleForget(net.ssid)}
                        disabled={actionLoading}
                        className="p-1.5 text-slate-400 hover:text-rose-500 active:bg-rose-50 rounded-lg transition"
                        title="Forget network"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AVAILABLE NETWORKS CARD */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
              Available Networks
            </span>
            <span className="text-xs text-slate-400">
              {scanning ? 'Updating...' : `${networks.length} found`}
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden divide-y divide-slate-100">
            {networks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                {scanning ? 'Scanning for nearby Wi-Fi...' : 'No networks found. Tap Scan to refresh.'}
              </div>
            ) : (
              networks.map((net) => {
                const isCurrent =
                  (isConnected && status.ssid === net.ssid) || Boolean(net.inUse);
                const s = Number(net.signal) || 0;

                return (
                  <div
                    key={net.ssid}
                    onClick={() => onNetworkClick(net)}
                    className="p-3.5 flex items-center justify-between active:bg-slate-100 cursor-pointer transition select-none"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="overflow-hidden">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {net.ssid}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                          <span>{net.frequency || '2.4 GHz'}</span>
                          <span>•</span>
                          <span>{net.security || 'Open'}</span>
                          {net.isSaved && (
                            <>
                              <span>•</span>
                              <span className="text-sky-600 font-medium">Saved</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {!net.isOpen && <Lock className="w-3.5 h-3.5 text-slate-400" />}

                      {/* Signal 4-bars indicator */}
                      <div className="flex items-end gap-[2px] h-3.5" title={`${s}%`}>
                        <div
                          className={`w-[3px] rounded-sm h-[3.5px] ${
                            s >= 20 ? 'bg-slate-800' : 'bg-slate-200'
                          }`}
                        />
                        <div
                          className={`w-[3px] rounded-sm h-[7px] ${
                            s >= 40 ? 'bg-slate-800' : 'bg-slate-200'
                          }`}
                        />
                        <div
                          className={`w-[3px] rounded-sm h-[10.5px] ${
                            s >= 65 ? 'bg-slate-800' : 'bg-slate-200'
                          }`}
                        />
                        <div
                          className={`w-[3px] rounded-sm h-[14px] ${
                            s >= 85 ? 'bg-slate-800' : 'bg-slate-200'
                          }`}
                        />
                      </div>

                      {isCurrent ? (
                        <Check className="w-4 h-4 text-sky-600 font-bold" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* JOIN OTHER NETWORK BUTTON */}
        <button
          type="button"
          onClick={() => openModal('', true)}
          className="w-full py-3.5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-sky-600 shadow-sm active:bg-slate-50 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Join Other Network...</span>
        </button>

        {/* FOOTER INFO */}
        <div className="text-center text-xs text-slate-400 pt-2 pb-6 space-y-1">
          <p>Controlled via phone connected to Reliv Kiosk Hotspot</p>
          <p className="text-[11px] text-slate-300">
            Raspberry Pi Kiosk • 192.168.50.1/wifi
          </p>
        </div>
      </div>

      {/* JOIN PASSWORD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-slate-900">
                {isCustomSsid ? 'Join Other Network' : selectedSsid}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              {isCustomSsid
                ? 'Enter the network SSID and security password'
                : 'Enter the password for this Wi-Fi network'}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const targetSsid = isCustomSsid ? customSsid.trim() : selectedSsid;
                if (!targetSsid) return;
                handleConnect(targetSsid, password, isCustomSsid);
              }}
              className="space-y-4"
            >
              {isCustomSsid && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Network Name (SSID)
                  </label>
                  <input
                    type="text"
                    required
                    value={customSsid}
                    onChange={(e) => setCustomSsid(e.target.value)}
                    placeholder="e.g. MyWiFi"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Required"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || (isCustomSsid && !customSsid.trim())}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-sm shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Connecting...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-full text-xs font-medium shadow-xl pointer-events-none flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
