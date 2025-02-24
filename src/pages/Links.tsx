import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Link2, Flag, ThumbsUp, Plus, Clock, Trash2 } from 'lucide-react';
import type { Link as LinkType, Admin as AdminType, User as UserType } from '../types';
import { readJsonFile, writeJsonFile } from '../services/dataService';
import toast from 'react-hot-toast';

function getTimeRemaining(expiryDate: Date): string {
  const now = new Date().getTime();
  const distance = expiryDate.getTime() - now;

  if (distance < 0) {
    return "Expired";
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export function Links() {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({
    url: '',
    platform: 'Twitter' as LinkType['platform']
  });
  const [supportedLinks, setSupportedLinks] = useState<string[]>([]);
  const [admins, setAdmins] = useState<AdminType[]>([]);
  const [currentUser, setCurrentUser] = React.useState<UserType | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }

      const linksData = await readJsonFile<{ links: LinkType[] }>('links.json');
      if (linksData) {
        setLinks(linksData.links);
      }

       const adminData = await readJsonFile<{ admins: AdminType[] }>('admin.json');
        if (adminData) {
            setAdmins(adminData.admins);
        }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      const storedSupportedLinks = localStorage.getItem(`supportedLinks_${currentUser.username}`);
      if (storedSupportedLinks) {
        setSupportedLinks(JSON.parse(storedSupportedLinks));
      }
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`supportedLinks_${currentUser?.username || 'default'}`, JSON.stringify(supportedLinks));
  }, [supportedLinks, currentUser]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLinks(prevLinks => {
        return prevLinks.map(link => link);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAddLink = async () => {
    if (newLink.url && currentUser) {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now

      const link: LinkType = {
        username: currentUser.username, // Use the current user's username
        platform: newLink.platform,
        timestamp: now.toISOString(),
        url: newLink.url,
        groupInfo: {
          name: 'MemeX Community',
          id: '123456789'
        },
        rewards: {
          add: 10,
          support: 5
        },
        reports: [],
        expiryDate: expiryDate.toISOString(),
        supports: 0, // Initialize supports count
        supportedBy: [] // Initialize supportedBy array
      };

      const updatedLinks = [link, ...links];
      const success = await writeJsonFile('links.json', { links: updatedLinks });

      if (success) {
        setLinks(updatedLinks);
        setNewLink({ url: '', platform: 'Twitter' });
        setShowAddForm(false);
      }
    }
  };

  const handleReport = async (linkUrl: string) => {
    if (!currentUser) return;

    const updatedLinks = links.map(link => {
      if (link.url === linkUrl) {
        const alreadyReported = link.reports.includes(currentUser.username);
        const updatedReports = alreadyReported
          ? link.reports.filter(name => name !== currentUser.username) // Remove report
          : [...link.reports, currentUser.username]; // Add report

        return {
          ...link,
          reports: updatedReports
        };
      }
      return link;
    });

    const success = await writeJsonFile('links.json', { links: updatedLinks });
    if (success) {
      setLinks(updatedLinks);
    }
  };

  const handleSupport = async (linkUrl: string) => {
    if (!currentUser) return;

    try {
      const usersData = await readJsonFile<{ users: UserType[] }>('users.json');
      const currentUserData = usersData?.users.find(u => u.username === currentUser.username);

      if (!currentUserData) {
        toast.error('User not found.');
        return;
      }

      const adminData = await readJsonFile<{ settings: { supportReward: number } }>('admin.json');
      const supportReward = adminData?.settings?.supportReward || 0;

      const updatedBalance = currentUserData.balance + supportReward;

      const updatedUsers = usersData?.users.map(u =>
        u.username === currentUser.username ? { ...u, balance: updatedBalance } : u
      ) || [];

      const updatedLinks = links.map(link => {
        if (link.url === linkUrl) {
          const alreadySupported = link.supportedBy?.includes(currentUser.username);
          if (alreadySupported) {
            return link;
          }
          return { ...link, supports: (link.supports || 0) + 1, supportedBy: [...(link.supportedBy || []), currentUser.username] };
        }
        return link;
      });

      const linksSuccess = await writeJsonFile('links.json', { links: updatedLinks });

      if (!linksSuccess) {
        toast.error('Failed to update link supports.');
        return;
      }

      const success = await writeJsonFile('users.json', { users: updatedUsers });

      if (success) {
        setSupportedLinks(prev => [...prev, linkUrl]);
        setLinks(updatedLinks); // Update the links state with the new supports count
        toast.success('Link supported successfully!');
        setSupportedLinks(prev => [...prev, linkUrl]);
      } else {
        toast.error('Failed to update balance.');
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error('Failed to support link.');
    }
  };

  const handleAdminDelete = async (linkUrl: string) => {
    const updatedLinks = links.filter(link => link.url !== linkUrl);
    const success = await writeJsonFile('links.json', { links: updatedLinks });
    if (success) {
      setLinks(updatedLinks);
      toast.success('Link deleted successfully!');
    } else {
      toast.error('Failed to delete link.');
    }
  };

  const isLinkSupported = (linkUrl: string) => {
    return supportedLinks.includes(linkUrl);
  };

  const isReportedByCurrentUser = (link: LinkType) => {
    return link.reports.includes(currentUser?.username || '');
  };

  const isAdmin = () => {
        return admins.some(admin => admin.username === currentUser?.username);
    };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Links</h1>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Link
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Platform</label>
              <select
                value={newLink.platform}
                onChange={(e) => setNewLink(prev => ({ ...prev, platform: e.target.value as LinkType['platform'] }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="Twitter">Twitter</option>
                <option value="Reddit">Reddit</option>
                <option value="Facebook">Facebook</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">URL</label>
              <input
                type="url"
                value={newLink.url}
                onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Enter link URL"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button onClick={handleAddLink}>Add Link</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {links.map((link, index) => {
          const expiryDate = new Date(link.expiryDate);
          const timeRemaining = getTimeRemaining(expiryDate);
          const isSupported = link.supportedBy?.includes(currentUser?.username || '');
          const isReported = isReportedByCurrentUser(link);

          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-medium">
                  <span className="text-blue-600">{link.platform}</span> Link
                </CardTitle>
                <div className="flex flex-col items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={`flex items-center gap-1 ${isSupported ? 'bg-green-500 text-white hover:bg-green-600' : ''}`}
                    onClick={() => handleSupport(link.url)}
                    disabled={isSupported}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {isSupported ? 'Supported' : 'Support'}
                  </Button>
                  <span className="text-xs">{link.supports || 0} Supports</span> {/* Display the supports count */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`flex items-center gap-1 ${isReported ? 'text-yellow-600' : 'text-red-600'}`}
                    onClick={() => handleReport(link.url)}
                  >
                    <Flag className="h-4 w-4" />
                    {isReported ? 'Unreport' : 'Report'} {link.reports.length > 0 && `(${link.reports.length})`}
                  </Button>
                  {isAdmin() && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 text-red-600"
                      onClick={() => handleAdminDelete(link.url)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Added by {link.username}</span>
                  <span>•</span>
                  <span>{new Date(link.timestamp).toLocaleDateString()}</span>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {link.url}
                </a>
                <div className="text-sm text-gray-500">
                  Rewards: {link.rewards.add} MemeX for adding, {link.rewards.support} MemeX for supporting
                </div>
                {link.reports.length > 0 && (
                  <div className="text-sm text-red-600">
                    Reported by: {link.reports.join(', ')}
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Expires in: {timeRemaining}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
