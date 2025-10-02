import '@/styles/globals.css'
import type { Metadata } from 'next'
import { fetchSiteData } from '@/lib/directus/fetchers'
import VisualEditingLayout from '@/components/layout/VisualEditingLayout'
import { FriendsSidebar } from '@/components/messages/FriendsSidebar'
import { ChatDock } from '@/components/messages/ChatDock'

export const metadata: Metadata = {
  title: 'Simple CMS Next.js',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { globals, headerNavigation, footerNavigation } = await fetchSiteData()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
        <VisualEditingLayout headerNavigation={headerNavigation} footerNavigation={footerNavigation} globals={globals}>
          <main className="flex-grow w-full">{children}</main>
        </VisualEditingLayout>
        {/* mount sidebar and dock at root so they overlay content but not header/footer layout structure */}
        <div className="hidden md:block">
          <FriendsSidebar />
        </div>
        <div className="hidden md:block">
          <ChatDock />
        </div>
      </body>
    </html>
  )
}
