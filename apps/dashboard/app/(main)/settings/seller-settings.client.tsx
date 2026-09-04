'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
import {
  Building2,
  Check,
  CloudUpload,
  FileText,
  LoaderCircle,
  Store,
  AlertCircle,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form'
import { Input } from '@workspace/ui/components/input'
import { Textarea } from '@workspace/ui/components/textarea'
import { Separator } from '@workspace/ui/components/separator'
import { Badge } from '@workspace/ui/components/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar'
import { SellerImageUpload } from '@/components/inputs/seller-image-upload'
import { getPublicUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'

import type {
  SellerDocument,
  SellerSettingsInitialData,
} from './seller-settings.types'
import {
  sellerProfileSchema,
  type SellerProfileForm,
} from './seller-settings.schema'
import {
  handleUpdateSellerProfile,
  handleUploadDocument,
} from './seller-settings.server'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface SellerSettingsFormProps {
  initialData: SellerSettingsInitialData
}

const AUTOSAVE_DELAY_MS = 900

export function SellerSettingsForm ({ initialData }: SellerSettingsFormProps) {
  const router = useRouter()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')
  const isSavingRef = useRef(false)

  const defaults: SellerProfileForm = useMemo(
    () => ({
      businessName: initialData.profile.businessName ?? '',
      displayName: initialData.profile.displayName ?? '',
      description: initialData.profile.description ?? '',
      logoUrl: initialData.profile.logoUrl ?? '',
      bannerUrl: initialData.profile.bannerUrl ?? '',
      supportEmail: initialData.profile.supportEmail ?? '',
      supportPhone: initialData.profile.supportPhone ?? '',
      returnPolicy: initialData.profile.returnPolicy ?? '',
      shippingPolicy: initialData.profile.shippingPolicy ?? '',
    }),
    [initialData.profile]
  )

  const form = useForm<SellerProfileForm>({
    resolver: zodResolver(sellerProfileSchema),
    defaultValues: defaults,
    mode: 'onChange',
  })

  const logoUrl = form.watch('logoUrl')
  const displayName = form.watch('displayName')
  const businessName = form.watch('businessName')

  useEffect(() => {
    lastSavedRef.current = JSON.stringify(defaults)
  }, [defaults])

  const persistProfile = useCallback(
    async (values: SellerProfileForm) => {
      const payload = JSON.stringify(values)
      if (payload === lastSavedRef.current) return

      const valid = await form.trigger()
      if (!valid) {
        setSaveStatus('error')
        return
      }

      if (isSavingRef.current) {
        // Queue another save after the in-flight one finishes
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => {
          void form.handleSubmit((next) => persistProfile(next))()
        }, 400)
        return
      }

      isSavingRef.current = true
      setSaveStatus('saving')

      try {
        const res = await handleUpdateSellerProfile(values)
        if (res.success) {
          lastSavedRef.current = payload
          form.reset(values)
          setSaveStatus('saved')
          router.refresh()
        } else {
          setSaveStatus('error')
          toast.error(res.message)
          if ('errors' in res && res.errors) {
            Object.entries(res.errors).forEach(([field, messages]) => {
              form.setError(field as keyof SellerProfileForm, {
                type: 'server',
                message: messages[0],
              })
            })
          }
        }
      } catch {
        setSaveStatus('error')
        toast.error('Failed to save settings')
      } finally {
        isSavingRef.current = false
      }
    },
    [form, router]
  )

  const scheduleAutosave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void form.handleSubmit((values) => persistProfile(values))()
    }, AUTOSAVE_DELAY_MS)
  }, [form, persistProfile])

  useEffect(() => {
    const subscription = form.watch((_values, info) => {
      if (info.type !== 'change') return
      // Images save immediately via dedicated handlers
      if (info.name === 'logoUrl' || info.name === 'bannerUrl') return
      setSaveStatus('idle')
      scheduleAutosave()
    })

    return () => {
      subscription.unsubscribe()
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [form, scheduleAutosave])

  const handleImageChange = useCallback(
    (field: 'logoUrl' | 'bannerUrl', url: string) => {
      form.setValue(field, url, {
        shouldDirty: true,
        shouldValidate: true,
      })
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      void form.handleSubmit((values) =>
        persistProfile({ ...values, [field]: url })
      )()
    },
    [form, persistProfile]
  )

  const storeInitial =
    (displayName || businessName || 'S').charAt(0).toUpperCase()

  return (
    <div className='space-y-6 p-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
            Store Settings
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Changes save automatically. Update your store profile, branding, and
            documents.
          </p>
        </div>
        <AutosaveIndicator status={saveStatus} />
      </div>

      <Form {...form}>
        <form className='space-y-6' onSubmit={(e) => e.preventDefault()}>
          <div className='grid grid-cols-1 gap-6 xl:grid-cols-5'>
            {/* Profile / branding */}
            <Card className='xl:col-span-2'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Store className='size-4' />
                  Profile & Branding
                </CardTitle>
                <CardDescription>
                  Your logo appears across the dashboard and storefront.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='flex flex-col items-center gap-4 sm:flex-row sm:items-start'>
                  <FormField
                    control={form.control}
                    name='logoUrl'
                    render={({ field }) => (
                      <FormItem className='space-y-2'>
                        <FormControl>
                          <SellerImageUpload
                            variant='logo'
                            value={field.value}
                            onChange={(url) =>
                              handleImageChange('logoUrl', url)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='flex min-w-0 flex-1 flex-col items-center gap-2 sm:items-start sm:pt-2'>
                    <div className='flex items-center gap-3'>
                      <Avatar className='size-12 border'>
                        <AvatarImage
                          src={
                            logoUrl
                              ? getPublicUrl(logoUrl, 'sellers')
                              : undefined
                          }
                          alt={displayName || businessName || 'Store logo'}
                        />
                        <AvatarFallback className='bg-primary/10 font-semibold text-primary'>
                          {storeInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0'>
                        <p className='truncate font-medium'>
                          {displayName || businessName || 'Your store'}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          Preview of how your logo appears
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name='displayName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Name shown to customers'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='supportEmail'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support email</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='support@example.com'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='supportPhone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support phone</FormLabel>
                      <FormControl>
                        <Input placeholder='+20 1XX XXX XXXX' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Store details */}
            <Card className='xl:col-span-3'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Building2 className='size-4' />
                  Store Information
                </CardTitle>
                <CardDescription>
                  Business details, banner, and policies for your store page.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-5'>
                <FormField
                  control={form.control}
                  name='businessName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legal business name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Registered business name'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store description</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder='Tell customers what you sell'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='bannerUrl'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store banner</FormLabel>
                      <FormControl>
                        <SellerImageUpload
                          variant='banner'
                          value={field.value}
                          onChange={(url) =>
                            handleImageChange('bannerUrl', url)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='returnPolicy'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Return policy</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder='How returns work for your store'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='shippingPolicy'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipping policy</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder='Delivery times and shipping rules'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <DocumentsSection
            initialDocuments={initialData.documents}
            onUploaded={() => router.refresh()}
          />
        </form>
      </Form>
    </div>
  )
}

function AutosaveIndicator ({ status }: { status: SaveStatus }) {
  const label =
    status === 'saving'
      ? 'Saving…'
      : status === 'saved'
        ? 'All changes saved'
        : status === 'error'
          ? 'Could not save'
          : 'Autosave on'

  const className =
    status === 'saving'
      ? 'text-amber-700 border-amber-200 bg-amber-50'
      : status === 'saved'
        ? 'text-emerald-700 border-emerald-200 bg-emerald-50'
        : status === 'error'
          ? 'text-red-700 border-red-200 bg-red-50'
          : 'text-muted-foreground border-border bg-background'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
        className
      )}
      aria-live='polite'
    >
      {status === 'saving' ? (
        <LoaderCircle className='size-3.5 animate-spin' />
      ) : status === 'saved' ? (
        <Check className='size-3.5' />
      ) : status === 'error' ? (
        <AlertCircle className='size-3.5' />
      ) : (
        <CloudUpload className='size-3.5' />
      )}
      {label}
    </div>
  )
}

function DocumentsSection ({
  initialDocuments,
  onUploaded,
}: {
  initialDocuments: SellerDocument[]
  onUploaded: () => void
}) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setDocuments(initialDocuments)
  }, [initialDocuments])

  const upload = (payload: {
    documentType: string
    fileUrl: string
    expiryDate?: string | null
  }) => {
    startTransition(async () => {
      const res = await handleUploadDocument(payload)
      if (res.success) {
        toast.success(res.message)
        if ('document' in res && res.document) {
          setDocuments((prev) => [res.document as SellerDocument, ...prev])
        }
        onUploaded()
      } else {
        toast.error(res.message)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <FileText className='size-4' />
          Verification Documents
        </CardTitle>
        <CardDescription>
          Upload business license, tax certificates, and related documents.
          Uploads save immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <SellerImageUpload
            variant='document'
            label='General document'
            value={null}
            quiet
            disabled={isPending}
            onChange={(fileUrl) => {
              if (fileUrl) upload({ documentType: 'general', fileUrl })
            }}
          />
          <SellerImageUpload
            variant='document'
            label='Business license'
            value={null}
            quiet
            disabled={isPending}
            onChange={(fileUrl) => {
              if (fileUrl) {
                upload({ documentType: 'business_license', fileUrl })
              }
            }}
          />
          <SellerImageUpload
            variant='document'
            label='Tax certificate'
            value={null}
            quiet
            disabled={isPending}
            onChange={(fileUrl) => {
              if (fileUrl) {
                upload({ documentType: 'tax_certificate', fileUrl })
              }
            }}
          />
        </div>

        <Separator />

        <div className='space-y-3'>
          <h3 className='text-sm font-semibold'>Uploaded documents</h3>
          {documents.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No documents uploaded yet.
            </p>
          ) : (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className='overflow-hidden rounded-xl border bg-card'
                >
                  <div className='relative h-40 bg-muted/40'>
                    <Image
                      src={getPublicUrl(doc.fileUrl, 'sellers')}
                      alt={doc.documentType}
                      fill
                      className='object-contain p-2'
                    />
                  </div>
                  <div className='space-y-1.5 p-3'>
                    <div className='flex items-center justify-between gap-2'>
                      <p className='truncate text-sm font-medium capitalize'>
                        {doc.documentType.replace(/_/g, ' ')}
                      </p>
                      <Badge
                        variant='secondary'
                        className='shrink-0 capitalize'
                      >
                        {doc.status}
                      </Badge>
                    </div>
                    {doc.expiryDate ? (
                      <p className='text-xs text-muted-foreground'>
                        Expires{' '}
                        {new Date(doc.expiryDate).toLocaleDateString()}
                      </p>
                    ) : null}
                    {doc.uploadedAt ? (
                      <p className='text-xs text-muted-foreground'>
                        Uploaded{' '}
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
