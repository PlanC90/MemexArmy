import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Download, FileJson, Calendar } from 'lucide-react';
import { supabase } from '../supabaseClient'; 

export function Downloads() {
  const files = [
    { name: 'users', description: 'User profiles and balances', size: '-', updated: '-' },
    { name: 'links', description: 'All submitted links and their status', size: '-', updated: '-' },
    { name: 'admin', description: 'Admin user list', size: '-', updated: '-' },
    { name: 'withdrawals', description: 'Withdrawal history', size: '-', updated: '-' },
  ];
  


const handleDownload = async (tableName: string) => {
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error || !data) {
      throw new Error(`Failed to fetch data from ${tableName}`);
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error(`Error exporting ${tableName}:`, error);
    alert(`Failed to download ${tableName}.json`);
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
