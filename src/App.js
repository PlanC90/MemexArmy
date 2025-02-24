import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import RSS from 'rss';

const App = () => {
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState('');
  const [rssFeed, setRssFeed] = useState(null);

  useEffect(() => {
    generateRSSFeed();
  }, [links]);

  const addLink = () => {
    if (newLink.trim() !== '') {
      const newLinkItem = {
        id: uuidv4(),
        title: `Link ${links.length + 1}`,
        description: 'A new link',
        url: newLink,
        date: new Date().toISOString()
      };
      setLinks([...links, newLinkItem]);
      setNewLink('');
    }
  };

  const generateRSSFeed = () => {
    const feedOptions = {
      title: 'My RSS Feed',
      description: 'A list of links',
      feed_url: 'https://your-codesandbox-url/rss.xml',
      site_url: 'https://your-codesandbox-url',
      managingEditor: 'Your Name',
      webMaster: 'Your Name',
      copyright: `${new Date().getFullYear()} Your Name`,
      language: 'en',
      pubDate: new Date().toUTCString(),
      ttl: 60
    };

    const feed = new RSS(feedOptions);

    links.forEach(link => {
      feed.item({
        title: link.title,
        description: link.description,
        url: link.url,
        date: link.date,
        guid: link.id
      });
    });

    setRssFeed(feed.xml({ indent: true }));
  };

  const downloadRSSFeed = () => {
    if (rssFeed) {
      const blob = new Blob([rssFeed], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'links.rss';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div>
      <h1>RSS Feed Generator</h1>
      <div>
        <input
          type="text"
          value={newLink}
          onChange={e => setNewLink(e.target.value)}
          placeholder="Enter link URL"
        />
        <button onClick={addLink}>Add Link</button>
      </div>
      <button onClick={downloadRSSFeed} disabled={!rssFeed}>
        Download RSS Feed
      </button>
      <pre>{rssFeed ? rssFeed : 'No RSS feed generated yet.'}</pre>
    </div>
  );
};

export default App;
