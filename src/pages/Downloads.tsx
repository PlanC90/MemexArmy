import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Download, FileJson, Calendar } from 'lucide-react';

export function Downloads() {
  const files = [
    { name: 'user.json', description: 'User profiles and balances', size: '2.3 MB', updated: '2024-03-15' },
    { name: 'links.json', description: 'All submitted links and their status', size: '4.1 MB', updated: '2024-03-15' },
    { name: 'admin.json', description: 'Admin user list', size: '0.1 MB', updated: '2024-03-15' },
    { name: 'cekim.json', description: 'Withdrawal history', size: '1.8 MB', updated: '2024-03-15' },
  ];

  const handleDownload = async (filename: string) => {
    try {
      const response = await fetch(`/data/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to download ${filename}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(`Error downloading ${filename}:`, error);
      alert(`Failed to download ${filename}`);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Downloads</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {files.map((file) => (
          <Card key={file.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                {file.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">{file.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Last updated: {file.updated}
                </div>
                <span>Size: {file.size}</span>
              </div>
              <Button 
                className="w-full flex items-center justify-center gap-2"
                onClick={() => handleDownload(file.name)}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
