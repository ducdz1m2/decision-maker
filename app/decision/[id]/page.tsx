'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AuthGuard from '../../components/AuthGuard'
import LogoutButton from '../../components/LogoutButton'
import Link from 'next/link'
import Swal from 'sweetalert2'

interface Decision {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
}

interface DecisionFactor {
  factor_id: string
  importance_weight: number
  factor: {
    id: string
    name: string
    icon: string
    description?: string
  }
}

interface DecisionOption {
  id: string
  name: string
  description: string
}

interface DecisionResult {
  option_id: string
  final_score: number
  rank: number
  option: {
    id: string
    name: string
    description: string
  }
}

export default function DecisionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [decision, setDecision] = useState<Decision | null>(null)
  const [factors, setFactors] = useState<DecisionFactor[]>([])
  const [options, setOptions] = useState<DecisionOption[]>([])
  const [results, setResults] = useState<DecisionResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDecisionData()
  }, [params.id])

  const loadDecisionData = async () => {
    try {
      const { data: decisionData } = await supabase
        .from('decisions')
        .select('*')
        .eq('id', params.id)
        .single()

      if (decisionData) {
        setDecision(decisionData)

        // Load factors with details
        const { data: factorsData } = await supabase
          .from('decision_factors')
          .select('*, factor:factors(*)')
          .eq('decision_id', params.id)

        if (factorsData) {
          setFactors(factorsData)
        }

        // Load options
        const { data: optionsData } = await supabase
          .from('decision_options')
          .select('*')
          .eq('decision_id', params.id)

        if (optionsData) {
          setOptions(optionsData)
        }

        // Load results with option details
        const { data: resultsData } = await supabase
          .from('decision_results')
          .select('*, option:decision_options(*)')
          .eq('decision_id', params.id)
          .order('rank', { ascending: true })

        if (resultsData) {
          setResults(resultsData)
        }
      }
    } catch (error) {
      console.error('Error loading decision:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
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
        .eq('id', params.id)

      if (error) {
        Swal.fire('Lỗi', 'Không thể xóa quyết định', 'error')
      } else {
        Swal.fire('Đã xóa', 'Quyết định đã được xóa', 'success')
        router.push('/')
      }
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      </AuthGuard>
    )
  }

  if (!decision) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">Không tìm thấy quyết định</div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Link
              href="/"
              className="text-blue-600 hover:underline text-sm"
            >
              ← Quay lại trang chính
            </Link>
            <LogoutButton />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  {decision.title}
                </h1>
                {decision.description && (
                  <p className="text-gray-600">{decision.description}</p>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  Ngày tạo: {new Date(decision.created_at).toLocaleString('vi-VN')}
                </div>
              </div>
              <button
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700"
                title="Xóa quyết định"
              >
                🗑️
              </button>
            </div>
          </div>

          {/* Factors */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Các yếu tố đã chọn ({factors.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {factors.map((df) => (
                <div
                  key={df.factor_id}
                  className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{df.factor.icon}</span>
                    <span className="font-medium text-sm text-gray-800">
                      {df.factor.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Độ quan trọng: {df.importance_weight}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Kết quả phân tích
            </h2>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={result.option_id}
                  className={`p-4 rounded-lg border ${
                    index === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-800">
                        {index === 0 && '🏆 '} {result.option.name}
                      </div>
                      {result.option.description && (
                        <div className="text-sm text-gray-600 mt-1">
                          {result.option.description}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        #{result.rank}
                      </div>
                      <div className="text-sm text-gray-500">
                        Điểm: {result.final_score.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Các lựa chọn ({options.length})
            </h2>
            <div className="space-y-3">
              {options.map((option) => (
                <div
                  key={option.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="font-medium text-gray-800">{option.name}</div>
                  {option.description && (
                    <div className="text-sm text-gray-600 mt-1">
                      {option.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
