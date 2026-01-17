import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ChatWidgetComponent } from './chat-widget.component';
import { ChatService, NotificationService } from '../../core/services';
import { of, throwError } from 'rxjs';

describe('ChatWidgetComponent', () => {
  let component: ChatWidgetComponent;
  let fixture: ComponentFixture<ChatWidgetComponent>;
  let chatServiceSpy: jasmine.SpyObj<ChatService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    chatServiceSpy = jasmine.createSpyObj('ChatService', ['ask']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showError', 'showSuccess']);

    await TestBed.configureTestingModule({
      imports: [ChatWidgetComponent],
      providers: [
        { provide: ChatService, useValue: chatServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be closed by default', () => {
      expect(component.isOpen()).toBeFalse();
    });

    it('should have no messages by default', () => {
      expect(component.messages().length).toBe(0);
      expect(component.hasMessages()).toBeFalse();
    });

    it('should have empty input by default', () => {
      expect(component.userInput()).toBe('');
    });

    it('should not be loading by default', () => {
      expect(component.isLoading()).toBeFalse();
    });

    it('should have zero unread count by default', () => {
      expect(component.unreadCount()).toBe(0);
    });
  });

  describe('toggleChat', () => {
    it('should open chat when closed', () => {
      component.toggleChat();
      expect(component.isOpen()).toBeTrue();
    });

    it('should close chat when open', () => {
      component.toggleChat(); // Open
      component.toggleChat(); // Close
      expect(component.isOpen()).toBeFalse();
    });

    it('should reset unread count when opening', () => {
      // Simulate unread messages
      component.unreadCount.set(5);
      
      component.toggleChat();
      
      expect(component.unreadCount()).toBe(0);
    });

    it('should not reset unread count when closing', () => {
      component.toggleChat(); // Open
      component.unreadCount.set(3);
      component.toggleChat(); // Close
      
      // Unread count should remain as is when closing
      expect(component.unreadCount()).toBe(3);
    });
  });

  describe('canSend computed', () => {
    it('should return false when input is empty', () => {
      component.userInput.set('');
      expect(component.canSend()).toBeFalse();
    });

    it('should return false when input is whitespace only', () => {
      component.userInput.set('   ');
      expect(component.canSend()).toBeFalse();
    });

    it('should return true when input has text and not loading', () => {
      component.userInput.set('Hello');
      component.isLoading.set(false);
      expect(component.canSend()).toBeTrue();
    });

    it('should return false when loading even with text', () => {
      component.userInput.set('Hello');
      component.isLoading.set(true);
      expect(component.canSend()).toBeFalse();
    });
  });

  describe('sendMessage', () => {
    it('should not send when input is empty', () => {
      component.userInput.set('');
      component.sendMessage();
      
      expect(chatServiceSpy.ask).not.toHaveBeenCalled();
      expect(component.messages().length).toBe(0);
    });

    it('should not send when input is whitespace only', () => {
      component.userInput.set('   ');
      component.sendMessage();
      
      expect(chatServiceSpy.ask).not.toHaveBeenCalled();
    });

    it('should not send when already loading', () => {
      component.userInput.set('Test');
      component.isLoading.set(true);
      component.sendMessage();
      
      expect(chatServiceSpy.ask).not.toHaveBeenCalled();
    });

    it('should add user message and call service', fakeAsync(() => {
      chatServiceSpy.ask.and.returnValue(of({ success: true, answer: 'Response' }));
      
      component.userInput.set('Test question');
      component.sendMessage();
      
      expect(component.messages().length).toBe(1);
      expect(component.messages()[0].role).toBe('user');
      expect(component.messages()[0].content).toBe('Test question');
      expect(chatServiceSpy.ask).toHaveBeenCalledWith('Test question');
      
      tick();
      
      expect(component.messages().length).toBe(2);
      expect(component.messages()[1].role).toBe('assistant');
    }));

    it('should clear input after sending', fakeAsync(() => {
      chatServiceSpy.ask.and.returnValue(of({ success: true, answer: 'Response' }));
      
      component.userInput.set('Test');
      component.sendMessage();
      
      expect(component.userInput()).toBe('');
      tick();
    }));

    it('should set loading state while waiting for response', fakeAsync(() => {
      chatServiceSpy.ask.and.returnValue(of({ success: true, answer: 'Response' }));
      
      component.userInput.set('Test');
      component.sendMessage();
      
      expect(component.isLoading()).toBeTrue();
      
      tick();
      
      expect(component.isLoading()).toBeFalse();
    }));

    it('should add assistant message on success', fakeAsync(() => {
      chatServiceSpy.ask.and.returnValue(of({ success: true, answer: 'AI Response' }));
      
      component.userInput.set('Question');
      component.sendMessage();
      tick();
      
      const assistantMessage = component.messages().find(m => m.role === 'assistant');
      expect(assistantMessage).toBeTruthy();
      expect(assistantMessage?.content).toBe('AI Response');
    }));

    it('should add error message on service error', fakeAsync(() => {
      chatServiceSpy.ask.and.returnValue(throwError(() => new Error('Network error')));
      
      component.userInput.set('Question');
      component.sendMessage();
      tick();
      
      const assistantMessage = component.messages().find(m => m.role === 'assistant');
      expect(assistantMessage).toBeTruthy();
      expect(assistantMessage?.content).toContain('เกิดข้อผิดพลาด');
    }));

    it('should increment unread count when chat is closed', fakeAsync(() => {
      chatServiceSpy.ask.and.returnValue(of({ success: true, answer: 'Response' }));
      
      // Chat is closed by default
      component.userInput.set('Test');
      component.sendMessage();
      tick();
      
      expect(component.unreadCount()).toBe(1);
    }));

    it('should not increment unread count when chat is open', fakeAsync(() => {
      chatServiceSpy.ask.and.returnValue(of({ success: true, answer: 'Response' }));
      
      component.toggleChat(); // Open chat
      component.userInput.set('Test');
      component.sendMessage();
      tick();
      
      expect(component.unreadCount()).toBe(0);
    }));
  });

  describe('hasMessages computed', () => {
    it('should return false when no messages', () => {
      expect(component.hasMessages()).toBeFalse();
    });

    it('should return true when messages exist', fakeAsync(() => {
      chatServiceSpy.ask.and.returnValue(of({ success: true, answer: 'Response' }));
      
      component.userInput.set('Test');
      component.sendMessage();
      
      expect(component.hasMessages()).toBeTrue();
      tick();
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
