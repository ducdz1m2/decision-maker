import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { userId, full_name, phone, address, avatar_url, currentPassword, newPassword } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID là bắt buộc' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Không tìm thấy user' },
        { status: 404 }
      )
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Cần nhập mật khẩu hiện tại để đổi mật khẩu' },
          { status: 400 }
        )
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)

      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Mật khẩu hiện tại không đúng' },
          { status: 401 }
        )
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
          { status: 400 }
        )
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10)

      // Update user with new password
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          full_name,
          phone,
          address,
          avatar_url,
          password_hash: newPasswordHash
        })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json(
          { error: 'Lỗi khi cập nhật user' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { user: updatedUser, message: 'Cập nhật thành công' },
        { status: 200 }
      )
    } else {
      // Update user without password change
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          full_name,
          phone,
          address,
          avatar_url
        })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json(
          { error: 'Lỗi khi cập nhật user' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { user: updatedUser, message: 'Cập nhật thành công' },
        { status: 200 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
