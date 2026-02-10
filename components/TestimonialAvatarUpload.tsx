'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, User, X } from 'lucide-react'

interface TestimonialAvatarUploadProps {
  currentAvatar?: string
  onAvatarChange: (avatar: { url: string; publicId: string } | null) => void
  className?: string
}

export default function TestimonialAvatarUpload({
  currentAvatar,
  onAvatarChange,
  className = '',
}: TestimonialAvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreview(currentAvatar || null)
  }, [currentAvatar])

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB.')
      return
    }

    uploadAvatar(file)
  }

  const uploadAvatar = async (file: File) => {
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/upload/testimonial-avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload avatar')
      }

      const result = await response.json()
      setPreview(result.url)
      onAvatarChange({ url: result.url, publicId: result.public_id })
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload avatar. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = () => {
    setPreview(null)
    onAvatarChange(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-border bg-muted">
          {preview ? (
            <Image
              src={preview}
              alt="Avatar"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <User className="h-8 w-8" />
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-xs text-white">Uploading...</div>
            </div>
          )}

          {preview && !uploading && (
            <button
              type="button"
              onClick={removeAvatar}
              className="absolute -top-2 -right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
              title="Remove avatar"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          Optional avatar for the testimonial.
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${dragOver
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
          : 'border-border hover:border-blue-400'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-5 w-5 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {dragOver ? 'Drop your avatar here' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PNG, JPG, GIF up to 5MB
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={uploading}
      />
    </div>
  )
}
