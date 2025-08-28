'use client'

import { motion } from 'framer-motion'
import { Github, Linkedin, Twitter, Globe, ExternalLink, Calendar, Award } from 'lucide-react'
import { themes } from '@/lib/themes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'

export interface Profile {
  username: string
  name: string
  bio: string
  skills: string[]
  profileImage?: string
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
  theme: string
  projects: Project[]
  experiences: Experience[]
  certifications: Certification[]
  researches: Research[]
}

interface Project {
  id: string
  title: string
  description: string
  technologies: string[]
  githubUrl?: string
  liveUrl?: string
  image?: string
  featured: boolean
}

interface Experience {
  id: string
  company: string
  position: string
  startDate: string
  endDate?: string
  isCurrentlyWorking: boolean
  description: string
  technologies: string[]
  linkedinPostUrl?: string
}

interface Certification {
  id: string
  name: string
  issuer: string
  date: string
  credentialId?: string
  credentialUrl?: string
}

interface Research {
  id: string
  title: string
  description: string
  url: string
  publishedAt: string
}

interface PublicProfileProps {
  profile: Profile
}

export default function PublicProfile({ profile }: PublicProfileProps) {
  // Safety check to ensure profile exists and has required properties
  if (!profile) {
    return <div>Profile not found</div>
  }

  // Ensure all required properties exist with fallbacks
  const safeProfile = {
    ...profile,
    skills: profile.skills || [],
    projects: profile.projects || [],
    experiences: profile.experiences || [],
    certifications: profile.certifications || [],
    researches: profile.researches || [],
    socialLinks: profile.socialLinks || {},
    bio: profile.bio || '',
    name: profile.name || 'Developer',
    theme: profile.theme || 'modern'
  }

  const currentTheme = themes[safeProfile.theme as keyof typeof themes] || themes.modern

  const socialIcons = {
    github: Github,
    linkedin: Linkedin,
    twitter: Twitter,
    website: Globe,
  }

  const formatExperienceDuration = (startDate: string, endDate?: string, isCurrentlyWorking?: boolean) => {
    const formatDate = (dateStr: string) => {
      // Handle different date formats
      if (dateStr.includes('-')) {
        // Format: "YYYY-MM"
        const date = new Date(dateStr + '-01')
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        })
      } else {
        // Format: "Month YYYY"
        return dateStr
      }
    }

    const start = formatDate(startDate)
    if (isCurrentlyWorking) {
      return `${start} - Present`
    }
    const end = endDate ? formatDate(endDate) : 'Present'
    return `${start} - ${end}`
  }

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className={`min-h-screen ${currentTheme.styles.section}`}>
      {/* Hero Section */}
      <section className={`${currentTheme.styles.hero} relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <div className="text-center">
            {/* Profile Image with Enhanced Styling */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="mb-12"
            >
              <div className="relative inline-block">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-white/10 rounded-full blur-xl scale-110"></div>
                
                {(safeProfile.profilePhoto?.url || safeProfile.profileImage) ? (
                  <Image
                    src={safeProfile.profilePhoto?.url || safeProfile.profileImage!}
                    alt={safeProfile.name}
                    width={160}
                    height={160}
                    className="relative w-40 h-40 rounded-full border-4 border-white/80 shadow-2xl object-cover backdrop-blur-sm"
                  />
                ) : (
                  <div className="relative w-40 h-40 rounded-full border-4 border-white/80 shadow-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-5xl font-bold backdrop-blur-sm">
                    {safeProfile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* Decorative Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-white/30 scale-110 animate-pulse"></div>
              </div>
            </motion.div>

            {/* Name with Enhanced Typography and theme color */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={`text-6xl md:text-7xl lg:text-8xl font-bold mb-6 drop-shadow-lg ${currentTheme.colors.primary}`}
            >
              {safeProfile.name}
            </motion.h1>

            {/* Bio with theme secondary color */}
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className={`text-xl md:text-2xl lg:text-3xl mb-12 max-w-4xl mx-auto font-light leading-relaxed ${currentTheme.colors.secondary}`}
            >
              {safeProfile.bio || 'Full Stack Developer passionate about creating amazing digital experiences.'}
            </motion.p>

            {/* Social Links with Enhanced Design */}
            {safeProfile.socialLinks && Object.entries(safeProfile.socialLinks).some(([_, url]) => url) && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-wrap justify-center gap-4 mb-12"
              >
                {Object.entries(safeProfile.socialLinks).map(([platform, url], index) => {
                  const Icon = socialIcons[platform as keyof typeof socialIcons]
                  if (!Icon || !url) return null
                  return (
                    <motion.div 
                      key={platform} 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link href={url} target="_blank" rel="noopener noreferrer">
                        <Button 
                          variant="outline" 
                          size="lg"
                          className={`bg-white/10 backdrop-blur-sm border-white/30 ${currentTheme.colors.primary} hover:bg-white/20 hover:border-white/50 transition-all duration-300 shadow-lg hover:shadow-xl`}
                        >
                          <Icon className={`h-5 w-5 mr-2 ${currentTheme.colors.primary}`} />
                          <span className={currentTheme.colors.primary}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                        </Button>
                      </Link>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}

            {/* Skills with Enhanced Design */}
            {safeProfile.skills && safeProfile.skills.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto"
              >
                {safeProfile.skills.map((skill, index) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1 + index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <Badge 
                      variant="secondary" 
                      className={`px-4 py-2 text-sm font-medium bg-white/20 backdrop-blur-sm border-white/30 ${currentTheme.colors.accent} hover:bg-white/30 transition-all duration-300 shadow-lg`}
                    >
                      <span className={currentTheme.colors.accent}>{skill}</span>
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.5 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
              >
                <motion.div
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1 h-3 bg-white/70 rounded-full mt-2"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Projects Section */}
        {safeProfile.projects && safeProfile.projects.length > 0 && (
          <motion.section 
            className="mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className={`text-3xl font-bold mb-8 ${currentTheme.colors.primary}`}>
              Projects
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                // Show featured projects first, then all other projects
                const featuredProjects = safeProfile.projects.filter(project => project.featured)
                const otherProjects = safeProfile.projects.filter(project => !project.featured)
                const allProjects = [...featuredProjects, ...otherProjects]
                
                // If no featured projects, show all projects
                const projectsToShow = featuredProjects.length > 0 ? featuredProjects : allProjects
                
                return projectsToShow.slice(0, 6).map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className={`${currentTheme.styles.card} h-full transition-all duration-200`}>
                      {project.image && (
                        <div className="aspect-video relative overflow-hidden rounded-t-lg">
                          <Image
                            src={project.image}
                            alt={project.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className={currentTheme.colors.primary}>
                          {project.title}
                        </CardTitle>
                        <CardDescription>
                          {project.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.technologies.map((tech) => (
                            <Badge key={tech} variant="outline">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {project.githubUrl && (
                            <Link href={project.githubUrl} target="_blank">
                              <Button variant="outline" size="sm">
                                <Github className="h-4 w-4 mr-2" />
                                Code
                              </Button>
                            </Link>
                          )}
                          {project.liveUrl && (
                            <Link href={project.liveUrl} target="_blank">
                              <Button size="sm" className={currentTheme.styles.button}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Live Demo
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              })()}
            </div>
          </motion.section>
        )}

        {/* Experience Section */}
        {safeProfile.experiences && safeProfile.experiences.length > 0 && (
          <motion.section 
            className="mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className={`text-3xl font-bold mb-8 ${currentTheme.colors.primary}`}>
              Experience
            </h2>
            <div className="space-y-6">
              {safeProfile.experiences.map((experience, index) => (
                <motion.div
                  key={experience.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className={currentTheme.styles.card}>
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <CardTitle className={currentTheme.colors.primary}>
                            {experience.position}
                          </CardTitle>
                          <CardDescription className="text-lg font-medium">
                            {experience.company}
                          </CardDescription>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-2 md:mt-0">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatExperienceDuration(experience.startDate, experience.endDate, experience.isCurrentlyWorking)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">{experience.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {experience.technologies.map((tech) => (
                          <Badge key={tech} variant="secondary">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Certifications Section */}
        {safeProfile.certifications && safeProfile.certifications.length > 0 && (
          <motion.section 
            className="mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className={`text-3xl font-bold mb-8 ${currentTheme.colors.primary}`}>
              Certifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {safeProfile.certifications.map((cert, index) => (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className={currentTheme.styles.card}>
                    <CardHeader>
                      <CardTitle className={`flex items-center ${currentTheme.colors.primary}`}>
                        <Award className="h-5 w-5 mr-2" />
                        {cert.name}
                      </CardTitle>
                      <CardDescription>
                        {cert.issuer} • {cert.date}
                      </CardDescription>
                    </CardHeader>
                    {cert.credentialUrl && (
                      <CardContent>
                        <Link href={cert.credentialUrl} target="_blank">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Credential
                          </Button>
                        </Link>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Research Section */}
        {safeProfile.researches && safeProfile.researches.length > 0 && (
          <motion.section 
            className="mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className={`text-3xl font-bold mb-8 ${currentTheme.colors.primary}`}>
              Latest Research Papers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {safeProfile.researches.slice(0, 4).map((research, index) => (
                <motion.div
                  key={research.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className={currentTheme.styles.card}>
                    <CardHeader>
                      <CardTitle className={currentTheme.colors.primary}>
                        <Link href={research.url} target="_blank" className="hover:underline">
                          {research.title}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        {research.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {new Date(research.publishedAt).toLocaleDateString()}
                        </span>
                        <Link href={research.url} target="_blank">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Read More
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}