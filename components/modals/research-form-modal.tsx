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
import toast from 'react-hot-toast'

interface ResearchPost {
  id?: string
  title: string
  description: string
  url: string
  publishedAt: string
}

interface ResearchFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  research?: ResearchPost
}

export default function ResearchFormModal({
  isOpen,
  onClose,
  onSuccess,
  research
}: ResearchFormModalProps) {
  const [formData, setFormData] = useState<ResearchPost>({
    title: '',
    description: '',
    url: '',
    publishedAt: ''
  })
  const [loading, setLoading] = useState(false)

  const isEditing = !!research?.id

  useEffect(() => {
    if (research) {
      setFormData(research)
    } else {
      setFormData({
        title: '',
        description: '',
        url: '',
        publishedAt: ''
      })
    }
  }, [research, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.url || !formData.publishedAt) {
      toast.error('All fields are required')
      return
    }

    // Validate URL
    try {
      new URL(formData.url)
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    setLoading(true)

    try {
      const url = '/api/profile/researches'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save research paper')
      }

      toast.success(isEditing ? 'Research paper updated successfully!' : 'Research paper created successfully!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving research paper:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save research paper')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Research Paper' : 'Add New Research Paper'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update your research paper information below.'
              : 'Fill out the form below to add a new new research paperto your portfolio.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Research Paper Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter the title of your research paper"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <MarkdownEditor
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Brief description or summary of the research paper (Markdown supported)"
              rows={4}
            />
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Research Paper URL *</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://yourresearch.com/post-title"
              required
            />
            <p className="text-sm text-muted-foreground">
              Link to your research papers
            </p>
          </div>

          {/* Published Date */}
          <div className="space-y-2">
            <Label htmlFor="publishedAt">Published Date *</Label>
            <Input
              id="publishedAt"
              type="date"
              value={formData.publishedAt}
              onChange={(e) => setFormData(prev => ({ ...prev, publishedAt: e.target.value }))}
              required
            />
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
              {isEditing ? 'Update Research Paper' : 'Add Research Paper'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
