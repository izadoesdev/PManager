'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, Clock, Calendar } from "lucide-react"
import { type Card as CardType } from '@prisma/client'
import dayjs from 'dayjs'

interface CardModalProps {
  card: CardType
  open: boolean
  onOpenChange: (open: boolean) => void
}

const priorityColors = {
  low: 'bg-blue-500/10 text-blue-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  high: 'bg-red-500/10 text-red-500'
} as const

export function CardModal({ card, open, onOpenChange }: CardModalProps) {
  const copyToClipboard = () => {
    const formattedText = `
Task: ${card.title}
Priority: ${card.priority}
${card.description ? `Description: ${card.description}\n` : ''}Created: ${dayjs(card.createdAt).format('MMM D, YYYY h:mm A')}
${card.status !== 'active' ? `${card.status === 'archived' ? 'Archived' : 'Deleted'}: ${dayjs(card.status === 'archived' ? card.archivedAt : card.deletedAt).format('MMM D, YYYY h:mm A')}` : ''}
`.trim()
    
    navigator.clipboard.writeText(formattedText)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold mb-1">{card.title}</DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={`px-2 py-0.5 rounded-full text-xs ${priorityColors[card.priority as keyof typeof priorityColors]} capitalize`}>
                  {card.priority}
                </span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span title={dayjs(card.createdAt).format('MMM D, YYYY h:mm A')}>
                    Created {dayjs(card.createdAt).fromNow()}
                  </span>
                </div>
                {card.status !== 'active' && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span title={dayjs(card.status === 'archived' ? card.archivedAt : card.deletedAt).format('MMM D, YYYY h:mm A')}>
                      {card.status === 'archived' ? 'Archived' : 'Deleted'}{' '}
                      {dayjs(card.status === 'archived' ? card.archivedAt : card.deletedAt).fromNow()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        </DialogHeader>
        {card.description && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Description</h4>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap rounded-lg bg-muted/50 p-4">
              {card.description}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 