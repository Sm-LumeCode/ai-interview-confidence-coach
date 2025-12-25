import React from 'react'
import { Code, Database, Brain, Cloud, Shield } from 'lucide-react'

const categories = [
  {
    id: 'software_development',
    name: 'Software Development',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    description: 'Master coding interviews and system design'
  },
  {
    id: 'data_analytics',
    name: 'Data & Analytics',
    icon: Database,
    color: 'from-purple-500 to-pink-500',
    description: 'Excel in data analysis and visualization'
  },
  {
    id: 'data_science_ml',
    name: 'Data Science & ML',
    icon: Brain,
    color: 'from-green-500 to-emerald-500',
    description: 'Ace machine learning and AI interviews'
  },
  {
    id: 'cloud_devops',
    name: 'Cloud & DevOps',
    icon: Cloud,
    color: 'from-orange-500 to-red-500',
    description: 'Prepare for cloud and DevOps roles'
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    icon: Shield,
    color: 'from-indigo-500 to-purple-500',
    description: 'Secure your cybersecurity interview'
  }
]

const RoleSelector = ({ onSelectRole }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {categories.map((category, index) => {
        const Icon = category.icon
        return (
          <div
            key={category.id}
            className="card cursor-pointer transform hover:scale-105 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => onSelectRole(category.id)}
          >
            <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${category.color} flex items-center justify-center mb-4`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{category.name}</h3>
            <p className="text-gray-600">{category.description}</p>
            <div className="mt-4 flex items-center text-blue-600 font-semibold">
              <span>Start Practice</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default RoleSelector