# Prescription Upload System Documentation

## Overview
The PhillDesk prescription upload system allows customers to securely upload prescription files to Google Drive while storing metadata in the database. The system features file validation, progress tracking, and comprehensive error handling.

## Architecture

### Components
1. **PrescriptionUpload Component** - React modal for file upload UI
2. **PrescriptionUploadService** - Service layer for API communication
3. **PrescriptionStore** - Zustand store for state management
4. **Google Drive Integration** - Secure file storage
5. **Database Metadata** - Prescription information storage

## Implementation Details

### File Upload Flow
```
Customer selects file → Validation → Upload to Google Drive → Save metadata to database → Update UI
```

### Security Features
- File type validation (JPEG, PNG, PDF, WebP)
- File size limits (max 10MB)
- Secure service account authentication
- Private Google Drive folder storage
- JWT-based API authentication

### API Endpoints
```
POST /api/prescriptions/upload
- Uploads file to Google Drive
- Saves metadata to database
- Returns prescription ID and file URL

GET /api/prescriptions/stats
- Returns user prescription statistics
- Used for dashboard metrics

GET /api/prescriptions
- Returns paginated prescription list
- Supports status filtering

DELETE /api/prescriptions/:id
- Deletes prescription and associated file
```

## Configuration

### Environment Variables
Add these to your `.env` file:

```env
# Google Drive Configuration
VITE_GOOGLE_DRIVE_CLIENT_ID=your_client_id
VITE_GOOGLE_DRIVE_FOLDER_ID=your_folder_id
VITE_GOOGLE_DRIVE_SERVICE_EMAIL=service_account@example.com

# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api
```

### Google Drive Setup
1. Create a Google Cloud Project
2. Enable Google Drive API
3. Create a Service Account
4. Generate Service Account Key
5. Share target folder with service account email
6. Configure environment variables

## File Structure

```
src/
├── components/
│   └── prescription/
│       └── PrescriptionUpload.tsx     # Upload modal component
├── services/
│   └── prescriptionUploadService.ts   # API service layer
├── store/
│   └── prescriptionStore.ts           # State management
├── pages/
│   └── customer/
│       └── CustomerDashboard.tsx      # Dashboard with upload integration
└── config/
    └── index.ts                       # Configuration and API client
```

## Usage

### Customer Dashboard Integration
```tsx
import PrescriptionUpload from '@components/prescription/PrescriptionUpload'
import { usePrescriptionStore } from '@store/prescriptionStore'

const CustomerDashboard = () => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const { stats, fetchPrescriptionStats } = usePrescriptionStore()

  const handleUploadSuccess = async () => {
    await fetchPrescriptionStats()
    // Handle success (show message, update UI, etc.)
  }

  return (
    <div>
      <Button onClick={() => setUploadModalVisible(true)}>
        Upload Prescription
      </Button>
      
      <PrescriptionUpload
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  )
}
```

### Direct Service Usage
```tsx
import PrescriptionUploadService from '@services/prescriptionUploadService'

const uploadFile = async (file: File) => {
  const fileData = {
    file,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  }

  const metadata = {
    patientNotes: 'Additional notes',
    doctorName: 'Dr. Smith',
  }

  try {
    const response = await PrescriptionUploadService.uploadPrescription(
      fileData,
      metadata,
      (progress) => console.log(`Upload progress: ${progress}%`)
    )
    console.log('Upload successful:', response)
  } catch (error) {
    console.error('Upload failed:', error)
  }
}
```

## State Management

### Store Structure
```typescript
interface PrescriptionStoreState {
  // Data
  prescriptions: Prescription[]
  stats: PrescriptionStats
  
  // Loading states
  loading: boolean
  error: string | null
  
  // Upload state
  uploadState: {
    isUploading: boolean
    uploadProgress: number
    uploadError: string | null
  }
  
  // Actions
  uploadPrescription: (file, metadata, onProgress?) => Promise<void>
  fetchPrescriptions: (page?, status?) => Promise<void>
  fetchPrescriptionStats: () => Promise<void>
  deletePrescription: (id) => Promise<void>
}
```

### Store Actions
```typescript
// Upload prescription
const { uploadPrescription } = usePrescriptionStore()
await uploadPrescription(fileData, metadata, progressCallback)

// Fetch user statistics
const { fetchPrescriptionStats, stats } = usePrescriptionStore()
await fetchPrescriptionStats()

// Get prescription list
const { fetchPrescriptions, prescriptions } = usePrescriptionStore()
await fetchPrescriptions(1, 'pending') // page 1, pending status
```

## Validation Rules

### File Validation
- **Allowed Types**: JPEG, PNG, PDF, WebP
- **Max Size**: 10MB
- **Extensions**: .jpg, .jpeg, .png, .pdf, .gif, .webp

### Form Validation
- **Patient Notes**: Optional, max 500 characters
- **Doctor Name**: Optional, max 100 characters
- **Prescription Date**: Optional, valid date format

## Error Handling

### Client-Side Errors
- File validation errors
- Network connectivity issues
- Upload progress tracking
- User-friendly error messages

### Server-Side Errors
- Google Drive API errors
- Database connectivity issues
- Authentication failures
- File processing errors

### Error Recovery
- Automatic retry mechanisms
- Progress restoration
- Graceful degradation
- User notification system

## Performance Optimizations

### Upload Performance
- Chunked file uploads for large files
- Progress tracking with callbacks
- Timeout configuration (2 minutes)
- Background upload processing

### UI Performance
- Lazy loading of upload component
- Optimistic UI updates
- Debounced form validation
- Efficient re-renders with Zustand

## Security Considerations

### File Security
- Server-side file validation
- Virus scanning (recommended)
- Content type verification
- File size restrictions

### Data Protection
- Encrypted file storage
- Secure API endpoints
- JWT token authentication
- HIPAA compliance considerations

### Access Control
- User-specific file access
- Role-based permissions
- Audit logging
- Session management

## Testing

### Unit Tests
```typescript
// Test file validation
import { validateFile } from '@services/prescriptionUploadService'

test('validates file type correctly', () => {
  const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
  const result = validateFile(validFile)
  expect(result.valid).toBe(true)
})

// Test store actions
import { usePrescriptionStore } from '@store/prescriptionStore'

test('uploads prescription successfully', async () => {
  const store = usePrescriptionStore.getState()
  await store.uploadPrescription(fileData, metadata)
  expect(store.uploadState.uploadProgress).toBe(100)
})
```

### Integration Tests
- End-to-end upload flow
- Error handling scenarios
- Progress tracking accuracy
- Database consistency

## Monitoring and Analytics

### Upload Metrics
- Success/failure rates
- Upload duration tracking
- File size distribution
- Error categorization

### User Analytics
- Upload frequency per user
- Most common file types
- Peak upload times
- User engagement metrics

## Deployment Considerations

### Environment Setup
1. Configure Google Drive service account
2. Set up secure credential storage
3. Configure file size limits
4. Set up monitoring and alerting

### Production Settings
- Enable file virus scanning
- Configure backup storage
- Set up CDN for file delivery
- Implement rate limiting

## Troubleshooting

### Common Issues

**Upload Fails with "Invalid File Type"**
- Check file extension and MIME type
- Verify UPLOAD_CONFIG settings
- Ensure file isn't corrupted

**Google Drive Access Denied**
- Verify service account credentials
- Check folder sharing permissions
- Validate API key configuration

**Slow Upload Performance**
- Check network connectivity
- Verify file size optimization
- Consider chunked upload implementation

**Database Connection Errors**
- Verify API endpoint configuration
- Check authentication tokens
- Monitor database connectivity

## Future Enhancements

### Planned Features
- Batch file upload support
- OCR text extraction
- Automatic prescription parsing
- Real-time upload notifications
- Mobile app integration

### Performance Improvements
- CDN integration for file delivery
- Advanced caching strategies
- Background processing queues
- Progressive image optimization
