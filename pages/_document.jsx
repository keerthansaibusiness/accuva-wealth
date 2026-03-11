import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Accuva Wealth — Elite AI-powered wealth and asset management platform for professional financial advisors and portfolio managers." />
        <meta name="keywords" content="wealth management, asset management, AI advisor, portfolio analysis, financial advisor, investment recommendations, risk assessment, market insights" />
        <meta name="author" content="Accuva Wealth" />
        <meta property="og:title" content="Accuva Wealth — AI Wealth Analyst Platform" />
        <meta property="og:description" content="Institutional-grade AI wealth management for professional financial advisors. Portfolio analysis, investment recommendations, risk assessment and forecasting." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Accuva Wealth — AI Wealth Analyst Platform" />
        <meta name="twitter:description" content="Institutional-grade AI wealth management for professional financial advisors." />
        <meta name="robots" content="index, follow" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⬡</text></svg>" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
