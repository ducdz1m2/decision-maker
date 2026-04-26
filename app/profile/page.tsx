'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AuthGuard from '../components/AuthGuard'
import LogoutButton from '../components/LogoutButton'
import NotificationButton from '../components/NotificationButton'
import Link from 'next/link'
import Swal from 'sweetalert2'

interface User {
  id: string
  username: string
  full_name?: string
  phone?: string
  address?: string
  avatar_url?: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadUser = () => {
      const userId = localStorage.getItem('user_id')

      if (userId) {
        supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()
          .then(({ data }) => {
            if (data) {
              setUser(data)
              setFullName(data.full_name || '')
              setPhone(data.phone || '')
              setAddress(data.address || '')
              setAvatarUrl(data.avatar_url || '')
            }
          })
      }
    }

    loadUser()
  }, [supabase])

  const handleAvatarUpload = async (file: File) => {
    if (!file) return

    setUploading(true)
    try {
      const userId = localStorage.getItem('user_id')
      if (!userId) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Lỗi upload ảnh: ' + uploadError.message
        })
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      console.log('Avatar URL:', publicUrl)
      setAvatarUrl(publicUrl)
      setAvatarFile(null)
    } catch (error) {
      console.error('Upload error:', error)
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Lỗi upload ảnh'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userId = localStorage.getItem('user_id')
      
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          full_name: fullName,
          phone,
          address,
          avatar_url: avatarUrl,
          currentPassword,
          newPassword,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setUser(data.user)
        setFullName(data.user.full_name || '')
        setPhone(data.user.phone || '')
        setAddress(data.user.address || '')
        setAvatarUrl(data.user.avatar_url || '')
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Cập nhật thành công!',
          timer: 2000,
          showConfirmButton: false
        })
        setCurrentPassword('')
        setNewPassword('')
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: data.error || 'Lỗi cập nhật'
        })
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Lỗi server'
      })
    }

    setLoading(false)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                👤 Profile
              </h1>
              <Link href="/" className="text-blue-600 hover:underline text-sm">
                ← Quay lại trang chính
              </Link>
            </div>
            <div className="flex gap-2">
              <NotificationButton />
              <LogoutButton />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Thông tin tài khoản
            </h2>

            {user && (
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  {avatarUrl || user.avatar_url ? (
                    <img
                      src={avatarUrl || user.avatar_url}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover"
                      onError={(e) => {
                        console.error('Image load error:', e)
                        console.log('Avatar URL:', avatarUrl || user.avatar_url)
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl">
                      👤
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-semibold">{user.full_name || user.username}</p>
                    <p className="text-gray-500">@{user.username}</p>
                    <p className="text-gray-500">{user.phone || 'Chưa cập nhật số điện thoại'}</p>
                    {user.address && <p className="text-gray-500">{user.address}</p>}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Họ tên
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập họ tên"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập địa chỉ (tùy chọn)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Avatar
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setAvatarFile(file)
                        handleAvatarUpload(file)
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={uploading}
                  />
                  {uploading && <span className="text-sm text-gray-500">Đang upload...</span>}
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">
                  Đổi mật khẩu
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
