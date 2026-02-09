'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Upload, X, User } from 'lucide-react'

interface PhotoUploadProps {
  currentPhoto?: string
  onPhotoChange: (photo: { url: string; publicId: string } | null) => void
  className?: string
}

export default function PhotoUpload({ currentPhoto, onPhotoChange, className = '' }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhoto || null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image size should be less than 5MB.')
      return
    }

    uploadPhoto(file)
  }

  const uploadPhoto = async (file: File) => {
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('photo', file)

      const response = await fetch('/api/upload/photo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload photo')
      }

      const result = await response.json()
      setPreview(result.url)
      onPhotoChange({ url: result.url, publicId: result.public_id })
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = async () => {
    if (preview && preview !== currentPhoto) {
      // If it's a new upload, we should delete it from Cloudinary
      // For simplicity, we'll just clear the preview
    }

    setPreview(null)
    onPhotoChange(null)

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
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-center">
        <div className="relative">
          {/* Photo Preview */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-border bg-muted">
            {preview ? (
              <Image
                src={preview}
                alt="Profile"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <User size={48} />
              </div>
            )}

            {/* Loading Overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-sm">Uploading...</div>
              </div>
            )}
          </div>

          {/* Remove Button */}
          {preview && !uploading && (
            <button
              onClick={removePhoto}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              title="Remove photo"
            >
              <X size={14} />
            </button>
          )}

          {/* Camera Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Upload photo"
          >
            <Camera size={20} />
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
            : 'border-border hover:border-blue-400'
          }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {dragOver ? 'Drop your photo here' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PNG, JPG, GIF up to 5MB
        </p>
      </div>

      {/* Hidden File Input */}
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
