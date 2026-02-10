'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, MessageSquare, GripVertical, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DashboardLayout from '@/components/dashboard/layout'
import TestimonialFormModal from '@/components/modals/testimonial-form-modal'
import toast from 'react-hot-toast'
import MarkdownContent from '@/components/MarkdownContent'

interface Testimonial {
  id: string
  name: string
  role?: string
  company?: string
  quote: string
  avatarUrl?: string
  avatarPublicId?: string
  sourceUrl?: string
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | undefined>(undefined)
  const [draggedTestimonialId, setDraggedTestimonialId] = useState<string | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const response = await fetch('/api/profile/testimonials')
      if (response.ok) {
        const data = await response.json()
        setTestimonials(data.testimonials || [])
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTestimonial = () => {
    setEditingTestimonial(undefined)
    setIsModalOpen(true)
  }

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial)
    setIsModalOpen(true)
  }

  const handleDeleteTestimonial = async (testimonialId: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) {
      return
    }

    try {
      const response = await fetch(`/api/profile/testimonials?id=${testimonialId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete testimonial')
      }

      toast.success('Testimonial deleted successfully!')
      fetchTestimonials()
    } catch (error) {
      console.error('Error deleting testimonial:', error)
      toast.error('Failed to delete testimonial')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingTestimonial(undefined)
  }

  const handleModalSuccess = () => {
    fetchTestimonials()
  }

  const persistTestimonialOrder = async (nextTestimonials: Testimonial[], previousTestimonials: Testimonial[]) => {
    setSavingOrder(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testimonials: nextTestimonials }),
      })
      if (!response.ok) {
        throw new Error('Failed to save testimonial order')
      }
      toast.success('Testimonial order updated!')
    } catch (error) {
      console.error('Error updating testimonial order:', error)
      setTestimonials(previousTestimonials)
      toast.error('Failed to update testimonial order')
    } finally {
      setSavingOrder(false)
    }
  }

  const handleReorder = (targetId: string) => {
    if (!draggedTestimonialId || draggedTestimonialId === targetId) return

    const previousTestimonials = [...testimonials]
    const fromIndex = testimonials.findIndex((item) => item.id === draggedTestimonialId)
    const toIndex = testimonials.findIndex((item) => item.id === targetId)
    if (fromIndex < 0 || toIndex < 0) return

    const nextTestimonials = [...testimonials]
    const [moved] = nextTestimonials.splice(fromIndex, 1)
    nextTestimonials.splice(toIndex, 0, moved)
    setTestimonials(nextTestimonials)
    persistTestimonialOrder(nextTestimonials, previousTestimonials)
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Testimonials</h1>
            <p className="text-muted-foreground">
              Highlight feedback from teammates, managers, or clients
            </p>
          </div>
          <Button onClick={handleAddTestimonial} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Testimonial
          </Button>
        </div>

        {testimonials.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No testimonials yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-sm">
                Add quotes from collaborators to build trust with visitors.
              </p>
              <Button onClick={handleAddTestimonial} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Testimonial
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`h-full hover:shadow-lg transition-shadow ${savingOrder && draggedTestimonialId ? 'opacity-80' : ''}`}
                  onDragOver={(event) => {
                    event.preventDefault()
                  }}
                  onDrop={() => handleReorder(testimonial.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                          <CardTitle className="text-lg leading-tight">{testimonial.name}</CardTitle>
                          {(testimonial.role || testimonial.company) && (
                            <CardDescription className="mt-1 font-medium">
                              {testimonial.role || 'Contributor'}
                              {testimonial.company ? ` · ${testimonial.company}` : ''}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                          draggable
                          onDragStart={() => setDraggedTestimonialId(testimonial.id)}
                          onDragEnd={() => setDraggedTestimonialId(null)}
                          aria-label="Drag to reorder testimonial"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditTestimonial(testimonial)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTestimonial(testimonial.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                      <MarkdownContent content={testimonial.quote} />
                    </div>
                    {testimonial.sourceUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={testimonial.sourceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Source
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <TestimonialFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          testimonial={editingTestimonial}
        />
      </div>
    </DashboardLayout>
  )
}
