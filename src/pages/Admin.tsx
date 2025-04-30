import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Shield, Users, Coins, Flag, X, Trash2, Search, Send } from 'lucide-react'; // Import Send icon
import type { Admin as AdminType, Link as LinkType, User as UserType } from '../types';
import { fetchFromSupabase } from '../services/dataService';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';


export function Admin() {
  const [admins, setAdmins] = useState<AdminType[]>([]);
  const [newAdmin, setNewAdmin] = useState('');
  const [taskReward, setTaskReward] = useState(0);
  const [supportReward, setSupportReward] = useState(0);
  const [settingsId, setSettingsId] = useState('');
  const [reportedLinks, setReportedLinks] = useState<LinkType[]>([]);
  const [allLinks, setAllLinks] = useState<LinkType[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);

  useEffect(() => {
  const loadData = async () => {
    const adminsData = await fetchFromSupabase<AdminType>('admin');
    const settingsData = await fetchFromSupabase<any>('settings');

    setAdmins(adminsData || []);
    if (settingsData && settingsData[0]) {
      setTaskReward(settingsData[0].taskReward);
      setSupportReward(settingsData[0].supportReward);
      setSettingsId(settingsData[0].id);
    }

    const linksData = await fetchFromSupabase<LinkType>('links');
    if (linksData) {
      setAllLinks(linksData);
      const reported = linksData.filter(link => link.reports.length > 0);
      setReportedLinks(reported);
    }

    const usersData = await fetchFromSupabase<UserType>('users');
    setAllUsers(usersData || []);
  };

  loadData();
}, []);


  useEffect(() => {
    if (searchUser) {
      const foundUser = allUsers.find(user => user.username.toLowerCase().includes(searchUser.toLowerCase()));
      setSelectedUser(foundUser || null);
    } else {
      setSelectedUser(null);
    }
  }, [searchUser, allUsers]);

  const handleAddAdmin = async () => {
    if (newAdmin) {
      const { error } = await supabase.from('admin').insert([{ username: newAdmin }]);
      if (error) {
        toast.error('Failed to add admin.');
        return;
      }

      setAdmins(prev => [...prev, { username: newAdmin }]);
      setNewAdmin('');
      toast.success('Admin added!');
    }
  };


  const handleRemoveAdmin = async (username: string) => {
    const { error } = await supabase.from('admin').delete().eq('username', username);
    if (error) {
      toast.error('Failed to remove admin.');
      return;
    }

    setAdmins(prev => prev.filter(admin => admin.username !== username));
    toast.success('Admin removed!');
  };


 const handleSaveSettings = async () => {
  const { error } = await supabase
    .from('settings')
    .update({ taskReward, supportReward })
    .eq('id', settingsId);

  if (error) {
    toast.error('Failed to save settings.');
  } else {
    toast.success('Settings saved successfully!');
  }
};


  const handleRemoveReport = async (linkUrl: string) => {
    const { error } = await supabase
      .from('links')
      .update({ reports: [] })
      .eq('url', linkUrl);

    if (error) {
      toast.error('Failed to remove report.');
      return;
    }

    const updated = allLinks.map(link =>
      link.url === linkUrl ? { ...link, reports: [] } : link
    );
    setAllLinks(updated);
    setReportedLinks(updated.filter(link => link.reports.length > 0));
    toast.success('Report removed successfully!');
  };


  const handleAdminDelete = async (linkUrl: string) => {
    const { error } = await supabase.from('links').delete().eq('url', linkUrl);
    if (error) {
      toast.error('Failed to delete link.');
      return;
    }

    const updated = allLinks.filter(link => link.url !== linkUrl);
    setAllLinks(updated);
    setReportedLinks(updated.filter(link => link.reports.length > 0));
    toast.success('Link deleted successfully!');
  };


  const handleChangePassword = async (newPassword: string) => {
    if (!selectedUser) return;

    const { error } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id', selectedUser.id);

    if (error) {
      toast.error('Failed to change password.');
      return;
    }

    const updatedUsers = allUsers.map(user =>
      user.id === selectedUser.id ? { ...user, password: newPassword } : user
    );
    setAllUsers(updatedUsers);
    setSelectedUser(prev => (prev ? { ...prev, password: newPassword } : null));
    toast.success('Password changed successfully!');
  };


  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    const { error } = await supabase.from('users').delete().eq('id', selectedUser.id);
    if (error) {
      toast.error('Failed to delete user.');
      return;
    }

    setAllUsers(prev => prev.filter(user => user.id !== selectedUser.id));
    setSelectedUser(null);
    toast.success('User deleted successfully!');
  };


  const handleToggleLinkRestriction = async () => {
    if (!selectedUser) return;

    const newStatus = !selectedUser.canAddLinks;

    const { error } = await supabase
      .from('users')
      .update({ canAddLinks: newStatus })
      .eq('id', selectedUser.id);

    if (error) {
      toast.error('Failed to toggle link restriction.');
      return;
    }

    const updatedUsers = allUsers.map(user =>
      user.id === selectedUser.id ? { ...user, canAddLinks: newStatus } : user
    );
    setAllUsers(updatedUsers);
    setSelectedUser(prev => (prev ? { ...prev, canAddLinks: newStatus } : null));
    toast.success(`Link adding ${newStatus ? 'enabled' : 'disabled'} for user.`);
  };

  const handleResendLastLink = async () => {
    try {
      const response = await fetch('/api/telegram/resend-last', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Failed to resend last link.');
      }
    } catch (error) {
      console.error('Error resending last link:', error);
      toast.error('An error occurred while trying to resend the link.');
    }
  };


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Admin Panel</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Enter admin username"
            />
            <Button onClick={handleAddAdmin}>Add Admin</Button>
          </div>
          <div className="divide-y">
            {admins.map((admin) => (
              <div key={admin.username} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{admin.username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  onClick={() => handleRemoveAdmin(admin.username)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Reward Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Task Reward</label>
            <input
              type="number"
              value={taskReward}
              onChange={(e) => setTaskReward(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Enter task reward amount"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Support Reward</label>
            <input
              type="number"
              value={supportReward}
              onChange={(e) => setSupportReward(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Enter support reward amount"
            />
          </div>
          <Button onClick={handleSaveSettings}>Save Settings</Button>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" /> {/* Use Send icon */}
            Telegram Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleResendLastLink}>Resend Last Link to Telegram</Button>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Reported Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reportedLinks.length === 0 ? (
            <p>No links have been reported.</p>
          ) : (
            <ul className="list-disc pl-5">
              {reportedLinks.map((link) => (
                <li key={link.url} className="py-1 flex items-center justify-between">
                  <div>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {link.url}
                    </a>
                    <p className="text-sm text-gray-500">
                      Reported by: {link.reports.join(', ')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-yellow-600"
                      onClick={() => handleRemoveReport(link.url)}
                    >
                      <X className="h-4 w-4" />
                      Remove Report
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleAdminDelete(link.url)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Link
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Search for a user"
            />
            <Button variant="outline">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-medium">Selected User: {selectedUser.username}</p>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={handleDeleteUser}>
                  Delete User
                </Button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Change Password</label>
                <input
                  type="password"
                  placeholder="New Password"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  onBlur={(e) => handleChangePassword(e.target.value)}
                />
              </div>
              <div>
                <Button onClick={handleToggleLinkRestriction}>
                  {selectedUser.canAddLinks ? 'Restrict Link Adding' : 'Allow Link Adding'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
