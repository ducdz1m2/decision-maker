'use client'

import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

export default function NotificationButton() {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const handleClick = () => {
    if (!('Notification' in window)) {
      Swal.fire({
        icon: 'warning',
        title: 'Cảnh báo',
        text: 'Browser không hỗ trợ thông báo'
      })
      return
    }

    if (permission === 'default') {
      Notification.requestPermission().then(newPermission => {
        setPermission(newPermission)
        if (newPermission === 'granted') {
          new Notification('Thông báo đã bật!', { body: 'Bạn sẽ nhận được thông báo khi có quyết định mới.' })
        }
      })
    } else if (permission === 'denied') {
      Swal.fire({
        icon: 'warning',
        title: 'Cảnh báo',
        text: 'Thông báo đã bị chặn. Vào browser settings để bật lại.'
      })
    }
  }

  const getButtonColor = () => {
    if (!('Notification' in window)) return 'bg-gray-500 hover:bg-gray-600'
    if (permission === 'default') return 'bg-blue-500 hover:bg-blue-600'
    if (permission === 'granted') return 'bg-green-500 hover:bg-green-600'
    return 'bg-red-500 hover:bg-red-600'
  }

  return (
    <button
      onClick={handleClick}
      className={`${getButtonColor()} text-white px-3 py-2 rounded-lg transition-colors`}
      title={permission === 'default' ? 'Bật thông báo' : permission === 'granted' ? 'Đã bật' : 'Đã chặn'}
    >
      🔔
    </button>
  )
}
