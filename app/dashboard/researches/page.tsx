'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, BookOpen, ExternalLink, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DashboardLayout from '@/components/dashboard/layout'
import ResearchFormMdoal from '@/components/modals/research-form-modal'
import toast from 'react-hot-toast'

interface ResearchPost {
  id: string
  title: string
  description: string
  url: string
  publishedAt: string
}

export default function ResearchesPage() {
  const { data: session } = useSession()
  const [researches, setResearches] = useState<ResearchPost[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingResearch, setEditingResearch] = useState<ResearchPost | undefined>(undefined)

  useEffect(() => {
    fetchResearches()
  }, [])

  const fetchResearches = async () => {
    try {
      const response = await fetch('/api/profile/researches')
      if (response.ok) {
        const data = await response.json()
        setResearches(data.researches || [])
      }
    } catch (error) {
      console.error('Error fetching researches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddResearch = () => {
    setEditingResearch(undefined)
    setIsModalOpen(true)
  }

  const handleEditResearch = (research: ResearchPost) => {
    setEditingResearch(research)
    setIsModalOpen(true)
  }

  const handleDeleteResearch = async (researchId: string) => {
    if (!confirm('Are you sure you want to delete this research paper?')) {
      return
    }

    try {
      const response = await fetch(`/api/profile/researches?id=${researchId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete research paper')
      }

      toast.success('Research paper deleted successfully!')
      fetchResearches()
    } catch (error) {
      console.error('Error deleting research paper:', error)
      toast.error('Failed to delete research paper')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingResearch(undefined)
  }

  const handleModalSuccess = () => {
    fetchResearches()
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Research Papers</h1>
            <p className="text-gray-600">
              Share your thoughts, tutorials, and technical articles
            </p>
          </div>
          <Button onClick={handleAddResearch} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Research Paper
          </Button>
        </div>

        {researches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">No research papers yet</h3>
              <p className="text-gray-600 text-center mb-6 max-w-sm">
                Start sharing your knowledge by adding links to your research articles.
              </p>
              <Button onClick={handleAddResearch} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Research Paper
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {researches.map((research, index) => (
              <motion.div
                key={research.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl leading-tight">
                            {research.title}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {research.description}
                          </CardDescription>
                          <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {new Date(research.publishedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={research.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditResearch(research)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteResearch(research.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <ResearchFormMdoal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          research={editingResearch}
        />
      </div>
    </DashboardLayout>
  )
}
