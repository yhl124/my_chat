'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  url?: string;
}

function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'debug' | 'info' | 'warn' | 'error'>('all');
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const updateLogs = () => {
      const allLogs = logger.getLogs();
      const filteredLogs = filter === 'all' 
        ? allLogs 
        : logger.getLogsByLevel(filter);
      setLogs(filteredLogs.slice(-100)); // Show last 100 logs
    };

    updateLogs();
    const interval = setInterval(updateLogs, 1000);
    return () => clearInterval(interval);
  }, [filter, mounted]);

  if (!mounted) {
    return null;
  }

  const stats = logger.getStats();

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'debug': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-800';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsVisible(true)}
          variant="outline"
          className="bg-white shadow-lg"
        >
          🔍 Logs ({stats.total})
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 bg-white border rounded-lg shadow-xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Application Logs</h3>
          <div className="flex space-x-2 text-sm">
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
              Errors: {stats.error}
            </span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
              Warnings: {stats.warn}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
              Info: {stats.info}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
              Total: {stats.total}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1 border rounded"
          >
            <option value="all">All Levels</option>
            <option value="error">Errors Only</option>
            <option value="warn">Warnings</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
          <Button 
            onClick={() => logger.downloadLogs()} 
            variant="outline" 
            size="sm"
          >
            Download
          </Button>
          <Button 
            onClick={() => logger.clearLogs()} 
            variant="outline" 
            size="sm"
          >
            Clear
          </Button>
          <Button 
            onClick={() => setIsVisible(false)} 
            variant="outline" 
            size="sm"
          >
            ✕
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-1 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No logs to display
            </div>
          ) : (
            logs.map((log, index) => (
              <div 
                key={index} 
                className={`p-2 rounded ${getLogColor(log.level)}`}
              >
                <div className="flex items-start space-x-2">
                  <span className="text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="font-semibold uppercase">
                    {log.level}
                  </span>
                  <span className="flex-1">
                    {log.message}
                  </span>
                </div>
                {log.data && (
                  <div className="mt-1 ml-20 text-gray-600 text-xs">
                    <pre className="whitespace-pre-wrap">
                      {typeof log.data === 'string' 
                        ? log.data 
                        : JSON.stringify(log.data, null, 2)
                      }
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Export with dynamic loading to prevent SSR issues
export default dynamic(() => Promise.resolve(LogViewer), {
  ssr: false
});