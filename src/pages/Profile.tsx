import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { User, Wallet, Award, Link as LinkIcon, ArrowDownToLine } from 'lucide-react';
import type { User as UserType, Link as LinkType } from '../types';
import { fetchFromSupabase } from '../services/dataService';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function Profile() {
  const [user, setUser] = useState<UserType | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const minimumWithdrawalAmount = 2000000;
  const maximumWithdrawalAmount = 2000000;
  const [tasksAdded, setTasksAdded] = useState(0);
  const [tasksSupported, setTasksSupported] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) {
          setLoading(false);
          return;
        }
  
        const currentUser = JSON.parse(userStr);
        const users = await fetchFromSupabase<UserType>('users');
        const matchedUser = users?.find(u => u.username === currentUser.username);
  
        if (!matchedUser) {
          setLoading(false);
          return;
        }
  
        const links = await fetchFromSupabase<LinkType>('links');
        const userLinks = links?.filter(link => link.username === matchedUser.username) || [];
        setTasksAdded(userLinks.length);
  
        const supportedCount = links?.filter(link =>
          link.supportedBy?.includes(currentUser.username)
        ).length || 0;
  
        setTasksSupported(supportedCount);
        setUser(matchedUser);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load profile data');
        setLoading(false);
      }
    };
  
    loadData();
  }, []);
  

  const handleWithdraw = async () => {
    if (!user) return;
  
    const amount = Number(withdrawAmount);
    if (amount >= minimumWithdrawalAmount && amount <= user.balance && amount <= maximumWithdrawalAmount) {
      const withdrawal = {
        username: user.username,
        amount,
        walletAddress: user.walletAddress,
        timestamp: new Date().toISOString()
      };
  
      // 1. Supabase'e yeni çekim kaydı ekle
      const { error: withdrawError } = await supabase
        .from('withdrawals')
        .insert(withdrawal);
  
      if (withdrawError) {
        console.error('Withdraw insert error:', withdrawError);
        toast.error('Withdrawal failed.');
        return;
      }
  
      // 2. Kullanıcının bakiyesini güncelle
      const newBalance = user.balance - amount;
  
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('username', user.username);
  
      if (updateError) {
        console.error('Balance update error:', updateError);
        toast.error('Balance update failed.');
        return;
      }
  
      setUser(prev => prev ? ({ ...prev, balance: newBalance }) : null);
      setWithdrawAmount('');
      toast.success('Withdrawal successful!');
    } else {
      toast.error(`Invalid withdrawal amount. Minimum withdrawal amount is ${minimumWithdrawalAmount} MemeX and maximum withdrawal amount is ${maximumWithdrawalAmount} MemeX.`);
    }
  };
  

  const handleSaveWallet = async () => {
    if (!user) return;
  
    const { error } = await supabase
      .from('users')
      .update({ walletAddress: user.walletAddress })
      .eq('username', user.username);
  
    if (error) {
      console.error('Wallet update error:', error.message);
      toast.error('Failed to save wallet address.');
    } else {
      toast.success('Wallet address saved!');
      localStorage.setItem('currentUser', JSON.stringify({ ...user }));
    }
  };
  

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg">Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-red-600">User not found</h2>
        <p className="mt-2 text-gray-600">Please log in to view your profile</p>
        <Button 
          className="mt-4"
          onClick={() => window.location.href = '/login'}
        >
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <p className="mt-1 text-lg font-medium">{user.username}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Wallet Address</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                value={user.walletAddress}
                onChange={(e) => setUser(prev => prev ? ({ ...prev, walletAddress: e.target.value }) : null)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your wallet address"
              />
              <Button onClick={handleSaveWallet}>Save</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LinkIcon className="h-5 w-5" />
              Tasks Added
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatNumber(tasksAdded)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5" />
              Tasks Supported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatNumber(tasksSupported)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {formatNumber(user.balance)}
              <span className="text-sm ml-1">MemeX</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5" />
            Withdraw MemeX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount to Withdraw (Available: {formatNumber(user.balance)} MemeX)
            </label>
            <p className="text-sm text-gray-500">Minimum withdrawal amount: 2,000,000 MemeX ve maksimum withdrawal amount: 2,000,000</p>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={user?.balance}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter amount to withdraw"
              />
              <Button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || !user || Number(withdrawAmount) < minimumWithdrawalAmount || Number(withdrawAmount) > user.balance}
              >
                Withdraw
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
