import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

/**
 * Notification Service
 * Handles app-wide notifications/toasts
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private counter = 0;

  /**
   * Show success notification
   */
  success(message: string, duration = 5000): void {
    this.show({ type: 'success', message, duration });
  }

  /**
   * Alias for success
   */
  showSuccess(message: string, details?: string, duration = 5000): void {
    const fullMessage = details ? `${message}: ${details}` : message;
    this.success(fullMessage, duration);
  }

  /**
   * Show error notification
   */
  error(message: string, duration = 8000): void {
    this.show({ type: 'error', message, duration });
  }

  /**
   * Alias for error
   */
  showError(message: string, details?: string, duration = 8000): void {
    const fullMessage = details ? `${message}: ${details}` : message;
    this.error(fullMessage, duration);
  }

  /**
   * Show warning notification
   */
  warning(message: string, duration = 6000): void {
    this.show({ type: 'warning', message, duration });
  }

  /**
   * Alias for warning
   */
  showWarning(message: string, details?: string, duration = 6000): void {
    const fullMessage = details ? `${message}: ${details}` : message;
    this.warning(fullMessage, duration);
  }

  /**
   * Show info notification
   */
  info(message: string, duration = 5000): void {
    this.show({ type: 'info', message, duration });
  }

  /**
   * Alias for info
   */
  showInfo(message: string, details?: string, duration = 5000): void {
    const fullMessage = details ? `${message}: ${details}` : message;
    this.info(fullMessage, duration);
  }

  /**
   * Show notification
   */
  private show(notification: Omit<Notification, 'id'>): void {
    const id = `notification-${++this.counter}`;
    const newNotification: Notification = { ...notification, id };

    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([...current, newNotification]);

    // Auto-remove after duration
    if (notification.duration) {
      setTimeout(() => this.dismiss(id), notification.duration);
    }
  }

  /**
   * Dismiss a notification
   */
  dismiss(id: string): void {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next(current.filter(n => n.id !== id));
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.notificationsSubject.next([]);
  }
}
