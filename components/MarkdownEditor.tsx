'use client'

import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MarkdownContent from '@/components/MarkdownContent'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  previewClassName?: string
  maxLength?: number
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 5,
  previewClassName,
  maxLength,
}: MarkdownEditorProps) {
  return (
    <Tabs defaultValue="write" className="w-full">
      <TabsList className="mb-3">
        <TabsTrigger value="write">Write</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="write" className="m-0">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
        />
      </TabsContent>
      <TabsContent value="preview" className="m-0 rounded-md border border-border bg-muted/40 p-3">
        {value.trim().length > 0 ? (
          <MarkdownContent content={value} className={previewClassName} />
        ) : (
          <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
        )}
      </TabsContent>
    </Tabs>
  )
}
