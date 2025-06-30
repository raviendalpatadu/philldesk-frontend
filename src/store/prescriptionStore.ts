/**
 * Prescription Store
 * 
 * Zustand store for managing prescription state and operations
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import PrescriptionUploadService, { 
  PrescriptionFile, 
  UploadProgressCallback 
} from '../services/prescriptionUploadService'

// Extended Prescription interface with all properties
interface Prescription {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  googleDriveFileId: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'completed'
  uploadedAt: string
  updatedAt: string
  patientNotes?: string
  doctorName?: string
  prescriptionDate?: string
  pharmacistNotes?: string
  rejectionReason?: string
}

interface UploadState {
  isUploading: boolean
  uploadProgress: number
  uploadError: string | null
}

interface PrescriptionState {
  prescriptions: Prescription[]
  loading: boolean
  error: string | null
  uploadState: UploadState
  stats: {
    total: number
    pending: number
    underReview: number
    approved: number
    rejected: number
    completed: number
  }
}

interface PrescriptionActions {
  uploadPrescription: (
    file: PrescriptionFile,
    metadata: Partial<Prescription>,
    onProgress?: UploadProgressCallback
  ) => Promise<void>
  fetchPrescriptions: (status?: string) => Promise<void>
  fetchPrescriptionStats: () => Promise<void>
  addPrescription: (prescription: Prescription) => void
  updatePrescriptionStatus: (id: string, status: Prescription['status'], notes?: string) => Promise<void>
  deletePrescription: (id: string) => Promise<void>
  clearError: () => void
  resetUploadState: () => void
  reset: () => void
}

type PrescriptionStore = PrescriptionState & PrescriptionActions

const initialState: PrescriptionState = {
  prescriptions: [],
  loading: false,
  error: null,
  uploadState: {
    isUploading: false,
    uploadProgress: 0,
    uploadError: null,
  },
  stats: {
    total: 0,
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    completed: 0
  }
}

export const usePrescriptionStore = create<PrescriptionStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    uploadPrescription: async (file, metadata, onProgress) => {
      try {
        set((state) => ({
          uploadState: {
            ...state.uploadState,
            isUploading: true,
            uploadProgress: 0,
            uploadError: null,
          },
          error: null,
        }))

        const progressCallback: UploadProgressCallback = (progress) => {
          set((state) => ({
            uploadState: {
              ...state.uploadState,
              uploadProgress: progress,
            },
          }))
          
          if (onProgress) {
            onProgress(progress)
          }
        }

        await PrescriptionUploadService.uploadPrescription(
          file,
          metadata,
          progressCallback
        )

        // Update stats and prescriptions after successful upload
        await get().fetchPrescriptionStats()
        await get().fetchPrescriptions() // Fetch to see new upload

        set((state) => ({
          uploadState: {
            ...state.uploadState,
            isUploading: false,
            uploadProgress: 100,
          },
        }))
      } catch (error: any) {
        set((state) => ({
          uploadState: {
            ...state.uploadState,
            isUploading: false,
            uploadProgress: 0,
            uploadError: error.message ?? 'Upload failed',
          },
          error: error.message ?? 'Upload failed',
        }))
        throw error
      }
    },

    fetchPrescriptions: async (status?: string) => {
      set({ loading: true, error: null })
      try {
        const response = await PrescriptionUploadService.getPrescriptions(1, 10, status)
        set({ 
          prescriptions: response.data ?? [], 
          loading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch prescriptions',
          loading: false 
        })
      }
    },

    fetchPrescriptionStats: async () => {
      try {
        const response = await PrescriptionUploadService.getPrescriptionStats()
        set({ 
          stats: {
            total: response.total ?? 0,
            pending: response.pending ?? 0,
            underReview: response.underReview ?? 0,
            approved: response.approved ?? 0,
            rejected: response.rejected ?? 0,
            completed: response.completed ?? 0,
          }
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch prescription stats'
        })
      }
    },

    addPrescription: (prescription: Prescription) => {
      const { prescriptions, stats } = get()
      set({
        prescriptions: [prescription, ...prescriptions],
        stats: {
          ...stats,
          total: stats.total + 1,
          pending: stats.pending + 1
        }
      })
    },

    updatePrescriptionStatus: async (id: string, status: Prescription['status'], notes?: string) => {
      try {
        // This would be implemented in the service
        // const updatedPrescription = await PrescriptionUploadService.updatePrescriptionStatus(id, status, notes)
        const { prescriptions } = get()
        
        set({
          prescriptions: prescriptions.map(p => 
            p.id === id ? { ...p, status, pharmacistNotes: notes } : p
          )
        })

        // Refresh stats after status update
        get().fetchPrescriptionStats()
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update prescription status'
        })
      }
    },

    deletePrescription: async (id: string) => {
      try {
        await PrescriptionUploadService.deletePrescription(id)
        const { prescriptions, stats } = get()
        
        const deletedPrescription = prescriptions.find(p => p.id === id)
        if (deletedPrescription) {
          // Map prescription status to stats property
          const getStatsKey = (status: Prescription['status']) => {
            switch (status) {
              case 'pending': return 'pending'
              case 'under_review': return 'underReview'
              case 'approved': return 'approved'
              case 'rejected': return 'rejected'
              case 'completed': return 'completed'
              default: return 'pending'
            }
          }

          const statsKey = getStatsKey(deletedPrescription.status)
          
          set({
            prescriptions: prescriptions.filter(p => p.id !== id),
            stats: {
              ...stats,
              total: stats.total - 1,
              [statsKey]: Math.max(0, stats[statsKey] - 1)
            }
          })
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete prescription'
        })
      }
    },

    clearError: () => set({ error: null }),

    resetUploadState: () => set({ 
      uploadState: {
        isUploading: false,
        uploadProgress: 0,
        uploadError: null,
      }
    }),

    reset: () => set(initialState)
  }))
)

// Subscribe to prescription changes for notifications
usePrescriptionStore.subscribe(
  (state) => state.prescriptions,
  (prescriptions, previousPrescriptions) => {
    // Check for status changes to show notifications
    if (previousPrescriptions.length > 0) {
      prescriptions.forEach(prescription => {
        const previous = previousPrescriptions.find(p => p.id === prescription.id)
        if (previous && previous.status !== prescription.status) {
          // Prescription status changed - could trigger notification
          console.log(`Prescription ${prescription.id} status changed from ${previous.status} to ${prescription.status}`)
        }
      })
    }
  }
)
