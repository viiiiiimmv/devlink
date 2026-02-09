import {
  DEFAULT_PROFILE_TEMPLATE,
  DEFAULT_PROFILE_THEME,
  DEFAULT_SECTION_SETTINGS,
  normalizeSectionSettings,
} from '@/lib/profile-customization'

type SocialLinks = {
  github?: string
  linkedin?: string
  twitter?: string
  website?: string
}

type ProfilePhoto = {
  url?: string
  publicId?: string
}

type SectionSetting = {
  id: string
  visible: boolean
}

type Project = { id?: string }
type Experience = { id?: string }
type Certification = { id?: string }
type Research = { id?: string }

export type ProfileCompletionInput = {
  name?: string
  bio?: string
  skills?: string[]
  profileImage?: string
  profilePhoto?: ProfilePhoto
  socialLinks?: SocialLinks
  theme?: string
  template?: string
  sectionSettings?: SectionSetting[]
  projects?: Project[]
  experiences?: Experience[]
  certifications?: Certification[]
  researches?: Research[]
}

export type CompletionStepId =
  | 'basics'
  | 'skills'
  | 'projects'
  | 'experience'
  | 'social'
  | 'photo'
  | 'credentials'
  | 'personalization'

export type CompletionStep = {
  id: CompletionStepId
  title: string
  description: string
  href: string
  points: number
  earnedPoints: number
  completed: boolean
}

export type ProfileCompletionResult = {
  percentage: number
  earnedPoints: number
  totalPoints: number
  completedSteps: number
  totalSteps: number
  steps: CompletionStep[]
  nextStep: CompletionStep | null
}

const TOTAL_POINTS = 100

const STEP_POINTS: Record<CompletionStepId, number> = {
  basics: 20,
  skills: 15,
  projects: 20,
  experience: 15,
  social: 10,
  photo: 8,
  credentials: 7,
  personalization: 5,
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function countNonEmptyStrings(values: unknown): number {
  if (!Array.isArray(values)) return 0
  let count = 0
  for (const value of values) {
    if (nonEmptyString(value)) count += 1
  }
  return count
}

function countItems(values: unknown): number {
  return Array.isArray(values) ? values.length : 0
}

function countSocialLinks(socialLinks: SocialLinks | undefined): number {
  if (!socialLinks) return 0
  let count = 0
  if (nonEmptyString(socialLinks.github)) count += 1
  if (nonEmptyString(socialLinks.linkedin)) count += 1
  if (nonEmptyString(socialLinks.twitter)) count += 1
  if (nonEmptyString(socialLinks.website)) count += 1
  return count
}

function hasCustomSectionSettings(sectionSettings: SectionSetting[] | undefined): boolean {
  const normalized = normalizeSectionSettings(sectionSettings)
  if (normalized.length !== DEFAULT_SECTION_SETTINGS.length) return true

  for (let i = 0; i < normalized.length; i += 1) {
    const current = normalized[i]
    const defaults = DEFAULT_SECTION_SETTINGS[i]
    if (!defaults || current.id !== defaults.id || current.visible !== defaults.visible) {
      return true
    }
  }

  return false
}

function clampPoints(value: number, max: number): number {
  if (value < 0) return 0
  if (value > max) return max
  return value
}

export function calculateProfileCompletion(profile: ProfileCompletionInput): ProfileCompletionResult {
  const bioLength = nonEmptyString(profile.bio) ? profile.bio.trim().length : 0
  const hasName = nonEmptyString(profile.name)
  const skillsCount = countNonEmptyStrings(profile.skills)
  const projectsCount = countItems(profile.projects)
  const experiencesCount = countItems(profile.experiences)
  const certificationsCount = countItems(profile.certifications)
  const researchesCount = countItems(profile.researches)
  const socialLinksCount = countSocialLinks(profile.socialLinks)
  const hasPhoto = nonEmptyString(profile.profilePhoto?.url) || nonEmptyString(profile.profileImage)

  const isCustomizedTheme =
    nonEmptyString(profile.theme) && profile.theme !== DEFAULT_PROFILE_THEME
  const isCustomizedTemplate =
    nonEmptyString(profile.template) && profile.template !== DEFAULT_PROFILE_TEMPLATE
  const isCustomizedSections = hasCustomSectionSettings(profile.sectionSettings)

  const basicsPoints = clampPoints(
    (hasName ? 6 : 0) + (bioLength >= 120 ? 14 : bioLength >= 40 ? 8 : bioLength > 0 ? 4 : 0),
    STEP_POINTS.basics
  )

  let skillsPoints = 0
  if (skillsCount >= 5) skillsPoints = STEP_POINTS.skills
  else if (skillsCount >= 3) skillsPoints = 10
  else if (skillsCount >= 1) skillsPoints = 5

  let projectsPoints = 0
  if (projectsCount >= 2) projectsPoints = STEP_POINTS.projects
  else if (projectsCount === 1) projectsPoints = 12

  const experiencePoints = experiencesCount > 0 ? STEP_POINTS.experience : 0

  let socialPoints = 0
  if (socialLinksCount >= 2) socialPoints = STEP_POINTS.social
  else if (socialLinksCount === 1) socialPoints = 5

  const photoPoints = hasPhoto ? STEP_POINTS.photo : 0
  const credentialsPoints =
    certificationsCount + researchesCount > 0 ? STEP_POINTS.credentials : 0

  const personalizationPoints =
    isCustomizedTheme || isCustomizedTemplate || isCustomizedSections
      ? STEP_POINTS.personalization
      : 0

  const steps: CompletionStep[] = [
    {
      id: 'basics',
      title: 'Write your profile summary',
      description: 'Add a clear bio so recruiters understand your background quickly.',
      href: '/dashboard/profile',
      points: STEP_POINTS.basics,
      earnedPoints: basicsPoints,
      completed: basicsPoints >= STEP_POINTS.basics,
    },
    {
      id: 'skills',
      title: 'Add your core skills',
      description: 'List at least 5 skills to highlight your strongest technologies.',
      href: '/dashboard/profile',
      points: STEP_POINTS.skills,
      earnedPoints: skillsPoints,
      completed: skillsPoints >= STEP_POINTS.skills,
    },
    {
      id: 'projects',
      title: 'Showcase projects',
      description: 'Add at least 2 projects to demonstrate real work and impact.',
      href: '/dashboard/projects',
      points: STEP_POINTS.projects,
      earnedPoints: projectsPoints,
      completed: projectsPoints >= STEP_POINTS.projects,
    },
    {
      id: 'experience',
      title: 'Add experience',
      description: 'Include your latest role or internship to strengthen credibility.',
      href: '/dashboard/experience',
      points: STEP_POINTS.experience,
      earnedPoints: experiencePoints,
      completed: experiencePoints >= STEP_POINTS.experience,
    },
    {
      id: 'social',
      title: 'Connect social links',
      description: 'Add at least 2 social links so visitors can contact or verify you.',
      href: '/dashboard/profile',
      points: STEP_POINTS.social,
      earnedPoints: socialPoints,
      completed: socialPoints >= STEP_POINTS.social,
    },
    {
      id: 'photo',
      title: 'Upload profile photo',
      description: 'Profiles with photos feel more trustworthy and convert better.',
      href: '/dashboard/profile',
      points: STEP_POINTS.photo,
      earnedPoints: photoPoints,
      completed: photoPoints >= STEP_POINTS.photo,
    },
    {
      id: 'credentials',
      title: 'Add certifications or research',
      description: 'Include one certification or publication to stand out.',
      href: '/dashboard/certifications',
      points: STEP_POINTS.credentials,
      earnedPoints: credentialsPoints,
      completed: credentialsPoints >= STEP_POINTS.credentials,
    },
    {
      id: 'personalization',
      title: 'Customize your portfolio look',
      description: 'Pick a custom theme/template or section layout.',
      href: '/dashboard/customise',
      points: STEP_POINTS.personalization,
      earnedPoints: personalizationPoints,
      completed: personalizationPoints >= STEP_POINTS.personalization,
    },
  ]

  const earnedPoints = steps.reduce((sum, step) => sum + step.earnedPoints, 0)
  const percentage = Math.max(0, Math.min(100, Math.round((earnedPoints / TOTAL_POINTS) * 100)))
  const completedSteps = steps.filter((step) => step.completed).length
  const nextStep = steps.find((step) => !step.completed) || null

  return {
    percentage,
    earnedPoints,
    totalPoints: TOTAL_POINTS,
    completedSteps,
    totalSteps: steps.length,
    steps,
    nextStep,
  }
}
