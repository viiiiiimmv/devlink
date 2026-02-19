'use client'

import { useMemo, useState } from 'react'
import { Github, Linkedin, FileJson, Search, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

type GitHubRepo = {
  id: number
  name: string
  description?: string
  htmlUrl?: string
  homepage?: string
  topics?: string[]
  language?: string
  stargazersCount?: number
  updatedAt?: string
  fork?: boolean
}

type ParsedResume = {
  name?: string
  bio?: string
  skills: string[]
  projects: Array<{
    title: string
    description: string
    technologies?: string[]
    githubUrl?: string
    liveUrl?: string
  }>
  experiences: Array<{
    company: string
    position: string
    startDate: string
    endDate?: string
    isCurrentlyWorking?: boolean
    description: string
    technologies?: string[]
  }>
  socialLinks?: {
    linkedin?: string
    github?: string
    twitter?: string
    website?: string
  }
}

const parseSkillsText = (value: string) =>
  value
    .split(/,|\\n/)
    .map((item) => item.trim())
    .filter(Boolean)

const parseLinkedInExperiences = (value: string) => {
  const lines = value
    .split('\\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return lines
    .map((line) => {
      const [position, company, startDate, endDate, description] = line
        .split('|')
        .map((part) => part.trim())

      if (!position || !company || !startDate || !description) {
        return null
      }

      const isCurrentlyWorking = /present/i.test(endDate || '')
      return {
        position,
        company,
        startDate,
        endDate: isCurrentlyWorking ? '' : endDate || '',
        isCurrentlyWorking,
        description,
        technologies: [],
      }
    })
    .filter(Boolean) as ParsedResume['experiences']
}

const parseResumeJson = (raw: string): ParsedResume | null => {
  const data = JSON.parse(raw)
  const skills = Array.isArray(data?.skills)
    ? data.skills
        .flatMap((skill: any) => {
          if (Array.isArray(skill.keywords)) return skill.keywords
          if (typeof skill.name === 'string') return [skill.name]
          return []
        })
        .map((value: string) => value.trim())
        .filter(Boolean)
    : []

  const projects = Array.isArray(data?.projects)
    ? data.projects
        .map((project: any) => ({
          title: typeof project?.name === 'string' ? project.name.trim() : '',
          description: typeof project?.description === 'string' ? project.description.trim() : '',
          technologies: Array.isArray(project?.keywords)
            ? project.keywords.map((item: string) => item.trim()).filter(Boolean)
            : [],
          githubUrl: typeof project?.url === 'string' ? project.url.trim() : '',
          liveUrl: typeof project?.url === 'string' ? project.url.trim() : '',
        }))
        .filter((project: any) => project.title && project.description)
    : []

  const experiences = Array.isArray(data?.work)
    ? data.work
        .map((work: any) => ({
          company: typeof work?.company === 'string' ? work.company.trim() : '',
          position: typeof work?.position === 'string' ? work.position.trim() : '',
          startDate: typeof work?.startDate === 'string' ? work.startDate.trim() : '',
          endDate: typeof work?.endDate === 'string' ? work.endDate.trim() : '',
          isCurrentlyWorking: !work?.endDate,
          description: typeof work?.summary === 'string' ? work.summary.trim() : '',
          technologies: Array.isArray(work?.highlights)
            ? work.highlights.map((item: string) => item.trim()).filter(Boolean)
            : [],
        }))
        .filter((experience: any) => experience.company && experience.position && experience.startDate && experience.description)
    : []

  const profiles = Array.isArray(data?.basics?.profiles) ? data.basics.profiles : []
  const socialLinks = profiles.reduce((acc: any, profile: any) => {
    const network = typeof profile?.network === 'string' ? profile.network.toLowerCase() : ''
    const url = typeof profile?.url === 'string' ? profile.url.trim() : ''
    if (!url) return acc
    if (network.includes('linkedin')) acc.linkedin = url
    if (network.includes('github')) acc.github = url
    if (network.includes('twitter')) acc.twitter = url
    return acc
  }, {})

  return {
    name: typeof data?.basics?.name === 'string' ? data.basics.name.trim() : '',
    bio: typeof data?.basics?.summary === 'string' ? data.basics.summary.trim() : '',
    skills,
    projects,
    experiences,
    socialLinks,
  }
}

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState('github')

  // GitHub state
  const [githubUsername, setGithubUsername] = useState('')
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([])
  const [githubQuery, setGithubQuery] = useState('')
  const [githubLoading, setGithubLoading] = useState(false)
  const [githubImporting, setGithubImporting] = useState(false)
  const [selectedRepoIds, setSelectedRepoIds] = useState<Set<number>>(new Set())

  // LinkedIn state
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [linkedinSkills, setLinkedinSkills] = useState('')
  const [linkedinExperiences, setLinkedinExperiences] = useState('')
  const [importLinkedinLink, setImportLinkedinLink] = useState(true)
  const [importLinkedinSkills, setImportLinkedinSkills] = useState(true)
  const [importLinkedinExperience, setImportLinkedinExperience] = useState(true)
  const [linkedinImporting, setLinkedinImporting] = useState(false)

  // Resume state
  const [resumeRaw, setResumeRaw] = useState('')
  const [resumeParsed, setResumeParsed] = useState<ParsedResume | null>(null)
  const [resumeError, setResumeError] = useState('')
  const [importResumeBasics, setImportResumeBasics] = useState(true)
  const [importResumeSkills, setImportResumeSkills] = useState(true)
  const [importResumeProjects, setImportResumeProjects] = useState(true)
  const [importResumeExperience, setImportResumeExperience] = useState(true)
  const [overwriteResumeBasics, setOverwriteResumeBasics] = useState(false)
  const [overwriteResumeSkills, setOverwriteResumeSkills] = useState(false)
  const [overwriteResumeProjects, setOverwriteResumeProjects] = useState(false)
  const [overwriteResumeExperience, setOverwriteResumeExperience] = useState(false)
  const [resumeImporting, setResumeImporting] = useState(false)

  const filteredRepos = useMemo(() => {
    const query = githubQuery.trim().toLowerCase()
    if (!query) return githubRepos
    return githubRepos.filter((repo) => repo.name.toLowerCase().includes(query))
  }, [githubRepos, githubQuery])

  const fetchGithubRepos = async () => {
    if (!githubUsername.trim()) {
      toast.error('Enter a GitHub username')
      return
    }

    setGithubLoading(true)
    try {
      const response = await fetch(`/api/import/github?username=${encodeURIComponent(githubUsername.trim())}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const fallback = 'Failed to fetch repositories'
        const detail = typeof errorData?.detail === 'string' ? errorData.detail : ''
        const message = errorData?.message || errorData?.error || (detail ? `${fallback}: ${detail}` : fallback)
        throw new Error(message)
      }
      const data = await response.json()
      setGithubRepos(data.repos || [])
      setSelectedRepoIds(new Set())
      toast.success('Repositories loaded')
    } catch (error) {
      console.error('GitHub fetch error:', error)
      toast.error(error instanceof Error ? error.message : 'Could not load GitHub repositories')
    } finally {
      setGithubLoading(false)
    }
  }

  const toggleRepoSelection = (repoId: number) => {
    setSelectedRepoIds((prev) => {
      const next = new Set(prev)
      if (next.has(repoId)) {
        next.delete(repoId)
      } else {
        next.add(repoId)
      }
      return next
    })
  }

  const handleImportGithub = async () => {
    const selectedRepos = githubRepos.filter((repo) => selectedRepoIds.has(repo.id))
    if (selectedRepos.length === 0) {
      toast.error('Select at least one repository to import')
      return
    }

    setGithubImporting(true)
    try {
      const response = await fetch('/api/import/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repos: selectedRepos }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || 'Failed to import projects')
      }

      const data = await response.json().catch(() => null)
      toast.success(`Imported ${data?.imported ?? selectedRepos.length} projects`)
    } catch (error) {
      console.error('GitHub import error:', error)
      toast.error(error instanceof Error ? error.message : 'GitHub import failed')
    } finally {
      setGithubImporting(false)
    }
  }

  const handleImportLinkedIn = async () => {
    const payload: any = {}
    if (importLinkedinLink && linkedinUrl.trim()) {
      payload.socialLinks = { linkedin: linkedinUrl.trim() }
    }
    if (importLinkedinSkills) {
      const skills = parseSkillsText(linkedinSkills)
      if (skills.length > 0) {
        payload.skills = skills
      }
    }
    if (importLinkedinExperience) {
      const experiences = parseLinkedInExperiences(linkedinExperiences)
      if (experiences.length > 0) {
        payload.experiences = experiences
      }
    }

    if (Object.keys(payload).length === 0) {
      toast.error('Add some LinkedIn data to import')
      return
    }

    setLinkedinImporting(true)
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || 'Failed to import LinkedIn data')
      }
      toast.success('LinkedIn data imported')
    } catch (error) {
      console.error('LinkedIn import error:', error)
      toast.error(error instanceof Error ? error.message : 'LinkedIn import failed')
    } finally {
      setLinkedinImporting(false)
    }
  }

  const handleResumeFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setResumeRaw(text)
  }

  const parseResume = () => {
    try {
      const parsed = parseResumeJson(resumeRaw)
      if (!parsed) {
        throw new Error('Invalid resume JSON')
      }
      setResumeParsed(parsed)
      setResumeError('')
      toast.success('Resume parsed successfully')
    } catch (error) {
      console.error('Resume parse error:', error)
      setResumeParsed(null)
      setResumeError('Could not parse resume JSON')
      toast.error('Failed to parse resume JSON')
    }
  }

  const handleImportResume = async () => {
    if (!resumeParsed) {
      toast.error('Parse a resume JSON first')
      return
    }

    const payload: any = { overwrite: {} }
    if (importResumeBasics) {
      payload.name = resumeParsed.name
      payload.bio = resumeParsed.bio
      payload.overwrite.name = overwriteResumeBasics
      payload.overwrite.bio = overwriteResumeBasics
    }
    if (importResumeSkills) {
      payload.skills = resumeParsed.skills
      payload.overwrite.skills = overwriteResumeSkills
    }
    if (importResumeProjects) {
      payload.projects = resumeParsed.projects
      payload.overwrite.projects = overwriteResumeProjects
    }
    if (importResumeExperience) {
      payload.experiences = resumeParsed.experiences
      payload.overwrite.experiences = overwriteResumeExperience
    }
    if (resumeParsed.socialLinks && importResumeBasics) {
      payload.socialLinks = resumeParsed.socialLinks
    }

    setResumeImporting(true)
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || 'Failed to import resume')
      }
      toast.success('Resume data imported')
    } catch (error) {
      console.error('Resume import error:', error)
      toast.error(error instanceof Error ? error.message : 'Resume import failed')
    } finally {
      setResumeImporting(false)
    }
  }

  return (
    
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Import Data</h1>
            <p className="text-muted-foreground">
              Bring in projects, skills, and experience from your existing profiles.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="github" className="gap-2">
              <Github className="h-4 w-4" />
              GitHub
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </TabsTrigger>
            <TabsTrigger value="resume" className="gap-2">
              <FileJson className="h-4 w-4" />
              Resume JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="github">
            <Card>
              <CardHeader>
                <CardTitle>Import from GitHub</CardTitle>
                <CardDescription>
                  Fetch repositories and turn them into projects.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-3">
                  <Input
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="GitHub username"
                  />
                  <Button onClick={fetchGithubRepos} disabled={githubLoading}>
                    {githubLoading ? 'Loading...' : 'Fetch Repos'}
                  </Button>
                </div>

                {githubRepos.length > 0 && (
                  <>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          value={githubQuery}
                          onChange={(e) => setGithubQuery(e.target.value)}
                          placeholder="Filter repositories"
                          className="max-w-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRepoIds(new Set(githubRepos.map((repo) => repo.id)))}
                        >
                          Select all
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRepoIds(new Set())}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredRepos.map((repo) => (
                        <div key={repo.id} className="rounded-xl border border-border/60 p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-foreground">{repo.name}</p>
                              <p className="text-xs text-muted-foreground">{repo.description || 'No description'}</p>
                            </div>
                            <Checkbox
                              checked={selectedRepoIds.has(repo.id)}
                              onCheckedChange={() => toggleRepoSelection(repo.id)}
                            />
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {repo.language && <Badge variant="secondary">{repo.language}</Badge>}
                            {repo.fork && <Badge variant="outline">Fork</Badge>}
                            {repo.stargazersCount ? <Badge variant="outline">⭐ {repo.stargazersCount}</Badge> : null}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {selectedRepoIds.size} selected
                      </p>
                      <Button onClick={handleImportGithub} disabled={githubImporting}>
                        {githubImporting ? 'Importing...' : 'Import Selected'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="linkedin">
            <Card>
              <CardHeader>
                <CardTitle>Import from LinkedIn</CardTitle>
                <CardDescription>
                  Paste details from LinkedIn to update your portfolio.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>LinkedIn profile URL</Label>
                  <Input
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      checked={importLinkedinLink}
                      onCheckedChange={(checked) => setImportLinkedinLink(Boolean(checked))}
                    />
                    Import LinkedIn link into social profiles
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Skills (comma or newline separated)</Label>
                  <Textarea
                    value={linkedinSkills}
                    onChange={(e) => setLinkedinSkills(e.target.value)}
                    placeholder="React, TypeScript, Node.js"
                    rows={3}
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      checked={importLinkedinSkills}
                      onCheckedChange={(checked) => setImportLinkedinSkills(Boolean(checked))}
                    />
                    Import skills
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Experience (one per line)</Label>
                  <Textarea
                    value={linkedinExperiences}
                    onChange={(e) => setLinkedinExperiences(e.target.value)}
                    placeholder="Role | Company | Jan 2022 | Present | Built pricing system"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: Role | Company | Start (Month YYYY) | End (Month YYYY or Present) | Description
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      checked={importLinkedinExperience}
                      onCheckedChange={(checked) => setImportLinkedinExperience(Boolean(checked))}
                    />
                    Import experiences
                  </div>
                </div>

                <Button onClick={handleImportLinkedIn} disabled={linkedinImporting}>
                  {linkedinImporting ? 'Importing...' : 'Import LinkedIn Data'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resume">
            <Card>
              <CardHeader>
                <CardTitle>Import from Resume JSON</CardTitle>
                <CardDescription>
                  Upload a JSON Resume file or paste JSON to import details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-3">
                  <Input type="file" accept="application/json" onChange={handleResumeFile} />
                  <Button variant="outline" onClick={parseResume}>Parse JSON</Button>
                </div>

                <Textarea
                  value={resumeRaw}
                  onChange={(e) => setResumeRaw(e.target.value)}
                  placeholder="{ ... }"
                  rows={6}
                />

                {resumeError && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <XCircle className="h-4 w-4" />
                    {resumeError}
                  </div>
                )}

                {resumeParsed && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Resume parsed successfully
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-border/60 p-4 space-y-2">
                        <p className="font-semibold">Basics</p>
                        <p className="text-sm text-muted-foreground">{resumeParsed.name || 'No name found'}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={importResumeBasics}
                            onCheckedChange={(checked) => setImportResumeBasics(Boolean(checked))}
                          />
                          Import name & bio
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Checkbox
                            checked={overwriteResumeBasics}
                            onCheckedChange={(checked) => setOverwriteResumeBasics(Boolean(checked))}
                          />
                          Overwrite existing basics
                        </div>
                      </div>

                      <div className="rounded-lg border border-border/60 p-4 space-y-2">
                        <p className="font-semibold">Skills</p>
                        <p className="text-sm text-muted-foreground">{resumeParsed.skills.length} skills detected</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={importResumeSkills}
                            onCheckedChange={(checked) => setImportResumeSkills(Boolean(checked))}
                          />
                          Import skills
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Checkbox
                            checked={overwriteResumeSkills}
                            onCheckedChange={(checked) => setOverwriteResumeSkills(Boolean(checked))}
                          />
                          Replace existing skills
                        </div>
                      </div>

                      <div className="rounded-lg border border-border/60 p-4 space-y-2">
                        <p className="font-semibold">Projects</p>
                        <p className="text-sm text-muted-foreground">{resumeParsed.projects.length} projects detected</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={importResumeProjects}
                            onCheckedChange={(checked) => setImportResumeProjects(Boolean(checked))}
                          />
                          Import projects
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Checkbox
                            checked={overwriteResumeProjects}
                            onCheckedChange={(checked) => setOverwriteResumeProjects(Boolean(checked))}
                          />
                          Replace existing projects
                        </div>
                      </div>

                      <div className="rounded-lg border border-border/60 p-4 space-y-2">
                        <p className="font-semibold">Experience</p>
                        <p className="text-sm text-muted-foreground">{resumeParsed.experiences.length} roles detected</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={importResumeExperience}
                            onCheckedChange={(checked) => setImportResumeExperience(Boolean(checked))}
                          />
                          Import experience
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Checkbox
                            checked={overwriteResumeExperience}
                            onCheckedChange={(checked) => setOverwriteResumeExperience(Boolean(checked))}
                          />
                          Replace existing experience
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleImportResume} disabled={resumeImporting}>
                      {resumeImporting ? 'Importing...' : 'Import Resume Data'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    
  )
}
