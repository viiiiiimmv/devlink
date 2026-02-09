'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import MonthYearPicker from '@/components/MonthYearPicker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import toast from 'react-hot-toast'

interface Experience {
  id?: string
  company: string
  position: string
  startDate: string
  endDate?: string
  isCurrentlyWorking: boolean
  description: string
  technologies: string[]
  linkedinPostUrl?: string
}

interface ExperienceFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  experience?: Experience
}

export default function ExperienceFormModal({
  isOpen,
  onClose,
  onSuccess,
  experience
}: ExperienceFormModalProps) {
  const [formData, setFormData] = useState<Experience>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    isCurrentlyWorking: false,
    description: '',
    technologies: [],
    linkedinPostUrl: ''
  })
  const [newTech, setNewTech] = useState('')
  const [loading, setLoading] = useState(false)

  const isEditing = !!experience?.id

  useEffect(() => {
    if (experience) {
      setFormData(experience)
    } else {
      setFormData({
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        isCurrentlyWorking: false,
        description: '',
        technologies: [],
        linkedinPostUrl: ''
      })
    }
  }, [experience, isOpen])

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
    
    if (!formData.company || !formData.position || !formData.startDate || !formData.description) {
      toast.error('Company, position, start date and description are required')
      return
    }

    if (!formData.isCurrentlyWorking && !formData.endDate) {
      toast.error('End date is required if not currently working')
      return
    }

    setLoading(true)

    try {
      const url = '/api/profile/experiences'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save experience')
      }

      toast.success(isEditing ? 'Experience updated successfully!' : 'Experience created successfully!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving experience:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save experience')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Experience' : 'Add New Experience'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update your work experience information below.'
              : 'Fill out the form below to add a new work experience to your portfolio.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              placeholder="Enter company name"
              required
            />
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position">Position *</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              placeholder="Enter your job title"
              required
            />
          </div>

          {/* Start Date */}
          <MonthYearPicker
            label="Start Date *"
            value={formData.startDate}
            onChange={(value) => setFormData(prev => ({ ...prev, startDate: value }))}
            placeholder="Select when you started this role"
          />

          {/* Currently Working Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isCurrentlyWorking"
              checked={formData.isCurrentlyWorking}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ 
                  ...prev, 
                  isCurrentlyWorking: checked as boolean,
                  endDate: checked ? '' : prev.endDate
                }))
              }
            />
            <Label htmlFor="isCurrentlyWorking">I currently work here</Label>
          </div>

          {/* End Date */}
          {!formData.isCurrentlyWorking && (
            <MonthYearPicker
              label="End Date *"
              value={formData.endDate || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, endDate: value }))}
              placeholder="Select when you ended this role"
            />
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your role, responsibilities, and achievements..."
              rows={4}
              required
            />
          </div>

          {/* LinkedIn Post URL */}
          <div className="space-y-2">
            <Label htmlFor="linkedinPostUrl">LinkedIn Post URL (Optional)</Label>
            <Input
              id="linkedinPostUrl"
              type="url"
              value={formData.linkedinPostUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, linkedinPostUrl: e.target.value }))}
              placeholder="https://www.linkedin.com/posts/..."
            />
            <p className="text-sm text-muted-foreground">
              Link to a LinkedIn post about this role (optional)
            </p>
          </div>

          {/* Technologies */}
          <div className="space-y-2">
            <Label>Technologies Used</Label>
            <div className="flex gap-2">
              <Input
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add technology (e.g., React, Python)"
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
              {isEditing ? 'Update Experience' : 'Add Experience'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
