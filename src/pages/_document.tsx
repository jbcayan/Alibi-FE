import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* UnivaPay widget script for global availability */}
        <script
          id="univapay-widget-global"
          src="https://widget.univapay.com/client/checkout.js"
          async={false}
          type="text/javascript"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
