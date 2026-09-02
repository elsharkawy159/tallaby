const ORDER_STATUS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  payment_processing: 'قيد معالجة الدفع',
  confirmed: 'مؤكد',
  shipping_soon: 'جاري التجهيز للشحن',
  shipped: 'تم الشحن',
  out_for_delivery: 'قيد التوصيل',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  refund_requested: 'طلب استرجاع',
  refunded: 'تم الاسترجاع',
  returned: 'مرتجع',
}

const PAYMENT_STATUS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  authorized: 'مصرّح',
  paid: 'مدفوع',
  failed: 'فشل الدفع',
  refunded: 'تم الاسترجاع',
  partially_refunded: 'استرجاع جزئي',
  collected: 'تم التحصيل',
}

export function translateOrderStatus(status: string): string {
  return ORDER_STATUS_AR[status] ?? status
}

export function translatePaymentStatus(status: string): string {
  return PAYMENT_STATUS_AR[status] ?? status
}

export function getOrderStatusTone(status: string): string {
  switch (status) {
    case 'pending':
    case 'payment_processing':
      return 'bg-amber-50 text-amber-800 ring-amber-200'
    case 'confirmed':
    case 'shipping_soon':
      return 'bg-sky-50 text-sky-800 ring-sky-200'
    case 'shipped':
    case 'out_for_delivery':
      return 'bg-violet-50 text-violet-800 ring-violet-200'
    case 'delivered':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200'
    case 'cancelled':
    case 'failed':
      return 'bg-red-50 text-red-800 ring-red-200'
    case 'refund_requested':
    case 'refunded':
    case 'returned':
      return 'bg-slate-50 text-slate-700 ring-slate-200'
    default:
      return 'bg-slate-50 text-slate-700 ring-slate-200'
  }
}

const INVOICE_EXPORT_WIDTH = 900

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  if (images.length === 0) return Promise.resolve()

  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve()
            return
          }
          img.onload = () => resolve()
          img.onerror = () => resolve()
        }),
    ),
  ).then(() => undefined)
}

function prepareCloneForExport(element: HTMLElement): {
  wrapper: HTMLDivElement
  clone: HTMLElement
} {
  const wrapper = document.createElement('div')
  wrapper.setAttribute('aria-hidden', 'true')
  wrapper.style.cssText = [
    'position: fixed',
    'left: -12000px',
    'top: 0',
    `width: ${INVOICE_EXPORT_WIDTH}px`,
    'z-index: -1',
    'background: #ffffff',
    'overflow: visible',
  ].join(';')

  const clone = element.cloneNode(true) as HTMLElement
  const sourceFont = window.getComputedStyle(element).fontFamily
  clone.style.cssText = [
    `width: ${INVOICE_EXPORT_WIDTH}px`,
    `max-width: ${INVOICE_EXPORT_WIDTH}px`,
    `min-width: ${INVOICE_EXPORT_WIDTH}px`,
    'margin: 0',
    'overflow: visible',
    'box-shadow: none',
    'transform: none',
    'position: relative',
    'left: 0',
    'top: 0',
    `font-family: ${sourceFont}`,
  ].join(';')

  clone.querySelectorAll<HTMLElement>('table').forEach((table) => {
    table.style.width = '100%'
    table.style.tableLayout = 'auto'
  })

  clone.querySelectorAll<HTMLElement>('*').forEach((node) => {
    const computed = window.getComputedStyle(node)
    if (
      computed.overflow === 'hidden' ||
      computed.overflowX === 'hidden' ||
      computed.overflowY === 'hidden'
    ) {
      node.style.overflow = 'visible'
    }
  })

  wrapper.appendChild(clone)
  document.body.appendChild(wrapper)

  return { wrapper, clone }
}

/** Renders the invoice off-screen at a fixed width for a clean full capture. */
export async function captureInvoiceImage(element: HTMLElement): Promise<Blob> {
  const { toPng } = await import('html-to-image')
  const { wrapper, clone } = prepareCloneForExport(element)

  try {
    await waitForImages(clone)
    if (document.fonts?.ready) {
      await document.fonts.ready
    }
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })

    const height = Math.ceil(clone.scrollHeight)

    const dataUrl = await toPng(clone, {
      width: INVOICE_EXPORT_WIDTH,
      height,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
      style: {
        width: `${INVOICE_EXPORT_WIDTH}px`,
        maxWidth: `${INVOICE_EXPORT_WIDTH}px`,
        margin: '0',
        overflow: 'visible',
        transform: 'none',
      },
    })

    const response = await fetch(dataUrl)
    return await response.blob()
  } finally {
    document.body.removeChild(wrapper)
  }
}
