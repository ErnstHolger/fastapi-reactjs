import React from 'react'
import { Button } from './ui/button'
import {
  Home,
  Grid3X3,
  TrendingUp,
  Info,
  Table,
  Brain,
  BarChart3
} from 'lucide-react'

const menuItems = [
  { name: 'Home', icon: Home, path: 'home' },
  { name: 'Configuration', icon: Table, path: 'object' },
  { name: 'Timeseries', icon: TrendingUp, path: 'timeseries' },
  { name: 'Tile', icon: Grid3X3, path: 'tile' },
  { name: 'Models', icon: Brain, path: 'models' },
  { name: 'Model TimeSeries', icon: BarChart3, path: 'model-timeseries' },
  { name: 'About', icon: Info, path: 'about' },
]

export default function Sidebar({ activeItem, onItemClick }) {
  return (
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.path}
              variant={activeItem === item.path ? "default" : "ghost"}
              className={`w-full justify-start gap-3 h-12 ${activeItem === item.path
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
                }`}
              onClick={() => onItemClick(item.path)}
            >
              <Icon size={20} />
              {item.name}
            </Button>
          )
        })}
      </nav>
    </div>
  )
}