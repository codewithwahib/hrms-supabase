// src/app/components/footer.tsx
'use client'

import { Roboto } from 'next/font/google'

const roboto = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
})

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={`bg-white border-t border-gray-200 py-4 px-6 ${roboto.className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-500 tracking-wide">
          <div className="text-center md:text-left">
            <span>© {currentYear} </span>
            <span className="font-medium text-[#0071BD]">A to Zee Switchgear Engineering (SMC) Pvt. Ltd.</span>
            <span> - All Rights Reserved</span>
          </div>
          <div className="text-center md:text-right">
            <span>Developed By: </span>
            <span className="font-medium text-[#0071BD]">Muhammad Hassan Jaffer</span>
          </div>
        </div>
      </div>
    </footer>
  )
}