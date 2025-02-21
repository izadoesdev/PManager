import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Template } from '@prisma/client'
import { Plus, Pencil, Trash2, Save } from "lucide-react"

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TemplateDialog({ open, onOpenChange }: TemplateDialogProps) {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null)

  useEffect(() => {
    if (open) {
      fetchTemplates()
    } else {
      setTitle('')
      setDescription('')
      setSelectedTemplate(null)
      setEditingTemplate(null)
    }
  }, [open])

  const fetchTemplates = async () => {
    const response = await fetch('/api/templates')
    if (response.ok) {
      const data = await response.json()
      setTemplates(data)
    }
  }

  const handleCreateBoard = async () => {
    if (!title.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          templateId: selectedTemplate?.id
        })
      })

      if (response.ok) {
        const board = await response.json()
        router.push(`/board/${board.id}`)
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error creating board:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditTemplate = async () => {
    if (!editingTemplate || !editingTemplate.name.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingTemplate.name,
          description: editingTemplate.description
        })
      })

      if (response.ok) {
        await fetchTemplates()
        setEditingTemplate(null)
      }
    } catch (error) {
      console.error('Error updating template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/templates/${templateToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchTemplates()
        setTemplateToDelete(null)
        if (selectedTemplate?.id === templateToDelete.id) {
          setSelectedTemplate(null)
        }
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
            <DialogDescription>
              Create a blank board or start from a template.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="blank">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="blank">Blank Board</TabsTrigger>
              <TabsTrigger value="template">From Template</TabsTrigger>
            </TabsList>
            <TabsContent value="blank" className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Board Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter board title..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter board description..."
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="template" className="py-4">
              <div className="space-y-4">
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-4">
                    {templates.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground p-4">
                        No templates available. Save a board as a template to see it here.
                      </div>
                    ) : (
                      templates.map((template) => (
                        <div
                          key={template.id}
                          className={`group rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                            selectedTemplate?.id === template.id ? 'border-primary bg-muted/50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => {
                                setSelectedTemplate(template)
                                setTitle(template.name)
                                setDescription(template.description || '')
                              }}
                            >
                              <h3 className="font-medium">{template.name}</h3>
                              {template.description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {template.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingTemplate(template)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => setTemplateToDelete(template)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                {selectedTemplate && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Board Title</label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter board title..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description (optional)</label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter board description..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBoard} disabled={!title.trim() || isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Create Board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={editingTemplate !== null} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update the template name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template Name</label>
              <Input
                value={editingTemplate?.name || ''}
                onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Enter template name..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                value={editingTemplate?.description || ''}
                onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Enter template description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditTemplate} disabled={!editingTemplate?.name.trim() || isLoading}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Confirmation */}
      <AlertDialog 
        open={templateToDelete !== null} 
        onOpenChange={(open) => !open && setTemplateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Delete template?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template
              <span className="font-medium text-foreground"> {templateToDelete?.name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteTemplate}
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 