'use client'

interface KnobProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  size?: number
  label?: string
}

export default function Knob({
  value,
  onChange,
  min = 1,
  max = 9,
  step = 0.5,
  label
}: KnobProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    onChange(newValue)
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-xs">
      {label && <span className="text-sm font-medium text-gray-600">{label}</span>}
      
      <div className="flex items-center gap-4 w-full">
        <span className="text-3xl font-bold text-blue-600 w-12 text-center">
          {value}
        </span>
        
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
      
      <div className="text-xs text-gray-500">
        {min} - {max}
      </div>
    </div>
  )
}
