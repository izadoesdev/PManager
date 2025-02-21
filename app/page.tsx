'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Archive, Trash2, RotateCcw, Clock, ListTodo } from "lucide-react"
import { type BoardWithCounts } from '@/app/lib/types'
import dayjs from 'dayjs'
import { TemplateDialog } from './components/TemplateDialog'

async function getBoards() {
  const res = await fetch('/api/boards')
  return res.json() 
}

async function createBoard(title: string, description: string | null) {
  const res = await fetch('/api/boards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description })
  })
  return res.json()
}

async function updateBoard(id: number, data: Partial<BoardWithCounts>) {
  const res = await fetch('/api/boards', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data })
  })
  return res.json()
}

async function deleteBoard(id: number) {
  const res = await fetch(`/api/boards/${id}`, {
    method: 'DELETE'
  })
  return res.ok
}

export default function Home() {
  const [boards, setBoards] = useState<BoardWithCounts[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [boardToDelete, setBoardToDelete] = useState<{ board: BoardWithCounts, permanent: boolean } | null>(null)

  // Load boards on mount
  useEffect(() => {
    getBoards().then(setBoards)
  }, [])

  const handleArchiveBoard = async (board: BoardWithCounts) => {
    const newStatus = board.status === 'archived' ? 'active' : 'archived'
    const updatedBoard = await updateBoard(board.id, {
      status: newStatus,
      archivedAt: newStatus === 'archived' ? new Date() : null
    })
    setBoards(boards.map(b => b.id === board.id ? updatedBoard : b))
  }

  const handleDeleteBoard = async (board: BoardWithCounts) => {
    const newStatus = board.status === 'deleted' ? 'active' : 'deleted'
    const updatedBoard = await updateBoard(board.id, {
      status: newStatus,
      deletedAt: newStatus === 'deleted' ? new Date() : null
    })
    setBoards(boards.map(b => b.id === board.id ? updatedBoard : b))
    setBoardToDelete(null)
  }

  const handlePermanentDelete = async (board: BoardWithCounts) => {
    const success = await deleteBoard(board.id)
    if (success) {
      setBoards(boards.filter(b => b.id !== board.id))
    }
    setBoardToDelete(null)
  }

  const activeBoards = boards.filter(board => board.status === 'active')
  const archivedBoards = boards.filter(board => board.status === 'archived')
  const deletedBoards = boards.filter(board => board.status === 'deleted')

  return (
    <main className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Project Boards</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Board
        </Button>
        <TemplateDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </div>

      {/* Active Boards */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeBoards.map(board => (
            <Link
              key={board.id}
              href={`/board/${board.id}`}
              className="group relative bg-card rounded-lg border transition-all hover:shadow-lg hover:border-primary/50"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {board.title}
                    </h3>
                    {board.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {board.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span title={dayjs(board.createdAt).format('MMM D, YYYY h:mm A')}>
                          Created {dayjs(board.createdAt).fromNow()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ListTodo className="h-3.5 w-3.5" />
                        <span>
                          {board.counts?.lists || 0} lists • {board.counts?.cards || 0} cards
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.preventDefault()
                        handleArchiveBoard(board)
                      }}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.preventDefault()
                        setBoardToDelete({ board, permanent: false })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>

        {/* Archived Boards */}
        {archivedBoards.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Archived Boards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedBoards.map(board => (
                <div
                  key={board.id}
                  className="group bg-card/50 rounded-lg p-4 border hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-medium">{board.title}</h3>
                      {board.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {board.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span title={dayjs(board.archivedAt).format('MMM D, YYYY h:mm A')}>
                            Archived {dayjs(board.archivedAt).fromNow()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleArchiveBoard(board)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deleted Boards */}
        {deletedBoards.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Deleted Boards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deletedBoards.map(board => (
                <div
                  key={board.id}
                  className="group bg-card/50 rounded-lg p-4 border hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">{board.title}</h3>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteBoard(board)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.preventDefault()
                              setBoardToDelete({ board, permanent: true })
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {board.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {board.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span title={dayjs(board.deletedAt).format('MMM D, YYYY h:mm A')}>
                            Deleted {dayjs(board.deletedAt).fromNow()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={boardToDelete !== null} 
        onOpenChange={(open) => !open && setBoardToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              {boardToDelete?.permanent ? 'Permanently delete board?' : 'Delete board?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {boardToDelete?.permanent ? (
                <>
                  This action cannot be undone. This will permanently delete the board
                  <span className="font-medium text-foreground"> {boardToDelete.board.title} </span>
                  and all of its data including {boardToDelete.board.counts?.lists || 0} lists and {boardToDelete.board.counts?.cards || 0} cards.
                </>
              ) : (
                <>
                  Are you sure you want to delete the board
                  <span className="font-medium text-foreground"> {boardToDelete?.board.title}</span>?
                  You can restore it later from the deleted boards section.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!boardToDelete) return
                boardToDelete.permanent 
                  ? handlePermanentDelete(boardToDelete.board)
                  : handleDeleteBoard(boardToDelete.board)
              }}
            >
              {boardToDelete?.permanent ? 'Delete Forever' : 'Delete Board'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
