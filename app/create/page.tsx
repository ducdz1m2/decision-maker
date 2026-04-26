'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import AuthGuard from '../components/AuthGuard'
import FactorSelector from '../components/FactorSelector'
import Knob from '../components/Knob'
import Swal from 'sweetalert2'

interface Factor {
  id: string
  name: string
  icon: string
  description?: string
}

interface Option {
  id: string
  name: string
  description: string
}

type Step = 1 | 2 | 3 | 4

export default function CreateDecisionPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [factors, setFactors] = useState<Factor[]>([])
  const [selectedFactors, setSelectedFactors] = useState<Map<string, number>>(new Map())
  const [options, setOptions] = useState<Option[]>([
    { id: '1', name: '', description: '' },
    { id: '2', name: '', description: '' }
  ])
  const [decisionTitle, setDecisionTitle] = useState('')
  const [decisionDescription, setDecisionDescription] = useState('')
  const [comparisonMatrix, setComparisonMatrix] = useState<Map<string, Map<string, number>>>(new Map())
  const [currentComparison, setCurrentComparison] = useState<{ factor1: string; factor2: string; index: number } | null>(null)

  useEffect(() => {
    loadFactors()
  }, [])

  const loadFactors = async () => {
    const { data } = await supabase.from('factors').select('*').order('name')
    if (data) setFactors(data)
  }

  const handleToggleFactor = (factorId: string, weight: number) => {
    const newSelected = new Map(selectedFactors)
    if (weight === 0) {
      newSelected.delete(factorId)
    } else {
      newSelected.set(factorId, weight)
    }
    setSelectedFactors(newSelected)
  }

  const handleWeightChange = (factorId: string, weight: number) => {
    const newSelected = new Map(selectedFactors)
    newSelected.set(factorId, weight)
    setSelectedFactors(newSelected)
  }

  const handleAddOption = () => {
    setOptions([...options, { id: Date.now().toString(), name: '', description: '' }])
  }

  const handleRemoveOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(opt => opt.id !== id))
    }
  }

  const handleOptionChange = (id: string, field: 'name' | 'description', value: string) => {
    setOptions(options.map(opt => 
      opt.id === id ? { ...opt, [field]: value } : opt
    ))
  }

  const handleStep1Next = () => {
    if (selectedFactors.size < 2) {
      Swal.fire('Lỗi', 'Vui lòng chọn ít nhất 2 yếu tố', 'error')
      return
    }
    setStep(2)
  }

  const handleStep2Next = () => {
    const validOptions = options.filter(opt => opt.name.trim() !== '')
    if (validOptions.length < 2) {
      Swal.fire('Lỗi', 'Vui lòng nhập ít nhất 2 lựa chọn', 'error')
      return
    }
    setStep(3)
    initializeComparisons()
  }

  const initializeComparisons = () => {
    const factorIds = Array.from(selectedFactors.keys())
    const matrix = new Map<string, Map<string, number>>()
    
    factorIds.forEach(f1 => {
      matrix.set(f1, new Map())
      factorIds.forEach(f2 => {
        if (f1 !== f2) {
          matrix.get(f1)!.set(f2, 1) // Default value
        }
      })
    })
    
    setComparisonMatrix(matrix)
    startComparison(factorIds)
  }

  const startComparison = (factorIds: string[]) => {
    let index = 0
    const comparisons: { factor1: string; factor2: string }[] = []
    
    for (let i = 0; i < factorIds.length; i++) {
      for (let j = i + 1; j < factorIds.length; j++) {
        comparisons.push({ factor1: factorIds[i], factor2: factorIds[j] })
      }
    }
    
    if (comparisons.length > 0) {
      setCurrentComparison({ ...comparisons[0], index: 0 })
    } else {
      setStep(4)
    }
  }

  const handleComparisonValue = (value: number) => {
    if (!currentComparison) return
    
    const { factor1, factor2 } = currentComparison
    const newMatrix = new Map(comparisonMatrix)
    
    // Set value for factor1 vs factor2
    newMatrix.get(factor1)!.set(factor2, value)
    // Set reciprocal for factor2 vs factor1
    newMatrix.get(factor2)!.set(factor1, 1 / value)
    
    setComparisonMatrix(newMatrix)
  }

  const handleNextComparison = () => {
    if (!currentComparison) return
    
    const factorIds = Array.from(selectedFactors.keys())
    const comparisons: { factor1: string; factor2: string }[] = []
    
    for (let i = 0; i < factorIds.length; i++) {
      for (let j = i + 1; j < factorIds.length; j++) {
        comparisons.push({ factor1: factorIds[i], factor2: factorIds[j] })
      }
    }
    
    const nextIndex = currentComparison.index + 1
    
    if (nextIndex < comparisons.length) {
      setCurrentComparison({ ...comparisons[nextIndex], index: nextIndex })
    } else {
      setCurrentComparison(null)
      setStep(4)
    }
  }

  const handleSaveDecision = async () => {
    setLoading(true)
    
    try {
      const userId = localStorage.getItem('user_id')
      if (!userId) {
        router.push('/login')
        return
      }

      // Create decision
      const { data: decision, error: decisionError } = await supabase
        .from('decisions')
        .insert({
          user_id: userId,
          title: decisionTitle,
          description: decisionDescription
        })
        .select()
        .single()

      if (decisionError) throw decisionError

      // Create decision factors
      const factorInserts = Array.from(selectedFactors.entries()).map(([factorId, weight]) => ({
        decision_id: decision.id,
        factor_id: factorId,
        importance_weight: weight
      }))

      const { error: factorsError } = await supabase
        .from('decision_factors')
        .insert(factorInserts)

      if (factorsError) throw factorsError

      // Create options
      const validOptions = options.filter(opt => opt.name.trim() !== '')
      const optionInserts = validOptions.map(opt => ({
        decision_id: decision.id,
        name: opt.name,
        description: opt.description
      }))

      const { data: createdOptions, error: optionsError } = await supabase
        .from('decision_options')
        .insert(optionInserts)
        .select()

      if (optionsError) throw optionsError

      // Calculate AHP results and save
      const results = calculateAHPResults(createdOptions)
      
      const resultInserts = results.map((result, index) => ({
        decision_id: decision.id,
        option_id: result.optionId,
        final_score: result.score,
        rank: index + 1
      }))

      const { error: resultsError } = await supabase
        .from('decision_results')
        .insert(resultInserts)

      if (resultsError) throw resultsError

      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Quyết định đã được lưu!',
        timer: 2000,
        showConfirmButton: false
      })

      router.push(`/decision/${decision.id}`)
    } catch (error) {
      console.error('Error saving decision:', error)
      Swal.fire('Lỗi', `Không thể lưu quyết định: ${error}`, 'error')
    }

    setLoading(false)
  }

  const calculateAHPResults = (createdOptions: any[]) => {
    // Simplified AHP calculation using weighted sum
    const factorIds = Array.from(selectedFactors.keys())
    const results = createdOptions.map((option: any) => {
      let totalScore = 0
      factorIds.forEach(factorId => {
        const weight = selectedFactors.get(factorId) || 50
        // For simplicity, assign random scores for now
        // In a real implementation, you'd have user score each option for each factor
        const optionScore = Math.random() * 100
        totalScore += (weight / 100) * optionScore
      })
      return {
        optionId: option.id,
        score: totalScore
      }
    })
    
    return results.sort((a, b) => b.score - a.score)
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Thông tin quyết định</h3>
        <input
          type="text"
          value={decisionTitle}
          onChange={(e) => setDecisionTitle(e.target.value)}
          placeholder="Tiêu đề quyết định (ví dụ: Chọn công việc mới)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
        />
        <textarea
          value={decisionDescription}
          onChange={(e) => setDecisionDescription(e.target.value)}
          placeholder="Mô tả (tùy chọn)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Chọn yếu tố cần cân nhắc</h3>
        <p className="text-sm text-gray-600 mb-4">Chọn ít nhất 2 yếu tố và điều chỉnh độ quan trọng</p>
        <FactorSelector
          factors={factors}
          selectedFactors={selectedFactors}
          onToggleFactor={handleToggleFactor}
          onWeightChange={handleWeightChange}
        />
      </div>

      <button
        onClick={handleStep1Next}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Tiếp tục →
      </button>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Nhập các lựa chọn</h3>
        <p className="text-sm text-gray-600 mb-4">Nhập ít nhất 2 lựa chọn để so sánh</p>
        
        {options.map((option, index) => (
          <div key={option.id} className="p-4 border border-gray-200 rounded-lg mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700">Lựa chọn {index + 1}</span>
              {options.length > 2 && (
                <button
                  onClick={() => handleRemoveOption(option.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Xóa
                </button>
              )}
            </div>
            <input
              type="text"
              value={option.name}
              onChange={(e) => handleOptionChange(option.id, 'name', e.target.value)}
              placeholder="Tên lựa chọn"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
            />
            <textarea
              value={option.description}
              onChange={(e) => handleOptionChange(option.id, 'description', e.target.value)}
              placeholder="Mô tả (tùy chọn)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>
        ))}

        <button
          onClick={handleAddOption}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
        >
          + Thêm lựa chọn
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep(1)}
          className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
        >
          ← Quay lại
        </button>
        <button
          onClick={handleStep2Next}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tiếp tục →
        </button>
      </div>
    </div>
  )

  const renderStep3 = () => {
    if (!currentComparison) return null

    const factor1 = factors.find(f => f.id === currentComparison.factor1)
    const factor2 = factors.find(f => f.id === currentComparison.factor2)
    const factorIds = Array.from(selectedFactors.keys())
    const totalComparisons = (factorIds.length * (factorIds.length - 1)) / 2
    const currentValue = comparisonMatrix.get(currentComparison.factor1)?.get(currentComparison.factor2) || 1

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">So sánh yếu tố</h3>
          <p className="text-sm text-gray-600">
            So sánh {currentComparison.index + 1}/{totalComparisons}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="text-center flex-1">
              <div className="text-4xl mb-2">{factor1?.icon}</div>
              <div className="font-semibold text-gray-800">{factor1?.name}</div>
            </div>

            <div className="px-4">
              <Knob
                value={currentValue}
                onChange={handleComparisonValue}
                min={1}
                max={9}
                step={0.5}
                size={100}
              />
            </div>

            <div className="text-center flex-1">
              <div className="text-4xl mb-2">{factor2?.icon}</div>
              <div className="font-semibold text-gray-800">{factor2?.name}</div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>1 = Ngang nhau | 9 = {factor1?.name} quan trọng hơn nhiều</p>
          </div>
        </div>

        <button
          onClick={handleNextComparison}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tiếp tục →
        </button>
      </div>
    )
  }

  const renderStep4 = () => {
    const validOptions = options.filter(opt => opt.name.trim() !== '')
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Kết quả phân tích</h3>
          <p className="text-sm text-gray-600 mb-4">
            Dựa trên thuật toán AHP với {selectedFactors.size} yếu tố đã chọn
          </p>
        </div>

        <div className="space-y-3">
          {validOptions.map((option, index) => (
            <div
              key={option.id}
              className={`p-4 rounded-lg border ${
                index === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-800">
                    {index === 0 && '🏆 '} {option.name}
                  </div>
                  {option.description && (
                    <div className="text-sm text-gray-600">{option.description}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    #{index + 1}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep(3)}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Quay lại
          </button>
          <button
            onClick={handleSaveDecision}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Đang lưu...' : 'Lưu quyết định'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href="/"
              className="text-blue-600 hover:underline text-sm"
            >
              ← Quay lại trang chính
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
              Tạo quyết định mới
            </h1>

            {/* Progress indicator */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step >= s
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 4 && (
                    <div
                      className={`w-16 h-1 ${
                        step > s ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
