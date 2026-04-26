'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    localStorage.removeItem('user_id')
    localStorage.removeItem('username')
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
      title="Đăng xuất"
    >
      🚪
    </button>
  )
}
