'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Briefcase, Calendar, Linkedin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DashboardLayout from '@/components/dashboard/layout'
import ExperienceFormModal from '@/components/modals/experience-form-modal'
import toast from 'react-hot-toast'

interface Experience {
  id: string
  company: string
  position: string
  startDate: string
  endDate?: string
  isCurrentlyWorking: boolean
  description: string
  technologies: string[]
  linkedinPostUrl?: string
}

export default function ExperiencePage() {
  const { data: session } = useSession()
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExperience, setEditingExperience] = useState<Experience | undefined>(undefined)

  useEffect(() => {
    fetchExperiences()
  }, [])

  const fetchExperiences = async () => {
    try {
      const response = await fetch('/api/profile/experiences')
      if (response.ok) {
        const data = await response.json()
        setExperiences(data.experiences || [])
      }
    } catch (error) {
      console.error('Error fetching experiences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddExperience = () => {
    setEditingExperience(undefined)
    setIsModalOpen(true)
  }

  const handleEditExperience = (experience: Experience) => {
    setEditingExperience(experience)
    setIsModalOpen(true)
  }

  const handleDeleteExperience = async (experienceId: string) => {
    if (!confirm('Are you sure you want to delete this experience?')) {
      return
    }

    try {
      const response = await fetch(`/api/profile/experiences?id=${experienceId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete experience')
      }

      toast.success('Experience deleted successfully!')
      fetchExperiences()
    } catch (error) {
      console.error('Error deleting experience:', error)
      toast.error('Failed to delete experience')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingExperience(undefined)
  }

  const formatExperienceDuration = (startDate: string, endDate?: string, isCurrentlyWorking?: boolean) => {
    const formatDate = (dateStr: string) => {
      // Handle different date formats
      if (dateStr.includes('-')) {
        // Format: "YYYY-MM"
        const date = new Date(dateStr + '-01')
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        })
      } else {
        // Format: "Month YYYY"
        return dateStr
      }
    }

    const start = formatDate(startDate)
    if (isCurrentlyWorking) {
      return `${start} - Present`
    }
    const end = endDate ? formatDate(endDate) : 'Present'
    return `${start} - ${end}`
  }

  const handleModalSuccess = () => {
    fetchExperiences()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Experience</h1>
            <p className="text-gray-600">
              Showcase your professional journey and achievements
            </p>
          </div>
          <Button onClick={handleAddExperience} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Experience
          </Button>
        </div>

        {/* Experience List */}
        {experiences.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No experience added yet</h3>
              <p className="text-gray-600 text-center mb-6 max-w-sm">
                Add your work experience to showcase your professional journey and skills.
              </p>
              <Button onClick={handleAddExperience} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Experience
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {experiences.map((experience, index) => (
              <motion.div
                key={experience.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Briefcase className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl">{experience.position}</CardTitle>
                          <CardDescription className="text-lg font-medium text-gray-700 mt-1">
                            {experience.company}
                          </CardDescription>
                          <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {formatExperienceDuration(experience.startDate, experience.endDate, experience.isCurrentlyWorking)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditExperience(experience)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteExperience(experience.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">
                      {experience.description}
                    </p>

                    {/* LinkedIn Post Link */}
                    {experience.linkedinPostUrl && (
                      <div className="mb-4">
                        <Button variant="ghost" size="sm" asChild className="p-0 h-auto">
                          <a 
                            href={experience.linkedinPostUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                          >
                            <Linkedin className="h-4 w-4" />
                            View LinkedIn Post
                          </a>
                        </Button>
                      </div>
                    )}
                    
                    {/* Technologies */}
                    {experience.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {experience.technologies.map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Experience Form Modal */}
        <ExperienceFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          experience={editingExperience}
        />
      </div>
    </DashboardLayout>
  )
}
