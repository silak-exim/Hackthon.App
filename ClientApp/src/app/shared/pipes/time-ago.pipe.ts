import { Pipe, PipeTransform } from '@angular/core';

/**
 * Time ago pipe
 * Converts date to relative time string (e.g., "5 minutes ago")
 */
@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string | undefined | null): string {
    if (!value) return '';

    const date = new Date(value);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) {
      return 'เมื่อสักครู่';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} นาทีที่แล้ว`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} ชั่วโมงที่แล้ว`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days} วันที่แล้ว`;
    }

    const weeks = Math.floor(days / 7);
    if (weeks < 4) {
      return `${weeks} สัปดาห์ที่แล้ว`;
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
      return `${months} เดือนที่แล้ว`;
    }

    const years = Math.floor(days / 365);
    return `${years} ปีที่แล้ว`;
  }
}
