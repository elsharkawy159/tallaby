'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { formatRelativeTime } from '@workspace/i18n'
import { History, Plus, MessageSquare, Loader2, Trash2 } from 'lucide-react'
import { notify } from '@/services/toast'
import { Button } from '@workspace/ui/components/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@workspace/ui/components/sheet'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { cn } from '@/lib/utils'
import {
  listAiConversations,
  deleteAiConversation,
} from '@/actions/ai-conversation-actions'

type Conversation = Awaited<ReturnType<typeof listAiConversations>>[number]

type Props = {
  websiteId: string
  currentConversationId: string | null
  pages: Array<{ id: string; name: Record<string, string>; slug: string }>
  locale: string
  onSelect: (conv: Conversation) => void
  onNewChat: () => void
  isCreating: boolean
  /** Called after a conversation is deleted; lets the shell reset if it was active. */
  onDeleted?: (conversationId: string) => void
}

export function AiChatHistory ({
  websiteId,
  currentConversationId,
  pages,
  locale,
  onSelect,
  onNewChat,
  isCreating,
  onDeleted,
}: Props) {
  const t = useTranslations('aiBuilder.chatHistory')
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete (conversationId: string) {
    setDeletingId(conversationId)
    try {
      await deleteAiConversation(conversationId)
      setConversations((prev) => prev.filter((c) => c.id !== conversationId))
      onDeleted?.(conversationId)
    } catch {
      notify.error(t('toastDeleteFailed'))
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    if (!open) return
    setLoading(true)
    listAiConversations(websiteId)
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, websiteId])

  function getPageName (pageId: string | null) {
    if (!pageId) return null
    const page = pages.find((p) => p.id === pageId)
    if (!page) return null
    return (page.name[locale] ?? page.name['en'] ?? page.slug) as string
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label={t('chatHistory')}>
          <History className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 flex flex-col">
        <SheetHeader className="shrink-0 border-b px-4 py-3">
          <SheetTitle className="text-sm">{t('chatHistory')}</SheetTitle>
        </SheetHeader>

        <div className="shrink-0 px-3 py-2 border-b">
          <Button
            className="w-full gap-2 bg-violet-600 text-white hover:bg-violet-700"
            size="sm"
            disabled={isCreating}
            onClick={() => {
              onNewChat()
              setOpen(false)
            }}
          >
            {isCreating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {t('newChat')}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="py-12 text-center text-xs text-muted-foreground">{t('noChatsYet')}</p>
          ) : (
            <div className="flex flex-col gap-0.5 p-2">
              {conversations.map((conv) => {
                const pageName = getPageName(conv.pageId)
                const isActive = conv.id === currentConversationId
                return (
                  <div
                    key={conv.id}
                    className={cn(
                      'group relative flex items-center rounded-lg transition-colors hover:bg-muted',
                      isActive && 'bg-violet-50 dark:bg-violet-950/30'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(conv)
                        setOpen(false)
                      }}
                      className="flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-0.5 px-3 py-2.5 text-start"
                    >
                      <div className="flex w-full items-center gap-2">
                        <MessageSquare
                          className={cn(
                            'size-3.5 shrink-0',
                            isActive ? 'text-violet-500' : 'text-muted-foreground'
                          )}
                        />
                        <span
                          className={cn(
                            'flex-1 truncate text-sm font-medium',
                            isActive && 'text-violet-700 dark:text-violet-300'
                          )}
                        >
                          {conv.title}
                        </span>
                      </div>
                      <div className="ms-5.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                        {pageName && (
                          <>
                            <span className="truncate max-w-[100px]">{pageName}</span>
                            <span>·</span>
                          </>
                        )}
                        <span>{formatRelativeTime(conv.updatedAt, locale)}</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label={t('deleteConversation')}
                      disabled={deletingId === conv.id}
                      onClick={() => void handleDelete(conv.id)}
                      className="me-1 hidden shrink-0 cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 group-hover:flex dark:hover:bg-rose-950/40"
                    >
                      {deletingId === conv.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
