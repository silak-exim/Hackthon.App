# Corporate Proxy CA Certificates

วางไฟล์ CA certificate (.crt หรือ .pem) ในโฟลเดอร์นี้

## วิธี Export CA Certificate จาก Windows

### Method 1: Export จาก Browser (Chrome)
1. เปิด Chrome และไปที่ https://api.nuget.org
2. คลิก icon กุญแจ (🔒) ที่ address bar
3. คลิก "Connection is secure" > "Certificate is valid"
4. ไปที่ tab "Certification Path"
5. เลือก Root CA certificate (อันบนสุด)
6. คลิก "View Certificate" > "Details" tab
7. คลิก "Copy to File..." และเลือก format "Base-64 encoded X.509 (.CER)"
8. บันทึกเป็น `proxy-ca.crt` ในโฟลเดอร์นี้

### Method 2: Export จาก Windows Certificate Store (PowerShell)
```powershell
# ดู Root CA certificates ทั้งหมด
Get-ChildItem -Path Cert:\LocalMachine\Root | Format-Table Subject, Thumbprint

# Export CA certificate ที่ต้องการ (แทน THUMBPRINT ด้วยค่าจริง)
$cert = Get-ChildItem -Path Cert:\LocalMachine\Root\THUMBPRINT
$bytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
[System.IO.File]::WriteAllBytes("proxy-ca.crt", $bytes)
```

### Method 3: Export จาก Internet Options
1. เปิด Internet Options > Content > Certificates
2. ไปที่ tab "Trusted Root Certification Authorities"
3. หา certificate ของ proxy (เช่น Zscaler, BlueCoat, Fortinet, etc.)
4. คลิก "Export..." และเลือก "Base-64 encoded X.509 (.CER)"
5. บันทึกเป็น `proxy-ca.crt`

### Method 4: ขอจาก IT Department
ติดต่อ IT department เพื่อขอไฟล์ CA certificate ของ corporate proxy

## ตัวอย่างชื่อ Proxy CA ที่พบบ่อย
- Zscaler Root CA
- BlueCoat Root CA  
- Fortinet CA
- Palo Alto Root CA
- F5 Root CA
- Microsoft IT SSL CA
- Corporate Proxy CA

## หลังจากได้ไฟล์แล้ว
1. วางไฟล์ `.crt` หรือ `.pem` ในโฟลเดอร์นี้
2. ตรวจสอบว่าชื่อไฟล์ตรงกับที่กำหนดใน Dockerfile (`proxy-ca.crt`)
3. Run `docker-compose up -d --build` อีกครั้ง
