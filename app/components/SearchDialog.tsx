'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Search, Calendar as CalendarIcon, Tag, Clock, X } from "lucide-react"
import { type Priority, type Label } from '@prisma/client'
import dayjs from 'dayjs'
import { useDebounce } from '@/app/hooks/use-debounce'

interface SearchResult {
  id: number
  type: 'board' | 'list' | 'card'
  title: string
  description?: string | null
  boardId: number
  boardTitle?: string
  listId?: number
  listTitle?: string
  priority?: Priority
  labels?: Label[]
  dueDate?: Date | null
  createdAt: Date
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    dueDate: null as Date | null,
    labels: [] as Label[]
  })
//   const [availableLabels, setAvailableLabels] = useState<Label[]>([])
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setQuery('')
      setResults([])
      setFilters({
        type: 'all',
        priority: 'all',
        dueDate: null,
        labels: []
      })
      // Fetch available labels
      fetchLabels()
    }
  }, [open])

  useEffect(() => {
    const debounceSearch = setTimeout(() => {
      if (query.trim()) {
        performSearch()
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(debounceSearch)
  }, [query, filters])

  const fetchLabels = async () => {
    try {
      const response = await fetch('/api/labels')
      if (response.ok) {
        // const labels = await response.json()
        // setAvailableLabels(labels)
      }
    } catch (error) {
      console.error('Error fetching labels:', error)
    }
  }

  const performSearch = useCallback(async () => {
    if (!debouncedQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const searchParams = new URLSearchParams({
        q: debouncedQuery,
        type: filters.type,
        priority: filters.priority,
        ...(filters.dueDate && { dueDate: filters.dueDate.toISOString() }),
        ...(filters.labels.length && { labels: filters.labels.map(l => l.id).join(',') })
      })

      const response = await fetch(`/api/search?${searchParams.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error('Error performing search:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [debouncedQuery, filters])

  useEffect(() => {
    performSearch()
  }, [performSearch])

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'board') {
      router.push(`/board/${result.boardId}`)
    } else {
      router.push(`/board/${result.boardId}?highlight=${result.type}-${result.id}`)
    }
    onOpenChange(false)
  }

  const clearFilters = () => {
    setFilters({
      type: 'all',
      priority: 'all',
      dueDate: null,
      labels: []
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search boards, lists, and cards..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </DialogHeader>
        <div className="flex items-center gap-2 p-2 border-b bg-muted/50">
          <Select
            value={filters.type}
            onValueChange={(value) => setFilters(f => ({ ...f, type: value }))}
          >
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="board">Boards</SelectItem>
              <SelectItem value="list">Lists</SelectItem>
              <SelectItem value="card">Cards</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.priority}
            onValueChange={(value) => setFilters(f => ({ ...f, priority: value }))}
          >
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={filters.dueDate ? "default" : "outline"}
                className={cn(
                  "h-8 w-[150px] justify-start text-left font-normal",
                  !filters.dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dueDate ? dayjs(filters.dueDate).format('MMM D, YYYY') : "Due date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dueDate || undefined}
                onSelect={(date) => setFilters(f => ({ ...f, dueDate: date || null }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {filters.type !== 'all' || filters.priority !== 'all' || filters.dueDate || filters.labels.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={clearFilters}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <ScrollArea className="max-h-[60vh]">
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="text-center text-sm text-muted-foreground py-6">
                Searching...
              </div>
            ) : results.length > 0 ? (
              results.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="flex flex-col gap-1 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                        {result.type}
                      </span>
                      <h3 className="font-medium">{result.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {result.priority && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 capitalize">
                          {result.priority}
                        </span>
                      )}
                      {result.dueDate && (
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          <span>{dayjs(result.dueDate).format('MMM D')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {result.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {result.description}
                    </p>
                  )}
                  {(result.type === 'list' || result.type === 'card') && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <span>in board</span>
                      <span className="font-medium">{result.boardTitle}</span>
                      {result.type === 'card' && (
                        <>
                          <span>• list</span>
                          <span className="font-medium">{result.listTitle}</span>
                        </>
                      )}
                    </div>
                  )}
                  {result.labels && result.labels.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <div className="flex gap-1">
                        {result.labels.map(label => (
                          <span
                            key={label.id}
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: label.color + '20', color: label.color }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : query ? (
              <div className="text-center text-sm text-muted-foreground py-6">
                No results found
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-6">
                Type to start searching...
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}   