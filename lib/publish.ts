import type { IProfile, IProfilePublishSnapshot } from '@/models/Profile'

const countSocialLinks = (socialLinks: IProfile['socialLinks'] | undefined): number => {
  if (!socialLinks) return 0
  let count = 0
  if (typeof socialLinks.github === 'string' && socialLinks.github.trim()) count += 1
  if (typeof socialLinks.linkedin === 'string' && socialLinks.linkedin.trim()) count += 1
  if (typeof socialLinks.twitter === 'string' && socialLinks.twitter.trim()) count += 1
  if (typeof socialLinks.website === 'string' && socialLinks.website.trim()) count += 1
  return count
}

export const buildPublishSnapshot = (profile: Pick<IProfile,
  'name' | 'bio' | 'skills' | 'projects' | 'experiences' | 'certifications' | 'researches' | 'testimonials' | 'socialLinks' | 'profileImage' | 'profilePhoto' | 'theme' | 'template'
>): IProfilePublishSnapshot => {
  const hasPhoto = Boolean(
    (typeof profile.profilePhoto?.url === 'string' && profile.profilePhoto.url.trim()) ||
    (typeof profile.profileImage === 'string' && profile.profileImage.trim())
  )

  return {
    name: profile.name || '',
    bio: profile.bio || '',
    skillsCount: Array.isArray(profile.skills) ? profile.skills.length : 0,
    projectsCount: Array.isArray(profile.projects) ? profile.projects.length : 0,
    experiencesCount: Array.isArray(profile.experiences) ? profile.experiences.length : 0,
    certificationsCount: Array.isArray(profile.certifications) ? profile.certifications.length : 0,
    researchesCount: Array.isArray(profile.researches) ? profile.researches.length : 0,
    testimonialsCount: Array.isArray(profile.testimonials) ? profile.testimonials.length : 0,
    socialLinksCount: countSocialLinks(profile.socialLinks),
    hasPhoto,
    theme: profile.theme || '',
    template: profile.template || '',
  }
}
