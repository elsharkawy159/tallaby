import Script from 'next/script'

const ZOLAI_AGENT_KEY = 'pk_fb48cfbc82c045f08d468bbfc19e221f'

/**
 * Zolai chatbot widget. Loaded once globally with `lazyOnload` so it
 * never competes with page content for bandwidth.
 */
export function ZolaiChatbot () {
  return (
    <Script
      id="zolai-widget"
      src="https://zolai.io/widget.js"
      data-agent={ZOLAI_AGENT_KEY}
      strategy="lazyOnload"
    />
  )
}
