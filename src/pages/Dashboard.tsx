import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Link2, Award, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { readJsonFile } from '../services/dataService';
import type { User, Link } from '../types';

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeLinks: 0,
    totalRewards: 0,
    totalWithdrawals: 0
  });

  const [topUsers, setTopUsers] = useState<{ name: string; links: number }[]>([]);
  const [platformStats, setPlatformStats] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      const usersData = await readJsonFile<{ users: User[] }>('users.json');
      const linksData = await readJsonFile<{ links: Link[] }>('links.json');
      const withdrawalsData = await readJsonFile<{ withdrawals: any[] }>('cekim.json');

      if (usersData?.users && linksData?.links && withdrawalsData?.withdrawals) {
        // Calculate stats
        setStats({
          totalUsers: usersData.users.length,
          activeLinks: linksData.links.length,
          totalRewards: usersData.users.reduce((sum, user) => sum + user.balance, 0),
          totalWithdrawals: withdrawalsData.withdrawals.reduce((sum, w) => sum + w.amount, 0)
        });

        // Calculate top users by links
        const userLinkCounts = linksData.links.reduce((acc, link) => {
          acc[link.username] = (acc[link.username] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const sortedUsers = Object.entries(userLinkCounts)
          .map(([name, links]) => ({ name, links }))
          .sort((a, b) => b.links - a.links)
          .slice(0, 5);

        setTopUsers(sortedUsers);

        // Calculate platform distribution
        const platformCounts = linksData.links.reduce((acc, link) => {
          acc[link.platform] = (acc[link.platform] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setPlatformStats(
          Object.entries(platformCounts).map(([name, value]) => ({ name, value }))
        );
      }
    };

    loadDashboardData();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const renderXAxisLabel = (props: any) => {
    const { x, y, value, width } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="end"
          transform="rotate(-90)"
          style={{ fontSize: '12px', fill: '#666' }}
        >
          {value}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Links</CardTitle>
            <Link2 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.activeLinks)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Rewards</CardTitle>
            <Award className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats.totalRewards)}
              <span className="text-sm ml-1">MemeX</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Withdrawals</CardTitle>
            <Wallet className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats.totalWithdrawals)}
              <span className="text-sm ml-1">MemeX</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Users by Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topUsers}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={renderXAxisLabel} interval={0} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="links" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {platformStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
