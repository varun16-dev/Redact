import React from "react";
import { Shield, Server, Globe, Sparkles } from "lucide-react";
import { AppStatus } from "../types";

interface HeaderProps {
  status: AppStatus | null;
  currentTier: string;
  onUpgradeClick: () => void;
}

export default function Header({ status, currentTier, onUpgradeClick }: HeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo and Tagline */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-extrabold tracking-tight text-xl text-zinc-900">REDACT</span>
              <span className="bg-zinc-100 text-zinc-700 text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-zinc-200">
                v1.1 MVP
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-sans font-medium">AI-Powered Photo Misuse & Impersonation Protection for India</p>
          </div>
        </div>

        {/* Region & Compliance Badges */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 text-xs">
          {/* Hosting Region info */}
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-150 px-3 py-1.5 rounded-lg font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Server className="h-3.5 w-3.5 text-emerald-600" />
            <span>IN-WEST-1 (Mumbai Region)</span>
          </div>

          {/* Compliance Info */}
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg font-medium">
            <Globe className="h-3.5 w-3.5 text-zinc-500" />
            <span>DPDP Act 2023 Compliant</span>
          </div>

          {/* Tier display */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-500 font-sans capitalize">
              Tier: <strong className="text-zinc-900">{currentTier}</strong>
            </span>
            {currentTier === "free" ? (
              <button
                id="btn-upgrade-nav"
                onClick={onUpgradeClick}
                className="flex items-center gap-1 bg-amber-550 hover:bg-amber-600 text-amber-950 font-semibold px-3 py-1.5 rounded-lg text-xs transition border border-amber-300"
                style={{ backgroundColor: "#fef3c7", borderColor: "#fde68a", color: "#78350f" }}
              >
                <Sparkles className="h-3 w-3 text-amber-700" />
                Upgrade to Guardian
              </button>
            ) : (
              <span className="bg-zinc-900 text-white font-semibold px-2.5 py-1 rounded-lg text-xs">
                🛡️ Guardian Active
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
