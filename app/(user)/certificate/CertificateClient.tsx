'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Share2 } from 'lucide-react'

interface Props {
  userName: string
  batchName: string
  completionDate: string
}

export default function CertificateClient({ userName, batchName, completionDate }: Props) {
  const router = useRouter()
  const formattedDate = new Date(completionDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  function handleDownload() {
    window.print()
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HealEasy — Program Completed!',
          text: `I completed the ${batchName} program on HealEasy! 12 days of dedication.`,
        })
      } catch {
        // User cancelled
      }
    }
  }

  return (
    <>
      {/* Screen-only header */}
      <div className="print:hidden bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1.5 text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-semibold text-gray-900">Your Certificate</h1>
          </div>
          <div className="flex items-center gap-2">
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-sm text-green-600 font-medium px-3 py-1.5 rounded-lg hover:bg-green-50"
              >
                <Share2 size={15} /> Share
              </button>
            )}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-sm bg-green-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-green-700"
            >
              <Download size={15} /> Download
            </button>
          </div>
        </div>
      </div>

      {/* Certificate */}
      <div className="min-h-screen bg-gray-50 print:bg-white flex items-center justify-center p-4 print:p-0">
        <div className="w-full max-w-xl bg-white rounded-2xl print:rounded-none shadow-lg print:shadow-none overflow-hidden">
          {/* Decorative top border */}
          <div className="h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600" />

          <div className="p-8 sm:p-12 text-center">
            {/* Decorative border frame */}
            <div className="border-2 border-green-200 rounded-xl p-8 sm:p-10">
              {/* Logo */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-600 mb-4">
                <span className="text-white text-xl font-bold">H</span>
              </div>

              {/* Header */}
              <p className="text-sm font-medium text-green-600 uppercase tracking-widest mb-1">
                Certificate of Completion
              </p>
              <div className="w-16 h-0.5 bg-green-300 mx-auto mb-6" />

              {/* Body */}
              <p className="text-sm text-gray-500 mb-2">This certifies that</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                {userName}
              </h2>
              <p className="text-sm text-gray-500 mb-6">has successfully completed the</p>

              {/* Program name */}
              <div className="bg-green-50 rounded-xl py-4 px-6 mb-6">
                <h3 className="text-lg font-bold text-green-800">L1 10+2 Detox Program</h3>
                <p className="text-sm text-green-600 mt-1">{batchName}</p>
              </div>

              {/* Details */}
              <p className="text-sm text-gray-500 mb-1">
                All 12 days completed
              </p>
              <p className="text-sm text-gray-400">
                {formattedDate}
              </p>

              {/* Divider */}
              <div className="w-16 h-0.5 bg-green-300 mx-auto my-6" />

              {/* Footer */}
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-md bg-green-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">H</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">HealEasy</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Wellness Through Discipline</p>
            </div>
          </div>

          {/* Decorative bottom border */}
          <div className="h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600" />
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:bg-white, .print\\:bg-white * { visibility: visible; }
          .print\\:hidden { display: none !important; }
          @page { margin: 0; size: A4 landscape; }
        }
      `}</style>
    </>
  )
}
