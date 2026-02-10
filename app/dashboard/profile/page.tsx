'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Save, User, Link as LinkIcon, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import DashboardLayout from '@/components/dashboard/layout'
import PhotoUpload from '@/components/PhotoUpload'
import MarkdownEditor from '@/components/MarkdownEditor'
import toast from 'react-hot-toast'
import { POPULAR_TECH_SKILLS } from '@/lib/popular-tech-skills'

interface ProfileData {
  name: string
  bio: string
  skills: string[]
  profilePhoto?: {
    url?: string
    publicId?: string
  }
  socialLinks: {
    github?: string
    linkedin?: string
    twitter?: string
    website?: string
  }
  contactCta: {
    enabled: boolean
    title: string
    description: string
    buttonLabel: string
    link?: string
    email?: string
  }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    bio: '',
    skills: [],
    socialLinks: {},
    contactCta: {
      enabled: true,
      title: 'Let us work together',
      description: 'Open to freelance, full-time roles, and collaboration opportunities.',
      buttonLabel: 'Contact me',
      link: '',
      email: '',
    },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newSkill, setNewSkill] = useState('')
  const [draggedSkillIndex, setDraggedSkillIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const normalizeSkill = (value: string) => value.trim().toLowerCase()
  const existingSkillSet = useMemo(
    () => new Set(profile.skills.map((skill) => normalizeSkill(skill))),
    [profile.skills]
  )
  const isDuplicateSkill = existingSkillSet.has(normalizeSkill(newSkill))
  const suggestedSkills = useMemo(() => {
    const query = normalizeSkill(newSkill)
    const availableSkills = POPULAR_TECH_SKILLS.filter(
      (skill) => !existingSkillSet.has(normalizeSkill(skill))
    )

    if (!query) {
      return availableSkills.slice(0, 14)
    }

    const prefixMatches = availableSkills.filter((skill) =>
      normalizeSkill(skill).startsWith(query)
    )
    const fuzzyMatches = availableSkills.filter((skill) => {
      const normalized = normalizeSkill(skill)
      return !normalized.startsWith(query) && normalized.includes(query)
    })

    return [...prefixMatches, ...fuzzyMatches].slice(0, 14)
  }, [existingSkillSet, newSkill])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile({
          name: data.name || '',
          bio: data.bio || '',
          skills: data.skills || [],
          profilePhoto: data.profilePhoto || undefined,
          socialLinks: data.socialLinks || {},
          contactCta: {
            enabled: data.contactCta?.enabled !== false,
            title: data.contactCta?.title || 'Let us work together',
            description: data.contactCta?.description || 'Open to freelance, full-time roles, and collaboration opportunities.',
            buttonLabel: data.contactCta?.buttonLabel || 'Contact me',
            link: data.contactCta?.link || '',
            email: data.contactCta?.email || '',
          },
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })

      if (response.ok) {
        toast.success('Profile updated successfully!')
      } else {
        toast.error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const addSkillValue = (skillValue: string) => {
    const trimmed = skillValue.trim()
    if (!trimmed) return

    setProfile((prev) => {
      const alreadyExists = prev.skills.some(
        (skill) => normalizeSkill(skill) === normalizeSkill(trimmed)
      )
      if (alreadyExists) return prev

      return {
        ...prev,
        skills: [...prev.skills, trimmed]
      }
    })
    setNewSkill('')
  }

  const addSkill = () => {
    addSkillValue(newSkill)
  }

  const removeSkill = (skillToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const moveSkill = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return
    setProfile((prev) => {
      const nextSkills = [...prev.skills]
      if (fromIndex >= nextSkills.length || toIndex >= nextSkills.length) {
        return prev
      }
      const [moved] = nextSkills.splice(fromIndex, 1)
      nextSkills.splice(toIndex, 0, moved)
      return {
        ...prev,
        skills: nextSkills,
      }
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  const handlePhotoChange = (photo: { url: string; publicId: string } | null) => {
    setProfile(prev => ({
      ...prev,
      profilePhoto: photo || undefined
    }))
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
            <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground">
              Update your profile information and social links
            </p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Basic Information */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Your basic profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <MarkdownEditor
                  value={profile.bio}
                  onChange={(value) => setProfile(prev => ({ ...prev, bio: value }))}
                  placeholder="Tell us about yourself... (Markdown supported)"
                  rows={6}
                  maxLength={500}
                />
                <p className="text-sm text-muted-foreground">
                  {profile.bio.length}/500 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Social Links
              </CardTitle>
              <CardDescription>
                Connect your social profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub</Label>
                  <Input
                    id="github"
                    value={profile.socialLinks.github || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, github: e.target.value }
                    }))}
                    placeholder="https://github.com/username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={profile.socialLinks.linkedin || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                    }))}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={profile.socialLinks.twitter || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                    }))}
                    placeholder="https://twitter.com/username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.socialLinks.website || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, website: e.target.value }
                    }))}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Contact CTA
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Show a contact card on your public profile.
                    </p>
                  </div>
                  <Switch
                    checked={profile.contactCta.enabled}
                    onCheckedChange={(checked) =>
                      setProfile((prev) => ({
                        ...prev,
                        contactCta: { ...prev.contactCta, enabled: checked },
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-title">CTA Title</Label>
                    <Input
                      id="contact-title"
                      value={profile.contactCta.title}
                      onChange={(e) => setProfile((prev) => ({
                        ...prev,
                        contactCta: { ...prev.contactCta, title: e.target.value },
                      }))}
                      maxLength={120}
                      placeholder="Let us work together"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-button-label">Button Label</Label>
                    <Input
                      id="contact-button-label"
                      value={profile.contactCta.buttonLabel}
                      onChange={(e) => setProfile((prev) => ({
                        ...prev,
                        contactCta: { ...prev.contactCta, buttonLabel: e.target.value },
                      }))}
                      maxLength={40}
                      placeholder="Contact me"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="contact-description">CTA Description</Label>
                  <Textarea
                    id="contact-description"
                    value={profile.contactCta.description}
                    onChange={(e) => setProfile((prev) => ({
                      ...prev,
                      contactCta: { ...prev.contactCta, description: e.target.value },
                    }))}
                    maxLength={240}
                    rows={3}
                    className="w-full"
                    placeholder="Open to freelance, full-time roles, and collaboration opportunities."
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-link">Contact Link (optional)</Label>
                    <Input
                      id="contact-link"
                      value={profile.contactCta.link || ''}
                      onChange={(e) => setProfile((prev) => ({
                        ...prev,
                        contactCta: { ...prev.contactCta, link: e.target.value },
                      }))}
                      placeholder="https://calendly.com/your-handle or mailto:you@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email fallback (optional)</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={profile.contactCta.email || ''}
                      onChange={(e) => setProfile((prev) => ({
                        ...prev,
                        contactCta: { ...prev.contactCta, email: e.target.value },
                      }))}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Profile Photo
            </CardTitle>
            <CardDescription>
              Upload a profile photo to personalize your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoUpload
              currentPhoto={profile.profilePhoto?.url}
              onPhotoChange={handlePhotoChange}
            />
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Skills & Technologies</CardTitle>
            <CardDescription>
              Add the technologies and skills you work with
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={handleKeyPress}
                  list="popular-tech-skills"
                  placeholder="Add a skill (e.g., React, Python, etc.)"
                  className="flex-1"
                />
                <datalist id="popular-tech-skills">
                  {suggestedSkills.map((skill) => (
                    <option key={skill} value={skill} />
                  ))}
                </datalist>
                <Button 
                  onClick={addSkill}
                  disabled={!newSkill.trim() || isDuplicateSkill}
                >
                  Add
                </Button>
              </div>

              {suggestedSkills.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Popular technologies (click to add)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSkills.map((skill) => (
                      <Button
                        key={`suggestion-${skill}`}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => addSkillValue(skill)}
                      >
                        {skill}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <Badge 
                    key={`${skill}-${index}`}
                    variant="secondary" 
                    className="flex items-center gap-1 pr-1 cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move'
                      event.dataTransfer.setData('text/plain', String(index))
                      setDraggedSkillIndex(index)
                    }}
                    onDragOver={(event) => {
                      event.preventDefault()
                      event.dataTransfer.dropEffect = 'move'
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      const fromIndex = draggedSkillIndex ?? Number(event.dataTransfer.getData('text/plain'))
                      if (Number.isNaN(fromIndex)) return
                      moveSkill(fromIndex, index)
                      setDraggedSkillIndex(null)
                    }}
                    onDragEnd={() => setDraggedSkillIndex(null)}
                  >
                    {skill}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeSkill(skill)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>

              {profile.skills.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No skills added yet. Start by adding your technical skills and technologies.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
