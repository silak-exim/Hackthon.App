import { Pipe, PipeTransform } from '@angular/core';

/**
 * Truncate pipe
 * Truncates text to specified length with ellipsis
 */
@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  transform(value: string | undefined | null, limit = 100, trail = '...'): string {
    if (!value) return '';
    if (value.length <= limit) return value;
    
    return value.substring(0, limit).trim() + trail;
  }
}
