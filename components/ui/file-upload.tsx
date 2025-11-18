"use client"

import { useRef, useState, useCallback } from "react"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  accept?: string
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  selectedFile?: File | null
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function FileUpload({
  accept = ".json",
  onFileSelect,
  onFileRemove,
  selectedFile,
  loading = false,
  disabled = false,
  className,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled || loading) return

      const file = e.dataTransfer.files?.[0]
      if (file) {
        onFileSelect(file)
      }
    },
    [disabled, loading, onFileSelect]
  )

  const handleClick = useCallback(() => {
    if (!disabled && !loading) {
      fileInputRef.current?.click()
    }
  }, [disabled, loading])

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (onFileRemove) {
        onFileRemove()
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [onFileRemove]
  )

  return (
    <div className={cn("w-full", className)}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative w-full aspect-[2/1] min-h-[200px] border-2 border-dashed rounded-lg transition-all cursor-pointer",
          isDragging && "border-primary bg-primary/5",
          selectedFile && "border-primary/50 bg-primary/5",
          !selectedFile && !isDragging && "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "opacity-50 cursor-not-allowed",
          loading && "opacity-50 cursor-wait"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || loading}
        />

        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Processing...</p>
          </div>
        ) : selectedFile ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            {onFileRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="mt-2"
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                <span className="text-primary">Choose file</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {accept === ".json" ? "JSON files only" : `Files: ${accept}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
