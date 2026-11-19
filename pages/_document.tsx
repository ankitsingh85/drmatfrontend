import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Runs before hydration, before the browser applies its own
            scroll-restoration on reload/back-forward — without this, a
            React effect runs too late and the page has already jumped
            to wherever it was scrolled last time, since the browser's
            native restoration happens as part of the navigation itself. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }`,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
