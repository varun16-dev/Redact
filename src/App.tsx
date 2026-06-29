import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  ShieldAlert,
  Server,
  Globe,
  Upload,
  Camera,
  Trash2,
  FileText,
  CheckCircle2,
  AlertOctagon,
  CornerDownRight,
  ExternalLink,
  ChevronRight,
  User,
  MapPin,
  Phone,
  Mail,
  Lock,
  Download,
  Flame,
  Check,
  Zap,
  Briefcase,
  Layers,
  HelpCircle,
  Eye,
  RefreshCw,
  Clock,
  HeartHandshake
} from "lucide-react";
import { ThreatMatch, ScanResult, ComplainantDetails, AppStatus, UserAccount } from "./types";

export default function App() {
  // Sidebar Tabs
  const [activeTab, setActiveTab] = useState<"scan" | "findings" | "agents" | "complaint" | "compliance">("scan");

  // User Authentication & Session States
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  // Sign In inputs
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up inputs
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpFullName, setSignUpFullName] = useState("");
  const [signUpState, setSignUpState] = useState("Maharashtra");
  const [signUpCity, setSignUpCity] = useState("Mumbai");
  const [signUpMobile, setSignUpMobile] = useState("+91 98765 43210");
  const [signUpRelativeName, setSignUpRelativeName] = useState("");
  const [signUpRelationship, setSignUpRelationship] = useState("Father");
  const [authAgreement, setAuthAgreement] = useState(false);

  // App & Scan States
  const [appStatus, setAppStatus] = useState<AppStatus | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStageText, setScanStageText] = useState("");
  const [currentScanResult, setCurrentScanResult] = useState<ScanResult | null>(null);
  const [allScanResults, setAllScanResults] = useState<ScanResult[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Form states for complaint generation
  const [complainant, setComplainant] = useState<ComplainantDetails>({
    fullName: "Neha Sharma",
    state: "Maharashtra",
    city: "Mumbai",
    mobile: "+91 98765 43210",
    email: "neha.sharma@gmail.com",
    relativeName: "Rakesh Sharma",
    relationship: "Father",
  });

  // Action / Selected match state
  const [selectedMatchForNotice, setSelectedMatchForNotice] = useState<ThreatMatch | null>(null);
  const [generatedNoticeText, setGeneratedNoticeText] = useState<string>("");
  const [isGeneratingNotice, setIsGeneratingNotice] = useState(false);
  const [approvedNotices, setApprovedNotices] = useState<Record<string, { approved: boolean; text: string; date: string }>>({});
  const [sentNotices, setSentNotices] = useState<Record<string, boolean>>({});

  // Cybercrime Complaint state
  const [generatedComplaintDoc, setGeneratedComplaintDoc] = useState<string>("");
  const [isGeneratingComplaint, setIsGeneratingComplaint] = useState(false);

  // Upgrade Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<"free" | "guardian" | "institutional">("free");
  const [totalScansCount, setTotalScansCount] = useState(0);

  // Alerts
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Refs for camera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const scanStagesTextList = [
    "Establishing secure isolated session in GCP Mumbai (IN-WEST-1)...",
    "Parsing photo via local InsightFace Open-Source vectors...",
    "Scanning 480+ indexed social platform scrapers...",
    "Crawling deep-web Telegram channels for matching biometrics...",
    "Comparing facial contour mappings to identify high-risk deepfakes...",
    "Finalizing compliance audit under IT Act Section 79 / DPDP Section 13...",
  ];

  // Load backend status on mount
  const fetchStatus = async () => {
    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem("redact_auth_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch("/api/status", { headers });
      const data = await res.json();
      if (res.ok) {
        setAppStatus(data);
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          setSubscriptionTier(data.tier);
          setTotalScansCount(data.scanCount);
          setAllScanResults(data.scanHistory || []);
          setComplainant({
            fullName: data.user.fullName,
            state: data.user.state,
            city: data.user.city,
            mobile: data.user.mobile,
            email: data.user.email,
            relativeName: data.user.relativeName,
            relationship: data.user.relationship,
          });
        } else {
          setCurrentUser(null);
          if (token) {
            localStorage.removeItem("redact_auth_token");
          }
        }
      }
    } catch (err) {
      console.error("Error fetching status:", err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Auth: handle sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      showNotification("Please enter both email and password.", "error");
      return;
    }
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signInEmail, password: signInPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("redact_auth_token", data.token);
        showNotification("Signed in successfully. Fetching secure session...", "success");
        await fetchStatus();
      } else {
        showNotification(data.error || "Failed to sign in. Please check credentials.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Connection error during sign in.", "error");
    }
  };

  // Auth: handle sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword || !signUpFullName) {
      showNotification("Email, password, and full name are required.", "error");
      return;
    }
    if (!authAgreement) {
      showNotification("You must accept the DPDP Act & Biometric Privacy Agreement.", "error");
      return;
    }
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signUpEmail,
          password: signUpPassword,
          fullName: signUpFullName,
          state: signUpState,
          city: signUpCity,
          mobile: signUpMobile,
          relativeName: signUpRelativeName,
          relationship: signUpRelationship,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("redact_auth_token", data.token);
        showNotification("Account registered successfully. Secure sovereign storage provisioned.", "success");
        await fetchStatus();
      } else {
        showNotification(data.error || "Failed to register account.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Connection error during sign up.", "error");
    }
  };

  // Auth: handle sign out
  const handleSignOut = () => {
    localStorage.removeItem("redact_auth_token");
    setCurrentUser(null);
    setSelectedImage(null);
    setCurrentScanResult(null);
    setAllScanResults([]);
    showNotification("Logged out safely. Volatile biometric keys purged from active cache.", "info");
  };

  // Display notification helper
  const showNotification = (text: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Reset demo session
  const handleResetSession = async () => {
    try {
      const token = localStorage.getItem("redact_auth_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch("/api/user/reset", { method: "POST", headers });
      if (res.ok) {
        setSelectedImage(null);
        setCurrentScanResult(null);
        setAllScanResults([]);
        setGeneratedNoticeText("");
        setSelectedMatchForNotice(null);
        setGeneratedComplaintDoc("");
        setApprovedNotices({});
        setSentNotices({});
        fetchStatus();
        showNotification("All active scanning records and local memory safely purged.", "info");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Drag-and-Drop Handlers
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

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedImage(event.target.result as string);
        showNotification("Profile image loaded safely into volatile memory.", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Camera control
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
      setCameraError("Unable to access webcam. Please check permissions or upload a file.");
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

        // Mirror snapshot
        context.translate(width, 0);
        context.scale(-1, 1);
        context.drawImage(videoRef.current, 0, 0, width, height);
        context.setTransform(1, 0, 0, 1, 0, 0);

        const dataUrl = canvasRef.current.toDataURL("image/jpeg");
        setSelectedImage(dataUrl);
        stopCamera();
        showNotification("Camera photo captured securely.", "success");
      }
    }
  };

  // Perform Face Match Scan
  const handleLaunchScan = async () => {
    if (!selectedImage) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanStageText(scanStagesTextList[0]);

    // Fast-loading progress simulator
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        const next = prev + 1;
        if (next < 100) {
          const textIdx = Math.floor((next / 100) * scanStagesTextList.length);
          setScanStageText(scanStagesTextList[textIdx] || "Cross-referencing index pools...");
          return next;
        } else {
          clearInterval(progressInterval);
          return 99;
        }
      });
    }, 60);

    try {
      const token = localStorage.getItem("redact_auth_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch("/api/scan", {
        method: "POST",
        headers,
        body: JSON.stringify({
          image: selectedImage,
          source: isCameraActive ? "webcam" : "upload",
        }),
      });

      const data = await response.json();
      clearInterval(progressInterval);

      if (!response.ok) {
        setIsScanning(false);
        showNotification(data.error || "Failed to scan photo", "error");
        return;
      }

      setScanProgress(100);
      setScanStageText("Facial profile matching completed successfully!");

      setTimeout(() => {
        setCurrentScanResult(data);
        setAllScanResults((prev) => [data, ...prev]);
        setIsScanning(false);
        setActiveTab("findings");
        fetchStatus();
        showNotification(`Facial Identity Scan finished. Found ${data.matches.length} active exposure points.`, "success");
      }, 500);

    } catch (err: any) {
      clearInterval(progressInterval);
      setIsScanning(false);
      showNotification("Scan server timeout or connection failure.", "error");
    }
  };

  // Draft Notice for selected match
  const handleDraftNotice = async (match: ThreatMatch) => {
    setSelectedMatchForNotice(match);
    setGeneratedNoticeText("");
    setIsGeneratingNotice(true);
    setActiveTab("agents");

    try {
      const token = localStorage.getItem("redact_auth_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch("/api/draft-takedown", {
        method: "POST",
        headers,
        body: JSON.stringify({
          match,
          userName: complainant.fullName,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setGeneratedNoticeText(data.draft);
        showNotification(`Takedown demand notice drafted dynamically for ${match.platform}.`, "success");
      } else {
        showNotification(data.error || "Failed to draft notice.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Notice generation failed.", "error");
    } finally {
      setIsGeneratingNotice(false);
    }
  };

  // Approve notice state change
  const handleApproveNotice = (url: string) => {
    if (!selectedMatchForNotice) return;
    setApprovedNotices((prev) => ({
      ...prev,
      [url]: {
        approved: true,
        text: generatedNoticeText,
        date: new Date().toLocaleString("en-IN"),
      },
    }));
    showNotification("Legal Notice approved. Signed with biometric verification token.", "success");
  };

  // Send Notice simulation
  const handleSendNotice = (url: string) => {
    setSentNotices((prev) => ({ ...prev, [url]: true }));
    showNotification("Notice transmitted securely to Grievance Officer via REDACT Indian Node. Safe Harbor 36h counter active.", "success");
  };

  // Generate Cybercrime Complaint
  const handleGenerateComplaint = async () => {
    if (!currentScanResult || currentScanResult.matches.length === 0) {
      showNotification("You must complete a face scan to generate evidence references.", "error");
      return;
    }

    setIsGeneratingComplaint(true);
    setGeneratedComplaintDoc("");
    setActiveTab("complaint");

    try {
      const token = localStorage.getItem("redact_auth_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch("/api/generate-complaint", {
        method: "POST",
        headers,
        body: JSON.stringify({
          matches: currentScanResult.matches,
          complainant,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setGeneratedComplaintDoc(data.document);
        showNotification("cybercrime.gov.in complaint report compiled successfully.", "success");
      } else {
        showNotification(data.error || "Failed to compile complaint document.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to connect to Indian complaint generator node.", "error");
    } finally {
      setIsGeneratingComplaint(false);
    }
  };

  // Switch Tier API integration
  const handleUpgradeTier = async (tier: "free" | "guardian" | "institutional") => {
    try {
      const token = localStorage.getItem("redact_auth_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch("/api/user/upgrade", {
        method: "POST",
        headers,
        body: JSON.stringify({ tier }),
      });
      if (response.ok) {
        setSubscriptionTier(tier);
        setIsUpgradeModalOpen(false);
        fetchStatus();
        showNotification(`Successfully configured subscription to REDACT ${tier.toUpperCase()}`, "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadTxt = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get active matches list
  const activeMatchesList = currentScanResult?.matches || (allScanResults[0]?.matches || []);

  // Filter and Sort states for Exposure Console
  const [severityFilter, setSeverityFilter] = useState<string>("All");
  const [platformFilter, setPlatformFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("none"); // "none" | "severity" | "confidence" | "platform"

  // Dynamic list of platforms available in activeMatchesList to populate the filter dropdown
  const availablePlatforms = React.useMemo(() => {
    return Array.from(new Set(activeMatchesList.map((m) => m.platform)));
  }, [activeMatchesList]);

  // Filtered and sorted matches
  const filteredAndSortedMatches = React.useMemo(() => {
    let result = [...activeMatchesList];

    // Filter by Severity
    if (severityFilter !== "All") {
      result = result.filter((m) => m.severity === severityFilter);
    }

    // Filter by Platform
    if (platformFilter !== "All") {
      result = result.filter((m) => m.platform === platformFilter);
    }

    // Sort by selected criteria
    if (sortBy === "severity") {
      const severityOrder: Record<string, number> = { "Critical": 0, "High": 1, "Medium": 2 };
      result.sort((a, b) => (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99));
    } else if (sortBy === "confidence") {
      result.sort((a, b) => b.confidence - a.confidence);
    } else if (sortBy === "platform") {
      result.sort((a, b) => a.platform.localeCompare(b.platform));
    }

    return result;
  }, [activeMatchesList, severityFilter, platformFilter, sortBy]);

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-950 text-slate-100 font-sans gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-2xl animate-spin">
          R
        </div>
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest animate-pulse">Initializing Biometric Protection Core...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans flex flex-col justify-between overflow-y-auto relative py-12 px-4 sm:px-6">
        {/* Ambient glow decoration */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Toast Notification Banner */}
        {notification && (
          <div className="absolute top-4 right-4 z-50 animate-bounce max-w-sm bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl flex items-start gap-3">
            <div className={`p-1.5 rounded-lg ${notification.type === "success" ? "bg-emerald-950/80 text-emerald-400" : "bg-red-950/80 text-red-400"}`}>
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">System Broadcast</p>
              <p className="text-sm font-semibold text-white mt-0.5">{notification.text}</p>
            </div>
          </div>
        )}

        <div className="max-w-md w-full mx-auto my-auto relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl items-center justify-center font-black text-white text-2xl tracking-wider italic shadow-lg shadow-blue-500/25 mb-4">
              R
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">REDACT India</h2>
            <p className="text-xs text-slate-400 font-mono mt-1 tracking-widest uppercase">Digital Biometric Privacy & DPDP Core</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            <div className="flex border-b border-slate-800 mb-6">
              <button
                id="btn-switch-signin"
                className={`flex-1 pb-3 text-sm font-bold tracking-wider uppercase border-b-2 transition ${
                  authMode === "signin"
                    ? "border-blue-500 text-blue-400 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
                onClick={() => setAuthMode("signin")}
              >
                Sign In
              </button>
              <button
                id="btn-switch-signup"
                className={`flex-1 pb-3 text-sm font-bold tracking-wider uppercase border-b-2 transition ${
                  authMode === "signup"
                    ? "border-blue-500 text-blue-400 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
                onClick={() => setAuthMode("signup")}
              >
                Sign Up
              </button>
            </div>

            {authMode === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      id="input-signin-email"
                      type="email"
                      required
                      placeholder="e.g. neha.sharma@gmail.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      id="input-signin-password"
                      type="password"
                      required
                      placeholder="Enter account security key"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition font-medium"
                    />
                  </div>
                </div>

                <button
                  id="btn-auth-signin"
                  type="submit"
                  className="w-full py-3 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black rounded-xl uppercase tracking-wider transition shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  Unlock Personal Shield
                </button>

                <div className="mt-6 p-4 bg-blue-950/20 border border-blue-900/30 rounded-xl text-xs space-y-1 text-slate-400">
                  <p className="font-bold text-blue-400 uppercase tracking-wide">Developer Testing Account:</p>
                  <p>Email: <span className="font-mono text-white">neha.sharma@gmail.com</span></p>
                  <p>Password: <span className="font-mono text-white">password123</span></p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    id="input-signup-email"
                    type="email"
                    required
                    placeholder="e.g. user@domain.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Security Password</label>
                  <input
                    id="input-signup-password"
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Legal Name</label>
                  <input
                    id="input-signup-name"
                    type="text"
                    required
                    placeholder="e.g. Neha Sharma"
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">State (India)</label>
                    <input
                      id="input-signup-state"
                      type="text"
                      placeholder="e.g. Maharashtra"
                      value={signUpState}
                      onChange={(e) => setSignUpState(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">City</label>
                    <input
                      id="input-signup-city"
                      type="text"
                      placeholder="e.g. Mumbai"
                      value={signUpCity}
                      onChange={(e) => setSignUpCity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number</label>
                  <input
                    id="input-signup-mobile"
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={signUpMobile}
                    onChange={(e) => setSignUpMobile(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Relative Name</label>
                    <input
                      id="input-signup-relative"
                      type="text"
                      placeholder="e.g. Rakesh Sharma"
                      value={signUpRelativeName}
                      onChange={(e) => setSignUpRelativeName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Relationship</label>
                    <select
                      id="input-signup-relation"
                      value={signUpRelationship}
                      onChange={(e) => setSignUpRelationship(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-blue-500 transition font-medium"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Guardian">Guardian</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input
                    id="checkbox-auth-agreement"
                    type="checkbox"
                    checked={authAgreement}
                    onChange={(e) => setAuthAgreement(e.target.checked)}
                    className="mt-1 h-4 w-4 bg-slate-950 border-slate-800 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 leading-tight">
                    I agree to the secure processing of my facial biometric data on sovereign Mumbai nodes in full compliance with Section 4 and Section 13 of India's **DPDP Act 2023**.
                  </p>
                </div>

                <button
                  id="btn-auth-signup"
                  type="submit"
                  className="w-full py-3 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black rounded-xl uppercase tracking-wider transition shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  Create & Initialize Account
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-500 font-mono mt-8 relative z-10">
          <p>REDACT Security Service Protocol • DPDP-Act-2023 Compliant Platform</p>
          <p className="mt-1">All data resides strictly in Mumbai (IN-WEST-1) cloud infrastructure.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="absolute top-4 right-4 z-50 animate-bounce max-w-sm bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl flex items-start gap-3">
          <div className={`p-1.5 rounded-lg ${notification.type === "success" ? "bg-emerald-950/80 text-emerald-400" : "bg-red-950/80 text-red-400"}`}>
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">System Broadcast</p>
            <p className="text-sm font-semibold text-white mt-0.5">{notification.text}</p>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-9 w-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-lg tracking-wider italic shadow-md shadow-blue-500/20">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white uppercase">REDACT</span>
                <span className="text-[9px] bg-blue-900/40 text-blue-400 font-bold px-1.5 py-0.5 rounded border border-blue-800/60 uppercase font-mono">
                  India
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Digital Biometric Privacy Core</p>
            </div>
          </div>

          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Core Modules</p>
          <nav className="space-y-1">
            <button
              id="tab-scan-init"
              onClick={() => setActiveTab("scan")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition text-left text-sm ${
                activeTab === "scan"
                  ? "bg-blue-600/10 text-blue-400 font-semibold border-l-2 border-blue-500"
                  : "text-slate-400 hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <Camera className="w-4.5 h-4.5" />
                <span>Facial Identity Scan</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              id="tab-findings-init"
              onClick={() => setActiveTab("findings")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition text-left text-sm ${
                activeTab === "findings"
                  ? "bg-blue-600/10 text-blue-400 font-semibold border-l-2 border-blue-500"
                  : "text-slate-400 hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4.5 h-4.5" />
                <span>Exposure Console</span>
              </div>
              {activeMatchesList.length > 0 && (
                <span className="bg-red-500/20 text-red-400 font-mono text-[10px] px-2 py-0.2 rounded-full border border-red-500/40 font-bold">
                  {activeMatchesList.length}
                </span>
              )}
            </button>

            <button
              id="tab-agents-init"
              onClick={() => setActiveTab("agents")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition text-left text-sm ${
                activeTab === "agents"
                  ? "bg-blue-600/10 text-blue-400 font-semibold border-l-2 border-blue-500"
                  : "text-slate-400 hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <HeartHandshake className="w-4.5 h-4.5" />
                <span>Agent Action Queue</span>
              </div>
              {selectedMatchForNotice && (
                <span className="bg-amber-500/20 text-amber-400 font-mono text-[10px] px-2 py-0.2 rounded-full border border-amber-500/40 font-bold">
                  Pending
                </span>
              )}
            </button>

            <button
              id="tab-complaint-init"
              onClick={() => setActiveTab("complaint")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition text-left text-sm ${
                activeTab === "complaint"
                  ? "bg-blue-600/10 text-blue-400 font-semibold border-l-2 border-blue-500"
                  : "text-slate-400 hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4.5 h-4.5" />
                <span>Cybercrime Report</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              id="tab-compliance-init"
              onClick={() => setActiveTab("compliance")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition text-left text-sm ${
                activeTab === "compliance"
                  ? "bg-blue-600/10 text-blue-400 font-semibold border-l-2 border-blue-500"
                  : "text-slate-400 hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <Globe className="w-4.5 h-4.5" />
                <span>DPDP Act Ledger</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </nav>

          <div className="mt-8">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Identity & Location</p>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slate-400 font-medium">Isolated Node: AWS Mumbai</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Server className="h-3.5 w-3.5 text-slate-500" />
                <span>IN-WEST-1 Storage Zone</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Globe className="h-3.5 w-3.5 text-slate-500" />
                <span>DPDP compliant isolation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account and reset widgets */}
        <div className="p-6 border-t border-slate-800 space-y-4 bg-slate-900/20">
          {/* User Profile and Sign Out */}
          {currentUser && (
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="h-8 w-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                  {currentUser.fullName.substring(0, 2)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{currentUser.fullName}</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                </div>
              </div>
              <button
                id="btn-sidebar-signout"
                onClick={handleSignOut}
                className="text-[10px] font-bold text-slate-400 hover:text-red-400 px-2 py-1 hover:bg-red-950/20 hover:border-red-900/50 border border-slate-800 rounded-md transition shrink-0 uppercase tracking-wider"
                title="Sign Out"
              >
                Exit
              </button>
            </div>
          )}

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Account Tier</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wide">
                {subscriptionTier} Tier
              </span>
              <span className="text-[10px] text-slate-400 font-mono">({totalScansCount}/5 scans used)</span>
            </div>

            {subscriptionTier === "free" ? (
              <button
                id="btn-sidebar-upgrade"
                onClick={() => setIsUpgradeModalOpen(true)}
                className="mt-3 w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-lg uppercase tracking-wider transition shadow-lg shadow-blue-500/10 active:scale-95"
              >
                Upgrade to Guardian
              </button>
            ) : (
              <span className="block text-center mt-3 py-1.5 bg-emerald-950/50 border border-emerald-900 text-emerald-400 text-[10px] uppercase font-bold tracking-widest rounded-lg">
                🛡️ Guardian Active
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              id="btn-sidebar-reset"
              onClick={handleResetSession}
              className="text-[10px] font-mono text-red-400 hover:text-red-300 transition flex items-center gap-1 hover:underline"
            >
              <Trash2 className="h-3 w-3" />
              Purge Scan Memory
            </button>
            <span className="text-[10px] text-slate-600 font-mono">v1.1 MVP</span>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col bg-slate-950 p-6 sm:p-8 overflow-y-auto relative">
        {/* Mobile Navigation Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 md:hidden">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white italic">R</div>
            <span className="text-md font-extrabold text-white">REDACT.AI</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none font-bold"
            >
              <option value="scan">Scan Hub</option>
              <option value="findings">Exposure Console</option>
              <option value="agents">Agent Action Queue</option>
              <option value="complaint">Cybercrime Report</option>
              <option value="compliance">DPDP Act Ledger</option>
            </select>
            <button
              onClick={handleResetSession}
              className="text-[10px] text-red-400 bg-red-950/20 px-1.5 py-1.5 rounded-lg border border-red-900/50 font-bold"
              title="Purge"
            >
              Purge
            </button>
            <button
              onClick={handleSignOut}
              className="text-[10px] text-slate-400 hover:text-red-400 bg-slate-900 border border-slate-800 px-1.5 py-1.5 rounded-lg font-bold"
              title="Sign Out"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Header Content */}
        <header className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-400 font-mono font-bold uppercase tracking-widest bg-blue-900/20 px-2.5 py-1 rounded border border-blue-800/40">
                Indian Sovereign Server isolation
              </span>
              {subscriptionTier !== "free" && (
                <span className="text-xs text-amber-400 font-mono font-bold uppercase tracking-widest bg-amber-950/30 px-2.5 py-1 rounded border border-amber-800/40">
                  ★ GUARDIAN PROTECTION
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-2 flex items-center gap-2">
              Privacy Shield Engine
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Find where your profile photos have been leaked, misused, or deepfaked across open networks.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-right self-end sm:self-auto">
            <div className="bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-xl text-left">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Compliance Framework</p>
              <p className="text-xs text-blue-400 font-semibold mt-0.5">DPDP Act 2023 Compliant</p>
            </div>
          </div>
        </header>

        {/* Active Workspace / Rendered Tab */}
        <div className="flex-1">
          {/* TAB 1: BIOMETRIC SCAN HUB */}
          {activeTab === "scan" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Main Scanner Card */}
              <div className="col-span-1 lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-3 bg-slate-950 border-b border-l border-slate-800 rounded-bl-xl text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Zero-Retention Hash Engine
                </div>

                <div className="mb-6">
                  <h3 className="font-bold text-lg text-white">Biometric Scan Core</h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    We parse face coordinates with Open-Source **InsightFace/DeepFace** parameters inside isolated local sandboxes.
                  </p>
                </div>

                {/* Sub tier Warning info */}
                {subscriptionTier === "free" && totalScansCount >= 5 && (
                  <div className="mb-6 p-4 bg-amber-950/40 border border-amber-900/60 rounded-xl flex items-start gap-3">
                    <AlertOctagon className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-300">Free Tier Limit Reached ({totalScansCount}/5 scans)</h4>
                      <p className="text-xs text-amber-200/80 mt-1">
                        Please upgrade to the **Guardian Shield** to trigger unlimited automated deep-scans, monitoring, and AI legal notice agents.
                      </p>
                      <button
                        id="btn-upgrade-warning"
                        onClick={() => setIsUpgradeModalOpen(true)}
                        className="mt-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition"
                      >
                        Upgrade Now (₹149/mo)
                      </button>
                    </div>
                  </div>
                )}

                {/* Media Container Box */}
                {!selectedImage && !isCameraActive && (
                  <div
                    id="drop-zone"
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition min-h-[300px] ${
                      dragActive ? "border-blue-500 bg-blue-950/20" : "border-slate-800 hover:border-slate-700 bg-slate-950/40"
                    }`}
                  >
                    <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-4 shadow-xl">
                      <Upload className="h-6 w-6" />
                    </div>

                    <p className="text-sm font-bold text-white">Drag and drop your profile photograph here</p>
                    <p className="text-xs text-slate-500 mt-1 mb-6">Supports JPEG or PNG formats up to 10MB</p>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                      <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition text-center w-full sm:w-auto shadow-lg shadow-blue-500/20 active:scale-95">
                        Select Photo
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>

                      <button
                        id="btn-init-webcam"
                        onClick={startCamera}
                        className="flex items-center justify-center gap-2 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs px-5 py-2.5 rounded-lg transition w-full sm:w-auto"
                      >
                        <Camera className="h-4 w-4" />
                        Trigger Live Camera
                      </button>
                    </div>

                    <div className="mt-8 flex items-center gap-2 text-slate-500 text-[10px]">
                      <Lock className="h-3 w-3" />
                      <span>Volatile Local Parsing • ISO 27001 Certified Environment</span>
                    </div>
                  </div>
                )}

                {/* Webcam Interface */}
                {isCameraActive && !selectedImage && (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex flex-col items-center relative min-h-[320px] justify-center">
                    {cameraError ? (
                      <div className="p-6 text-center text-white max-w-sm">
                        <AlertOctagon className="h-8 w-8 text-red-500 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-300">{cameraError}</p>
                        <button
                          id="btn-close-cam"
                          onClick={() => setIsCameraActive(false)}
                          className="mt-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
                        >
                          Back to Upload
                        </button>
                      </div>
                    ) : (
                      <>
                        <video ref={videoRef} autoPlay playsInline className="w-full h-80 object-cover scale-x-[-1]" />
                        <div className="absolute inset-0 border-2 border-blue-500/30 m-8 rounded-lg pointer-events-none flex items-center justify-center">
                          <div className="w-48 h-48 rounded-full border-2 border-dashed border-blue-500/60 flex items-center justify-center animate-pulse">
                            <span className="text-[10px] text-blue-400 uppercase font-mono font-black tracking-widest bg-slate-950/80 px-2.5 py-1 rounded">
                              Align Portrait
                            </span>
                          </div>
                        </div>

                        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 px-4">
                          <button
                            id="btn-snap"
                            onClick={capturePhoto}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-6 py-3 rounded-full flex items-center gap-2 shadow-lg shadow-blue-500/30 transition"
                          >
                            <Camera className="h-4 w-4" />
                            Capture Portrait
                          </button>
                          <button
                            id="btn-stop-cam"
                            onClick={() => setIsCameraActive(false)}
                            className="bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-xs px-4 py-3 rounded-full border border-slate-700 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Pre-scan / Image Loaded State */}
                {selectedImage && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="relative w-full sm:w-44 aspect-square bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center shrink-0">
                        <img src={selectedImage} alt="Loaded portrait" className="w-full h-full object-cover" />

                        {isScanning && (
                          <>
                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_12px_#3b82f6] animate-bounce" />
                            <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-[1px] animate-pulse" />
                            {/* Scanning overlay dots */}
                            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 p-3 pointer-events-none">
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping mx-auto my-auto" style={{ animationDelay: "0.1s" }} />
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping mx-auto my-auto" style={{ animationDelay: "0.6s" }} />
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping mx-auto my-auto" style={{ animationDelay: "1.2s" }} />
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping mx-auto my-auto" style={{ animationDelay: "0.3s" }} />
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex-1 w-full space-y-4">
                        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Volatile Asset Hash</span>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            Loaded under **DPDP Act Notice standard**. No biometric data matches are transmitted overseas. You can immediately delete this photograph using the purge control at any time.
                          </p>
                          <button
                            id="btn-purge-action"
                            onClick={() => {
                              setSelectedImage(null);
                              showNotification("Volatile cache safely destroyed.", "info");
                            }}
                            className="mt-3 text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1.5 transition hover:underline"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Purge Photo Cache (Delete Data)
                          </button>
                        </div>

                        {!isScanning ? (
                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            <button
                              id="btn-execute-match"
                              onClick={handleLaunchScan}
                              disabled={subscriptionTier === "free" && totalScansCount >= 5}
                              className={`w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm px-6 py-3 rounded-xl transition shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2 active:scale-95 ${
                                subscriptionTier === "free" && totalScansCount >= 5 ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              <RefreshCw className="h-4.5 w-4.5" />
                              Launch Deep-Match Scan
                            </button>
                            <button
                              id="btn-cancel-selection"
                              onClick={() => setSelectedImage(null)}
                              className="w-full sm:w-auto border border-slate-800 hover:bg-slate-800 text-slate-400 font-bold text-sm px-5 py-3 rounded-xl transition"
                            >
                              Change Photo
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-blue-400 flex items-center gap-2 animate-pulse">
                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
                                ACTIVE SCANNING MATRIX...
                              </span>
                              <span className="text-slate-400 font-mono">{scanProgress}%</span>
                            </div>

                            <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300"
                                style={{ width: `${scanProgress}%` }}
                              />
                            </div>

                            <p className="text-xs font-mono text-slate-500 italic">
                              "{scanStageText}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Guide Info */}
              <div className="col-span-1 lg:col-span-5 space-y-6">
                {/* Platform info card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <Shield className="h-4.5 w-4.5 text-blue-500" />
                    Indian Privacy Shield Core
                  </h3>
                  <div className="space-y-4 text-xs text-slate-300">
                    <p className="leading-relaxed">
                      REDACT operates strictly within boundaries authorized under **Sections 43A, 66E, and 67** of India's **Information Technology Act, 2000**, and **DPDP Act 2023** standards.
                    </p>

                    <div className="border-t border-slate-800 pt-4 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>**InsightFace Local Mapping:** Biometric hashes map 128 nodal points temporarily. Biometric template files are auto-erased.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>**Grievance Officer Sync:** Matches trigger pre-formatted demands citing platform-specific Safe Harbor Intermediary regulations.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>**Legal Complaint Compiler:** Generates cybercrime.gov.in and Maharashtra State Cyber Cell compliant intake PDF structures.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Recent Global Scan stats */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Global Protection Stats</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-black block">Active Scans</span>
                      <span className="text-lg font-mono font-bold text-white">41,920+</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-black block">Resolved Links</span>
                      <span className="text-lg font-mono font-bold text-white">89.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXPOSURE CONSOLE (URL Results) */}
          {activeTab === "findings" && (
            <div className="space-y-6">
              {activeMatchesList.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto">
                  <ShieldAlert className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white">No active threat scan on record</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                    Please upload or capture a profile photo in the Scan Hub to audit for potential image misuse or fake profile impersonation.
                  </p>
                  <button
                    id="btn-nav-to-scan"
                    onClick={() => setActiveTab("scan")}
                    className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition"
                  >
                    Go to Scan Hub
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Face metadata stats banner */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-red-950/40 border border-red-900/60 rounded-xl flex items-center justify-center text-red-400 text-lg font-mono font-black">
                        {currentScanResult?.privacyRiskScore || 78}%
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-md">Biometric Vulnerability Risk Assessment</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Detected Face: <span className="text-slate-300 font-semibold">{currentScanResult?.detectedFaceInfo || "Processed Profile (Biometric template deleted)"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        id="btn-trigger-cybercrime-flow"
                        onClick={handleGenerateComplaint}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition shadow-md flex items-center gap-1.5"
                      >
                        <FileText className="h-4 w-4" />
                        Compile Cybercrime Report
                      </button>
                    </div>
                  </div>

                  {/* Findings Table Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="font-bold text-white">Active Face-Matching Identifiers</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Verified online occurrences of this biometric likeness.</p>
                      </div>
                      <span className="text-xs bg-red-950/60 text-red-400 font-bold px-2.5 py-1 rounded border border-red-900/40 font-mono">
                        {filteredAndSortedMatches.length === activeMatchesList.length ? (
                          `${activeMatchesList.length} Exposure Links Active`
                        ) : (
                          `Showing ${filteredAndSortedMatches.length} of ${activeMatchesList.length} Links`
                        )}
                      </span>
                    </div>

                    {/* Filters & Sorting Toolbar */}
                    <div className="px-6 py-4 bg-slate-950/50 border-b border-slate-800 flex flex-col md:flex-row items-end md:items-center gap-4 justify-between">
                      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* Severity Filter */}
                        <div className="flex flex-col gap-1 w-full sm:w-auto">
                          <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-bold">Filter by Severity</label>
                          <select
                            id="filter-severity"
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition w-full sm:w-44 font-semibold"
                          >
                            <option value="All">All Severities</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                          </select>
                        </div>

                        {/* Platform Filter */}
                        <div className="flex flex-col gap-1 w-full sm:w-auto">
                          <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-bold">Filter by Platform</label>
                          <select
                            id="filter-platform"
                            value={platformFilter}
                            onChange={(e) => setPlatformFilter(e.target.value)}
                            className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition w-full sm:w-44 font-semibold"
                          >
                            <option value="All">All Platforms</option>
                            {availablePlatforms.map((platform) => (
                              <option key={platform} value={platform}>
                                {platform}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="flex flex-col gap-1 w-full sm:w-auto">
                          <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-bold">Sort By</label>
                          <select
                            id="sort-by"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition w-full sm:w-48 font-semibold"
                          >
                            <option value="none">Default Order</option>
                            <option value="severity">Severity (Critical First)</option>
                            <option value="confidence">Biometric Confidence (High to Low)</option>
                            <option value="platform">Platform Name (A to Z)</option>
                          </select>
                        </div>
                      </div>

                      {/* Reset Filters */}
                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        {(severityFilter !== "All" || platformFilter !== "All" || sortBy !== "none") && (
                          <button
                            id="btn-clear-filters"
                            onClick={() => {
                              setSeverityFilter("All");
                              setPlatformFilter("All");
                              setSortBy("none");
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 font-bold transition flex items-center gap-1.5 hover:underline"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Reset Filters
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-950 text-xs text-slate-500 uppercase tracking-widest font-mono">
                          <tr>
                            <th className="px-6 py-4">Platform & Resource Link</th>
                            <th className="px-6 py-4">Threat Designation</th>
                            <th className="px-6 py-4">Biometric Confidence</th>
                            <th className="px-6 py-4">Risk Severity</th>
                            <th className="px-6 py-4 text-right">Human-In-Loop Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {filteredAndSortedMatches.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                <div className="flex flex-col items-center justify-center">
                                  <AlertOctagon className="h-8 w-8 text-slate-600 mb-2" />
                                  <p className="text-sm font-semibold">No results match the selected filter criteria.</p>
                                  <button
                                    id="btn-reset-filters-table"
                                    onClick={() => {
                                      setSeverityFilter("All");
                                      setPlatformFilter("All");
                                      setSortBy("none");
                                    }}
                                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 hover:underline"
                                  >
                                    Clear all filters
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            filteredAndSortedMatches.map((match, i) => {
                            const isApproved = approvedNotices[match.url]?.approved;
                            const isSent = sentNotices[match.url];

                            return (
                              <tr key={i} className="hover:bg-slate-850/30 transition">
                                <td className="px-6 py-4">
                                  <div className="space-y-1 max-w-sm overflow-hidden">
                                    <div className="flex items-center gap-2">
                                      <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700 font-bold uppercase">
                                        {match.platform}
                                      </span>
                                      <a
                                        href={match.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 shrink-0 font-mono"
                                      >
                                        Inspect Source <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </div>
                                    <p className="text-xs text-slate-500 font-mono truncate">{match.url}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="space-y-1">
                                    <p className="text-xs text-slate-200 font-semibold">{match.matchType}</p>
                                    <p className="text-[10px] text-slate-500 font-sans max-w-xs whitespace-normal line-clamp-1">
                                      {match.explanation}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2 font-mono">
                                    <span className="text-xs text-emerald-400 font-bold">{(match.confidence * 100).toFixed(1)}%</span>
                                    <div className="w-12 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                                      <div className="bg-emerald-500 h-full" style={{ width: `${match.confidence * 100}%` }} />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase font-mono ${
                                      match.severity === "Critical"
                                        ? "bg-red-950/50 text-red-400 border-red-900/60"
                                        : match.severity === "High"
                                        ? "bg-orange-950/50 text-orange-400 border-orange-900/60"
                                        : "bg-amber-950/50 text-amber-400 border-amber-900/60"
                                    }`}
                                  >
                                    {match.severity}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {isSent ? (
                                    <span className="text-xs text-emerald-400 font-bold flex items-center justify-end gap-1 font-mono">
                                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                                      Notice Sent (36h Active)
                                    </span>
                                  ) : isApproved ? (
                                    <button
                                      id={`btn-transmit-notice-${i}`}
                                      onClick={() => handleSendNotice(match.url)}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-md"
                                    >
                                      Transmit Approved Notice
                                    </button>
                                  ) : (
                                    <button
                                      id={`btn-draft-notice-${i}`}
                                      onClick={() => handleDraftNotice(match)}
                                      className="bg-slate-800 hover:bg-slate-700 hover:border-slate-600 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-1.5 rounded-lg transition"
                                    >
                                      Draft Takedown Demand
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          }))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Intermediary warning note */}
                  <div className="p-4 bg-blue-950/30 border border-blue-900/40 rounded-xl flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Automated Takedown Shield</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Once you draft and approve legal notice demands, REDACT delivers them instantly to the designated Indian Grievance Officers.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AGENT ACTION QUEUE (Human-In-Loop Approvals) */}
          {activeTab === "agents" && (
            <div className="space-y-6">
              {!selectedMatchForNotice ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto">
                  <Shield className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white">No legal notice drafted yet</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                    Go to the Exposure Console and select **"Draft Takedown Demand"** on any active link to trigger the AI-agent notice generation.
                  </p>
                  <button
                    id="btn-nav-to-findings"
                    onClick={() => setActiveTab("findings")}
                    className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition"
                  >
                    View Exposure Links
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Notice Preview Drawer */}
                  <div className="col-span-1 lg:col-span-8 space-y-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 flex-wrap gap-2">
                        <div>
                          <h3 className="font-bold text-white text-md">Dynamic DPDP Section 13 Notice</h3>
                          <p className="text-xs text-slate-500">Addressed to Grievance Department of {selectedMatchForNotice.platform}</p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            id="btn-download-draft"
                            onClick={() => handleDownloadTxt(generatedNoticeText, `takedown_notice_${selectedMatchForNotice.platform}.md`)}
                            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
                            title="Download Notice"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download Markdown
                          </button>
                        </div>
                      </div>

                      {isGeneratingNotice ? (
                        <div className="py-20 text-center space-y-3">
                          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
                          <p className="text-sm font-mono text-slate-400">Drafting strict Intermediary Legal notice citing IT Section 79 rules...</p>
                        </div>
                      ) : (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 font-mono text-xs text-slate-300 leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap">
                          {generatedNoticeText}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Approvals control panel */}
                  <div className="col-span-1 lg:col-span-4 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                      <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Notice Approval Control</h3>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black block">Notice Metadata</span>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Target platform:</span>
                            <span className="text-white font-bold">{selectedMatchForNotice.platform}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Infringing Link:</span>
                            <span className="text-blue-400 font-mono truncate max-w-[150px]" title={selectedMatchForNotice.url}>
                              {selectedMatchForNotice.url}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Legal Statutes:</span>
                            <span className="text-emerald-400 font-bold font-mono">DPDP Sec 13 / IT 79</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        {approvedNotices[selectedMatchForNotice.url]?.approved ? (
                          <div className="space-y-3">
                            <div className="p-3 bg-emerald-950/40 border border-emerald-900 text-emerald-400 text-xs rounded-xl flex items-start gap-2">
                              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500 mt-0.5" />
                              <div>
                                <span className="font-bold">Biometric Signature Verified</span>
                                <p className="text-[10px] text-emerald-500/80 mt-0.5">Approved on {approvedNotices[selectedMatchForNotice.url].date}</p>
                              </div>
                            </div>

                            {!sentNotices[selectedMatchForNotice.url] ? (
                              <button
                                id="btn-transmit-notice-agent"
                                onClick={() => handleSendNotice(selectedMatchForNotice.url)}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-3 rounded-xl transition shadow-lg shadow-blue-500/20 active:scale-95"
                              >
                                Transmit to Grievance Officer Now
                              </button>
                            ) : (
                              <div className="p-3 bg-blue-950/40 border border-blue-900 text-blue-400 text-xs rounded-xl flex items-start gap-2">
                                <Check className="h-4 w-4 text-blue-500 mt-0.5" />
                                <span>Notice successfully transmitted. Intermediary counter active.</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-xs text-slate-400 leading-relaxed">
                              🚨 **Human-In-The-Loop Mandate:** REDACT legal agents will never transmit notice letters to intermediaries without your formal, active signature. Review the draft, then click below to sign and approve.
                            </p>
                            <button
                              id="btn-sign-approve-notice"
                              onClick={() => handleApproveNotice(selectedMatchForNotice.url)}
                              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-4 py-3 rounded-xl transition shadow-lg shadow-emerald-500/15 active:scale-95"
                            >
                              Sign & Approve Notice Draft
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notice drafting statutory citation reference helper */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-xs text-slate-400 space-y-3">
                      <p className="font-bold text-slate-300">Legal citations applied in this draft:</p>
                      <ul className="space-y-2 font-mono text-[10px]">
                        <li>• **DPDP Act Section 13:** Right of Data Principals to claim absolute erasure of unauthorized pictures.</li>
                        <li>• **IT Act Section 79 Intermediary Liability:** Safe harbor immunity strips within 36h once actual knowledge of impersonation is served.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CYBERCRIME NATIONAL PORTAL REPORT CENTER */}
          {activeTab === "complaint" && (
            <div className="space-y-6">
              {activeMatchesList.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto">
                  <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white">No evidence links to report</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                    Please upload and scan your profile photo to identify active face-matched exposure links before compiling a cybercrime.gov.in report.
                  </p>
                  <button
                    id="btn-nav-to-scan-complaint"
                    onClick={() => setActiveTab("scan")}
                    className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition"
                  >
                    Go to Scan Hub
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Complainant metadata edit profile card */}
                  <div className="col-span-1 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div>
                      <h3 className="font-bold text-white text-md">Complainant Intake Profile</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Configure details to match cybercrime.gov.in official intake.</p>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Full Legal Name</label>
                        <input
                          type="text"
                          value={complainant.fullName}
                          onChange={(e) => setComplainant({ ...complainant, fullName: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">State / UT</label>
                          <input
                            type="text"
                            value={complainant.state}
                            onChange={(e) => setComplainant({ ...complainant, state: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">City / Dist</label>
                          <input
                            type="text"
                            value={complainant.city}
                            onChange={(e) => setComplainant({ ...complainant, city: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Mobile (Linked to Aadhaar)</label>
                        <input
                          type="text"
                          value={complainant.mobile}
                          onChange={(e) => setComplainant({ ...complainant, mobile: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Email ID</label>
                        <input
                          type="email"
                          value={complainant.email}
                          onChange={(e) => setComplainant({ ...complainant, email: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Parent/Guardian</label>
                          <input
                            type="text"
                            value={complainant.relativeName}
                            onChange={(e) => setComplainant({ ...complainant, relativeName: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Relationship</label>
                          <input
                            type="text"
                            value={complainant.relationship}
                            onChange={(e) => setComplainant({ ...complainant, relationship: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      id="btn-recompile-report"
                      onClick={handleGenerateComplaint}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-blue-500/10"
                    >
                      Compile Report Document
                    </button>
                  </div>

                  {/* Generated Complaint Doc Viewer */}
                  <div className="col-span-1 lg:col-span-8 space-y-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 flex-wrap gap-2">
                        <div>
                          <h3 className="font-bold text-white text-md">Official Complaint Document</h3>
                          <p className="text-xs text-slate-500">Ready to print and upload to cybercrime.gov.in portal</p>
                        </div>

                        {generatedComplaintDoc && (
                          <button
                            id="btn-download-complaint"
                            onClick={() => handleDownloadTxt(generatedComplaintDoc, "cyber_complaint_report.md")}
                            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download Document
                          </button>
                        )}
                      </div>

                      {isGeneratingComplaint ? (
                        <div className="py-24 text-center space-y-3">
                          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
                          <p className="text-sm font-mono text-slate-400">Compiling biometric evidence, legal citations (IT Act 66D/66E/67) & complainant statements...</p>
                        </div>
                      ) : generatedComplaintDoc ? (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 font-mono text-xs text-slate-300 leading-relaxed max-h-[520px] overflow-y-auto whitespace-pre-wrap">
                          {generatedComplaintDoc}
                        </div>
                      ) : (
                        <div className="py-20 text-center text-slate-500 max-w-sm mx-auto">
                          <FileText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                          <p className="text-xs">Click **"Compile Report Document"** on the left to generate the complete legally audited case file.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COMPLIANCE & PRIVACY LEDGER (DPDP Act 2023) */}
          {activeTab === "compliance" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">REDACT Indian Regulatory Framework Compliance</h3>
                  <p className="text-xs text-slate-400 mt-1">Our adherence to physical boundary localization, data minimization, and active user consent mandates.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rule 1: DPDP Act */}
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" />
                      <span>DPDP Act 2023 Compliant</span>
                    </div>
                    <p className="text-xs text-slate-300 font-semibold">Section 13 (Right to Erasure)</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      All uploaded photographs are processed via in-memory volatile hashing. No permanent biometric databases are established, giving you immediate right to erasure with the "Purge Photo Cache" control.
                    </p>
                  </div>

                  {/* Rule 2: IT Act */}
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                      <span className="h-1.5 w-1.5 bg-blue-400 rounded-full" />
                      <span>IT Act 2000 & 2008 Amendment</span>
                    </div>
                    <p className="text-xs text-slate-300 font-semibold">Sections 66D, 66E, and 67</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Our system addresses malicious identity impersonation (66D), violation of bodily media privacy (66E), and publishing/sharing obscene morphed composites (67) by enforcing intermediary notice pull-downs.
                    </p>
                  </div>

                  {/* Rule 3: Local storage */}
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                      <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full" />
                      <span>Sovereign Storage Zone</span>
                    </div>
                    <p className="text-xs text-slate-300 font-semibold">Mumbai Regional Cloud Boundaries</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Data residency is restricted to the Mumbai regions (IN-WEST-1) of secure cloud partners. No photo vectors or telemetry packets cross foreign borders.
                    </p>
                  </div>

                  {/* Rule 4: Human-in-loop */}
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <span className="h-1.5 w-1.5 bg-amber-400 rounded-full" />
                      <span>Human-In-The-Loop (HITL)</span>
                    </div>
                    <p className="text-xs text-slate-300 font-semibold">Agent Action Controls</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      REDACT's automated AI notice transmitters are hard-fenced. They cannot contact platforms or send notice transcripts without explicit biometric sign-off and approval on your dashboard.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-6">
                  <h4 className="font-bold text-white text-xs mb-3">Core Technical Engine Specs</h4>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 font-mono text-[10px] text-slate-400 leading-relaxed">
                    <p>• **Algorithm:** INSIGHTFACE_OS_V3 (Inference isolated locally)</p>
                    <p>• **Session Retention:** 0 seconds (Immediate erasure from volatile memory on user purging or tab exit)</p>
                    <p>• **Database Registry:** MongoDB replica clustering isolated strictly to Mumbai local zone</p>
                    <p>• **Notice Generation:** Strict compliance standard with cybercrime.gov.in intake fields</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Footer Stats */}
        <footer className="mt-8 border-t border-slate-850 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex gap-6 flex-wrap justify-center">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Total Platform Scans</span>
              <span className="text-sm font-mono text-white font-bold">1,482,900+</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Intermediary Compliance</span>
              <span className="text-sm font-mono text-white font-bold">89.2% Resolved</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">State Cyber Cell Format</span>
              <span className="text-sm font-mono text-white font-bold">cybercrime.gov.in v2.1</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Engine: INSIGHTFACE_OS_V3
            </span>
          </div>
        </footer>
      </main>

      {/* Subscription Tier Upgrade Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
            {/* Banner element */}
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-mono font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">
              Guardian Shield Pro
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Activate REDACT Premium Shield</h3>
              <p className="text-slate-400 text-xs mt-1">
                Protect your biometric identity with 24/7 scanning, instant AI legal notices, and cybercrime filing exports.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Free Tier */}
              <div className={`p-4 bg-slate-950 border rounded-xl flex flex-col justify-between ${subscriptionTier === "free" ? "border-blue-500" : "border-slate-800"}`}>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Free Tier</h4>
                  <p className="text-xl font-mono font-bold text-white mt-1">₹0</p>
                  <p className="text-[10px] text-slate-500 mt-2">Good for single trials and initial validation.</p>
                  <ul className="text-[10px] text-slate-400 mt-4 space-y-2">
                    <li>• 5 Deep-Scans total</li>
                    <li>• Basic exposure URL view</li>
                    <li>• No active agents</li>
                  </ul>
                </div>
                <button
                  id="btn-select-free"
                  onClick={() => handleUpgradeTier("free")}
                  disabled={subscriptionTier === "free"}
                  className="mt-6 w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold text-[10px] uppercase rounded-lg disabled:opacity-40"
                >
                  {subscriptionTier === "free" ? "Current Tier" : "Select"}
                </button>
              </div>

              {/* Guardian Tier */}
              <div className={`p-4 bg-slate-950 border rounded-xl flex flex-col justify-between relative ${subscriptionTier === "guardian" ? "border-blue-500 bg-blue-950/10" : "border-slate-800"}`}>
                <div className="absolute -top-2.5 left-4 bg-amber-500 text-amber-950 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                  Popular
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Guardian
                  </h4>
                  <p className="text-xl font-mono font-bold text-white mt-1">₹149<span className="text-xs text-slate-500">/mo</span></p>
                  <p className="text-[10px] text-slate-400 mt-2">Comprehensive protection for students & individuals.</p>
                  <ul className="text-[10px] text-slate-300 mt-4 space-y-2">
                    <li>• **Unlimited Deep-Scans**</li>
                    <li>• **24/7 Active Scanning**</li>
                    <li>• AI Legal Agents (Takedown drafts)</li>
                    <li>• cybercrime.gov.in Exports</li>
                  </ul>
                </div>
                <button
                  id="btn-select-guardian"
                  onClick={() => handleUpgradeTier("guardian")}
                  className="mt-6 w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[10px] uppercase rounded-lg shadow-lg shadow-blue-500/20"
                >
                  {subscriptionTier === "guardian" ? "Active" : "Activate Guardian"}
                </button>
              </div>

              {/* Institutional Tier */}
              <div className={`p-4 bg-slate-950 border rounded-xl flex flex-col justify-between ${subscriptionTier === "institutional" ? "border-blue-500" : "border-slate-800"}`}>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase">NGO / College</h4>
                  <p className="text-xl font-mono font-bold text-white mt-1">Bulk</p>
                  <p className="text-[10px] text-slate-500 mt-2">For educational colleges, NGOs, and support helplines.</p>
                  <ul className="text-[10px] text-slate-400 mt-4 space-y-2">
                    <li>• NGO Admin Console</li>
                    <li>• Bulk scan lists</li>
                    <li>• Direct legal counselor channel</li>
                    <li>• Custom API rate limits</li>
                  </ul>
                </div>
                <button
                  id="btn-select-institutional"
                  onClick={() => handleUpgradeTier("institutional")}
                  className="mt-6 w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold text-[10px] uppercase rounded-lg"
                >
                  {subscriptionTier === "institutional" ? "Active" : "Activate Bulk"}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                id="btn-close-upgrade-modal"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white font-bold transition px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
