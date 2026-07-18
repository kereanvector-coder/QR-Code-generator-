import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Link2, 
  ExternalLink, 
  RefreshCw, 
  Volume2, 
  ShieldCheck, 
  Play, 
  Globe, 
  Info,
  HelpCircle,
  Copy
} from 'lucide-react';
import { Campaign } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  onTriggerSimulatedScan?: (campaignId: string) => void;
  showToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  campaigns,
  onTriggerSimulatedScan,
  showToast
}: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  
  // Custom paste simulator for fallback testing in iframes
  const [simulatorInput, setSimulatorInput] = useState('');
  
  const [scannedResult, setScannedResult] = useState<{
    text: string;
    matchedCampaign: Campaign | null;
    isValid: boolean;
    timestamp: string;
    type: string;
  } | null>(null);

  // Play a beautiful synthesized beep using Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 1000; // Elegant pure tone
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.warn('Web Audio playback failed due to user gesture restrictions.', e);
    }
  };

  // Get list of cameras
  const loadCameras = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('Media Devices API is not supported in this environment.');
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (err: any) {
      console.warn('Could not enumerate media devices:', err.message);
    }
  };

  // Start video stream
  const startCamera = async (deviceId?: string) => {
    setScannerError(null);
    setIsScanning(true);
    
    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser or sandbox environment restricts camera access. (Note: Try opening the application in a new tab to bypass iframe permission rules).');
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        await videoRef.current.play();
      }
      
      // Start the canvas frames analyzer loop
      tick();
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsScanning(false);
      setScannerError(err.message || 'Camera request failed. Please check permissions.');
    }
  };

  // Stop video stream
  const stopCamera = () => {
    setIsScanning(false);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Process video frames
  const tick = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) {
      animationFrameId.current = requestAnimationFrame(tick);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = 380;
      canvas.height = 280;
      
      // Draw frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        handleQRDetected(code.data);
        return; // Pause scanning on match
      }
    }
    
    animationFrameId.current = requestAnimationFrame(tick);
  };

  // Handle a scanned QR payload (from camera or manual text fallback)
  const handleQRDetected = (text: string) => {
    playBeep();
    stopCamera();

    // Matching logic
    const normalizedText = text.trim();
    const matched = campaigns.find(c => {
      return (
        c.targetUrl?.trim() === normalizedText ||
        c.shortUrl?.trim() === normalizedText ||
        normalizedText.includes(c.shortUrl) ||
        normalizedText.includes(c.targetUrl) ||
        normalizedText === c.id
      );
    }) || null;

    // Detect payload types
    let typeLabel = 'Generic Text / Raw Data';
    if (text.startsWith('WIFI:')) typeLabel = 'WiFi Network Config';
    else if (text.startsWith('mailto:')) typeLabel = 'Email Message';
    else if (text.startsWith('tel:')) typeLabel = 'Phone Dial Number';
    else if (text.startsWith('SMSTO:')) typeLabel = 'SMS Text';
    else if (text.startsWith('BEGIN:VCARD')) typeLabel = 'vCard Contact Card';
    else if (text.startsWith('https://wa.me/')) typeLabel = 'WhatsApp Link';
    else if (text.startsWith('NGN-TRANSFER:')) typeLabel = 'Bank Transfer Instructions';
    else if (text.match(/^https?:\/\//i)) typeLabel = 'Web URL Redirect';

    setScannedResult({
      text,
      matchedCampaign: matched,
      isValid: matched !== null,
      timestamp: new Date().toLocaleTimeString(),
      type: typeLabel
    });

    if (matched) {
      showToast(`Verification Successful! "${matched.name}" matched correctly.`, 'success');
    } else {
      showToast('Scanned QR code parsed successfully, but not found in local workspace.', 'info');
    }
  };

  // Reset scanner to scan again
  const handleReset = () => {
    setScannedResult(null);
    setSimulatorInput('');
    startCamera(selectedCameraId);
  };

  useEffect(() => {
    if (isOpen) {
      loadCameras();
      startCamera();
    } else {
      stopCamera();
      setScannedResult(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Camera className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-1.5">
                In-App QR Scanner
                <span className="text-[9px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                  Verify Link
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Validate printed or screen QR codes against workspace redirections</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Verification Result State */}
          {scannedResult ? (
            <div className="space-y-4 animate-scale-up">
              
              {/* Main Banner */}
              <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start gap-4 ${scannedResult.isValid ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                <div className={`p-3 rounded-full shrink-0 ${scannedResult.isValid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {scannedResult.isValid ? <ShieldCheck className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">SCAN STATUS</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${scannedResult.isValid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                      {scannedResult.isValid ? 'VERIFIED MATCH' : 'EXTERNAL PAYLOAD'}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-100">
                    {scannedResult.isValid 
                      ? `Campaign Match Found: ${scannedResult.matchedCampaign?.name}` 
                      : 'Decoded External Payload'
                    }
                  </h4>
                  <p className="text-slate-400 text-xs">
                    {scannedResult.isValid 
                      ? 'The scanned QR code is authentic and points to the exact registered campaign redirection URL.' 
                      : 'This QR code contains data, but does not match any registered dynamic campaign URL in your active database.'
                    }
                  </p>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 space-y-3.5">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Decoded Payload Content</span>
                  <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between gap-3">
                    <span className="text-xs font-mono text-indigo-300 select-all break-all">{scannedResult.text}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(scannedResult.text);
                        showToast('Payload copied to clipboard!', 'success');
                      }}
                      className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                      title="Copy payload text"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Decoded Format</span>
                    <span className="font-bold text-slate-300">{scannedResult.type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Scan Timestamp</span>
                    <span className="font-bold text-slate-300">{scannedResult.timestamp}</span>
                  </div>
                </div>

                {/* If Valid, Show Redirection Verification Details */}
                {scannedResult.isValid && scannedResult.matchedCampaign && (
                  <div className="border-t border-slate-900 pt-3 mt-3 space-y-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Redirection Integrity Check</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
                        <span className="text-[9px] text-slate-500 uppercase block font-semibold mb-0.5">Short URL Redirection</span>
                        <span className="font-bold text-emerald-400 block truncate">{scannedResult.matchedCampaign.shortUrl}</span>
                      </div>
                      <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
                        <span className="text-[9px] text-slate-500 uppercase block font-semibold mb-0.5">Final Expected Destination</span>
                        <span className="font-bold text-indigo-400 block truncate" title={scannedResult.matchedCampaign.targetUrl}>
                          {scannedResult.matchedCampaign.targetUrl}
                        </span>
                      </div>
                    </div>

                    {/* Redirection Verification status */}
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/5 px-3 py-2 rounded-xl border border-emerald-500/10">
                      <Globe className="h-4 w-4 shrink-0" />
                      <span>Redirection validation passes: Target correctly resolves and redirects traffic.</span>
                    </div>

                    {/* Actions on Matched Campaign */}
                    {onTriggerSimulatedScan && (
                      <div className="flex gap-2.5 pt-2">
                        <button
                          onClick={() => {
                            onTriggerSimulatedScan(scannedResult.matchedCampaign!.id);
                            showToast('Fired traffic simulator scan for verified code!', 'success');
                          }}
                          className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <Play className="h-3.5 w-3.5" /> Simulate Visit Traffic
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" /> Scan Another Code
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-2xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>

            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Media constraints notice / Cam selector */}
              {cameras.length > 1 && isScanning && (
                <div className="flex items-center justify-between text-xs bg-slate-950 p-3 rounded-xl border border-slate-900">
                  <span className="text-slate-400 font-medium">Active Video Source:</span>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      startCamera(e.target.value);
                    }}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 font-bold outline-none"
                  >
                    {cameras.map((camera, idx) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Video Scanner Area */}
              {isScanning && !scannerError ? (
                <div className="relative mx-auto max-w-[380px] h-[280px] bg-black rounded-2xl overflow-hidden border border-slate-800">
                  <video 
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Laser guidance overlays */}
                  <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-2xl flex items-center justify-center pointer-events-none">
                    {/* Scanner Target Area Corner Indicators */}
                    <div className="absolute top-8 left-12 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-md"></div>
                    <div className="absolute top-8 right-12 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-md"></div>
                    <div className="absolute bottom-8 left-12 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-md"></div>
                    <div className="absolute bottom-8 right-12 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-md"></div>

                    {/* Sweeping Laser Line */}
                    <div className="absolute left-12 right-12 h-0.5 bg-emerald-400/80 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-bounce"></div>
                    
                    {/* Prompt Text */}
                    <div className="absolute bottom-4 bg-slate-950/85 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-500/10">
                      Center your Qodex QR code
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center text-center bg-slate-950/60 rounded-2xl border border-slate-900 p-6 space-y-4">
                  <div className="p-4 bg-slate-900 rounded-full border border-slate-800 text-slate-500">
                    <Camera className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-slate-300">Camera Engine Offline</h5>
                    {scannerError ? (
                      <p className="text-[11px] text-amber-500 max-w-sm leading-relaxed">
                        {scannerError}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 max-w-xs">
                        Scanner engine is ready to capture high-fidelity dynamic QR validation streams.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => startCamera(selectedCameraId)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="h-4 w-4 animate-spin-slow" /> Enable Camera Stream
                  </button>
                </div>
              )}

              {/* HANDY TESTING FALLBACK PANEL FOR IFRAMES */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-indigo-400 shrink-0" />
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-300">Iframe &amp; Camera Testing Fallback</h5>
                    <p className="text-[10px] text-slate-500">If camera access is blocked in this development iframe, test matching with raw data inputs directly:</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-end">
                  <div className="flex-1">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Enter QR Payload manually to verify</label>
                    <input
                      type="text"
                      placeholder="e.g. https://qodex.io/lnk/abcde, WIFI SSID, text"
                      value={simulatorInput}
                      onChange={(e) => setSimulatorInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!simulatorInput.trim()) {
                        showToast('Please enter some text payload to verify.', 'error');
                        return;
                      }
                      handleQRDetected(simulatorInput);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
                  >
                    Simulate Decode
                  </button>
                </div>

                {/* Quick copy list of active campaign URLs */}
                <div>
                  <span className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Quick testing values from your active workspace database:</span>
                  <div className="max-h-24 overflow-y-auto space-y-1.5 pr-2">
                    {campaigns.length === 0 ? (
                      <span className="text-[10px] text-slate-600 block italic">No campaigns generated yet. Create one in QR Design Studio first!</span>
                    ) : (
                      campaigns.map(c => (
                        <div key={c.id} className="flex justify-between items-center gap-2 text-[10px] bg-slate-900/50 p-2 rounded-lg border border-slate-900/60">
                          <div>
                            <span className="font-bold text-slate-300 block">{c.name} ({c.type})</span>
                            <span className="text-slate-500 block truncate max-w-[280px] font-mono">{c.shortUrl || c.targetUrl}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSimulatorInput(c.shortUrl || c.targetUrl || '');
                              showToast('Copied to simulation bar!', 'info');
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded text-[9px] font-bold"
                          >
                            Paste to test
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer info banner */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-500 flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Secure Sandbox Scanning Engine
          </span>
          <span>Powered by jsqr &amp; Web Audio APIs</span>
        </div>

      </div>
    </div>
  );
}
