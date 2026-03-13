import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, LogOut, TrendingUp, Target, User } from 'lucide-react'

const Navbar = ({ user, onLogout }) => {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="glass-effect shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold gradient-text">AI Interview Coach</h1>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/dashboard')
                  ? 'bg-[radial-gradient(circle_farthest-corner_at_32.7%_49.8%,rgba(28,88,238,1)_0%,rgba(0,39,137,1)_100.2%)] text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>

            <Link
              to="/progress"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/progress')
                  ? 'bg-[radial-gradient(circle_farthest-corner_at_32.7%_49.8%,rgba(28,88,238,1)_0%,rgba(0,39,137,1)_100.2%)] text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="hidden sm:inline">Progress</span>
            </Link>

            <Link
              to="/challenges"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/challenges')
                  ? 'bg-[radial-gradient(circle_farthest-corner_at_32.7%_49.8%,rgba(28,88,238,1)_0%,rgba(0,39,137,1)_100.2%)] text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Target className="w-5 h-5" />
              <span className="hidden sm:inline">Challenges</span>
            </Link>

            <Link
              to="/profile"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/profile')
                  ? 'bg-[radial-gradient(circle_farthest-corner_at_32.7%_49.8%,rgba(28,88,238,1)_0%,rgba(0,39,137,1)_100.2%)] text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">Profile</span>
            </Link>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar