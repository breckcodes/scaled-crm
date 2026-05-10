import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('scaled_crm_token')
    const savedUser = localStorage.getItem('scaled_crm_user')

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        if (parsedUser.id && parsedUser.id !== 0 && savedToken !== 'dev-token' && !savedToken.startsWith('dev-')) {
          setToken(savedToken)
          setUser(parsedUser)
        } else {
          localStorage.removeItem('scaled_crm_token')
          localStorage.removeItem('scaled_crm_user')
        }
      } catch {
        localStorage.removeItem('scaled_crm_token')
        localStorage.removeItem('scaled_crm_user')
      }
    }
    setLoading(false)
  }, [])

  const login = (token, user) => {
    localStorage.setItem('scaled_crm_token', token)
    localStorage.setItem('scaled_crm_user', JSON.stringify(user))
    setToken(token)
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem('scaled_crm_token')
    localStorage.removeItem('scaled_crm_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, logout,
      isAuthenticated: !!token && !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
