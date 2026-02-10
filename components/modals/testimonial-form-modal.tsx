'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import MarkdownEditor from '@/components/MarkdownEditor'
import TestimonialAvatarUpload from '@/components/TestimonialAvatarUpload'
import toast from 'react-hot-toast'

interface Testimonial {
  id?: string
  name: string
  role?: string
  company?: string
  quote: string
  avatarUrl?: string
  avatarPublicId?: string
  sourceUrl?: string
}

interface TestimonialFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  testimonial?: Testimonial
}

export default function TestimonialFormModal({
  isOpen,
  onClose,
  onSuccess,
  testimonial,
}: TestimonialFormModalProps) {
  const [formData, setFormData] = useState<Testimonial>({
    name: '',
    role: '',
    company: '',
    quote: '',
    avatarUrl: '',
    avatarPublicId: '',
    sourceUrl: '',
  })
  const [loading, setLoading] = useState(false)

  const isEditing = Boolean(testimonial?.id)

  useEffect(() => {
    if (testimonial) {
      setFormData({
        ...testimonial,
        avatarPublicId: testimonial.avatarPublicId || '',
      })
    } else {
      setFormData({
        name: '',
        role: '',
        company: '',
        quote: '',
        avatarUrl: '',
        avatarPublicId: '',
        sourceUrl: '',
      })
    }
  }, [testimonial, isOpen])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.name.trim() || !formData.quote.trim()) {
      toast.error('Name and quote are required')
      return
    }

    setLoading(true)
    try {
      const url = '/api/profile/testimonials'
      const method = isEditing ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || 'Failed to save testimonial')
      }

      toast.success(isEditing ? 'Testimonial updated!' : 'Testimonial added!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving testimonial:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save testimonial')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (avatar: { url: string; publicId: string } | null) => {
    setFormData(prev => ({
      ...prev,
      avatarUrl: avatar?.url || '',
      avatarPublicId: avatar?.publicId || ''
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
          <DialogDescription>
            Highlight feedback from clients, collaborators, or managers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Person name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={formData.role || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                placeholder="e.g., Product Manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Company or team"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">Source URL</Label>
              <Input
                id="sourceUrl"
                type="url"
                value={formData.sourceUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, sourceUrl: e.target.value }))}
                placeholder="https://linkedin.com/..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote">Quote *</Label>
            <MarkdownEditor
              value={formData.quote}
              onChange={(value) => setFormData(prev => ({ ...prev, quote: value }))}
              placeholder="Write the testimonial... (Markdown supported)"
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label>Avatar (Optional)</Label>
            <TestimonialAvatarUpload
              currentAvatar={formData.avatarUrl || ''}
              onAvatarChange={handleAvatarChange}
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : null}
              {isEditing ? 'Update Testimonial' : 'Add Testimonial'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
