# Foundry Data Uploader

โปรเจค Full-Stack สำหรับอัพโหลดเอกสาร, ค้นหา และถามคำถามกับ AI ผ่าน Azure AI Foundry

## 🏗️ สถาปัตยกรรม

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Angular 19    │──────▶│  .NET 10 API    │──────▶│ Azure AI Foundry│
│   (Frontend)    │       │   (Backend)     │       │    (AI Model)   │
└─────────────────┘       └────────┬────────┘       └─────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │  Azure Search   │
                          │    (Index)      │
                          └─────────────────┘
```

## ✨ ฟีเจอร์

- **💬 ถามคำถาม AI**: ส่งคำถามไปยัง Azure AI Foundry และรับคำตอบ
- **📁 อัพโหลดเอกสาร**: อัพโหลดไฟล์ .txt, .md, .json, .csv เข้า Azure Search
- **🔍 ค้นหาเอกสาร**: ค้นหาเอกสารที่อัพโหลดไว้
- **📚 จัดการเอกสาร**: ดู/ลบเอกสารที่มีอยู่

## 📋 ข้อกำหนดเบื้องต้น

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [Angular CLI 19](https://angular.dev/)
- Azure AI Foundry resource
- Azure Cognitive Search resource

## ⚙️ การตั้งค่า

### 1. ตั้งค่า Azure AI Foundry

สร้าง Azure AI Foundry resource และคัดลอก:
- Endpoint URL
- API Key
- Model name (เช่น gpt-4o)

### 2. ตั้งค่า Azure Cognitive Search

สร้าง Azure Search resource และคัดลอก:
- Endpoint URL
- API Key

### 3. ตั้งค่า Environment Variables

**Option A: ผ่าน appsettings.Development.json**

แก้ไขไฟล์ `appsettings.Development.json`:

```json
{
  "AzureAIFoundry": {
    "Endpoint": "https://YOUR-FOUNDRY-RESOURCE.api.azureml.ms/chat/completions",
    "ApiKey": "YOUR_API_KEY_HERE",
    "ModelName": "gpt-4o"
  },
  "AzureSearch": {
    "Endpoint": "https://YOUR-SEARCH-SERVICE.search.windows.net",
    "ApiKey": "YOUR_SEARCH_API_KEY_HERE",
    "IndexName": "knowledgedocs"
  }
}
```

**Option B: ผ่าน Environment Variables**

```powershell
$env:FOUNDRY_ENDPOINT = "https://YOUR-FOUNDRY-RESOURCE.api.azureml.ms/chat/completions"
$env:FOUNDRY_API_KEY = "YOUR_API_KEY"
$env:FOUNDRY_MODEL_NAME = "gpt-4o"
$env:AZURE_SEARCH_ENDPOINT = "https://YOUR-SEARCH-SERVICE.search.windows.net"
$env:AZURE_SEARCH_API_KEY = "YOUR_SEARCH_API_KEY"
$env:AZURE_SEARCH_INDEX_NAME = "knowledgedocs"
```

## 🚀 การรัน

### รัน Backend (.NET 10)

```powershell
cd c:\Users\supakornp\FoundryDataUploader
dotnet restore
dotnet run
```

Backend จะรันที่: `http://localhost:5000`

### รัน Frontend (Angular 19)

```powershell
cd c:\Users\supakornp\FoundryDataUploader\ClientApp
npm install
ng serve
```

Frontend จะรันที่: `http://localhost:4200`

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/ask` | ถามคำถาม AI |
| POST | `/api/upload` | อัพโหลดเอกสาร |
| GET | `/api/search?query=xxx` | ค้นหาเอกสาร |
| GET | `/api/documents` | ดูเอกสารทั้งหมด |
| DELETE | `/api/documents/{id}` | ลบเอกสาร |

## 📝 ตัวอย่างการใช้งาน API

### ถามคำถาม

```bash
curl -X POST http://localhost:5000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Azure?", "context": "optional context"}'
```

### อัพโหลดเอกสาร

```bash
curl -X POST http://localhost:5000/api/upload \
  -F "files=@document.txt"
```

### ค้นหาเอกสาร

```bash
curl "http://localhost:5000/api/search?query=azure"
```

## 🔧 โครงสร้างโปรเจค

```
FoundryDataUploader/
├── Program.cs                 # Main API entry point
├── Models/
│   ├── KnowledgeDoc.cs       # Document model
│   └── ApiModels.cs          # Request/Response models
├── Services/
│   ├── IFoundryService.cs    # Foundry interface
│   ├── FoundryService.cs     # Azure AI Foundry client
│   ├── ISearchService.cs     # Search interface
│   └── SearchService.cs      # Azure Search client
├── appsettings.json          # Configuration
├── appsettings.Development.json
└── ClientApp/                 # Angular 19 Frontend
    └── src/
        └── app/
            ├── components/
            │   ├── chat/      # Chat component
            │   ├── upload/    # Upload component
            │   └── search/    # Search component
            └── services/
                └── api.service.ts
```

## 📜 License

MIT
