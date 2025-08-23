/**
 * Frontend Logger
 * 
 * 로그를 콘솔과 로컬 스토리지에 저장하며, 
 * 서버로 전송하는 기능도 제공합니다.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  url?: string;
  userAgent?: string;
}

class FrontendLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private storageKey = 'ai-chat-logs';
  private isClient = typeof window !== 'undefined';
  
  constructor() {
    if (this.isClient) {
      this.loadLogsFromStorage();
      this.setupErrorHandling();
    }
  }

  private loadLogsFromStorage() {
    if (!this.isClient) return;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load logs from localStorage:', error);
    }
  }

  private saveLogsToStorage() {
    if (!this.isClient) return;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (error) {
      console.warn('Failed to save logs to localStorage:', error);
    }
  }

  private setupErrorHandling() {
    if (!this.isClient) return;
    
    // Global error handler
    window.addEventListener('error', (event) => {
      this.error('Global Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      url: this.isClient ? window.location.href : 'server',
      userAgent: this.isClient ? navigator.userAgent : 'server'
    };

    // Add to logs array
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Save to localStorage
    this.saveLogsToStorage();

    // Console output with appropriate method
    const consoleMethod = console[level] || console.log;
    if (data) {
      consoleMethod(`[${entry.timestamp}] ${message}`, data);
    } else {
      consoleMethod(`[${entry.timestamp}] ${message}`);
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Get logs by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Clear all logs
  clearLogs() {
    this.logs = [];
    this.saveLogsToStorage();
  }

  // Export logs as JSON string
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Send logs to backend (for error reporting)
  async sendLogsToBackend(errorLogs?: boolean) {
    try {
      const logsToSend = errorLogs 
        ? this.logs.filter(log => log.level === 'error')
        : this.logs;

      if (logsToSend.length === 0) return;

      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logsToSend,
          timestamp: new Date().toISOString(),
          session: this.getSessionId()
        }),
      });

      if (response.ok) {
        this.info('Logs sent to backend successfully');
      }
    } catch (error) {
      console.error('Failed to send logs to backend:', error);
    }
  }

  private getSessionId(): string {
    if (!this.isClient) return 'server-session';
    
    let sessionId = localStorage.getItem('ai-chat-session-id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('ai-chat-session-id', sessionId);
    }
    return sessionId;
  }

  // Download logs as file
  downloadLogs() {
    if (!this.isClient) return;
    
    const logsJson = this.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-chat-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Get log statistics
  getStats() {
    const stats = {
      total: this.logs.length,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      lastLog: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null
    };

    this.logs.forEach(log => {
      stats[log.level]++;
    });

    return stats;
  }
}

// Export singleton instance
export const logger = new FrontendLogger();

// Export for development/debugging
if (typeof window !== 'undefined') {
  (window as any).aiChatLogger = logger;
}