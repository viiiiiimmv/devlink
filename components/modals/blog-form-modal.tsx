'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import toast from 'react-hot-toast'

interface BlogPost {
  id?: string
  title: string
  description: string
  url: string
  publishedAt: string
}

interface BlogFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  blog?: BlogPost
}

export default function BlogFormModal({
  isOpen,
  onClose,
  onSuccess,
  blog
}: BlogFormModalProps) {
  const [formData, setFormData] = useState<BlogPost>({
    title: '',
    description: '',
    url: '',
    publishedAt: ''
  })
  const [loading, setLoading] = useState(false)

  const isEditing = !!blog?.id

  useEffect(() => {
    if (blog) {
      setFormData(blog)
    } else {
      setFormData({
        title: '',
        description: '',
        url: '',
        publishedAt: ''
      })
    }
  }, [blog, isOpen])

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
      const url = '/api/profile/blogs'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save blog post')
      }

      toast.success(isEditing ? 'Blog post updated successfully!' : 'Blog post created successfully!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving blog post:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save blog post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Blog Post' : 'Add New Blog Post'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update your blog post information below.'
              : 'Fill out the form below to add a new blog post to your portfolio.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Blog Post Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter the title of your blog post"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description or summary of the blog post"
              rows={3}
              required
            />
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Blog Post URL *</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://yourblog.com/post-title"
              required
            />
            <p className="text-sm text-gray-600">
              Link to your blog post on Medium, Dev.to, your personal blog, etc.
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
              {isEditing ? 'Update Blog Post' : 'Add Blog Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
