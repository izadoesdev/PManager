import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save } from "lucide-react"

interface SaveTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardId: number
  boardTitle: string
  boardDescription?: string | null
}

export function SaveTemplateDialog({ 
  open, 
  onOpenChange, 
  boardId,
  boardTitle,
  boardDescription 
}: SaveTemplateDialogProps) {
  const [name, setName] = useState(boardTitle)
  const [description, setDescription] = useState(boardDescription || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId,
          name,
          description: description || null
        })
      })

      if (response.ok) {
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save this board as a template to reuse it later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Template Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter template name..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter template description..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isLoading}>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 