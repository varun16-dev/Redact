export interface ThreatMatch {
  platform: string;
  url: string;
  matchType: string;
  confidence: number;
  severity: "Critical" | "High" | "Medium";
  explanation: string;
  status: "Active" | "Removed";
  takedownStatus: "Drafted" | "Approved" | "Sent" | "Success";
}

export interface ScanResult {
  id: string;
  timestamp: string;
  detectedFaceInfo: string;
  privacyRiskScore: number;
  matches: ThreatMatch[];
  source: "upload" | "webcam";
}

export interface ComplainantDetails {
  fullName: string;
  state: string;
  city: string;
  mobile: string;
  email: string;
  relativeName: string;
  relationship: string;
}

export interface AppStatus {
  status: string;
  region: string;
  compliance: {
    dpdpAct: string;
    itAct: string;
    cybercrimeGovFormat: string;
  };
  tier: "free" | "guardian" | "institutional";
  scanCount: number;
  limitReached: boolean;
  user?: UserAccount;
}

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  state: string;
  city: string;
  mobile: string;
  relativeName: string;
  relationship: string;
  tier: "free" | "guardian" | "institutional";
  scanCount: number;
}

