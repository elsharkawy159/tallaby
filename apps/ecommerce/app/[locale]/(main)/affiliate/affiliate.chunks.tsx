'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  Copy,
  Gift,
  Link2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Users,
} from 'lucide-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@workspace/ui/components/accordion'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card'

const CODE = 'OMAR10EQH'

const benefits = [
  { icon: TrendingUp, title: 'Earn 10%', text: 'Earn 10% of eligible delivered order value, excluding shipping.' },
  { icon: Gift, title: 'Give 10% Off', text: 'Your audience gets an instant 10% discount at checkout.' },
  { icon: Link2, title: 'Unlimited Usage', text: 'Your personal code can be reused across multiple orders.' },
  { icon: Wallet, title: 'Automatic Wallet Credit', text: 'Delivered commissions are added to your Tallaby wallet automatically.' },
]

const steps = [
  { number: '01', icon: Users, title: 'Join', text: 'Sign up for the Tallaby Affiliate Program.' },
  { number: '02', icon: Sparkles, title: 'Get your code', text: 'We generate a unique personal promo code for you.', code: CODE },
  { number: '03', icon: Link2, title: 'Share', text: 'Share your code with friends, followers, or your community.' },
  { number: '04', icon: Wallet, title: 'Earn', text: 'When an order is delivered, 10% goes to your Tallaby wallet.' },
]

const faqs = [
  ['How much do I earn?', 'You earn 10% of the eligible order amount, excluding shipping, when an order using your code is successfully delivered.'],
  ['How much does my customer save?', 'Customers receive 10% off their eligible order when they use your promo code at checkout.'],
  ['Can my code be used more than once?', 'Yes. Your promo code is reusable and can be used on multiple orders.'],
  ['When do I receive my commission?', 'Your commission becomes available after the order reaches Delivered status.'],
  ['What happens if an order is cancelled or returned?', 'Cancelled or returned orders do not generate valid affiliate earnings. If a credited order is later refunded or returned, the corresponding commission may be reversed.'],
  ['Can I see which orders used my code?', 'Yes. Your Affiliate section shows referred orders, statuses, and earnings for completed deliveries.'],
  ["Can I see the customer's personal information?", 'No. Affiliate order information is limited to what is necessary to track your referral and earnings while protecting customer privacy.'],
]

export function AffiliatePageContent() {
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    await navigator.clipboard.writeText(CODE)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="overflow-hidden bg-primary text-primary-foreground">
        <div className="container py-12 md:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
            <div className="text-center lg:text-start">
              <Badge className="mb-5 bg-accent text-accent-foreground">Tallaby Affiliate Program</Badge>
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Share Tallaby. <span className="text-accent">Give 10% Off.</span> Earn 10%.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-primary-foreground/80 lg:mx-0">
                Turn your recommendations into rewards. Your community saves 10% on their orders, and you earn 10% when their order is delivered.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/auth/sign-up">Join the Affiliate Program <ArrowRight data-icon="inline-end" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  <Link href="#how-it-works">How It Works</Link>
                </Button>
              </div>
              <div className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/70 lg:justify-start">
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-accent" /> No complicated setup</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-accent" /> Automatic wallet credit</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <div className="rounded-3xl border border-primary-foreground/15 bg-primary-foreground/10 p-5 shadow-2xl backdrop-blur-sm sm:p-7">
                <div className="flex items-center justify-between text-sm text-primary-foreground/70">
                  <span>Your personal code</span><Sparkles className="size-4 text-accent" />
                </div>
                <div className="mt-4 rounded-2xl bg-background p-5 text-foreground shadow-xl">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-2xl font-bold tracking-[0.18em] text-primary sm:text-3xl">{CODE}</span>
                    <Button type="button" size="icon" variant="outline" aria-label="Copy affiliate code" onClick={copyCode}>
                      {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
                    </Button>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t pt-4">
                    <span className="text-sm text-muted-foreground">Customer discount</span><span className="text-xl font-bold text-accent">10% OFF</span>
                  </div>
                  {copied && <p className="mt-3 text-xs font-medium text-primary">Code copied to clipboard</p>}
                </div>
                <div className="mt-6 grid grid-cols-4 items-center gap-2 text-center text-xs text-primary-foreground/75">
                  {['You share', 'They save', 'Delivered', 'You earn'].map((label, index) => <div key={label} className="flex flex-col items-center gap-2"><span className="flex size-9 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">{index + 1}</span><span>{label}</span></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main>
        <section className="container py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Why Tallaby</p><h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">A simple way to make every recommendation count.</h2></div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{benefits.map(({ icon: Icon, title, text }) => <Card key={title} className="bg-card transition-transform hover:-translate-y-1"><CardHeader><div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></div><CardTitle className="pt-3 text-lg">{title}</CardTitle><CardDescription className="leading-relaxed">{text}</CardDescription></CardHeader></Card>)}</div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 bg-muted/50 py-16 md:py-24"><div className="container"><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">How it works</p><h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">From a good recommendation to a real reward.</h2></div><div className="mt-12 grid gap-6 lg:grid-cols-4">{steps.map(({ number, icon: Icon, title, text, code }) => <div key={number} className="relative"><div className="flex items-center gap-4 lg:block"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">{number}</span><div className="mt-0 lg:mt-5"><Icon className="hidden size-5 text-accent lg:block" /><h3 className="mt-0 font-semibold lg:mt-3">{title}</h3></div></div><p className="ml-16 mt-3 text-sm leading-relaxed text-muted-foreground lg:ml-0">{text}</p>{code && <p className="ml-16 mt-3 inline-block rounded-lg bg-background px-3 py-2 font-mono text-sm font-semibold text-primary lg:ml-0">{code}</p>}{number !== '04' && <span className="absolute left-12 top-12 hidden h-px w-[calc(100%-2rem)] bg-border lg:block" />}</div>)}</div></div></section>

        <section className="container py-16 md:py-24"><div className="grid items-center gap-10 lg:grid-cols-[.85fr_1.15fr]"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">See how it works</p><h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">The math is clear. Your audience saves, you earn.</h2><p className="mt-5 leading-relaxed text-muted-foreground">Shipping charges are excluded from affiliate commission calculations, so the reward always reflects the eligible product value.</p></div><div className="grid gap-4 sm:grid-cols-2"><Card className="bg-muted/40"><CardHeader><CardDescription>Customer pays</CardDescription><CardTitle className="text-2xl text-primary">EGP 900 <span className="text-base font-normal text-muted-foreground">+ shipping</span></CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground"><p>Products subtotal: EGP 1,000</p><p className="mt-2 text-accent">10% discount: − EGP 100</p></CardContent></Card><Card className="border-accent/40 bg-accent/10"><CardHeader><CardDescription>Affiliate earns</CardDescription><CardTitle className="text-2xl text-primary">EGP 100</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground"><p>10% of eligible order value</p><p className="mt-2 inline-flex items-center gap-1 font-medium text-primary"><Wallet className="size-4" /> Added after delivery</p></CardContent></Card></div></div></section>

        <section className="bg-primary py-16 text-primary-foreground md:py-24"><div className="container"><div className="grid items-start gap-8 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Your affiliate dashboard</p><h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">Everything you need, at a glance.</h2><p className="mt-5 leading-relaxed text-primary-foreground/75">Track referrals, delivered earnings, and wallet balance without exposing customer personal information.</p><p className="mt-6 inline-flex items-center gap-2 text-sm text-primary-foreground/75"><ShieldCheck className="size-4 text-accent" /> Privacy-safe order tracking</p></div><div className="rounded-3xl bg-background p-4 text-foreground shadow-2xl sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">Your Affiliate Code</p><p className="mt-1 font-mono text-xl font-bold tracking-wider text-primary">{CODE}</p></div><Button size="sm" variant="outline" onClick={copyCode}>{copied ? 'Copied' : 'Copy code'} <Clipboard data-icon="inline-end" /></Button></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Orders', '24'], ['Delivered', '19'], ['Pending Profit', 'EGP 420'], ['Total Profit', 'EGP 1,850']].map(([label, value]) => <div key={label} className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-semibold text-primary">{value}</p></div>)}</div><div className="mt-3 rounded-xl border border-accent/30 bg-accent/10 p-4"><p className="text-xs text-muted-foreground">Wallet Balance</p><p className="mt-1 text-2xl font-bold text-primary">EGP 1,850</p></div><div className="mt-5"><p className="text-sm font-semibold">Recent activity</p><div className="mt-3 flex flex-col gap-3">{[['#TLB-10294', 'Delivered', 'EGP 120'], ['#TLB-10281', 'On the way', 'Pending'], ['#TLB-10270', 'Delivered', 'EGP 85']].map(([order, status, profit]) => <div key={order} className="flex items-center justify-between gap-3 border-b pb-3 text-sm last:border-0 last:pb-0"><div><p className="font-medium">Order {order}</p><p className="text-xs text-muted-foreground">{status}</p></div><span className={status === 'Delivered' ? 'font-semibold text-primary' : 'text-muted-foreground'}>{profit}</span></div>)}</div></div><p className="mt-5 text-xs text-muted-foreground">Your earnings become available when the order is successfully delivered.</p></div></div></div></section>

        <section className="container py-16 md:py-24"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Built for sharing</p><h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">Why become a Tallaby affiliate?</h2><p className="mt-5 leading-relaxed text-muted-foreground">A thoughtful recommendation should be easy to share and easy to follow through.</p></div><div className="grid gap-3 sm:grid-cols-2">{['No complicated setup', 'Personal promo code', 'Unlimited code usage', '10% customer discount', '10% affiliate commission', 'Automatic wallet credit', 'Transparent order tracking', 'Works across Tallaby products', 'Easy to share on social media'].map(item => <div key={item} className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm"><span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="size-4" /></span>{item}</div>)}</div></div></section>

        <section className="bg-muted/50 py-16 md:py-24"><div className="container max-w-3xl"><div className="text-center"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Questions, answered</p><h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Affiliate program FAQ</h2></div><Accordion type="single" collapsible className="mt-10 flex flex-col gap-3">{faqs.map(([question, answer], index) => <AccordionItem key={question} value={`faq-${index}`}><AccordionTrigger>{question}</AccordionTrigger><AccordionContent className="text-muted-foreground leading-relaxed">{answer}</AccordionContent></AccordionItem>)}</Accordion></div></section>
      </main>

      <section className="bg-primary py-16 text-center text-primary-foreground md:py-20"><div className="container"><h2 className="text-balance text-3xl font-bold md:text-4xl">Ready to start earning with Tallaby?</h2><p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/75">Share your code. Help people save. Earn when they shop.</p><Button asChild size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90"><Link href="/auth/sign-up">Join the Tallaby Affiliate Program <ArrowRight data-icon="inline-end" /></Link></Button></div></section>
    </div>
  )
}
