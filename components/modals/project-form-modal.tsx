'use client'

import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import toast from 'react-hot-toast'

interface Project {
  id?: string
  title: string
  description: string
  technologies: string[]
  githubUrl?: string
  liveUrl?: string
  image?: string
  featured: boolean
}

interface ProjectFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  project?: Project
}

export default function ProjectFormModal({
  isOpen,
  onClose,
  onSuccess,
  project
}: ProjectFormModalProps) {
  const [formData, setFormData] = useState<Project>({
    title: '',
    description: '',
    technologies: [],
    githubUrl: '',
    liveUrl: '',
    image: '',
    featured: false
  })
  const [newTech, setNewTech] = useState('')
  const [loading, setLoading] = useState(false)

  const isEditing = !!project?.id

  useEffect(() => {
    if (project) {
      setFormData(project)
    } else {
      setFormData({
        title: '',
        description: '',
        technologies: [],
        githubUrl: '',
        liveUrl: '',
        image: '',
        featured: false
      })
    }
  }, [project, isOpen])

  const addTechnology = () => {
    if (newTech.trim() && !formData.technologies.includes(newTech.trim())) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, newTech.trim()]
      }))
      setNewTech('')
    }
  }

  const removeTechnology = (techToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(tech => tech !== techToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTechnology()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required')
      return
    }

    setLoading(true)

    try {
      const url = '/api/profile/projects'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save project')
      }

      toast.success(isEditing ? 'Project updated successfully!' : 'Project created successfully!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving project:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Project' : 'Add New Project'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update your project information below.'
              : 'Fill out the form below to add a new project to your portfolio.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter project title"
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
              placeholder="Describe your project..."
              rows={3}
              required
            />
          </div>

          {/* Technologies */}
          <div className="space-y-2">
            <Label>Technologies</Label>
            <div className="flex gap-2">
              <Input
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add technology (e.g., React, Node.js)"
                className="flex-1"
              />
              <Button 
                type="button"
                onClick={addTechnology}
                disabled={!newTech.trim() || formData.technologies.includes(newTech.trim())}
              >
                Add
              </Button>
            </div>
            
            {/* Technology Tags */}
            <div className="flex flex-wrap gap-2">
              {formData.technologies.map((tech) => (
                <Badge 
                  key={tech} 
                  variant="secondary" 
                  className="flex items-center gap-1 pr-1"
                >
                  {tech}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeTechnology(tech)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="githubUrl">GitHub URL</Label>
              <Input
                id="githubUrl"
                type="url"
                value={formData.githubUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
                placeholder="https://github.com/..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="liveUrl">Live Demo URL</Label>
              <Input
                id="liveUrl"
                type="url"
                value={formData.liveUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, liveUrl: e.target.value }))}
                placeholder="https://your-project.com"
              />
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              type="url"
              value={formData.image}
              onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
              placeholder="https://example.com/project-image.jpg"
            />
          </div>

          {/* Featured */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, featured: checked as boolean }))
              }
            />
            <Label htmlFor="featured">Featured project</Label>
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
              {isEditing ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
