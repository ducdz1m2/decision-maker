'use client'

import { useState } from 'react'

interface Factor {
  id: string
  name: string
  icon: string
  description?: string
}

interface FactorSelectorProps {
  factors: Factor[]
  selectedFactors: Map<string, number>
  onToggleFactor: (factorId: string, weight: number) => void
  onWeightChange: (factorId: string, weight: number) => void
}

export default function FactorSelector({
  factors,
  selectedFactors,
  onToggleFactor,
  onWeightChange
}: FactorSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredFactors = factors.filter(factor =>
    factor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    factor.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm yếu tố..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
        {filteredFactors.map((factor) => {
          const isSelected = selectedFactors.has(factor.id)
          const weight = selectedFactors.get(factor.id) || 50

          return (
            <div
              key={factor.id}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => {
                if (isSelected) {
                  onToggleFactor(factor.id, 0)
                } else {
                  onToggleFactor(factor.id, 50)
                }
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{factor.icon}</span>
                <span className="font-medium text-sm text-gray-800">
                  {factor.name}
                </span>
              </div>

              {isSelected && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Độ quan trọng</span>
                    <span>{weight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={weight}
                    onChange={(e) => {
                      onWeightChange(factor.id, parseInt(e.target.value))
                      e.stopPropagation()
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedFactors.size > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            Đã chọn <strong>{selectedFactors.size}</strong> yếu tố
          </p>
        </div>
      )}
    </div>
  )
}
