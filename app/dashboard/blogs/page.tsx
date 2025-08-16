'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, BookOpen, ExternalLink, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DashboardLayout from '@/components/dashboard/layout'
import BlogFormModal from '@/components/modals/blog-form-modal'
import toast from 'react-hot-toast'

interface BlogPost {
  id: string
  title: string
  description: string
  url: string
  publishedAt: string
}

export default function BlogsPage() {
  const { data: session } = useSession()
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState<BlogPost | undefined>(undefined)

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      const response = await fetch('/api/profile/blogs')
      if (response.ok) {
        const data = await response.json()
        setBlogs(data.blogs || [])
      }
    } catch (error) {
      console.error('Error fetching blogs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBlog = () => {
    setEditingBlog(undefined)
    setIsModalOpen(true)
  }

  const handleEditBlog = (blog: BlogPost) => {
    setEditingBlog(blog)
    setIsModalOpen(true)
  }

  const handleDeleteBlog = async (blogId: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return
    }

    try {
      const response = await fetch(`/api/profile/blogs?id=${blogId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete blog post')
      }

      toast.success('Blog post deleted successfully!')
      fetchBlogs()
    } catch (error) {
      console.error('Error deleting blog post:', error)
      toast.error('Failed to delete blog post')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingBlog(undefined)
  }

  const handleModalSuccess = () => {
    fetchBlogs()
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
            <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
            <p className="text-gray-600">
              Share your thoughts, tutorials, and technical articles
            </p>
          </div>
          <Button onClick={handleAddBlog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Blog Post
          </Button>
        </div>

        {/* Blog Posts List */}
        {blogs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No blog posts yet</h3>
              <p className="text-gray-600 text-center mb-6 max-w-sm">
                Start sharing your knowledge by adding links to your blog posts or articles.
              </p>
              <Button onClick={handleAddBlog} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Blog Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {blogs.map((blog, index) => (
              <motion.div
                key={blog.id}
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
                            {blog.title}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {blog.description}
                          </CardDescription>
                          <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {new Date(blog.publishedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={blog.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditBlog(blog)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteBlog(blog.id)}
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

        {/* Blog Form Modal */}
        <BlogFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          blog={editingBlog}
        />
      </div>
    </DashboardLayout>
  )
}
