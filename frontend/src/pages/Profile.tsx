import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { useAuthStore } from "../store/authStore"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar, SidebarItem } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ThemeToggle"
import {
  User,
  Mail,
  Shield,
  Home,
  Play,
  FileText,
  TrendingUp,
  Settings as SettingsIcon,
  LogOut,
  Camera,
  Award,
  Save,
  X,
  Video,
  Trash2,
  Globe,
  GlobeLock,
  Clock,
  BarChart3,
} from "lucide-react"
import { authAPI, demoAPI, analyticsAPI } from "../services/api"
import { Analytics as AnalyticsData } from "../types"

interface Recording {
  _id: string
  recordingUrl: string
  recordingDuration: number
  isPublished: boolean
  finalScore: number
  questions: any[]
  completedAt: string
}

export default function Profile() {
  const { user, setUser, logout } = useAuthStore()
  const navigate = useNavigate()
  
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    role: user?.role || ''
  })
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [recordingsLoading, setRecordingsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    loadRecordings()
    loadAnalytics()
  }, [])

  const loadRecordings = async () => {
    try {
      const res = await demoAPI.getMyRecordings()
      setRecordings(res.data)
    } catch (error) {
      console.error('Error loading recordings:', error)
    } finally {
      setRecordingsLoading(false)
    }
  }

  const loadAnalytics = async () => {
    if (!user?.id) return
    try {
      const res = await analyticsAPI.getUserAnalytics(user.id)
      setAnalytics(res.data)
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    try {
      const response = await authAPI.updateProfile(formData)
      setUser({ ...user, ...response.data.user })
      setIsEditing(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Update failed:', error)
      alert('Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (id: string) => {
    setActionLoading(id)
    try {
      await demoAPI.publish(id)
      setRecordings(prev => prev.map(r => r._id === id ? { ...r, isPublished: true } : r))
    } catch (error) {
      console.error('Publish failed:', error)
      alert('Failed to publish.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnpublish = async (id: string) => {
    setActionLoading(id)
    try {
      await demoAPI.unpublish(id)
      setRecordings(prev => prev.map(r => r._id === id ? { ...r, isPublished: false } : r))
    } catch (error) {
      console.error('Unpublish failed:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recording? This cannot be undone.')) return
    setActionLoading(id)
    try {
      await demoAPI.deleteRecording(id)
      setRecordings(prev => prev.filter(r => r._id !== id))
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete.')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
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
          <SidebarItem icon={<User />} isActive={true}>
            Profile
          </SidebarItem>
          <SidebarItem icon={<SettingsIcon />} onClick={() => navigate('/settings')}>
            Settings
          </SidebarItem>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">User Profile</h1>
              <div className="flex gap-3">
                <ThemeToggle />
                <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? <X className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
                <Button variant="destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* Profile Card */}
              <Card className="md:col-span-1 border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                <CardContent className="pt-8 text-center">
                  <div className="relative inline-block mb-6">
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl text-white font-bold mx-auto border-4 border-white dark:border-slate-800 shadow-xl">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full shadow-lg"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
                  <p className="text-slate-500 mb-4 capitalize dark:text-slate-400">{user?.role || 'Interviewer'}</p>
                  <div className="flex justify-center gap-2">
                    <Badge variant="secondary" className="capitalize">{user?.role || 'candidate'}</Badge>
                    <Badge className="bg-emerald-500">{analytics?.totalInterviews || 0} interviews</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Details and Stats */}
              <div className="md:col-span-2 space-y-6">
                <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-xl">Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input 
                            value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Professional Role</Label>
                          <Input 
                            value={formData.role} 
                            onChange={(e) => setFormData({...formData, role: e.target.value})} 
                          />
                        </div>
                        <Button type="submit" disabled={loading} className="w-full bg-indigo-600">
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                          <Mail className="h-5 w-5 mr-4 text-indigo-500" />
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Email Address</p>
                            <p className="font-medium">{user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                          <Shield className="h-5 w-5 mr-4 text-purple-500" />
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Account Role</p>
                            <p className="font-medium capitalize">{user?.role}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-xl">Platform Achievement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                          <Award className="h-8 w-8" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">Practice Summary</p>
                          <p className="text-indigo-100 text-sm">Based on your saved interview recordings</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{analytics?.totalInterviews || 0}</p>
                        <p className="text-xs text-indigo-100">interviews</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Average score</p>
                        <p className="text-2xl font-bold text-emerald-600">{analytics?.averageScore || 0}/5</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Needs improvement</p>
                        <p className="mt-1 text-sm font-medium">
                          {analytics?.weakAreas?.length ? analytics.weakAreas.join(', ') : 'Complete more interviews'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* My Interview Recordings Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Video className="h-5 w-5 text-indigo-500" />
                      My Interview Recordings
                    </CardTitle>
                    <Badge variant="secondary">{recordings.length} recordings</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {recordingsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : recordings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Video className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No Recordings Yet</h3>
                      <p className="text-slate-500 mb-4 dark:text-slate-400">Complete a mock interview to get your first recording.</p>
                      <Button onClick={() => navigate('/interview')} className="bg-gradient-to-r from-indigo-600 to-purple-600">
                        <Play className="mr-2 h-4 w-4" />
                        Start Interview
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recordings.map((rec) => (
                        <motion.div
                          key={rec._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all"
                        >
                          {/* Thumbnail / Play */}
                          <div
                            className="w-28 h-20 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform relative shrink-0"
                            onClick={() => setPlayingVideo(playingVideo === rec._id ? null : rec._id)}
                          >
                            <Play className="h-8 w-8 text-white" />
                            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                              {formatDuration(rec.recordingDuration)}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">Interview Session</span>
                              {rec.isPublished ? (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">
                                  <Globe className="h-3 w-3 mr-1" />
                                  Published
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  <GlobeLock className="h-3 w-3 mr-1" />
                                  Private
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Award className="h-3 w-3" />
                                Score: {typeof rec.finalScore === 'number' ? rec.finalScore.toFixed(1) : 'N/A'}/5
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(rec.recordingDuration)}
                              </span>
                              <span>{rec.questions?.length || 0} questions</span>
                              <span>{formatDate(rec.completedAt)}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {rec.isPublished ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnpublish(rec._id)}
                                disabled={actionLoading === rec._id}
                                className="text-xs"
                              >
                                <GlobeLock className="mr-1 h-3.5 w-3.5" />
                                Unpublish
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handlePublish(rec._id)}
                                disabled={actionLoading === rec._id}
                                className="bg-gradient-to-r from-emerald-500 to-green-600 text-xs"
                              >
                                <Globe className="mr-1 h-3.5 w-3.5" />
                                Publish
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/interview-result/${rec._id}`)}
                              className="text-xs"
                            >
                              <BarChart3 className="mr-1 h-3.5 w-3.5" />
                              View Analysis
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(rec._id)}
                              disabled={actionLoading === rec._id}
                              className="text-xs"
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        </motion.div>
                      ))}

                      {/* Inline Video Player */}
                      <AnimatePresence>
                        {playingVideo && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-black rounded-xl overflow-hidden">
                              <div className="flex items-center justify-between p-3 bg-slate-900">
                                <span className="text-white text-sm font-medium">Playing Recording</span>
                                <button
                                  onClick={() => setPlayingVideo(null)}
                                  className="text-white/50 hover:text-white p-1 rounded hover:bg-white/10"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <video
                                controls
                                autoPlay
                                className="w-full max-h-[400px]"
                                src={recordings.find(r => r._id === playingVideo)?.recordingUrl}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
