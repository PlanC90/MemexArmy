export interface User {
  id: string;
  username: string;
  password: string; // Will be hashed
  tasksAdded: number;
  tasksSupported: number;
  balance: number;
  walletAddress: string;
  roles: UserRole[];
  createdAt: string;
}

export type UserRole = 'user' | 'admin';

export interface UserPermissions {
  canAddLinks: boolean;
  canViewAdmin: boolean;
  canDeleteLinks: boolean;
  canViewDownloads: boolean;
}

export interface Link {
  id: string;
  username: string;
  platform: 'Twitter' | 'Reddit' | 'Facebook' | 'TikTok' | 'YouTube' | 'Other';
  timestamp: string;
  url: string;
  groupInfo: {
    name: string;
    id: string;
  };
  rewards: {
    add: number;
    support: number;
  };
  reports: string[];
  expiryDate: string;
}

export interface Withdrawal {
  id: string;
  username: string;
  amount: number;
  walletAddress: string;
  timestamp: string;
}

export interface Admin {
  username: string;
}
