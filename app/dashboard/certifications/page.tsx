'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Award, ExternalLink, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DashboardLayout from '@/components/dashboard/layout'
import CertificationFormModal from '@/components/modals/certification-form-modal'
import toast from 'react-hot-toast'

interface Certification {
  id: string
  name: string
  issuer: string
  date: string
  credentialId?: string
  credentialUrl?: string
}

export default function CertificationsPage() {
  const { data: session } = useSession()
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCertification, setEditingCertification] = useState<Certification | undefined>(undefined)

  useEffect(() => {
    fetchCertifications()
  }, [])

  const fetchCertifications = async () => {
    try {
      const response = await fetch('/api/profile/certifications')
      if (response.ok) {
        const data = await response.json()
        setCertifications(data.certifications || [])
      }
    } catch (error) {
      console.error('Error fetching certifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCertification = () => {
    setEditingCertification(undefined)
    setIsModalOpen(true)
  }

  const handleEditCertification = (certification: Certification) => {
    setEditingCertification(certification)
    setIsModalOpen(true)
  }

  const handleDeleteCertification = async (certificationId: string) => {
    if (!confirm('Are you sure you want to delete this certification?')) {
      return
    }

    try {
      const response = await fetch(`/api/profile/certifications?id=${certificationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete certification')
      }

      toast.success('Certification deleted successfully!')
      fetchCertifications()
    } catch (error) {
      console.error('Error deleting certification:', error)
      toast.error('Failed to delete certification')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingCertification(undefined)
  }

  const handleModalSuccess = () => {
    fetchCertifications()
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
            <h1 className="text-3xl font-bold text-gray-900">Certifications</h1>
            <p className="text-gray-600">
              Showcase your professional achievements and credentials
            </p>
          </div>
          <Button onClick={handleAddCertification} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Certification
          </Button>
        </div>

        {/* Certifications Grid */}
        {certifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Award className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No certifications added yet</h3>
              <p className="text-gray-600 text-center mb-6 max-w-sm">
                Add your professional certifications to showcase your expertise and achievements.
              </p>
              <Button onClick={handleAddCertification} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Certification
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((certification, index) => (
              <motion.div
                key={certification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Award className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg leading-tight">
                            {certification.name}
                          </CardTitle>
                          <CardDescription className="mt-1 font-medium">
                            {certification.issuer}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditCertification(certification)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteCertification(certification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <Calendar className="h-4 w-4" />
                      {certification.date}
                    </div>

                    {/* Credential Info */}
                    {certification.credentialId && (
                      <div className="mb-4">
                        <Badge variant="outline" className="text-xs">
                          ID: {certification.credentialId}
                        </Badge>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {certification.credentialUrl ? (
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <a 
                            href={certification.credentialUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Credential
                          </a>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="flex-1" disabled>
                          No Link Available
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Certification Form Modal */}
        <CertificationFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          certification={editingCertification}
        />
      </div>
    </DashboardLayout>
  )
}
