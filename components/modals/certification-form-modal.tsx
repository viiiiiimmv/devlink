'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MonthYearPicker from '@/components/MonthYearPicker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import toast from 'react-hot-toast'

interface Certification {
  id?: string
  name: string
  issuer: string
  date: string
  credentialId?: string
  credentialUrl?: string
}

interface CertificationFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  certification?: Certification
}

export default function CertificationFormModal({
  isOpen,
  onClose,
  onSuccess,
  certification
}: CertificationFormModalProps) {
  const [formData, setFormData] = useState<Certification>({
    name: '',
    issuer: '',
    date: '',
    credentialId: '',
    credentialUrl: ''
  })
  const [loading, setLoading] = useState(false)

  const isEditing = !!certification?.id

  useEffect(() => {
    if (certification) {
      setFormData(certification)
    } else {
      setFormData({
        name: '',
        issuer: '',
        date: '',
        credentialId: '',
        credentialUrl: ''
      })
    }
  }, [certification, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.issuer || !formData.date) {
      toast.error('Name, issuer and date are required')
      return
    }

    // Validate URL if provided
    if (formData.credentialUrl && formData.credentialUrl.trim()) {
      try {
        new URL(formData.credentialUrl.trim())
      } catch {
        toast.error('Please enter a valid credential URL')
        return
      }
    }

    setLoading(true)

    try {
      const url = '/api/profile/certifications'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save certification')
      }

      toast.success(isEditing ? 'Certification updated successfully!' : 'Certification created successfully!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving certification:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save certification')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Certification' : 'Add New Certification'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update your certification information below.'
              : 'Fill out the form below to add a new certification to your portfolio.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Certification Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., AWS Certified Solutions Architect"
              required
            />
          </div>

          {/* Issuer */}
          <div className="space-y-2">
            <Label htmlFor="issuer">Issuing Organization *</Label>
            <Input
              id="issuer"
              value={formData.issuer}
              onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
              placeholder="e.g., Amazon Web Services (AWS)"
              required
            />
          </div>

          {/* Date */}
          <MonthYearPicker
            label="Issue Date *"
            value={formData.date}
            onChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
            placeholder="Select when you received this certification"
          />

          {/* Credential ID */}
          <div className="space-y-2">
            <Label htmlFor="credentialId">Credential ID</Label>
            <Input
              id="credentialId"
              value={formData.credentialId}
              onChange={(e) => setFormData(prev => ({ ...prev, credentialId: e.target.value }))}
              placeholder="Enter credential ID or certificate number"
            />
          </div>

          {/* Credential URL */}
          <div className="space-y-2">
            <Label htmlFor="credentialUrl">Credential URL</Label>
            <Input
              id="credentialUrl"
              type="url"
              value={formData.credentialUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, credentialUrl: e.target.value }))}
              placeholder="https://www.credly.com/badges/..."
            />
            <p className="text-sm text-muted-foreground">
              Link to your digital credential or certificate verification page
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : null}
              {isEditing ? 'Update Certification' : 'Add Certification'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
