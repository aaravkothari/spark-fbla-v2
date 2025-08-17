"use client"

import * as React from "react"
import { useCallback, useRef, useState } from "react"
import { v4 as uuid } from "uuid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { UploadCloud, FileText, X, Check, AlertTriangle, Eye, Trash2 } from "lucide-react"

type FileStatus = "queued" | "uploading" | "done" | "error" | "canceled"

type Item = {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: FileStatus
  progress: number
  previewURL: string
  error?: string
}

const MAX_FILES = 10
const MAX_SIZE_BYTES = 25 * 1024 * 1024 // 25MB

export function PdfUploader() {
  const [items, setItems] = useState<Item[]>([])
  const [isDragging, setDragging] = useState(false)
  const [openPreview, setOpenPreview] = useState<null | Item>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const next: Item[] = []
    for (const file of Array.from(files)) {
      const id = uuid()
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
      const tooBig = file.size > MAX_SIZE_BYTES

      const base: Item = {
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type || "application/pdf",
        status: "queued",
        progress: 0,
        previewURL: URL.createObjectURL(file),
      }

      if (!isPdf) {
        base.status = "error"
        base.error = "Only PDF files are allowed."
      } else if (tooBig) {
        base.status = "error"
        base.error = `Max size is ${Math.round(MAX_SIZE_BYTES / (1024 * 1024))}MB.`
      }

      next.push(base)
    }

    setItems(prev => [...prev, ...next].slice(0, MAX_FILES))
  }, [])

  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    onFiles(e.dataTransfer.files)
  }, [onFiles])

  const handleBrowse = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const humanSize = (n: number) => {
    if (n < 1024) return `${n} B`
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
    return `${(n / (1024 * 1024)).toFixed(1)} MB`
  }

  const fakeUpload = useCallback((id: string) => {
    setItems(prev => prev.map(it =>
      it.id === id
        ? { ...it, status: "error", error: "Coming soon..." }
        : it
    ))
  }, [])

  const fakeUploadAll = useCallback(() => {
    setItems(prev => prev.map(it =>
      it.status === "queued"
        ? { ...it, status: "error", error: "Coming soon..." }
        : it
    ))
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const it = prev.find(x => x.id === id)
      if (it?.previewURL) URL.revokeObjectURL(it.previewURL)
      return prev.filter(x => x.id !== id)
    })
  }, [])

  const clearAll = useCallback(() => {
    setItems(prev => {
      prev.forEach(p => p.previewURL && URL.revokeObjectURL(p.previewURL))
      return []
    })
  }, [])

  const hasQueued = items.some(i => i.status === "queued")
  const hasItems = items.length > 0

  return (
    <>
      <Card className="border-dashed shadow-sm">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-6 w-6" />
            <CardTitle className="text-xl">Upload Chapter PDFs</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Drag & drop your PDFs here or browse to select up to {MAX_FILES} files (max {Math.round(MAX_SIZE_BYTES / (1024 * 1024))}MB each).
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Drop Area */}
          <Label
            onDragEnter={(e) => { e.preventDefault(); setDragging(true) }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={(e) => { e.preventDefault(); setDragging(false) }}
            onDrop={onDrop}
            htmlFor="pdf-input"
            className={cn(
              "flex h-40 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center transition",
              isDragging ? "border-primary bg-primary/5" : "hover:bg-muted/50"
            )}
          >
            <div className="flex flex-col items-center gap-2">
              <UploadCloud className="h-8 w-8" />
              <div className="text-sm">
                <span className="font-medium">Drop PDFs</span> here or{" "}
                <button
                  type="button"
                  className="underline underline-offset-2"
                  onClick={handleBrowse}
                >
                  browse
                </button>
              </div>
              <div className="text-xs text-muted-foreground">Only .pdf files are accepted</div>
            </div>
            <Input
              ref={inputRef}
              id="pdf-input"
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
          </Label>

          {/* List */}
          {hasItems && (
            <ScrollArea className="max-h-[360px] rounded-md border">
              <div className="divide-y">
                {items.map((it) => (
                  <div key={it.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-3 sm:w-1/2">
                      <div className="grid h-10 w-10 place-items-center rounded-md bg-muted">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{it.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {humanSize(it.size)}
                        </div>
                      </div>
                      <div className="ml-2">
                        {it.status === "error" && <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />{it.error}</Badge>}
                        {it.status === "queued" && <Badge variant="outline">Ready</Badge>}
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 sm:ml-auto">
                      <Progress value={it.progress} className="h-2" />
                      {it.error && <p className="text-xs text-destructive">{it.error}</p>}
                    </div>

                    <div className="flex items-center gap-2 sm:w-[220px] sm:justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setOpenPreview(it)}
                      >
                        <Eye className="mr-1 h-4 w-4" /> Preview
                      </Button>

                      {it.status === "queued" && (
                        <Button size="sm" onClick={() => fakeUpload(it.id)}>
                          Upload
                        </Button>
                      )}

                      {(it.status === "error" || it.status === "canceled") && (
                        <Button variant="ghost" size="icon" onClick={() => removeItem(it.id)} aria-label="Remove">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            Tip: You can select multiple PDFs at once.
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={clearAll} disabled={!hasItems}>
              Clear
            </Button>
            <Button onClick={fakeUploadAll} disabled={!hasQueued}>
              Upload all
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!openPreview} onOpenChange={(o) => !o && setOpenPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="truncate">{openPreview?.name ?? "Preview"}</DialogTitle>
          </DialogHeader>
          <div className="h-[70vh]">
            {openPreview?.previewURL ? (
              <iframe
                src={openPreview.previewURL}
                className="h-full w-full rounded-md border"
                title="PDF preview"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                No preview
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
