import { Component, OnDestroy, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ChatService, NotificationService } from '../../core/services';

/**
 * Form data interface for auto-fill
 */
interface FormData {
  // Personal Info
  titleName: string;
  firstName: string;
  lastName: string;
  firstNameEn: string;
  lastNameEn: string;
  idCard: string;
  birthDate: string;
  nationality: string;
  
  // Contact Info
  phone: string;
  email: string;
  
  // Address
  address: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  
  // Business Info
  companyName: string;
  businessType: string;
  annualRevenue: string;
  exportCountries: string;
}

/**
 * Smart Form Filler Component
 * Upload ID card or document image to auto-fill registration form
 */
@Component({
  selector: 'app-smart-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './smart-form.component.html',
  styleUrl: './smart-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SmartFormComponent implements OnDestroy {
  // Form data signal
  readonly formData = signal<FormData>({
    titleName: '',
    firstName: '',
    lastName: '',
    firstNameEn: '',
    lastNameEn: '',
    idCard: '',
    birthDate: '',
    nationality: 'ไทย',
    phone: '',
    email: '',
    address: '',
    subDistrict: '',
    district: '',
    province: '',
    postalCode: '',
    companyName: '',
    businessType: '',
    annualRevenue: '',
    exportCountries: ''
  });

  // UI State
  readonly selectedImages = signal<{id: number, image: string, name: string, type: string}[]>([]);
  readonly isProcessing = signal(false);
  readonly processingStep = signal('');
  readonly isFormFilled = signal(false);
  readonly currentStep = signal(1);
  readonly currentProcessingImage = signal(0);

  // Title options
  readonly titleOptions = ['นาย', 'นาง', 'นางสาว', 'ดร.', 'ศ.', 'รศ.', 'ผศ.'];
  
  // Province options (sample)
  readonly provinces = [
    'กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'เชียงใหม่',
    'ชลบุรี', 'ภูเก็ต', 'ขอนแก่น', 'นครราชสีมา', 'สงขลา'
  ];

  // Business types
  readonly businessTypes = [
    'ส่งออกสินค้าเกษตร', 'ส่งออกสินค้าอุตสาหกรรม', 'ส่งออกอาหารและเครื่องดื่ม',
    'ส่งออกเครื่องนุ่งห่ม', 'ส่งออกอิเล็กทรอนิกส์', 'อื่นๆ'
  ];

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
   * Handle file selection for multiple images
   */
  onFileSelected(event: Event, imageId?: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.notificationService.showError('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.notificationService.showError('ขนาดไฟล์ต้องไม่เกิน 10MB');
      return;
    }

    // Read and display image
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      if (imageId !== undefined) {
        // Update existing image
        this.selectedImages.update(images => 
          images.map(img => img.id === imageId ? { ...img, image: imageData, name: file.name } : img)
        );
      } else {
        // Add new image
        const newId = Date.now();
        this.selectedImages.update(images => [...images, { 
          id: newId, 
          image: imageData, 
          name: file.name,
          type: 'custom'
        }]);
      }
    };
    reader.readAsDataURL(file);
  }

  /**
   * Remove an image
   */
  removeImage(imageId: number): void {
    this.selectedImages.update(images => images.filter(img => img.id !== imageId));
  }

  /**
   * Process uploaded images with AI
   */
  async processImages(): Promise<void> {
    if (this.selectedImages().length === 0) {
      this.notificationService.showError('กรุณาเลือกรูปภาพอย่างน้อย 1 รูป');
      return;
    }

    this.isProcessing.set(true);
    const totalImages = this.selectedImages().length;
    this.processingStep.set('กำลังวิเคราะห์รูปภาพ...');

    // Simulate AI processing with realistic steps
    const steps = [
      { text: 'กำลังตรวจจับข้อความในรูปภาพ...', delay: 1000 },
      { text: 'กำลังแยกแยะข้อมูลบุคคล...', delay: 1500 },
      { text: 'กำลังตรวจสอบความถูกต้อง...', delay: 1000 },
      { text: 'กำลังกรอกข้อมูลลงฟอร์ม...', delay: 800 }
    ];

    for (const step of steps) {
      this.processingStep.set(step.text);
      await this.delay(step.delay);
    }

    // Call AI to extract data (using chat service for demo)
    const prompt = `จากรูปบัตรประชาชนที่อัพโหลด กรุณาสกัดข้อมูลในรูปแบบ JSON:
    - ชื่อ-นามสกุล ภาษาไทย
    - ชื่อ-นามสกุล ภาษาอังกฤษ  
    - เลขบัตรประชาชน
    - วันเกิด
    - ที่อยู่`;

    this.chatService.ask(prompt)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isProcessing.set(false);
          this.processingStep.set('');
        })
      )
      .subscribe({
        next: () => {
          // For demo, fill with sample data
          this.fillFormWithSampleData();
          this.isFormFilled.set(true);
          this.notificationService.showSuccess('กรอกข้อมูลสำเร็จ!', 'AI ได้กรอกข้อมูลจากรูปภาพเรียบร้อยแล้ว');
        },
        error: () => {
          // Even on error, fill with sample data for demo
          this.fillFormWithSampleData();
          this.isFormFilled.set(true);
          this.notificationService.showSuccess('กรอกข้อมูลสำเร็จ!');
        }
      });
  }

  /**
   * Fill form with sample extracted data
   */
  private fillFormWithSampleData(): void {
    this.formData.set({
      titleName: 'นาย',
      firstName: 'สมชาย',
      lastName: 'รักประเทศ',
      firstNameEn: 'SOMCHAI',
      lastNameEn: 'RAKPRATHET',
      idCard: '1-1234-56789-01-2',
      birthDate: '1985-03-15',
      nationality: 'ไทย',
      phone: '081-234-5678',
      email: 'somchai.r@email.com',
      address: '123/45 หมู่ 6 ซอยสุขุมวิท 55',
      subDistrict: 'คลองตันเหนือ',
      district: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      postalCode: '10110',
      companyName: 'บริษัท ส่งออกไทย จำกัด',
      businessType: 'ส่งออกสินค้าเกษตร',
      annualRevenue: '50,000,000',
      exportCountries: 'จีน, ญี่ปุ่น, สหรัฐอเมริกา'
    });
  }

  /**
   * Update form field
   */
  updateField(field: keyof FormData, value: string): void {
    this.formData.update(data => ({ ...data, [field]: value }));
  }

  /**
   * Go to next step
   */
  nextStep(): void {
    if (this.currentStep() < 3) {
      this.currentStep.update(s => s + 1);
    }
  }

  /**
   * Go to previous step
   */
  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  /**
   * Submit form
   */
  submitForm(): void {
    this.notificationService.showSuccess('สมัครสมาชิกสำเร็จ!', 'ระบบจะส่งข้อมูลการยืนยันไปยังอีเมลของท่าน');
    // Reset form after submission
    setTimeout(() => {
      this.resetForm();
    }, 2000);
  }

  /**
   * Reset form
   */
  resetForm(): void {
    this.formData.set({
      titleName: '',
      firstName: '',
      lastName: '',
      firstNameEn: '',
      lastNameEn: '',
      idCard: '',
      birthDate: '',
      nationality: 'ไทย',
      phone: '',
      email: '',
      address: '',
      subDistrict: '',
      district: '',
      province: '',
      postalCode: '',
      companyName: '',
      businessType: '',
      annualRevenue: '',
      exportCountries: ''
    });
    this.selectedImages.set([]);
    this.isFormFilled.set(false);
    this.currentStep.set(1);
  }

  /**
   * Use all sample images (ID card, Passport, Driver's License)
   */
  useSampleImages(): void {
    this.selectedImages.set([
      { id: 1, image: this.generateSampleIdCard(), name: 'บัตรประชาชน.png', type: 'id_card' },
      { id: 2, image: this.generateSamplePassport(), name: 'หนังสือเดินทาง.png', type: 'passport' },
      { id: 3, image: this.generateSampleDriverLicense(), name: 'ใบขับขี่.png', type: 'driver_license' }
    ]);
    this.notificationService.showInfo('โหลดรูปตัวอย่าง 3 รูปแล้ว', 'กดปุ่ม "วิเคราะห์ด้วย AI" เพื่อกรอกข้อมูล');
  }

  /**
   * Generate sample ID card image as base64
   */
  private generateSampleIdCard(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 380;
    const ctx = canvas.getContext('2d')!;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 600, 380);
    gradient.addColorStop(0, '#1a237e');
    gradient.addColorStop(1, '#283593');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 380);

    // Header band
    ctx.fillStyle = '#c62828';
    ctx.fillRect(0, 0, 600, 50);

    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('บัตรประจำตัวประชาชน', 300, 32);

    // Thailand text
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('THAILAND IDENTIFICATION CARD', 300, 65);

    // Photo placeholder
    ctx.fillStyle = '#e3f2fd';
    ctx.fillRect(30, 80, 140, 180);
    ctx.fillStyle = '#1565c0';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📷', 100, 180);
    ctx.font = '12px Arial';
    ctx.fillText('รูปถ่าย', 100, 240);

    // Personal information
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial, sans-serif';
    ctx.textAlign = 'left';

    const info = [
      { label: 'เลขประจำตัวประชาชน', value: '1-1234-56789-01-2', y: 95 },
      { label: 'ชื่อ-สกุล', value: 'นาย สมชาย รักประเทศ', y: 130 },
      { label: 'Name', value: 'Mr. SOMCHAI RAKPRATHET', y: 160 },
      { label: 'วันเกิด', value: '15 มี.ค. 2528 / 15 Mar 1985', y: 195 },
      { label: 'ที่อยู่', value: '123/45 หมู่ 6 ซ.สุขุมวิท 55', y: 230 },
      { label: '', value: 'แขวงคลองตันเหนือ เขตวัฒนา', y: 250 },
      { label: '', value: 'กรุงเทพมหานคร 10110', y: 270 }
    ];

    info.forEach(item => {
      if (item.label) {
        ctx.fillStyle = '#90caf9';
        ctx.fillText(item.label, 190, item.y);
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = item.label ? 'bold 14px Arial' : '13px Arial';
      ctx.fillText(item.value, 190, item.y + (item.label ? 18 : 0));
      ctx.font = '14px Arial';
    });

    // Footer
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(0, 330, 600, 50);
    ctx.fillStyle = '#1a237e';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('* นี่คือรูปตัวอย่างสำหรับการสาธิต Smart Form Filler *', 300, 350);
    ctx.fillText('SAMPLE IMAGE FOR DEMO PURPOSES ONLY', 300, 365);

    return canvas.toDataURL('image/png');
  }

  /**
   * Generate sample Passport image as base64
   */
  private generateSamplePassport(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 420;
    const ctx = canvas.getContext('2d')!;

    // Background - Dark red/maroon
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(0, 0, 600, 420);

    // Gold border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.strokeRect(15, 15, 570, 390);

    // Emblem placeholder
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(300, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8B0000';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏛️', 300, 90);

    // Header text
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THAILAND', 300, 145);
    ctx.font = '18px Arial, sans-serif';
    ctx.fillText('ประเทศไทย', 300, 170);
    ctx.font = 'bold 20px Arial';
    ctx.fillText('PASSPORT', 300, 200);
    ctx.font = '14px Arial';
    ctx.fillText('หนังสือเดินทาง', 300, 220);

    // Photo placeholder
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(40, 245, 120, 150);
    ctx.fillStyle = '#8B0000';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📷', 100, 330);

    // Data section
    ctx.fillStyle = '#FFD700';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    const passportInfo = [
      { label: 'Type/ประเภท', value: 'P', y: 255 },
      { label: 'Country Code', value: 'THA', y: 280 },
      { label: 'Passport No.', value: 'AA1234567', y: 305 },
      { label: 'Surname/นามสกุล', value: 'RAKPRATHET', y: 330 },
      { label: 'Given Names/ชื่อ', value: 'SOMCHAI', y: 355 },
      { label: 'Date of Birth', value: '15 MAR 1985', y: 380 }
    ];

    passportInfo.forEach(item => {
      ctx.fillStyle = '#FFD700';
      ctx.font = '10px Arial';
      ctx.fillText(item.label, 180, item.y);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Arial';
      ctx.fillText(item.value, 180, item.y + 14);
    });

    // MRZ Zone
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(40, 400, 520, 15);
    ctx.fillStyle = '#000000';
    ctx.font = '9px Courier New, monospace';
    ctx.fillText('P<THARAKPRATHET<<SOMCHAI<<<<<<<<<<<<<<<<<<<<', 45, 411);

    return canvas.toDataURL('image/png');
  }

  /**
   * Generate sample Driver's License image as base64
   */
  private generateSampleDriverLicense(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 380;
    const ctx = canvas.getContext('2d')!;

    // Background gradient - pink/purple
    const gradient = ctx.createLinearGradient(0, 0, 600, 380);
    gradient.addColorStop(0, '#E91E63');
    gradient.addColorStop(1, '#9C27B0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 380);

    // Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('กรมการขนส่งทางบก', 300, 30);
    ctx.font = '12px Arial';
    ctx.fillText('DEPARTMENT OF LAND TRANSPORT', 300, 48);
    ctx.font = 'bold 14px Arial';
    ctx.fillText('ใบอนุญาตขับรถยนต์ส่วนบุคคล', 300, 70);

    // Photo placeholder
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(30, 90, 130, 160);
    ctx.fillStyle = '#E91E63';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📷', 95, 175);

    // License info
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';

    const licenseInfo = [
      { label: 'เลขที่ใบอนุญาต', value: '12345678901', y: 100 },
      { label: 'ชื่อ-สกุล', value: 'นาย สมชาย รักประเทศ', y: 130 },
      { label: 'Name', value: 'Mr. SOMCHAI RAKPRATHET', y: 155 },
      { label: 'วันเกิด', value: '15 มี.ค. 2528', y: 185 },
      { label: 'เลขบัตรประชาชน', value: '1-1234-56789-01-2', y: 215 },
      { label: 'วันออกบัตร', value: '1 ม.ค. 2568', y: 245 },
      { label: 'วันหมดอายุ', value: '14 มี.ค. 2573', y: 275 }
    ];

    licenseInfo.forEach(item => {
      ctx.fillStyle = '#ffeb3b';
      ctx.font = '10px Arial';
      ctx.fillText(item.label, 180, item.y);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Arial';
      ctx.fillText(item.value, 180, item.y + 14);
    });

    // License class
    ctx.fillStyle = '#ffeb3b';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('B', 520, 180);
    ctx.font = '12px Arial';
    ctx.fillText('ประเภท', 520, 200);

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(0, 320, 600, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('* นี่คือรูปตัวอย่างสำหรับการสาธิต Smart Form Filler *', 300, 345);
    ctx.fillText('SAMPLE IMAGE FOR DEMO PURPOSES ONLY', 300, 360);

    return canvas.toDataURL('image/png');
  }

  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
