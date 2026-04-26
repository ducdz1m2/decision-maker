'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AuthGuard from '../components/AuthGuard'
import LogoutButton from '../components/LogoutButton'
import Link from 'next/link'

interface Decision {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
}

export default function HistoryPage() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [filteredDecisions, setFilteredDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const loadData = async () => {
      const userId = localStorage.getItem('user_id')

      if (userId) {
        const { data } = await supabase
          .from('decisions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (data) {
          setDecisions(data)
          setFilteredDecisions(data)
        }
      }
      setLoading(false)
    }

    loadData()
  }, [])

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredDecisions(decisions)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = decisions.filter(decision =>
        decision.title.toLowerCase().includes(term) ||
        decision.description?.toLowerCase().includes(term)
      )
      setFilteredDecisions(filtered)
    }
    setCurrentPage(1)
  }, [searchTerm, decisions])

  const totalPages = Math.ceil(filteredDecisions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDecisions = filteredDecisions.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                📜 Lịch sử
              </h1>
              <Link href="/" className="text-blue-600 hover:underline text-sm">
                ← Quay lại trang chính
              </Link>
            </div>
            <LogoutButton />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Lịch sử quyết định của bạn
            </h2>

            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tiêu đề, mô tả..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {loading ? (
              <div className="text-center text-gray-500 py-8">Đang tải...</div>
            ) : currentDecisions.length > 0 ? (
              <>
                <div className="space-y-3">
                  {currentDecisions.map((decision) => (
                    <div
                      key={decision.id}
                      className="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
                    >
                      <Link href={`/decision/${decision.id}`}>
                        <div className="font-semibold text-lg text-blue-600 hover:underline">
                          {decision.title}
                        </div>
                        {decision.description && (
                          <div className="text-gray-600 text-sm mt-1">
                            {decision.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-2">
                          Ngày tạo: {new Date(decision.created_at).toLocaleString('vi-VN')}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ←
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            ) : searchTerm ? (
              <div className="text-center text-gray-500 py-8">
                Không tìm thấy kết quả nào
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Chưa có quyết định nào
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
