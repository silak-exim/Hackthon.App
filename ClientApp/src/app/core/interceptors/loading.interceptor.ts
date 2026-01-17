import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

/**
 * Loading Interceptor
 * Shows loading indicator during HTTP requests
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  // Could integrate with a loading service here
  const startTime = Date.now();

  return next(req).pipe(
    finalize(() => {
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        console.log(`Request to ${req.url} took ${duration}ms`);
      }
    })
  );
};
