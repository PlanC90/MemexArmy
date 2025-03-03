import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Shield, Users, Coins, Flag, X, Trash2, Search } from 'lucide-react';
import type { Admin as AdminType, Link as LinkType, User as UserType } from '../types';
import { readJsonFile, writeJsonFile } from '../services/dataService';
import toast from 'react-hot-toast';

export function Admin() {
  const [admins, setAdmins] = useState<AdminType[]>([]);
  const [newAdmin, setNewAdmin] = useState('');
  const [taskReward, setTaskReward] = useState(0);
  const [supportReward, setSupportReward] = useState(0);
  const [reportedLinks, setReportedLinks] = useState<LinkType[]>([]);
  const [allLinks, setAllLinks] = useState<LinkType[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);

  useEffect(() => {
    const loadAdminData = async () => {
      const data = await readJsonFile<{
        admins: AdminType[];
        settings: { taskReward: number; supportReward: number };
      }>('admin.json');
      
      setAdmins(data?.admins || []);
      setTaskReward(data?.settings?.taskReward || 0);
      setSupportReward(data?.settings?.supportReward || 0);
    };

    const loadLinks = async () => {
      const linksData = await readJsonFile<{ links: LinkType[] }>('links.json');
      if (linksData?.links) {
        setAllLinks(linksData.links);
        const reported = linksData.links.filter(link => link.reports.length > 0);
        setReportedLinks(reported);
      }
    };

    const loadUsers = async () => {
      const usersData = await readJsonFile<{ users: UserType[] }>('users.json');
      setAllUsers(usersData?.users || []);
    };

    loadAdminData();
    loadLinks();
    loadUsers();
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
      const updatedAdmins = [...admins, { username: newAdmin }];
      const success = await writeJsonFile('admin.json', {
        admins: updatedAdmins,
        settings: { taskReward, supportReward }
      });

      if (success) {
        setAdmins(updatedAdmins);
        setNewAdmin('');
      }
    }
  };

  const handleRemoveAdmin = async (username: string) => {
    const updatedAdmins = admins.filter(admin => admin.username !== username);
    const success = await writeJsonFile('admin.json', {
      admins: updatedAdmins,
      settings: { taskReward, supportReward }
    });

    if (success) {
      setAdmins(updatedAdmins);
    }
  };

  const handleSaveSettings = async () => {
    const success = await writeJsonFile('admin.json', {
      admins: admins,
      settings: { taskReward, supportReward }
    });

    if (success) {
      toast.success('Settings saved successfully!');
    } else {
      toast.error('Failed to save settings.');
    }
  };

  const handleRemoveReport = async (linkUrl: string) => {
    const updatedLinks = allLinks.map(link => {
      if (link.url === linkUrl) {
        return { ...link, reports: [] };
      }
      return link;
    });

    const success = await writeJsonFile('links.json', { links: updatedLinks });
    if (success) {
      setAllLinks(updatedLinks);
      setReportedLinks(updatedLinks.filter(link => link.reports.length > 0));
      toast.success('Report removed successfully!');
    } else {
      toast.error('Failed to remove report.');
    }
  };

  const handleAdminDelete = async (linkUrl: string) => {
    const updatedLinks = allLinks.filter(link => link.url !== linkUrl);
    const success = await writeJsonFile('links.json', { links: updatedLinks });
    if (success) {
      setAllLinks(updatedLinks);
      setReportedLinks(updatedLinks.filter(link => link.reports.length > 0));
      toast.success('Link deleted successfully!');
    } else {
      toast.error('Failed to delete link.');
    }
  };

  const handleChangePassword = async (newPassword: string) => {
    if (!selectedUser) return;

    const updatedUsers = allUsers.map(user => {
      if (user.id === selectedUser.id) {
        return { ...user, password: newPassword };
      }
      return user;
    });

    const success = await writeJsonFile('users.json', { users: updatedUsers });
    if (success) {
      setAllUsers(updatedUsers);
      setSelectedUser(prev => prev ? ({ ...prev, password: newPassword }) : null);
      toast.success('Password changed successfully!');
    } else {
      toast.error('Failed to change password.');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    const updatedUsers = allUsers.filter(user => user.id !== selectedUser.id);
    const success = await writeJsonFile('users.json', { users: updatedUsers });
    if (success) {
      setAllUsers(updatedUsers);
      setSelectedUser(null);
      toast.success('User deleted successfully!');
    } else {
      toast.error('Failed to delete user.');
    }
  };

  const handleToggleLinkRestriction = async () => {
    if (!selectedUser) return;

    const updatedUsers = allUsers.map(user => {
      if (user.id === selectedUser.id) {
        return { ...user, canAddLinks: !user.canAddLinks };
      }
      return user;
    });

    const success = await writeJsonFile('users.json', { users: updatedUsers });
    if (success) {
      setAllUsers(updatedUsers);
      setSelectedUser(prev => prev ? ({ ...prev, canAddLinks: !prev.canAddLinks }) : null);
      toast.success(`Link adding ${selectedUser.canAddLinks ? 'enabled' : 'disabled'} for user.`);
    } else {
      toast.error('Failed to toggle link restriction.');
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
