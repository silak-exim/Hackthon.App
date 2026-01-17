import { Component, OnDestroy, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ChatService, NotificationService } from '../../core/services';
import { ChatMessage } from '../../core/models';

/**
 * Chat component for interacting with the AI assistant.
 * Uses signals for reactive state management and follows best practices.
 */
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent implements OnDestroy {
  // Signals for reactive state
  readonly messages = signal<ChatMessage[]>([]);
  readonly userInput = signal('');
  readonly context = signal('');
  readonly isLoading = signal(false);
  readonly showContextInput = signal(false);

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
   * Toggle the visibility of the context input section
   */
  toggleContext(): void {
    this.showContextInput.update(show => !show);
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
    const contextValue = this.context().trim() || undefined;
    
    this.chatService.ask(question, contextValue)
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
        },
        error: (err) => {
          const errorMessage = err.error?.answer || err.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
          
          this.addMessage({
            role: 'assistant',
            content: `เกิดข้อผิดพลาด: ${errorMessage}`,
            timestamp: new Date()
          });
          
          this.notificationService.showError('ไม่สามารถส่งข้อความได้', errorMessage);
        }
      });
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
   * Update the context value
   */
  updateContext(value: string): void {
    this.context.set(value);
  }

  /**
   * Track messages by timestamp for ngFor optimization
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
