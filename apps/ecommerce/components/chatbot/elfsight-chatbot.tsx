import Script from 'next/script'

const ELFSIGHT_APP_ID = 'f5f6fef6-c0f0-41de-b107-072948b80fc4'

/**
 * Elfsight AI Chatbot widget. Loaded once globally with `lazyOnload` so it
 * never competes with page content for bandwidth.
 */
export function ElfsightChatbot () {
  return (
    <>
      <Script
        id="elfsight-platform"
        src="https://elfsightcdn.com/platform.js"
        strategy="lazyOnload"
      />
      <div className={`elfsight-app-${ELFSIGHT_APP_ID}`} data-elfsight-app-lazy />
    </>
  )
}
