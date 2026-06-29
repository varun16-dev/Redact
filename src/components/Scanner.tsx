import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, Camera, Trash2, ShieldAlert, Sparkles, AlertTriangle, RefreshCw, Eye } from "lucide-react";
import { ScanResult } from "../types";

interface ScannerProps {
  onScanComplete: (result: ScanResult) => void;
  scanCount: number;
  limitReached: boolean;
  tier: string;
  onUpgradeClick: () => void;
}

export default function Scanner({ onScanComplete, scanCount, limitReached, tier, onUpgradeClick }: ScannerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressText, setScanProgressText] = useState("");
  const [scanStep, setScanStep] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Scanning stages simulation
  const scanStages = [
    "Establishing end-to-end encrypted session inside Mumbai Secure Node...",
    "Hashing facial landmarks using zero-retention vectors...",
    "Scanning open web indices, Telegram directories, and social platforms...",
    "Cross-referencing face templates across Indian image syndicates...",
    "Assembling metadata matches under the DPDP Act 2023 regulations...",
    "Finalizing threat analysis report...",
  ];

  useEffect(() => {
    if (isScanning) {
      setScanStep(0);
      setScanProgressText(scanStages[0]);

      const interval = setInterval(() => {
        setScanStep((prev) => {
          const next = prev + 1;
          if (next < scanStages.length) {
            setScanProgressText(scanStages[next]);
            return next;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isScanning]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    setSelectedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError("Unable to access webcam. Please check permissions or upload a photo instead.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        const width = videoRef.current.videoWidth || 640;
        const height = videoRef.current.videoHeight || 480;
        canvasRef.current.width = width;
        canvasRef.current.height = height;

        // Draw flipped image for intuitive mirror selfie
        context.translate(width, 0);
        context.scale(-1, 1);
        context.drawImage(videoRef.current, 0, 0, width, height);
        context.setTransform(1, 0, 0, 1, 0, 0); // reset scale

        const dataUrl = canvasRef.current.toDataURL("image/jpeg");
        setSelectedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleScanInit = async () => {
    if (!selectedImage || isScanning) return;

    setIsScanning(true);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage,
          source: isCameraActive ? "webcam" : "upload",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to scan image");
      }

      // Buffer slightly for immersive effect if API finishes earlier than 5s
      setTimeout(() => {
        onScanComplete(data);
        setIsScanning(false);
      }, 7000);

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong during the scan. Please try again.");
      setIsScanning(false);
    }
  };

  // Immediate erasure of uploaded photo to respect DPDP/user data deletion mandate
  const handlePurge = () => {
    setSelectedImage(null);
    stopCamera();
    setCameraError(null);
    setIsScanning(false);
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-3 bg-zinc-550 border-b border-l border-zinc-150 rounded-bl-xl text-[10px] font-mono text-zinc-500 bg-zinc-50 uppercase flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
        Zero Biometric Storage Engine
      </div>

      <div className="mb-4">
        <h2 className="font-sans font-bold text-xl text-zinc-900 tracking-tight flex items-center gap-2">
          Facial Identity Scanning Core
        </h2>
        <p className="text-zinc-500 text-xs font-sans mt-0.5">
          Scan your profile picture to identify deepfakes, fake social accounts, and illegal leaks across the open web.
        </p>
      </div>

      {limitReached && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-amber-900 font-sans">Free Scan Limit Reached ({scanCount}/5)</h4>
            <p className="text-xs text-amber-700 font-sans mt-1">
              You have exhausted your 5 complimentary privacy scans. Upgrade to the <strong>REDACT Guardian Shield</strong> to unlock unlimited face matches, 24/7 darknet monitoring, and automated AI legal agents.
            </p>
            <button
              id="btn-scanner-upgrade"
              onClick={onUpgradeClick}
              className="mt-2 text-xs font-semibold bg-amber-650 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg bg-amber-800 transition"
            >
              Upgrade Now (₹149/mo)
            </button>
          </div>
        </div>
      )}

      {/* Media Input Container */}
      {!selectedImage && !isCameraActive && (
        <div
          id="drag-drop-zone"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition ${
            dragActive ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50/50"
          }`}
        >
          <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 mb-4">
            <UploadCloud className="h-6 w-6" />
          </div>

          <p className="text-sm font-semibold text-zinc-800 font-sans">
            Drag and drop your profile photo here
          </p>
          <p className="text-xs text-zinc-400 font-sans mt-1 mb-4">
            Supports PNG, JPEG up to 10MB
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <label className="cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs px-4 py-2 rounded-lg transition text-center w-full sm:w-auto shadow-sm">
              Choose Photo
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            <button
              id="btn-use-camera"
              onClick={startCamera}
              className="flex items-center justify-center gap-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium text-xs px-4 py-2 rounded-lg transition w-full sm:w-auto"
            >
              <Camera className="h-4 w-4" />
              Capture via Webcam
            </button>
          </div>

          <p className="text-[10px] text-zinc-400 mt-6 max-w-md">
            🔒 **Compliance Statement:** Your photo is processed securely on Indian soil. Under our DPDP Section 4 protocol, your uploaded image data is converted to volatile facial hashes and instantly cleared upon session completion. No permanent storage is used.
          </p>
        </div>
      )}

      {/* Live Camera View */}
      {isCameraActive && !selectedImage && (
        <div className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-950 flex flex-col items-center relative min-h-[350px] justify-center">
          {cameraError ? (
            <div className="p-6 text-center text-white max-w-sm">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
              <p className="text-sm font-semibold">{cameraError}</p>
              <button
                id="btn-camera-fallback"
                onClick={() => setIsCameraActive(false)}
                className="mt-4 bg-white/20 hover:bg-white/30 text-white font-medium text-xs px-4 py-2 rounded-lg transition"
              >
                Go Back to Upload
              </button>
            </div>
          ) : (
            <>
              {/* Camera Frame Preview */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-h-[360px] object-cover scale-x-[-1]"
              />

              <div className="absolute inset-0 border-2 border-zinc-400/30 m-8 rounded-lg pointer-events-none flex items-center justify-center">
                {/* Facial alignment guide overlay */}
                <div className="w-48 h-48 rounded-full border-2 border-dashed border-white/60 flex items-center justify-center">
                  <span className="text-[10px] text-white/60 uppercase font-mono tracking-wider">Align Face</span>
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 px-4">
                <button
                  id="btn-capture-snapshot"
                  onClick={capturePhoto}
                  className="bg-white hover:bg-zinc-150 text-zinc-950 font-bold text-xs px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg transition"
                >
                  <Camera className="h-4 w-4 text-zinc-900 animate-pulse" />
                  Capture Photo
                </button>
                <button
                  id="btn-cancel-camera"
                  onClick={() => setIsCameraActive(false)}
                  className="bg-black/60 hover:bg-black/80 text-white font-medium text-xs px-4 py-2.5 rounded-full border border-white/20 transition"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Captured or Selected Image Display & Scan Launcher */}
      {selectedImage && (
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="relative w-full max-w-[280px] aspect-square bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden shadow-sm flex items-center justify-center">
            <img src={selectedImage} alt="Face to scan" className="w-full h-full object-cover" />

            {/* Radar scanner sweep animation */}
            {isScanning && (
              <>
                {/* Sweep beam */}
                <div className="absolute left-0 w-full h-1.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce top-0" style={{ animationDuration: '4s' }} />
                
                {/* Simulated digital scanning facial landmarks mapping dots */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 p-4 pointer-events-none opacity-80">
                  <div className="border border-emerald-400/30 rounded-full w-2 h-2 mx-auto my-auto bg-emerald-500 animate-ping" style={{ animationDelay: "0.2s" }} />
                  <div className="border border-emerald-400/30 rounded-full w-2 h-2 mx-auto my-auto bg-emerald-500 animate-ping" style={{ animationDelay: "1.1s" }} />
                  <div className="border border-emerald-400/30 rounded-full w-2 h-2 mx-auto my-auto bg-emerald-500 animate-ping" style={{ animationDelay: "0.7s" }} />
                  <div className="border border-emerald-400/30 rounded-full w-2 h-2 mx-auto my-auto bg-emerald-500 animate-ping" style={{ animationDelay: "1.4s" }} />
                  <div className="border border-emerald-400/30 rounded-full w-2 h-2 mx-auto my-auto bg-emerald-500 animate-ping" style={{ animationDelay: "0.5s" }} />
                  <div className="border border-emerald-400/30 rounded-full w-2 h-2 mx-auto my-auto bg-emerald-500 animate-ping" style={{ animationDelay: "1.9s" }} />
                </div>
              </>
            )}
          </div>

          <div className="flex-1 w-full">
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 mb-4">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Volatile Session File</span>
              <p className="text-xs text-zinc-600 mt-1 font-sans">
                Image loaded and hashed locally. This file remains in transient system RAM and can be permanently deleted with the button below at any time.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  id="btn-purge-photo"
                  onClick={handlePurge}
                  className="flex items-center gap-1 text-zinc-600 hover:text-red-650 text-xs font-semibold py-1 hover:text-red-700 transition"
                >
                  <Trash2 className="h-3.5 w-3.5 text-zinc-500" />
                  Purge Photo Now (Delete Data)
                </button>
              </div>
            </div>

            {!isScanning ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  id="btn-launch-scan"
                  onClick={handleScanInit}
                  disabled={limitReached}
                  className={`w-full sm:w-auto bg-zinc-900 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 ${
                    limitReached ? "opacity-40 cursor-not-allowed bg-zinc-500" : "hover:bg-zinc-800"
                  }`}
                >
                  <RefreshCw className="h-4 w-4" />
                  Start Face-Match Scan
                </button>
                <button
                  id="btn-change-photo"
                  onClick={handlePurge}
                  className="w-full sm:w-auto border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium text-sm px-5 py-3 rounded-xl transition"
                >
                  Choose Different Photo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-emerald-700 flex items-center gap-2 animate-pulse">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                    MATCH SCANNERS RUNNING...
                  </span>
                  <span className="text-zinc-500 font-mono">Stage {scanStep + 1}/6</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-1000 ease-out"
                    style={{ width: `${((scanStep + 1) / 6) * 100}%` }}
                  />
                </div>

                <p className="text-xs text-zinc-600 italic font-medium h-8 flex items-center">
                  "{scanProgressText}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden canvas for capturing frame from video stream */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
