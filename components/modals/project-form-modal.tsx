'use client'

import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import MarkdownEditor from '@/components/MarkdownEditor'
import ProjectImageUpload from '@/components/ProjectImageUpload'
import toast from 'react-hot-toast'

interface Project {
  id?: string
  title: string
  description: string
  caseStudy?: string
  technologies: string[]
  githubUrl?: string
  liveUrl?: string
  image?: string
  imagePublicId?: string
  gallery?: ProjectGalleryItem[]
  metrics?: ProjectMetric[]
  featured: boolean
}

interface ProjectGalleryItem {
  id: string
  url: string
  caption?: string
  publicId?: string
}

interface ProjectMetric {
  id: string
  label: string
  value: string
  detail?: string
}

interface ProjectFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  project?: Project
}

const createLocalId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
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
    caseStudy: '',
    technologies: [],
    githubUrl: '',
    liveUrl: '',
    image: '',
    imagePublicId: '',
    gallery: [],
    metrics: [],
    featured: false
  })
  const [newTech, setNewTech] = useState('')
  const [loading, setLoading] = useState(false)

  const isEditing = !!project?.id

  useEffect(() => {
    if (project) {
      setFormData({
        ...project,
        caseStudy: project.caseStudy || '',
        gallery: Array.isArray(project.gallery) ? project.gallery : [],
        metrics: Array.isArray(project.metrics) ? project.metrics : [],
      })
    } else {
      setFormData({
        title: '',
        description: '',
        caseStudy: '',
        technologies: [],
        githubUrl: '',
        liveUrl: '',
        image: '',
        imagePublicId: '',
        gallery: [],
        metrics: [],
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

  const handleImageChange = (image: { url: string; publicId: string } | null) => {
    setFormData(prev => ({
      ...prev,
      image: image?.url || '',
      imagePublicId: image?.publicId || ''
    }))
  }

  const addGalleryItem = () => {
    setFormData((prev) => ({
      ...prev,
      gallery: [
        ...(prev.gallery || []),
        { id: createLocalId(), url: '', caption: '', publicId: '' },
      ],
    }))
  }

  const removeGalleryItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).filter((item) => item.id !== itemId),
    }))
  }

  const updateGalleryItem = (
    itemId: string,
    updater: (item: ProjectGalleryItem) => ProjectGalleryItem
  ) => {
    setFormData((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).map((item) => (
        item.id === itemId ? updater(item) : item
      )),
    }))
  }

  const addMetric = () => {
    setFormData((prev) => ({
      ...prev,
      metrics: [
        ...(prev.metrics || []),
        { id: createLocalId(), label: '', value: '', detail: '' },
      ],
    }))
  }

  const updateMetric = (
    metricId: string,
    updates: Partial<ProjectMetric>
  ) => {
    setFormData((prev) => ({
      ...prev,
      metrics: (prev.metrics || []).map((metric) => (
        metric.id === metricId ? { ...metric, ...updates } : metric
      )),
    }))
  }

  const removeMetric = (metricId: string) => {
    setFormData((prev) => ({
      ...prev,
      metrics: (prev.metrics || []).filter((metric) => metric.id !== metricId),
    }))
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
            <MarkdownEditor
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Describe your project... (Markdown supported)"
              rows={4}
            />
          </div>

          {/* Case Study */}
          <div className="space-y-2">
            <Label htmlFor="caseStudy">Case Study (Markdown)</Label>
            <MarkdownEditor
              value={formData.caseStudy || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, caseStudy: value }))}
              placeholder="Write the full project case study: problem, approach, architecture, trade-offs, outcomes..."
              rows={8}
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
            <Label>Project Image</Label>
            <ProjectImageUpload
              currentImage={formData.image}
              onImageChange={handleImageChange}
            />
          </div>

          {/* Gallery */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Image Gallery</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addGalleryItem}
                className="gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add gallery image
              </Button>
            </div>
            {(formData.gallery || []).length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Add supporting visuals for your case study.
              </p>
            ) : (
              <div className="space-y-4">
                {(formData.gallery || []).map((item, index) => (
                  <div key={item.id} className="rounded-lg border border-border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">
                        Gallery image {index + 1}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeGalleryItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <ProjectImageUpload
                      currentImage={item.url}
                      onImageChange={(image) => {
                        updateGalleryItem(item.id, (current) => ({
                          ...current,
                          url: image?.url || '',
                          publicId: image?.publicId || '',
                        }))
                      }}
                    />
                    <Input
                      value={item.caption || ''}
                      onChange={(event) =>
                        updateGalleryItem(item.id, (current) => ({
                          ...current,
                          caption: event.target.value,
                        }))
                      }
                      placeholder="Caption (optional)"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Project Metrics</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addMetric}
                className="gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add metric
              </Button>
            </div>

            {(formData.metrics || []).length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Add outcomes like growth, performance, or reliability improvements.
              </p>
            ) : (
              <div className="space-y-3">
                {(formData.metrics || []).map((metric) => (
                  <div key={metric.id} className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-12">
                    <Input
                      value={metric.label}
                      onChange={(event) => updateMetric(metric.id, { label: event.target.value })}
                      placeholder="Metric label (e.g., Conversion rate)"
                      className="md:col-span-4"
                    />
                    <Input
                      value={metric.value}
                      onChange={(event) => updateMetric(metric.id, { value: event.target.value })}
                      placeholder="Value (e.g., +38%)"
                      className="md:col-span-3"
                    />
                    <Input
                      value={metric.detail || ''}
                      onChange={(event) => updateMetric(metric.id, { detail: event.target.value })}
                      placeholder="Context/detail (optional)"
                      className="md:col-span-4"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeMetric(metric.id)}
                      className="md:col-span-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
