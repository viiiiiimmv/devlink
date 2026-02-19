'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Profile } from '@/components/public-profile/profile'
import { ArrowDown, ArrowUp, Eye, EyeOff, Globe2, GripVertical, LayoutGrid, Palette, Save } from 'lucide-react'
import PortfolioLivePreview from '@/components/PortfolioLivePreview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import toast from 'react-hot-toast'
import {
  DEFAULT_SECTION_SETTINGS,
  DEFAULT_PROFILE_TEMPLATE,
  DEFAULT_PROFILE_THEME,
  isValidTemplate,
  isValidTheme,
  normalizeSectionSettings,
  sectionOptions,
  templateOptions,
  type ProfileSectionId,
  type ProfileSectionSetting,
  themeOptions,
} from '@/lib/profile-customization'
import { themes } from '@/lib/themes'

type CustomThemeSettings = {
  enabled: boolean
  primary: string
  secondary: string
}

const DEFAULT_CUSTOM_THEME: CustomThemeSettings = {
  enabled: false,
  primary: '#2563eb',
  secondary: '#14b8a6',
}

const DESKTOP_PREVIEW_WIDTH = 1280

const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#([0-9a-fA-F]{6})$/.test(value.trim())

const normalizeCustomTheme = (value: unknown): CustomThemeSettings => {
  const source = typeof value === 'object' && value !== null
    ? value as Record<string, unknown>
    : {}

  return {
    enabled: Boolean(source.enabled),
    primary: isHexColor(source.primary) ? source.primary.trim() : DEFAULT_CUSTOM_THEME.primary,
    secondary: isHexColor(source.secondary) ? source.secondary.trim() : DEFAULT_CUSTOM_THEME.secondary,
  }
}

const areCustomThemesEqual = (left: unknown, right: unknown) => {
  const normalizedLeft = normalizeCustomTheme(left)
  const normalizedRight = normalizeCustomTheme(right)
  return (
    normalizedLeft.enabled === normalizedRight.enabled &&
    normalizedLeft.primary === normalizedRight.primary &&
    normalizedLeft.secondary === normalizedRight.secondary
  )
}

const areSectionSettingsEqual = (
  currentSettings: unknown,
  originalSettings: unknown
) => {
  const normalizedCurrent = normalizeSectionSettings(currentSettings)
  const normalizedOriginal = normalizeSectionSettings(originalSettings)

  if (normalizedCurrent.length !== normalizedOriginal.length) {
    return false
  }

  return normalizedCurrent.every(
    (setting, index) =>
      setting.id === normalizedOriginal[index].id &&
      setting.visible === normalizedOriginal[index].visible
  )
}

export default function CustomisePage() {
  const previewContainerRef = useRef<HTMLDivElement | null>(null)
  const previewContentRef = useRef<HTMLDivElement | null>(null)
  const [previewScale, setPreviewScale] = useState(1)
  const [previewHeight, setPreviewHeight] = useState(0)
  const [selectedTheme, setSelectedTheme] = useState(DEFAULT_PROFILE_THEME)
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_PROFILE_TEMPLATE)
  const [isPublished, setIsPublished] = useState(true)
  const [customTheme, setCustomTheme] = useState<CustomThemeSettings>(DEFAULT_CUSTOM_THEME)
  const [sectionSettings, setSectionSettings] = useState<ProfileSectionSetting[]>(DEFAULT_SECTION_SETTINGS)
  const [profileData, setProfileData] = useState<Profile | null>(null)
  const [draggedSectionId, setDraggedSectionId] = useState<ProfileSectionId | null>(null)
  const [dragOverSectionId, setDragOverSectionId] = useState<ProfileSectionId | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCustomisation()
  }, [])

  useEffect(() => {
    const container = previewContainerRef.current
    const content = previewContentRef.current

    if (!container || !content || typeof ResizeObserver === 'undefined') {
      return
    }

    const updateScale = () => {
      const containerWidth = container.clientWidth
      if (!containerWidth) return

      const nextScale = Math.min(1, containerWidth / DESKTOP_PREVIEW_WIDTH)
      setPreviewScale(nextScale)

      const contentHeight = content.scrollHeight
      setPreviewHeight(Math.ceil(contentHeight * nextScale))
    }

    updateScale()

    const resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(container)
    resizeObserver.observe(content)

    return () => resizeObserver.disconnect()
  }, [])

  const fetchCustomisation = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        const nextTheme = isValidTheme(data.theme) ? data.theme : DEFAULT_PROFILE_THEME
        const nextTemplate = isValidTemplate(data.template) ? data.template : DEFAULT_PROFILE_TEMPLATE
        const nextIsPublished = data.isPublished !== false
        const nextCustomTheme = normalizeCustomTheme(data.customTheme)
        const nextSectionSettings = normalizeSectionSettings(data.sectionSettings)

        setSelectedTheme(nextTheme)
        setSelectedTemplate(nextTemplate)
        setIsPublished(nextIsPublished)
        setCustomTheme(nextCustomTheme)
        setSectionSettings(nextSectionSettings)
        setProfileData({
          ...data,
          theme: nextTheme,
          template: nextTemplate,
          isPublished: nextIsPublished,
          customTheme: nextCustomTheme,
          sectionSettings: nextSectionSettings,
        })
      }
    } catch (error) {
      console.error('Error fetching customisation settings:', error)
      toast.error('Failed to load customisation settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCustomisation = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: selectedTheme,
          template: selectedTemplate,
          isPublished,
          customTheme,
          sectionSettings,
        }),
      })

      if (!response.ok) {
        toast.error('Failed to update customisation')
        return
      }

      const updatedProfile = await response.json()
      setProfileData((prev) => ({
        ...(prev ?? updatedProfile),
        ...updatedProfile,
        theme: selectedTheme,
        template: selectedTemplate,
        isPublished,
        customTheme,
        sectionSettings,
      }))
      toast.success('Customisation updated successfully!')
    } catch (error) {
      console.error('Error updating customisation:', error)
      toast.error('Failed to update customisation')
    } finally {
      setSaving(false)
    }
  }

  const emptyProfile = useMemo<Profile>(
    () => ({
      username: '',
      name: '',
      bio: '',
      skills: [],
      profileImage: '',
      profilePhoto: {},
      socialLinks: {},
      theme: selectedTheme,
      template: selectedTemplate,
      isPublished,
      customTheme,
      sectionSettings,
      projects: [],
      experiences: [],
      certifications: [],
      researches: [],
      testimonials: [],
    }),
    [customTheme, isPublished, sectionSettings, selectedTheme, selectedTemplate]
  )

  const hasChanges =
    selectedTheme !== (profileData?.theme || DEFAULT_PROFILE_THEME) ||
    selectedTemplate !== (profileData?.template || DEFAULT_PROFILE_TEMPLATE) ||
    isPublished !== (profileData?.isPublished !== false) ||
    !areCustomThemesEqual(customTheme, profileData?.customTheme) ||
    !areSectionSettingsEqual(sectionSettings, profileData?.sectionSettings)

  const sectionOptionMap = useMemo(
    () =>
      sectionOptions.reduce((acc, option) => {
        acc[option.id] = option
        return acc
      }, {} as Record<ProfileSectionId, (typeof sectionOptions)[number]>),
    []
  )

  const moveSection = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= sectionSettings.length || fromIndex === toIndex) {
      return
    }

    setSectionSettings((current) => {
      const updated = [...current]
      const [movedSection] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, movedSection)
      return updated
    })
  }

  const toggleSectionVisibility = (sectionId: ProfileSectionId) => {
    setSectionSettings((current) =>
      current.map((setting) =>
        setting.id === sectionId ? { ...setting, visible: !setting.visible } : setting
      )
    )
  }

  const handleSectionDrop = (targetSectionId: ProfileSectionId) => {
    if (!draggedSectionId || draggedSectionId === targetSectionId) {
      setDragOverSectionId(null)
      return
    }

    const fromIndex = sectionSettings.findIndex((setting) => setting.id === draggedSectionId)
    const toIndex = sectionSettings.findIndex((setting) => setting.id === targetSectionId)

    if (fromIndex === -1 || toIndex === -1) {
      setDragOverSectionId(null)
      return
    }

    moveSection(fromIndex, toIndex)
    setDragOverSectionId(null)
    setDraggedSectionId(null)
  }

  const lightThemes = useMemo(
    () => themeOptions.filter((theme) => theme.tone === 'light'),
    []
  )

  const darkThemes = useMemo(
    () => themeOptions.filter((theme) => theme.tone === 'dark'),
    []
  )
  const selectedThemePalette = useMemo(
    () => themes[selectedTheme as keyof typeof themes] || themes.modern,
    [selectedTheme]
  )

  const renderTemplatePreview = (templateId: string) => {
    const palettes: Record<string, { from: string; to: string; card: string; accent: string }> = {
      editorial: { from: '#111827', to: '#374151', card: 'rgba(255,255,255,0.2)', accent: '#fbbf24' },
      bento: { from: '#0f172a', to: '#1d4ed8', card: 'rgba(255,255,255,0.18)', accent: '#22d3ee' },
      terminal: { from: '#020617', to: '#052e16', card: 'rgba(34,197,94,0.15)', accent: '#4ade80' },
      glass: { from: '#312e81', to: '#0ea5e9', card: 'rgba(255,255,255,0.24)', accent: '#e0f2fe' },
    }
    const palette = palettes[templateId] || palettes.editorial

    if (templateId === 'editorial') {
      return (
        <div
          className="w-full h-full rounded-lg p-2 flex gap-2"
          style={{ backgroundImage: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
        >
          <div className="w-2/5 rounded-md" style={{ backgroundColor: palette.card }} />
          <div className="flex-1 space-y-1">
            <div className="h-2 rounded" style={{ backgroundColor: palette.accent }} />
            <div className="h-2 rounded bg-white/45" />
            <div className="h-2 rounded bg-white/30 w-3/4" />
          </div>
        </div>
      )
    }

    if (templateId === 'bento') {
      return (
        <div
          className="w-full h-full rounded-lg p-2 grid grid-cols-4 grid-rows-3 gap-1"
          style={{ backgroundImage: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
        >
          <div className="col-span-2 row-span-2 rounded" style={{ backgroundColor: palette.card }} />
          <div className="col-span-2 rounded" style={{ backgroundColor: palette.accent }} />
          <div className="rounded" style={{ backgroundColor: 'rgba(255,255,255,0.45)' }} />
          <div className="rounded" style={{ backgroundColor: palette.card }} />
          <div className="col-span-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }} />
        </div>
      )
    }

    if (templateId === 'terminal') {
      return (
        <div
          className="w-full h-full rounded-lg p-2 border border-emerald-500/30"
          style={{ backgroundImage: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
        >
          <div className="space-y-1 text-[9px] font-mono">
            <div className="text-emerald-300">$ whoami</div>
            <div className="h-1.5 rounded bg-emerald-400/70 w-2/3" />
            <div className="text-emerald-300">$ ls projects</div>
            <div className="h-1.5 rounded bg-emerald-400/40 w-4/5" />
            <div className="h-1.5 rounded bg-emerald-400/30 w-1/2" />
          </div>
        </div>
      )
    }

    return (
      <div
        className="w-full h-full rounded-lg p-2 relative overflow-hidden"
        style={{ backgroundImage: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
      >
        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/20 blur-sm" />
        <div className="absolute bottom-1 left-1 right-1 h-7 rounded-md border border-white/35 backdrop-blur-md" style={{ backgroundColor: palette.card }} />
        <div className="absolute top-2 left-2 w-7 h-1.5 rounded" style={{ backgroundColor: palette.accent }} />
      </div>
    )
  }

  const renderThemePreview = (themeId: string) => {
    const themePalette = themes[themeId as keyof typeof themes] || themes.modern
    return (
      <div
        className="w-full h-16 rounded-lg mb-2 transition-all duration-150 overflow-hidden border border-black/10 dark:border-white/10 relative"
        style={{ backgroundImage: `linear-gradient(135deg, ${themePalette.primary}, ${themePalette.secondary})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.5),transparent_55%)]" />
        <div className="absolute bottom-2 left-2 right-2 flex gap-1">
          <div className="h-1.5 flex-1 rounded bg-white/70" />
          <div className="h-1.5 w-5 rounded bg-black/30" />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      
    )
  }

  return (
    
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Customise</h1>
            <p className="text-muted-foreground">
              Choose your profile template and theme, then preview changes live
            </p>
          </div>
          <Button
            onClick={handleSaveCustomisation}
            disabled={saving || !hasChanges}
            className="w-full md:w-auto flex items-center gap-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Customisation
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutGrid className="h-6 w-6 text-blue-600" />
                  Profile Templates
                </CardTitle>
                <CardDescription>
                  Select a design language for your public profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedTemplate}
                  onValueChange={(value) => {
                    if (isValidTemplate(value)) {
                      setSelectedTemplate(value)
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {templateOptions.map((template) => (
                    <label
                      key={template.id}
                      htmlFor={`template-${template.id}`}
                      className={`cursor-pointer group rounded-xl border-2 p-4 transition-all duration-150 ${
                        selectedTemplate === template.id
                          ? 'border-blue-500 shadow-lg'
                          : 'border-border hover:border-blue-300'
                      }`}
                    >
                      <div className="w-full h-20 rounded-lg mb-3">
                        {renderTemplatePreview(template.id)}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-blue-600">
                            {template.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{template.vibe}</p>
                        </div>
                        <RadioGroupItem value={template.id} id={`template-${template.id}`} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{template.description}</p>
                    </label>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GripVertical className="h-6 w-6 text-blue-600" />
                  Section Layout
                </CardTitle>
                <CardDescription>
                  Drag to reorder profile sections and hide the blocks you do not want to display
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sectionSettings.map((section, index) => {
                    const option = sectionOptionMap[section.id]

                    return (
                      <div
                        key={section.id}
                        draggable
                        onDragStart={() => setDraggedSectionId(section.id)}
                        onDragEnd={() => {
                          setDraggedSectionId(null)
                          setDragOverSectionId(null)
                        }}
                        onDragOver={(event) => {
                          event.preventDefault()
                          if (dragOverSectionId !== section.id) {
                            setDragOverSectionId(section.id)
                          }
                        }}
                        onDrop={(event) => {
                          event.preventDefault()
                          handleSectionDrop(section.id)
                        }}
                        className={`rounded-xl border p-3 md:p-4 transition-all ${
                          dragOverSectionId === section.id
                            ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/20'
                            : 'border-border bg-card'
                        }`}
                      >
                        <div className="flex items-start md:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 text-muted-foreground cursor-grab active:cursor-grabbing">
                              <GripVertical className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{option?.name ?? section.id}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {option?.description ?? 'Profile section'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => moveSection(index, index - 1)}
                              disabled={index === 0}
                              aria-label={`Move ${option?.name ?? section.id} up`}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => moveSection(index, index + 1)}
                              disabled={index === sectionSettings.length - 1}
                              aria-label={`Move ${option?.name ?? section.id} down`}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant={section.visible ? 'outline' : 'secondary'}
                              size="sm"
                              className="h-8"
                              onClick={() => toggleSectionVisibility(section.id)}
                            >
                              {section.visible ? (
                                <>
                                  <Eye className="h-4 w-4 mr-1.5" />
                                  Visible
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-4 w-4 mr-1.5" />
                                  Hidden
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  Hidden sections are removed from both preview and your public profile.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-6 w-6 text-blue-600" />
                  Theme Palette
                </CardTitle>
                <CardDescription>
                  20 redesigned themes grouped by light and dark, and usable with every template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedTheme}
                  onValueChange={(value) => {
                    if (isValidTheme(value)) {
                      setSelectedTheme(value)
                    }
                  }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">Light Themes</h3>
                      <span className="text-xs text-muted-foreground">10 options</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {lightThemes.map((theme) => (
                        <label
                          key={theme.id}
                          htmlFor={`theme-${theme.id}`}
                          className={`cursor-pointer group block rounded-lg border-2 p-3 transition-all duration-150 ${
                            selectedTheme === theme.id
                              ? 'border-blue-500 shadow-lg'
                              : 'border-border hover:border-blue-300'
                          }`}
                        >
                          {renderThemePreview(theme.id)}
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground group-hover:text-blue-600">
                              {theme.name}
                            </span>
                            <RadioGroupItem value={theme.id} id={`theme-${theme.id}`} className="ml-2" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">Dark Themes</h3>
                      <span className="text-xs text-muted-foreground">10 options</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {darkThemes.map((theme) => (
                        <label
                          key={theme.id}
                          htmlFor={`theme-${theme.id}`}
                          className={`cursor-pointer group block rounded-lg border-2 p-3 transition-all duration-150 ${
                            selectedTheme === theme.id
                              ? 'border-blue-500 shadow-lg'
                              : 'border-border hover:border-blue-300'
                          }`}
                        >
                          {renderThemePreview(theme.id)}
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground group-hover:text-blue-600">
                              {theme.name}
                            </span>
                            <RadioGroupItem value={theme.id} id={`theme-${theme.id}`} className="ml-2" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>
                        </label>
                      ))}
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-6 w-6 text-blue-600" />
                  Custom Theme Editor
                </CardTitle>
                <CardDescription>
                  Override the selected theme with your own primary and secondary colors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">Enable custom colors</p>
                    <p className="text-xs text-muted-foreground">
                      Keep your current template and only swap accent colors.
                    </p>
                  </div>
                  <Switch
                    checked={customTheme.enabled}
                    onCheckedChange={(checked) => {
                      setCustomTheme((current) => {
                        if (!checked) {
                          return { ...current, enabled: false }
                        }

                        const isDefaultPalette =
                          current.primary === DEFAULT_CUSTOM_THEME.primary &&
                          current.secondary === DEFAULT_CUSTOM_THEME.secondary

                        if (isDefaultPalette) {
                          return {
                            enabled: true,
                            primary: selectedThemePalette.primary,
                            secondary: selectedThemePalette.secondary,
                          }
                        }

                        return { ...current, enabled: true }
                      })
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="custom-primary">Primary color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="custom-primary"
                        type="color"
                        value={customTheme.primary}
                        onChange={(event) => {
                          const nextColor = event.target.value
                          setCustomTheme((current) => ({ ...current, primary: nextColor }))
                        }}
                        className="h-10 w-16 cursor-pointer p-1"
                      />
                      <Input
                        value={customTheme.primary}
                        readOnly
                        className="font-mono uppercase"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-secondary">Secondary color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="custom-secondary"
                        type="color"
                        value={customTheme.secondary}
                        onChange={(event) => {
                          const nextColor = event.target.value
                          setCustomTheme((current) => ({ ...current, secondary: nextColor }))
                        }}
                        className="h-10 w-16 cursor-pointer p-1"
                      />
                      <Input
                        value={customTheme.secondary}
                        readOnly
                        className="font-mono uppercase"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-2">Color Preview</p>
                  <div
                    className="h-20 rounded-lg border border-border"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${
                        customTheme.enabled ? customTheme.primary : selectedThemePalette.primary
                      }, ${customTheme.enabled ? customTheme.secondary : selectedThemePalette.secondary})`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe2 className="h-6 w-6 text-blue-600" />
                  Publish Controls
                </CardTitle>
                <CardDescription>
                  Control whether your public portfolio is visible to everyone
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      {isPublished ? 'Portfolio is published' : 'Portfolio is in draft mode'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isPublished
                        ? 'Visitors can open your public profile URL.'
                        : 'Only you can preview your profile while editing.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold uppercase tracking-[0.14em] ${isPublished ? 'text-green-600' : 'text-amber-600'}`}>
                      {isPublished ? 'Live' : 'Draft'}
                    </span>
                    <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="self-start lg:sticky lg:top-6">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>
                  Preview your selected template and theme in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  ref={previewContainerRef}
                  className="w-full h-[70vh] overflow-auto bg-muted/40 rounded-lg border border-border"
                >
                  <div className="relative w-full" style={{ height: previewHeight || '70vh' }}>
                    <div
                      ref={previewContentRef}
                      className="absolute top-0 left-0"
                      style={{
                        width: DESKTOP_PREVIEW_WIDTH,
                        transform: `scale(${previewScale})`,
                        transformOrigin: 'top left',
                      }}
                    >
                      <PortfolioLivePreview
                        key={`${selectedTemplate}-${selectedTheme}-${isPublished ? 'published' : 'draft'}-${customTheme.enabled ? `${customTheme.primary}-${customTheme.secondary}` : 'preset'}-${sectionSettings
                          .map((section) => `${section.id}:${section.visible ? 1 : 0}`)
                          .join('|')}`}
                        profile={{
                          ...(profileData ?? emptyProfile),
                          isPublished,
                          customTheme,
                          sectionSettings,
                        }}
                        themeId={selectedTheme}
                        templateId={selectedTemplate}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    
  )
}
