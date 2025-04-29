import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Link2, Flag, ThumbsUp, Plus, Clock, Trash2, Search } from 'lucide-react';
import type { Link as LinkType, Admin as AdminType, User as UserType } from '../types';
import { fetchFromSupabase } from '../services/dataService';
import { supabase } from '../supabaseClient';
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

function getRemainingTime(lastReset: Date): { timeRemaining: string; isExpired: boolean } {
    const resetTime = new Date(lastReset.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = resetTime.getTime() - now.getTime();

    if (diff <= 0) {
        return { timeRemaining: "Ready to add links!", isExpired: true };
    }

    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { timeRemaining: `Resets in ${hours}h ${minutes}m ${seconds}s`, isExpired: false };
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
  const [taskReward, setTaskReward] = useState(0);
  const [supportReward, setSupportReward] = useState(0);
  const [platformFilter, setPlatformFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
    const [userFilter, setUserFilter] = useState('All');
    const [supportFilter, setSupportFilter] = useState('All');
    const [reportFilter, setReportFilter] = useState('All');
    const [linksAddedToday, setLinksAddedToday] = useState(0);
    const [lastResetTime, setLastResetTime] = useState(new Date());
    const [remainingTime, setRemainingTime] = useState({ timeRemaining: "Ready to add links!", isExpired: true });
    const [lastLinkAdded, setLastLinkAdded] = useState<Date | null>(null);

    const updateExpiryDates = async (currentLinks: LinkType[]) => {
        const updatedLinks = currentLinks.map(link => {
            const timestamp = new Date(link.timestamp).getTime();
            const expiryDate = new Date(timestamp + 7 * 24 * 60 * 60 * 1000).toISOString();
            return { ...link, expiryDate };
        });
        return updatedLinks;
    };

    const deleteExpiredLinks = async (currentLinks: LinkType[]) => {
        const now = new Date();
        let updatedLinks: LinkType[] = []; // Initialize updatedLinks here
        updatedLinks = currentLinks.map(link => {
            if (new Date(link.expiryDate) <= now) {
                // Clear URL, groupInfo, and platform
                return {
                    ...link,
                    url: '',
                    groupInfo: { name: '', id: '' },
                    platform: ''
                };
            }
            return link;
        });
        for (const link of updatedLinks) {
          await supabase.from('links').update({
            url: link.url,
            groupInfo: link.groupInfo,
            platform: link.platform
          }).eq('id', link.id); 
        }
        
        return updatedLinks;
    };

  useEffect(() => {
    const loadData = async () => {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }

      const linksData = await fetchFromSupabase<LinkType>('links');
      if (linksData) {
        const updated = await updateExpiryDates(linksData);
          const validLinks = await deleteExpiredLinks(updated);
          setLinks(validLinks);
      }

      const adminData = await fetchFromSupabase<AdminType>('admin');
      const settingsData = await fetchFromSupabase<any>('settings'); 
      
      
      setAdmins(adminData || []);
      if (settingsData && settingsData[0]) {
        setTaskReward(settingsData[0].taskReward);
        setSupportReward(settingsData[0].supportReward);
      }
      

        const storedLinksAdded = localStorage.getItem(`linksAddedToday_${currentUser?.username || 'default'}`);
        const storedLastResetTime = localStorage.getItem(`lastResetTime_${currentUser?.username || 'default'}`);
        const storedLastLinkAdded = localStorage.getItem(`lastLinkAdded_${currentUser?.username || 'default'}`);

        const today = new Date().toLocaleDateString();
        const storedDate = storedLastResetTime ? new Date(storedLastResetTime).toLocaleDateString() : null;

        let parsedLinksAdded = 0;
        let parsedLastResetTime = new Date();
        let parsedLastLinkAdded: Date | null = null;

        if (storedLinksAdded) {
            parsedLinksAdded = parseInt(storedLinksAdded, 10);
        }

        if (storedLastResetTime) {
            parsedLastResetTime = new Date(storedLastResetTime);
        }

        if (storedLastLinkAdded) {
            parsedLastLinkAdded = new Date(storedLastLinkAdded);
        }

        if (storedDate === today) {
            setLinksAddedToday(parsedLinksAdded);
            setLastResetTime(parsedLastResetTime);
        } else {
            setLinksAddedToday(0);
            setLastResetTime(new Date());
            localStorage.setItem(`lastResetTime_${currentUser?.username || 'default'}`, new Date().toISOString());
            localStorage.setItem(`linksAddedToday_${currentUser?.username || 'default'}`, '0');
        }

        setLastLinkAdded(parsedLastLinkAdded);
    };
    loadData();
  }, []);

    useEffect(() => {
        if (currentUser) {
            const storedLinksAdded = localStorage.getItem(`linksAddedToday_${currentUser?.username || 'default'}`);
            const storedLastResetTime = localStorage.getItem(`lastResetTime_${currentUser?.username || 'default'}`);
            const storedLastLinkAdded = localStorage.getItem(`lastLinkAdded_${currentUser?.username || 'default'}`);

            const today = new Date().toLocaleDateString();
            const storedDate = storedLastResetTime ? new Date(storedLastResetTime).toLocaleDateString() : null;

            let parsedLinksAdded = 0;
            let parsedLastResetTime = new Date();
            let parsedLastLinkAdded: Date | null = null;

            if (storedLinksAdded) {
                parsedLinksAdded = parseInt(storedLinksAdded, 10);
            }

            if (storedLastResetTime) {
                parsedLastResetTime = new Date(storedLastResetTime);
            }

             if (storedLastLinkAdded) {
                parsedLastLinkAdded = new Date(storedLastLinkAdded);
            }

            if (storedDate === today) {
                setLinksAddedToday(parsedLinksAdded);
                setLastResetTime(parsedLastResetTime);
            } else {
                setLinksAddedToday(0);
                setLastResetTime(new Date());
                localStorage.setItem(`lastResetTime_${currentUser?.username || 'default'}`, new Date().toISOString());
                localStorage.setItem(`linksAddedToday_${currentUser?.username || 'default'}`, '0');
            }

            setLastLinkAdded(parsedLastLinkAdded);
        }
    }, [currentUser]);

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

    useEffect(() => {
        const timer = setInterval(() => {
            setRemainingTime(getRemainingTime(lastResetTime));
        }, 1000);

        return () => clearInterval(timer);
    }, [lastResetTime]);

    const isValidUrl = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleAddLink = async () => {
      if (newLink.url && currentUser) {
        if (!isValidUrl(newLink.url)) {
          toast.error('Please enter a valid URL.');
          return;
        }
    
        const now = new Date();
        const lastLinkAddedKey = `lastLinkAdded_${currentUser.username}`;
        const storedLastLinkAdded = localStorage.getItem(lastLinkAddedKey);
    
        if (storedLastLinkAdded) {
          const lastLinkAddedDate = new Date(storedLastLinkAdded);
          const timeDiff = now.getTime() - lastLinkAddedDate.getTime();
    
          if (timeDiff < 24 * 60 * 60 * 1000) {
            const timeLeft = 24 * 60 * 60 * 1000 - timeDiff;
            const hours = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
            toast.error(`You can add another link in ${hours}h ${minutes}m ${seconds}s.`);
            return;
          }
        }
    
        const expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 gün
    
        const newLinkData = {
          id: crypto.randomUUID(), // uuidv4() da olabilir
          username: currentUser.username,
          url: newLink.url,
          platform: newLink.platform,
          timestamp: now.toISOString(),
          expiryDate: expiryDate.toISOString(),
          groupInfo: {
            name: 'MemeX Community',
            id: '123456789'
          },
          rewards: {
            add: taskReward,
            support: supportReward
          },
          supports: 0,
          supportedBy: [],
          reports: []
        };
    
        const { error } = await supabase.from('links').insert([newLinkData]);
    
        if (error) {
          console.error("Supabase insert error:", error.message); // hata detayını logla
          toast.error('Failed to add link.');
          return;
        }
    
        setLinks([newLinkData, ...links]);
        setNewLink({ url: '', platform: 'Twitter' });
        setShowAddForm(false);
    
        localStorage.setItem(lastLinkAddedKey, now.toISOString());
        setLastLinkAdded(now);
        setLinksAddedToday(1);
        localStorage.setItem(`linksAddedToday_${currentUser.username}`, '1');
      }
    };
    
    
    
    

    const handleReport = async (linkUrl: string) => {
      if (!currentUser) return;
    
      const targetLink = links.find(link => link.url === linkUrl);
      if (!targetLink) return;
    
      const alreadyReported = targetLink.reports.includes(currentUser.username);
      const updatedReports = alreadyReported
        ? targetLink.reports.filter(name => name !== currentUser.username)
        : [...targetLink.reports, currentUser.username];
    
      const { error } = await supabase
        .from('links')
        .update({ reports: updatedReports })
        .eq('url', linkUrl);
    
      if (error) {
        toast.error('Failed to update report status.');
        return;
      }
    
      const updatedLinks = links.map(link =>
        link.url === linkUrl ? { ...link, reports: updatedReports } : link
      );
    
      setLinks(updatedLinks);
    };
    

    const handleSupport = async (linkUrl: string) => {
      if (!currentUser) return;
    
      try {
        // Kullanıcıyı Supabase'ten çek
        const usersData = await fetchFromSupabase<UserType>('users');
        const currentUserData = usersData?.find(u => u.username === currentUser.username);
    
        if (!currentUserData) {
          toast.error('User not found.');
          return;
        }
    
        // Ödül miktarını Supabase settings tablosundan çek
        const settingsData = await fetchFromSupabase<any>('settings');
        const supportReward = settingsData?.[0]?.supportReward || 0;
    
        // Güncel bakiye hesapla
        const updatedBalance = currentUserData.balance + supportReward;
    
        // Linki bul
        const targetLink = links.find(link => link.url === linkUrl);
        if (!targetLink) {
          toast.error('Link not found.');
          return;
        }
    
        // Zaten desteklendiyse işlem yapma
        const alreadySupported = targetLink.supportedBy?.includes(currentUser.username);
        if (alreadySupported) {
          toast.error('You already supported this link.');
          return;
        }
    
        // Supabase'te kullanıcı güncelle
        await supabase.from('users').update({ balance: updatedBalance }).eq('username', currentUser.username);
    
        // Supabase'te link güncelle
        await supabase
          .from('links')
          .update({
            supports: (targetLink.supports || 0) + 1,
            supportedBy: [...(targetLink.supportedBy || []), currentUser.username]
          })
          .eq('url', linkUrl);
    
        // Frontend'de state güncelle
        setSupportedLinks(prev => [...prev, linkUrl]);
        const updatedLinks = links.map(link =>
          link.url === linkUrl
            ? {
                ...link,
                supports: (link.supports || 0) + 1,
                supportedBy: [...(link.supportedBy || []), currentUser.username]
              }
            : link
        );
        setLinks(updatedLinks);
        toast.success('Link supported successfully!');
      } catch (error) {
        console.error('Error supporting link:', error);
        toast.error('Failed to support link.');
      }
    };    

  const handleAdminDelete = async (linkUrl: string) => {
    const { error } = await supabase.from('links').delete().eq('url', linkUrl);
  
    if (error) {
      toast.error('Failed to delete link.');
      return;
    }
  
    const updatedLinks = links.filter(link => link.url !== linkUrl);
    setLinks(updatedLinks);
    toast.success('Link deleted successfully!');
  };
  

  const isLinkSupported = (linkUrl: string) => {
    return supportedLinks.includes(linkUrl);
  };

  const isReportedByCurrentUser = (link: LinkType) => {
    return link.reports.includes(currentUser?.username || '');
  };

  const isAdminCheck = () => {
        return admins.some(admin => admin.username === currentUser?.username);
    };

    const filteredLinks = links.filter(link => {
        const platformMatch = platformFilter === 'All' || link.platform === platformFilter;
        const searchMatch = link.url.toLowerCase().includes(searchQuery.toLowerCase());
        const userMatch = userFilter === 'All' || link.username.toLowerCase().includes(userFilter.toLowerCase());
        const supportMatch = supportFilter === 'All' || (supportFilter === 'Supported' && link.supportedBy.includes(currentUser?.username || '')) || (supportFilter === 'Not Supported' && !link.supportedBy.includes(currentUser?.username || ''));
        const reportMatch = reportFilter === 'All' || (reportFilter === 'Reported' && link.reports.length > 0) || (reportFilter === 'Not Reported' && link.reports.length === 0);

        return platformMatch && searchMatch && userMatch && supportMatch && reportMatch;
    });

    const canDeleteLink = (link: LinkType): boolean => {
        return isAdminCheck() || (currentUser && link.username === currentUser.username);
    };

    const supportedCount = filteredLinks.filter(link => link.supportedBy.includes(currentUser?.username || '')).length;
    const unsupportedCount = filteredLinks.filter(link => !link.supportedBy.includes(currentUser?.username || '')).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Links
          <span className="ml-4 text-sm text-gray-500">
            Supported: {supportedCount} | Not Supported: {unsupportedCount}
          </span>
        </h1>
          <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                  Links Added: {linksAddedToday} / 1
              </div>
              <div className="text-sm text-gray-600">
                  {remainingTime.timeRemaining}
              </div>
              <Button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2"
                  disabled={!isAdminCheck() || linksAddedToday >= 1}
              >
                  <Plus className="h-4 w-4" />
                  Add New Link
              </Button>
          </div>
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
              <Button onClick={handleAddLink} disabled={(() => {
                  if (!currentUser) return true;
                  const lastLinkAddedKey = `lastLinkAdded_${currentUser.username}`;
                  const storedLastLinkAdded = localStorage.getItem(lastLinkAddedKey);
                  if (storedLastLinkAdded) {
                      const lastLinkAddedDate = new Date(storedLastLinkAdded);
                      const timeDiff = new Date().getTime() - lastLinkAddedDate.getTime();
                      return timeDiff < 24 * 60 * 60 * 1000;
                  }
                  return false;
              })()}>Add Link</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Platform:</label>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="All">All</option>
            <option value="Twitter">Twitter</option>
            <option value="Reddit">Reddit</option>
            <option value="Facebook">Facebook</option>
            <option value="TikTok">TikTok</option>
            <option value="YouTube">YouTube</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">User:</label>
            <input
                type="text"
                placeholder="Filter by user..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Support:</label>
            <select
                value={supportFilter}
                onChange={(e) => setSupportFilter(e.target.value)}
                className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
                <option value="All">All</option>
                <option value="Supported">Supported</option>
                <option value="Not Supported">Not Supported</option>
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Report:</label>
            <select
                value={reportFilter}
                onChange={(e) => setReportFilter(e.target.value)}
                className="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
                <option value="All">All</option>
                <option value="Reported">Reported</option>
                <option value="Not Reported">Not Reported</option>
            </select>
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700">Search Links:</label>
          <div className="relative mt-1">
            <input
              type="text"
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredLinks.map((link, index) => {
          const expiryDate = new Date(link.expiryDate);
          const timeRemaining = getTimeRemaining(expiryDate);
          const isSupported = isLinkSupported(link.url);
          const isReported = isReportedByCurrentUser(link);
          const isAdmin = isAdminCheck();
          const canCurrentUserDelete = canDeleteLink(link);

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
                  {canCurrentUserDelete && (
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
                  className="text-blue-600 hover:underline break-all"
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
