"use client"

import { Inter } from 'next/font/google'
import clsx from 'clsx'
import { DynamicContextProvider, DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

import '@/styles/tailwind.css'
import { type Metadata } from 'next'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={clsx('h-full antialiased', inter.variable)}
    >
      <body className="flex h-full flex-col">
        <div className="flex min-h-full flex-col">
          <DynamicContextProvider
            settings={{
              environmentId: '3f22ba21-68b9-4b63-916a-53ad9d92fcce',
              walletConnectors: [EthereumWalletConnectors],
            }}>
              {children}
            <DynamicWidget />
          </DynamicContextProvider>
        </div>
      </body>
    </html>
  )
}
