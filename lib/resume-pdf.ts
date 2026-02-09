type SocialLinks = {
  github?: string
  linkedin?: string
  twitter?: string
  website?: string
}

type Project = {
  title?: string
  description?: string
  technologies?: string[]
  githubUrl?: string
  liveUrl?: string
}

type Experience = {
  company?: string
  position?: string
  startDate?: string
  endDate?: string | null
  isCurrentlyWorking?: boolean
  description?: string
  technologies?: string[]
}

type Certification = {
  name?: string
  issuer?: string
  date?: string
  credentialUrl?: string
}

type Research = {
  title?: string
  description?: string
  url?: string
  publishedAt?: string
}

export type ResumeProfileInput = {
  username: string
  name: string
  bio?: string
  skills?: string[]
  socialLinks?: SocialLinks
  projects?: Project[]
  experiences?: Experience[]
  certifications?: Certification[]
  researches?: Research[]
}

type FontVariant = 'regular' | 'bold'

type TextBlock = {
  text: string
  size?: number
  font?: FontVariant
  indent?: number
  spacingBefore?: number
  spacingAfter?: number
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function safePdfText(value: string): string {
  const asciiOnly = value.replace(/[^\x20-\x7E]/g, '?')
  return asciiOnly
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function formatDateRange(startDate?: string, endDate?: string | null, isCurrent?: boolean): string {
  const start = nonEmpty(startDate) ? normalizeText(startDate) : ''
  if (!start) return ''
  if (isCurrent) return `${start} - Present`

  const end = nonEmpty(endDate) ? normalizeText(endDate) : ''
  return end ? `${start} - ${end}` : start
}

function wrapLine(text: string, maxChars: number): string[] {
  const normalized = normalizeText(text)
  if (!normalized) return []
  if (normalized.length <= maxChars) return [normalized]

  const words = normalized.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxChars) {
      current = candidate
      continue
    }

    if (current) {
      lines.push(current)
      current = word
      continue
    }

    // Handle very long single tokens.
    lines.push(word.slice(0, maxChars))
    current = word.slice(maxChars)
  }

  if (current) lines.push(current)
  return lines
}

function addSectionHeading(blocks: TextBlock[], heading: string) {
  blocks.push({
    text: heading.toUpperCase(),
    font: 'bold',
    size: 12,
    spacingBefore: 8,
    spacingAfter: 3,
  })
}

function buildResumeBlocks(profile: ResumeProfileInput, profileUrl: string): TextBlock[] {
  const blocks: TextBlock[] = []

  const displayName = nonEmpty(profile.name) ? normalizeText(profile.name) : normalizeText(profile.username)
  const displayUsername = normalizeText(profile.username)

  blocks.push({ text: displayName, size: 24, font: 'bold', spacingAfter: 2 })
  blocks.push({ text: `@${displayUsername}`, size: 12, spacingAfter: 8 })
  blocks.push({ text: `Portfolio: ${profileUrl}`, size: 10, spacingAfter: 2 })

  const socialLines: string[] = []
  if (nonEmpty(profile.socialLinks?.github)) socialLines.push(`GitHub: ${normalizeText(profile.socialLinks!.github!)}`)
  if (nonEmpty(profile.socialLinks?.linkedin)) socialLines.push(`LinkedIn: ${normalizeText(profile.socialLinks!.linkedin!)}`)
  if (nonEmpty(profile.socialLinks?.twitter)) socialLines.push(`Twitter: ${normalizeText(profile.socialLinks!.twitter!)}`)
  if (nonEmpty(profile.socialLinks?.website)) socialLines.push(`Website: ${normalizeText(profile.socialLinks!.website!)}`)
  if (socialLines.length > 0) {
    for (const line of socialLines) {
      blocks.push({ text: line, size: 10 })
    }
  }

  if (nonEmpty(profile.bio)) {
    addSectionHeading(blocks, 'Summary')
    blocks.push({ text: normalizeText(profile.bio!), size: 10, spacingAfter: 2 })
  }

  const skills = Array.isArray(profile.skills)
    ? profile.skills.filter((skill): skill is string => nonEmpty(skill)).map((skill) => normalizeText(skill))
    : []
  if (skills.length > 0) {
    addSectionHeading(blocks, 'Skills')
    blocks.push({ text: skills.join(' | '), size: 10, spacingAfter: 2 })
  }

  const experiences = Array.isArray(profile.experiences) ? profile.experiences : []
  if (experiences.length > 0) {
    addSectionHeading(blocks, 'Experience')
    for (const experience of experiences.slice(0, 8)) {
      const headingParts = []
      if (nonEmpty(experience.position)) headingParts.push(normalizeText(experience.position))
      if (nonEmpty(experience.company)) headingParts.push(normalizeText(experience.company))
      const heading = headingParts.join(' - ')
      if (heading) {
        blocks.push({ text: heading, font: 'bold', size: 10, spacingBefore: 2 })
      }

      const duration = formatDateRange(experience.startDate, experience.endDate, experience.isCurrentlyWorking)
      if (duration) blocks.push({ text: duration, size: 9 })

      if (nonEmpty(experience.description)) {
        blocks.push({
          text: `- ${normalizeText(experience.description!)}`,
          size: 9,
          indent: 12,
        })
      }

      const technologies = Array.isArray(experience.technologies)
        ? experience.technologies.filter((item): item is string => nonEmpty(item)).map((item) => normalizeText(item))
        : []
      if (technologies.length > 0) {
        blocks.push({
          text: `Tech: ${technologies.join(', ')}`,
          size: 9,
          indent: 12,
        })
      }
    }
  }

  const projects = Array.isArray(profile.projects) ? profile.projects : []
  if (projects.length > 0) {
    addSectionHeading(blocks, 'Projects')
    for (const project of projects.slice(0, 8)) {
      const title = nonEmpty(project.title) ? normalizeText(project.title) : 'Project'
      blocks.push({ text: title, font: 'bold', size: 10, spacingBefore: 2 })

      if (nonEmpty(project.description)) {
        blocks.push({
          text: `- ${normalizeText(project.description!)}`,
          size: 9,
          indent: 12,
        })
      }

      const stack = Array.isArray(project.technologies)
        ? project.technologies.filter((item): item is string => nonEmpty(item)).map((item) => normalizeText(item))
        : []
      if (stack.length > 0) {
        blocks.push({ text: `Tech: ${stack.join(', ')}`, size: 9, indent: 12 })
      }

      const links: string[] = []
      if (nonEmpty(project.githubUrl)) links.push(`GitHub: ${normalizeText(project.githubUrl!)}`)
      if (nonEmpty(project.liveUrl)) links.push(`Live: ${normalizeText(project.liveUrl!)}`)
      for (const line of links) {
        blocks.push({ text: line, size: 9, indent: 12 })
      }
    }
  }

  const certifications = Array.isArray(profile.certifications) ? profile.certifications : []
  if (certifications.length > 0) {
    addSectionHeading(blocks, 'Certifications')
    for (const certification of certifications.slice(0, 8)) {
      const lineParts = []
      if (nonEmpty(certification.name)) lineParts.push(normalizeText(certification.name))
      if (nonEmpty(certification.issuer)) lineParts.push(normalizeText(certification.issuer))
      if (nonEmpty(certification.date)) lineParts.push(normalizeText(certification.date))
      const line = lineParts.join(' - ')
      if (line) blocks.push({ text: line, size: 9, indent: 8 })

      if (nonEmpty(certification.credentialUrl)) {
        blocks.push({ text: normalizeText(certification.credentialUrl!), size: 8, indent: 12 })
      }
    }
  }

  const researches = Array.isArray(profile.researches) ? profile.researches : []
  if (researches.length > 0) {
    addSectionHeading(blocks, 'Research')
    for (const research of researches.slice(0, 8)) {
      const title = nonEmpty(research.title) ? normalizeText(research.title) : 'Research'
      blocks.push({ text: title, font: 'bold', size: 10, spacingBefore: 2 })

      if (nonEmpty(research.description)) {
        blocks.push({
          text: `- ${normalizeText(research.description!)}`,
          size: 9,
          indent: 12,
        })
      }

      const publishedAt = nonEmpty(research.publishedAt) ? normalizeText(research.publishedAt) : ''
      if (publishedAt) blocks.push({ text: `Published: ${publishedAt}`, size: 9, indent: 12 })
      if (nonEmpty(research.url)) blocks.push({ text: normalizeText(research.url!), size: 8, indent: 12 })
    }
  }

  blocks.push({
    text: `Generated by DevLink on ${new Date().toISOString().slice(0, 10)}`,
    size: 8,
    spacingBefore: 10,
  })

  return blocks
}

function blocksToPages(blocks: TextBlock[]): string[] {
  const pageWidth = 612
  const pageHeight = 792
  const leftMargin = 48
  const rightMargin = 48
  const usableWidth = pageWidth - leftMargin - rightMargin
  const bottomMargin = 48

  const pages: string[] = []
  let commands: string[] = []
  let y = pageHeight - 48

  const pushPage = () => {
    pages.push(commands.join('\n'))
    commands = []
    y = pageHeight - 48
  }

  for (const block of blocks) {
    const fontSize = block.size ?? 10
    const font = block.font ?? 'regular'
    const fontAlias = font === 'bold' ? 'F2' : 'F1'
    const indent = block.indent ?? 0
    const maxChars = Math.max(20, Math.floor((usableWidth - indent) / (fontSize * 0.52)))
    const wrappedLines = wrapLine(block.text, maxChars)

    if ((block.spacingBefore ?? 0) > 0) {
      y -= block.spacingBefore!
    }

    if (wrappedLines.length === 0) {
      y -= fontSize + 2
      if (y < bottomMargin) {
        pushPage()
      }
      continue
    }

    for (const line of wrappedLines) {
      if (y < bottomMargin) {
        pushPage()
      }

      const safeLine = safePdfText(line)
      const x = leftMargin + indent
      commands.push(`BT /${fontAlias} ${fontSize} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${safeLine}) Tj ET`)
      y -= fontSize + 4
    }

    if ((block.spacingAfter ?? 0) > 0) {
      y -= block.spacingAfter!
    }
  }

  if (commands.length > 0) {
    pages.push(commands.join('\n'))
  }

  if (pages.length === 0) {
    pages.push('BT /F1 12 Tf 48 744 Td (Resume is empty.) Tj ET')
  }

  return pages
}

function buildPdfDocument(pageStreams: string[]): Buffer {
  const objects: string[] = []
  const pageCount = pageStreams.length

  const firstPageObjectNumber = 3
  const firstContentObjectNumber = firstPageObjectNumber + pageCount
  const fontRegularObjectNumber = firstContentObjectNumber + pageCount
  const fontBoldObjectNumber = fontRegularObjectNumber + 1
  const totalObjects = fontBoldObjectNumber

  const pageReferences: string[] = []
  for (let i = 0; i < pageCount; i += 1) {
    const pageObjectNumber = firstPageObjectNumber + i
    pageReferences.push(`${pageObjectNumber} 0 R`)
  }

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = `<< /Type /Pages /Count ${pageCount} /Kids [ ${pageReferences.join(' ')} ] >>`

  for (let i = 0; i < pageCount; i += 1) {
    const pageObjectNumber = firstPageObjectNumber + i
    const contentObjectNumber = firstContentObjectNumber + i
    objects[pageObjectNumber] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
      `/Resources << /Font << /F1 ${fontRegularObjectNumber} 0 R /F2 ${fontBoldObjectNumber} 0 R >> >> ` +
      `/Contents ${contentObjectNumber} 0 R >>`

    const stream = pageStreams[i]
    const streamLength = Buffer.byteLength(stream, 'utf8')
    objects[contentObjectNumber] =
      `<< /Length ${streamLength} >>\nstream\n${stream}\nendstream`
  }

  objects[fontRegularObjectNumber] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  objects[fontBoldObjectNumber] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
  const offsets: number[] = [0]

  for (let objectNumber = 1; objectNumber <= totalObjects; objectNumber += 1) {
    const body = objects[objectNumber] || '<< >>'
    offsets[objectNumber] = Buffer.byteLength(pdf, 'utf8')
    pdf += `${objectNumber} 0 obj\n${body}\nendobj\n`
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${totalObjects + 1}\n`
  pdf += '0000000000 65535 f \n'

  for (let objectNumber = 1; objectNumber <= totalObjects; objectNumber += 1) {
    pdf += `${String(offsets[objectNumber]).padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\n`
  pdf += `startxref\n${xrefOffset}\n%%EOF`

  return Buffer.from(pdf, 'utf8')
}

export function generateResumePdf(profile: ResumeProfileInput, profileUrl: string): Buffer {
  const blocks = buildResumeBlocks(profile, profileUrl)
  const pages = blocksToPages(blocks)
  return buildPdfDocument(pages)
}
