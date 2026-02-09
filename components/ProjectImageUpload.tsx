'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Image as ImageIcon, Upload, X } from 'lucide-react'

interface ProjectImageUploadProps {
  currentImage?: string
  onImageChange: (image: { url: string; publicId: string } | null) => void
  className?: string
}

export default function ProjectImageUpload({
  currentImage,
  onImageChange,
  className = ''
}: ProjectImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreview(currentImage || null)
  }, [currentImage])

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB.')
      return
    }

    uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload/project-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const result = await response.json()
      setPreview(result.url)
      onImageChange({ url: result.url, publicId: result.public_id })
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setPreview(null)
    onImageChange(null)

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
      <div className="relative w-full aspect-video overflow-hidden rounded-lg border border-border bg-muted">
        {preview ? (
          <Image
            src={preview}
            alt="Project"
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-sm text-white">Uploading...</div>
          </div>
        )}

        {preview && !uploading && (
          <button
            type="button"
            onClick={removeImage}
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
            title="Remove image"
          >
            <X size={14} />
          </button>
        )}
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
        <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {dragOver ? 'Drop your image here' : 'Click to upload or drag and drop'}
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
