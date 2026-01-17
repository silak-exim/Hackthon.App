import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

/**
 * HTTP Error Interceptor
 * Global error handling for HTTP requests
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';

      if (error.status === 0) {
        // Network error
        errorMessage = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ';
      } else if (error.status === 401) {
        errorMessage = 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่';
      } else if (error.status === 403) {
        errorMessage = 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้';
      } else if (error.status === 404) {
        errorMessage = 'ไม่พบข้อมูลที่ร้องขอ';
      } else if (error.status >= 500) {
        errorMessage = 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่ภายหลัง';
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      }

      // Show notification for user-visible errors
      // Don't show for health check failures
      if (!req.url.includes('/health')) {
        notificationService.error(errorMessage);
      }

      console.error('HTTP Error:', {
        status: error.status,
        message: errorMessage,
        url: req.url
      });

      return throwError(() => new Error(errorMessage));
    })
  );
};
