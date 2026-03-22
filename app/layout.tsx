import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import './globals.css'
import { ModelProvider } from '@/components/context/ModelContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Conversa — Offline Voice AI',
  description: 'A fully offline, voice-first AI assistant that runs entirely in your browser. Private by design.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#0B0F19',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Pre-load WASM modules before React hydration */}
        <Script
          id="wasm-preloader"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                console.log('[WASMPreloader] Starting module pre-load...');
                
                const modules = [
                  { url: '/assets/racommons-llamacpp.js', global: '__llamacpp_cpu__', name: 'LlamaCpp CPU' },
                  { url: '/assets/racommons-llamacpp-webgpu.js', global: '__llamacpp_webgpu__', name: 'LlamaCpp WebGPU' },
                  { url: '/assets/sherpa/sherpa-onnx-glue.js', global: '__sherpa_onnx__', name: 'Sherpa ONNX' },
                ];
                
                async function loadModule(mod) {
                  try {
                    console.log('[WASMPreloader] Fetching ' + mod.name + '...');
                    const response = await fetch(mod.url);
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    
                    const code = await response.text();
                    const blob = new Blob([code], { type: 'application/javascript' });
                    const blobURL = URL.createObjectURL(blob);
                    
                    const module = await import(blobURL);
                    window[mod.global] = module.default || module;
                    
                    console.log('[WASMPreloader] ' + mod.name + ' loaded ✓');
                  } catch (error) {
                    console.error('[WASMPreloader] Failed to load ' + mod.name + ':', error);
                    throw error;
                  }
                }
                
                Promise.all(modules.map(loadModule))
                  .then(() => {
                    console.log('[WASMPreloader] All modules pre-loaded ✓');
                    window.__WASM_MODULES_READY__ = true;
                  })
                  .catch((error) => {
                    console.error('[WASMPreloader] Pre-load failed:', error);
                    window.__WASM_MODULES_ERROR__ = error.message;
                  });
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ModelProvider>
          {children}
        </ModelProvider>
        <Analytics />
      </body>
    </html>
  )
}
