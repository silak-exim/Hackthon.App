import { Component, OnDestroy, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ChatService, NotificationService } from '../../core/services';
import { ChatMessage } from '../../core/models';

/**
 * Floating chat widget component for quick AI interactions.
 * Uses signals for reactive state management.
 */
@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatWidgetComponent implements OnDestroy {
  // Signals for reactive state
  readonly isOpen = signal(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly userInput = signal('');
  readonly isLoading = signal(false);
  readonly unreadCount = signal(0);

  // Computed values
  readonly hasMessages = computed(() => this.messages().length > 0);
  readonly canSend = computed(() => this.userInput().trim().length > 0 && !this.isLoading());

  // Cleanup subject
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly chatService: ChatService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle the chat window visibility
   */
  toggleChat(): void {
    this.isOpen.update(open => !open);
    if (this.isOpen()) {
      this.unreadCount.set(0);
    }
  }

  /**
   * Send a message to the AI assistant
   */
  sendMessage(): void {
    const question = this.userInput().trim();
    if (!question || this.isLoading()) return;

    // Add user message
    this.addMessage({
      role: 'user',
      content: question,
      timestamp: new Date()
    });

    // Clear input and set loading state
    this.userInput.set('');
    this.isLoading.set(true);

    // Send request to API
    this.chatService.ask(question)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          const content = response.success 
            ? response.answer 
            : `เกิดข้อผิดพลาด: ${response.answer}`;
          
          this.addMessage({
            role: 'assistant',
            content,
            timestamp: new Date()
          });

          // Increment unread count if chat is closed
          if (!this.isOpen()) {
            this.unreadCount.update(count => count + 1);
          }
        },
        error: (err) => {
          const errorMessage = err.error?.answer || err.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
          
          this.addMessage({
            role: 'assistant',
            content: `เกิดข้อผิดพลาด: ${errorMessage}`,
            timestamp: new Date()
          });
        }
      });
  }

  /**
   * Handle quick action buttons
   */
  sendQuickMessage(message: string): void {
    this.userInput.set(message);
    this.sendMessage();
  }

  /**
   * Handle keyboard events in the input field
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Clear all chat messages
   */
  clearChat(): void {
    this.messages.set([]);
    this.notificationService.showInfo('ล้างการสนทนาแล้ว');
  }

  /**
   * Update the user input value
   */
  updateUserInput(value: string): void {
    this.userInput.set(value);
  }

  /**
   * Track messages by timestamp for optimization
   */
  trackByTimestamp(_index: number, message: ChatMessage): number {
    return message.timestamp.getTime();
  }

  /**
   * Add a message to the chat history
   */
  private addMessage(message: ChatMessage): void {
    this.messages.update(msgs => [...msgs, message]);
  }
}
