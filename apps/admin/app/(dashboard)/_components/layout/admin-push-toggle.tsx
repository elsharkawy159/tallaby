'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { BellOff, BellRing, LoaderCircle, Send } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import {
  getAdminPushPublicKey,
  removeAdminPushSubscriptionAction,
  saveAdminPushSubscriptionAction,
  sendAdminTestPushAction,
} from '@/actions/push'

type State =
  | { kind: 'checking' }
  | { kind: 'hidden' } // push not configured on the server
  | { kind: 'unsupported' }
  | { kind: 'ready'; publicKey: string }

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = window.atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i)
  return out
}

function registerWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
}

/**
 * Browser alerts for the admin bell (ROADMAP.md F-06e): turn push on or off
 * for this browser or installed app, and send a test. Every admin bell
 * notification is pushed to every admin device that turned alerts on.
 */
export function AdminPushToggle() {
  const [state, setState] = useState<State>({ kind: 'checking' })
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [busy, startBusy] = useTransition()
  const [testing, startTesting] = useTransition()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const capable = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
      if (!capable) {
        if (!cancelled) setState({ kind: 'unsupported' })
        return
      }
      try {
        const publicKey = await getAdminPushPublicKey()
        if (cancelled) return
        if (!publicKey) {
          setState({ kind: 'hidden' })
          return
        }
        setPermission(Notification.permission)
        const registration = await registerWorker()
        const existing = await registration.pushManager.getSubscription()
        if (cancelled) return
        setSubscription(existing)
        setState({ kind: 'ready', publicKey })
        // Keep the saved device current (owner after an account switch).
        if (existing && Notification.permission === 'granted') {
          void saveAdminPushSubscriptionAction(existing.toJSON())
        }
      } catch {
        if (!cancelled) setState({ kind: 'unsupported' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (state.kind === 'checking' || state.kind === 'hidden') return null
  if (state.kind === 'unsupported') {
    return <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">This browser can&apos;t show alerts.</p>
  }

  const on = Boolean(subscription) && permission === 'granted'

  const turnOn = () =>
    startBusy(async () => {
      try {
        const result = await Notification.requestPermission()
        setPermission(result)
        if (result !== 'granted') {
          toast.error('Alerts weren’t allowed. Allow notifications for this site in your browser settings.')
          return
        }
        const registration = await registerWorker()
        await navigator.serviceWorker.ready
        const sub =
          (await registration.pushManager.getSubscription()) ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(state.publicKey),
          }))
        const saved = await saveAdminPushSubscriptionAction(sub.toJSON())
        if (!saved.success) {
          await sub.unsubscribe().catch(() => undefined)
          toast.error(saved.error)
          return
        }
        setSubscription(sub)
        toast.success('Browser alerts are on for this device.')
      } catch {
        toast.error('Something went wrong. Try again.')
      }
    })

  const turnOff = () =>
    startBusy(async () => {
      const sub = subscription
      if (!sub) return
      try {
        await removeAdminPushSubscriptionAction(sub.endpoint)
        await sub.unsubscribe()
        setSubscription(null)
        toast.success('Browser alerts are off for this device.')
      } catch {
        toast.error('Something went wrong. Try again.')
      }
    })

  const sendTest = () =>
    startTesting(async () => {
      const result = await sendAdminTestPushAction()
      if (result.success) toast.success('Test alert sent. It should arrive in a few seconds.')
      else toast.error(result.error)
    })

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5">
      <p className="text-xs text-muted-foreground">
        {permission === 'denied'
          ? 'Notifications are blocked for this site in your browser settings.'
          : on
            ? 'Browser alerts are on for this device.'
            : 'Get every notification as a browser alert.'}
      </p>
      <div className="flex gap-1">
        {on ? (
          <>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs" disabled={testing} onClick={sendTest}>
              {testing ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Test
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs" disabled={busy} onClick={turnOff}>
              {busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <BellOff className="size-3.5" />}
              Turn off
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs"
            disabled={busy || permission === 'denied'}
            onClick={turnOn}
          >
            {busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <BellRing className="size-3.5" />}
            Turn on alerts
          </Button>
        )}
      </div>
    </div>
  )
}
