'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Briefcase, Code, Sparkles, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import MonthYearPicker from '@/components/MonthYearPicker'
import toast from 'react-hot-toast'
import { isValidUsername, normalizeUsernameInput, USERNAME_VALIDATION_MESSAGE } from '@/lib/username'
import { POPULAR_TECH_SKILLS } from '@/lib/popular-tech-skills'
import { useSiteUrl } from '@/hooks/use-site-url'

type ExperienceInput = {
  company: string
  position: string
  startDate: string
  endDate: string
  isCurrentlyWorking: boolean
  description: string
  technologies: string[]
}

type ProjectInput = {
  title: string
  description: string
  technologies: string[]
  githubUrl: string
  liveUrl: string
}

const steps = [
  {
    id: 'basic',
    title: 'Basic info',
    description: 'Tell us who you are and claim your username.',
    icon: User,
  },
  {
    id: 'skills',
    title: 'Skills',
    description: 'Add at least 5 skills to highlight your strengths.',
    icon: Sparkles,
  },
  {
    id: 'experience',
    title: 'Experience',
    description: 'Optional: add your latest role.',
    icon: Briefcase,
  },
  {
    id: 'projects',
    title: 'Projects',
    description: 'Optional: add a featured project.',
    icon: Code,
  },
]

export default function Setup() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [initialized, setInitialized] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [checking, setChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)

  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')

  const [experience, setExperience] = useState<ExperienceInput>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    isCurrentlyWorking: false,
    description: '',
    technologies: [],
  })
  const [experienceTech, setExperienceTech] = useState('')

  const [project, setProject] = useState<ProjectInput>({
    title: '',
    description: '',
    technologies: [],
    githubUrl: '',
    liveUrl: '',
  })
  const [projectTech, setProjectTech] = useState('')

  const [loading, setLoading] = useState(false)
  const siteUrl = useSiteUrl()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?from=/dashboard/setup')
    }
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated' || initialized) return
    setEmail(session?.user?.email || '')
    setFullName(session?.user?.name || '')
    if (session?.user?.username) {
      setUsername(session.user.username)
    }
    setInitialized(true)
  }, [status, session, initialized])

  useEffect(() => {
    if (profileLoaded || !username) return
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile')
        if (!response.ok) return
        const data = await response.json()
        if (data?.name && !fullName) {
          setFullName(data.name)
        }
        if (Array.isArray(data?.skills) && skills.length === 0) {
          setSkills(data.skills)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setProfileLoaded(true)
      }
    }
    loadProfile()
  }, [profileLoaded, username, fullName, skills])

  useEffect(() => {
    if (!username) {
      setIsAvailable(null)
      return
    }

    if (!isValidUsername(username)) {
      setIsAvailable(false)
      return
    }

    let active = true
    const timeoutId = setTimeout(async () => {
      setChecking(true)
      try {
        const response = await fetch('/api/username/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        })
        const data = await response.json()
        if (active) {
          setIsAvailable(Boolean(data?.available))
        }
      } catch (error) {
        if (active) {
          setIsAvailable(null)
        }
        console.error('Error checking username:', error)
      } finally {
        if (active) {
          setChecking(false)
        }
      }
    }, 350)

    return () => {
      active = false
      clearTimeout(timeoutId)
    }
  }, [username])

  const handleUsernameChange = (value: string) => {
    setUsername(normalizeUsernameInput(value))
    setIsAvailable(null)
  }

  const normalizeSkill = (value: string) => value.trim().toLowerCase()
  const existingSkillSet = useMemo(
    () => new Set(skills.map((skill) => normalizeSkill(skill))),
    [skills]
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

  const addSkillValue = (skillValue: string) => {
    const trimmed = skillValue.trim()
    if (!trimmed) return

    setSkills((prev) => {
      const alreadyExists = prev.some(
        (skill) => normalizeSkill(skill) === normalizeSkill(trimmed)
      )
      if (alreadyExists) return prev
      return [...prev, trimmed]
    })
    setNewSkill('')
  }

  const addSkill = () => {
    addSkillValue(newSkill)
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((skill) => skill !== skillToRemove))
  }

  const addExperienceTech = () => {
    const trimmed = experienceTech.trim()
    if (!trimmed || experience.technologies.includes(trimmed)) return
    setExperience((prev) => ({
      ...prev,
      technologies: [...prev.technologies, trimmed],
    }))
    setExperienceTech('')
  }

  const removeExperienceTech = (tech: string) => {
    setExperience((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((item) => item !== tech),
    }))
  }

  const addProjectTech = () => {
    const trimmed = projectTech.trim()
    if (!trimmed || project.technologies.includes(trimmed)) return
    setProject((prev) => ({
      ...prev,
      technologies: [...prev.technologies, trimmed],
    }))
    setProjectTech('')
  }

  const removeProjectTech = (tech: string) => {
    setProject((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((item) => item !== tech),
    }))
  }

  const handleBasicContinue = async () => {
    if (status !== 'authenticated') {
      toast.error('Please sign in to continue')
      return
    }

    if (!fullName.trim()) {
      toast.error('Full name is required')
      return
    }

    if (!username || !isAvailable) {
      toast.error('Please choose a valid username')
      return
    }

    if (!isValidUsername(username)) {
      toast.error(USERNAME_VALIDATION_MESSAGE)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, name: fullName.trim() }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        toast.error(data?.error || data?.message || 'Setup failed')
        return
      }

      await updateSession({ username, name: fullName.trim() })
      setStepIndex(1)
    } catch (error) {
      toast.error('An error occurred during setup')
      console.error('Setup error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSkillsContinue = async () => {
    if (skills.length < 5) {
      toast.error('Please add at least 5 skills')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          skills,
        }),
      })

      if (!response.ok) {
        toast.error('Failed to save skills')
        return
      }

      setStepIndex(2)
    } catch (error) {
      console.error('Skills update error:', error)
      toast.error('Failed to save skills')
    } finally {
      setLoading(false)
    }
  }

  const handleExperienceContinue = async (skip: boolean) => {
    if (skip) {
      setStepIndex(3)
      return
    }

    const hasInput =
      experience.company.trim().length > 0 ||
      experience.position.trim().length > 0 ||
      experience.startDate.trim().length > 0 ||
      experience.endDate.trim().length > 0 ||
      experience.description.trim().length > 0 ||
      experience.technologies.length > 0

    if (!hasInput) {
      setStepIndex(3)
      return
    }

    if (!experience.company.trim() || !experience.position.trim() || !experience.startDate.trim() || !experience.description.trim()) {
      toast.error('Company, position, start date and description are required')
      return
    }

    if (!experience.isCurrentlyWorking && !experience.endDate.trim()) {
      toast.error('End date is required if not currently working')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/profile/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: experience.company.trim(),
          position: experience.position.trim(),
          startDate: experience.startDate.trim(),
          endDate: experience.isCurrentlyWorking ? null : experience.endDate.trim(),
          isCurrentlyWorking: experience.isCurrentlyWorking,
          description: experience.description.trim(),
          technologies: experience.technologies,
          linkedinPostUrl: '',
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        toast.error(error?.error || 'Failed to save experience')
        return
      }

      setStepIndex(3)
    } catch (error) {
      console.error('Experience save error:', error)
      toast.error('Failed to save experience')
    } finally {
      setLoading(false)
    }
  }

  const completeOnboarding = async () => {
    const response = await fetch('/api/onboarding/complete', { method: 'POST' })
    if (!response.ok) {
      toast.error('Failed to complete onboarding')
      return false
    }
    await updateSession({ onboardingCompleted: true })
    router.replace('/dashboard')
    router.refresh()
    return true
  }

  const handleProjectContinue = async (skip: boolean) => {
    if (skip) {
      setLoading(true)
      try {
        await completeOnboarding()
      } finally {
        setLoading(false)
      }
      return
    }

    const hasInput =
      project.title.trim().length > 0 ||
      project.description.trim().length > 0 ||
      project.githubUrl.trim().length > 0 ||
      project.liveUrl.trim().length > 0 ||
      project.technologies.length > 0

    if (!hasInput) {
      setLoading(true)
      try {
        await completeOnboarding()
      } finally {
        setLoading(false)
      }
      return
    }

    if (!project.title.trim() || !project.description.trim()) {
      toast.error('Project title and description are required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/profile/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title.trim(),
          description: project.description.trim(),
          technologies: project.technologies,
          githubUrl: project.githubUrl.trim(),
          liveUrl: project.liveUrl.trim(),
          featured: false,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        toast.error(error?.error || 'Failed to save project')
        return
      }

      await completeOnboarding()
    } catch (error) {
      console.error('Project save error:', error)
      toast.error('Failed to save project')
    } finally {
      setLoading(false)
    }
  }

  const step = steps[stepIndex]
  const StepIcon = step.icon
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100)

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                  <StepIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Step {stepIndex + 1} of {steps.length}
              </div>
            </div>
            <Progress value={progress} />
          </CardHeader>

          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {step.id === 'basic' && (
                <motion.div
                  key="basic"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full name *</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={email}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <div className="relative">
                      <Input
                        id="username"
                        placeholder="yourusername"
                        value={username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        className="pr-10"
                      />
                      {checking && (
                        <div className="absolute right-3 top-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                        </div>
                      )}
                      {!checking && isAvailable === true && (
                        <Check className="absolute right-3 top-3 h-4 w-4 text-green-600" />
                      )}
                      {!checking && isAvailable === false && (
                        <div className="absolute right-3 top-3 h-4 w-4 rounded-full bg-red-500" />
                      )}
                    </div>

                    {username && (
                      <div className="text-sm space-y-1">
                        <p className="text-muted-foreground">
                          Your portfolio will be available at:
                        </p>
                        <p className="font-mono text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded">
                          {siteUrl}/{username}
                        </p>
                        {isAvailable === false && (
                          <p className="text-red-600">
                            This username is unavailable or invalid
                          </p>
                        )}
                        {isAvailable === true && (
                          <p className="text-green-600">
                            Username is available!
                          </p>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      <p>- Must start with a letter</p>
                      <p>- Only lowercase letters and numbers allowed</p>
                      <p>- No symbols or special characters</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <Button
                      onClick={handleBasicContinue}
                      disabled={loading || checking}
                      className="min-w-[160px]"
                      size="lg"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {step.id === 'skills' && (
                <motion.div
                  key="skills"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Add at least 5 skills. You can reorder later in your dashboard.
                    </p>
                    <Badge variant={skills.length >= 5 ? 'secondary' : 'outline'}>
                      {skills.length} / 5 required
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addSkill()
                          }
                        }}
                        list="popular-tech-skills"
                        placeholder="Add a skill (e.g., React, Python)"
                        className="flex-1"
                      />
                      <datalist id="popular-tech-skills">
                        {suggestedSkills.map((skill) => (
                          <option key={skill} value={skill} />
                        ))}
                      </datalist>
                      <Button
                        type="button"
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
                      {skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1"
                        >
                          {skill}
                          <Button
                            type="button"
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
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStepIndex(0)}
                      disabled={loading}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleSkillsContinue}
                      disabled={loading || skills.length < 5}
                      className="min-w-[160px]"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {step.id === 'experience' && (
                <motion.div
                  key="experience"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={experience.company}
                        onChange={(e) => setExperience((prev) => ({ ...prev, company: e.target.value }))}
                        placeholder="Company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        value={experience.position}
                        onChange={(e) => setExperience((prev) => ({ ...prev, position: e.target.value }))}
                        placeholder="Job title"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MonthYearPicker
                      label="Start date"
                      value={experience.startDate}
                      onChange={(value) => setExperience((prev) => ({ ...prev, startDate: value }))}
                      placeholder="Select start date"
                    />
                    {!experience.isCurrentlyWorking && (
                      <MonthYearPicker
                        label="End date"
                        value={experience.endDate}
                        onChange={(value) => setExperience((prev) => ({ ...prev, endDate: value }))}
                        placeholder="Select end date"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isCurrentlyWorking"
                      checked={experience.isCurrentlyWorking}
                      onCheckedChange={(checked) =>
                        setExperience((prev) => ({
                          ...prev,
                          isCurrentlyWorking: checked as boolean,
                          endDate: checked ? '' : prev.endDate,
                        }))
                      }
                    />
                    <Label htmlFor="isCurrentlyWorking">I currently work here</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={experience.description}
                      onChange={(e) => setExperience((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your responsibilities and impact"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Technologies</Label>
                    <div className="flex gap-2">
                      <Input
                        value={experienceTech}
                        onChange={(e) => setExperienceTech(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addExperienceTech()
                          }
                        }}
                        placeholder="Add technology (e.g., React)"
                        className="flex-1"
                      />
                      <Button type="button" onClick={addExperienceTech} disabled={!experienceTech.trim()}>
                        Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {experience.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary" className="flex items-center gap-1 pr-1">
                          {tech}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => removeExperienceTech(tech)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStepIndex(1)}
                      disabled={loading}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleExperienceContinue(true)}
                        disabled={loading}
                      >
                        Skip for now
                      </Button>
                      <Button
                        onClick={() => handleExperienceContinue(false)}
                        disabled={loading}
                        className="min-w-[160px]"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step.id === 'projects' && (
                <motion.div
                  key="projects"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="projectTitle">Project title</Label>
                      <Input
                        id="projectTitle"
                        value={project.title}
                        onChange={(e) => setProject((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Project name"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="projectDescription">Description</Label>
                      <Textarea
                        id="projectDescription"
                        value={project.description}
                        onChange={(e) => setProject((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what you built"
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="githubUrl">GitHub URL</Label>
                      <Input
                        id="githubUrl"
                        type="url"
                        value={project.githubUrl}
                        onChange={(e) => setProject((prev) => ({ ...prev, githubUrl: e.target.value }))}
                        placeholder="https://github.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="liveUrl">Live URL</Label>
                      <Input
                        id="liveUrl"
                        type="url"
                        value={project.liveUrl}
                        onChange={(e) => setProject((prev) => ({ ...prev, liveUrl: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Technologies</Label>
                    <div className="flex gap-2">
                      <Input
                        value={projectTech}
                        onChange={(e) => setProjectTech(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addProjectTech()
                          }
                        }}
                        placeholder="Add technology (e.g., Next.js)"
                        className="flex-1"
                      />
                      <Button type="button" onClick={addProjectTech} disabled={!projectTech.trim()}>
                        Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary" className="flex items-center gap-1 pr-1">
                          {tech}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => removeProjectTech(tech)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStepIndex(2)}
                      disabled={loading}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleProjectContinue(true)}
                        disabled={loading}
                      >
                        Skip for now
                      </Button>
                      <Button
                        onClick={() => handleProjectContinue(false)}
                        disabled={loading}
                        className="min-w-[160px]"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <>
                            Finish
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
