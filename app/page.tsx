'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AuthGuard from './components/AuthGuard'
import LogoutButton from './components/LogoutButton'
import Link from 'next/link'
import Swal from 'sweetalert2'

interface Decision {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUsername, setCurrentUsername] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const userId = localStorage.getItem('user_id')
      const username = localStorage.getItem('username')

      if (userId) {
        setCurrentUsername(username || null)

        const { data } = await supabase
          .from('decisions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (data) {
          setDecisions(data)
        }
      }
      setLoading(false)
    }

    loadData()
  }, [])

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Bạn có chắc?',
      text: 'Quyết định này sẽ bị xóa vĩnh viễn!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    })

    if (result.isConfirmed) {
      const { error } = await supabase
        .from('decisions')
        .delete()
        .eq('id', id)

      if (error) {
        Swal.fire('Lỗi', 'Không thể xóa quyết định', 'error')
      } else {
        setDecisions(decisions.filter(d => d.id !== id))
        Swal.fire('Đã xóa', 'Quyết định đã được xóa', 'success')
      }
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                🎯 Decision Maker
              </h1>
              <p className="text-gray-600 mt-1">
                Xin chào, {currentUsername}!
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/profile"
                className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                title="Profile"
              >
                👤
              </Link>
              <LogoutButton />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">
                Các quyết định của bạn
              </h2>
              <Link
                href="/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Tạo quyết định mới
              </Link>
            </div>

            {loading ? (
              <div className="text-center text-gray-500 py-8">Đang tải...</div>
            ) : decisions.length > 0 ? (
              <div className="space-y-3">
                {decisions.map((decision) => (
                  <div
                    key={decision.id}
                    className="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Link
                          href={`/decision/${decision.id}`}
                          className="text-lg font-semibold text-blue-600 hover:underline"
                        >
                          {decision.title}
                        </Link>
                        {decision.description && (
                          <p className="text-gray-600 text-sm mt-1">
                            {decision.description}
                          </p>
                        )}
                        <div className="text-xs text-gray-400 mt-2">
                          Ngày tạo: {new Date(decision.created_at).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(decision.id)}
                        className="ml-4 text-red-500 hover:text-red-700"
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p className="mb-4">Bạn chưa có quyết định nào</p>
                <Link
                  href="/create"
                  className="text-blue-600 hover:underline"
                >
                  Tạo quyết định đầu tiên
                </Link>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4">
            <Link
              href="/history"
              className="text-blue-600 hover:underline"
            >
              Xem lịch sử chi tiết →
            </Link>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
