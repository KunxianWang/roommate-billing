'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  createdAt: string
  _count?: {
    expensesPaid: number
    expenseSplits: number
  }
}

export default function UserManagement() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除此用户吗？只有没有未结算账单的用户才能被删除。')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('用户删除成功')
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || '删除失败')
      }
    } catch (error) {
      alert('删除失败，请重试')
    }
  }

  const currentUserEmail = session?.user?.email

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">用户管理</h2>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
           只能删除没有未结算账单的用户。删除用户前请确保已结算所有相关账单。
        </p>
      </div>

      <div className="space-y-2">
        {users.map(user => (
          <div key={user.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              {user.image && (
                <img
                  src={user.image}
                  alt={user.name || ''}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {user.name || user.email}
                  {user.email === currentUserEmail && ' (我)'}
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            
            {user.email !== currentUserEmail && (
              <button
                onClick={() => handleDeleteUser(user.id)}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50"
              >
                删除
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}