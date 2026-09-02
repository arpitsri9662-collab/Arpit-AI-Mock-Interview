import { motion } from "framer-motion"
import { useState } from "react"
import { useAuthStore } from "../store/authStore"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sidebar, SidebarItem } from "@/components/ui/sidebar"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/theme-provider"
import {
  User,
  Home,
  Play,
  FileText,
  TrendingUp,
  Settings as SettingsIcon,
  Bell,
  Moon,
  Lock,
  Globe,
  Trash2,
  ShieldAlert
} from "lucide-react"
import { authAPI } from "../services/api"

export default function Settings() {
  const { user, setUser } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const isDarkMode = theme === 'dark'

  const handleUpdateRole = async (newRole: string) => {
    if (!user) return
    setLoading(true)
    try {
      await authAPI.updateSettings({ role: newRole })
      setUser({ ...user, role: newRole })
      alert('Default role updated successfully!')
    } catch (error) {
      console.error('Update failed:', error)
      alert('Failed to update settings.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar>
          <SidebarItem icon={<Home />} onClick={() => navigate('/dashboard')}>
            Dashboard
          </SidebarItem>
          <SidebarItem icon={<Play />} onClick={() => navigate('/interview')}>
            Start Interview
          </SidebarItem>
          <SidebarItem icon={<FileText />} onClick={() => navigate('/resume')}>
            Resume Analysis
          </SidebarItem>
          <SidebarItem icon={<TrendingUp />} onClick={() => navigate('/analytics')}>
            Analytics
          </SidebarItem>
          <SidebarItem icon={<User />} onClick={() => navigate('/profile')}>
            Profile
          </SidebarItem>
          <SidebarItem icon={<SettingsIcon />} isActive={true}>
            Settings
          </SidebarItem>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">Platform Settings</h1>

            <div className="space-y-6">
              {/* Account Preferences */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-indigo-500" />
                    Interview Role
                  </CardTitle>
                  <CardDescription>Select your primary goal on the platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant={user?.role === 'candidate' ? 'default' : 'outline'}
                        onClick={() => handleUpdateRole('candidate')}
                        disabled={loading}
                        className="h-16"
                      >
                        Candidate (Looking for Jobs)
                      </Button>
                      <Button 
                        variant={user?.role === 'admin' ? 'default' : 'outline'}
                        onClick={() => handleUpdateRole('interviewer')}
                        disabled={loading}
                        className="h-16"
                      >
                        Interviewer (Practicing Reviews)
                      </Button>
                   </div>
                </CardContent>
              </Card>

              {/* Appearance */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="h-5 w-5 text-blue-500" />
                    Appearance
                  </CardTitle>
                  <CardDescription>Manage how the platform looks for you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark themes.</p>
                    </div>
                    <Switch
                      checked={isDarkMode}
                      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                      aria-label="Toggle dark mode"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-emerald-500" />
                    Notifications
                  </CardTitle>
                  <CardDescription>Configure your email and platform alerts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Interview Reminders</Label>
                      <p className="text-sm text-slate-500">Receive alerts about upcoming mock interviews.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Performance Reports</Label>
                      <p className="text-sm text-slate-500">Weekly summary of your session analytics.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-purple-500" />
                    Security
                  </CardTitle>
                  <CardDescription>Secure your account with advanced options.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start rounded-xl py-6">
                    <Lock className="mr-4 h-5 w-5" />
                    Change Account Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-xl py-6">
                    <Globe className="mr-4 h-5 w-5" />
                    Manage Active Login Sessions
                  </Button>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-200 bg-red-50/20 dark:bg-red-950/10 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>Permanent actions that cannot be undone.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" className="rounded-xl">
                    Deactivate Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
