import { motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sidebar, SidebarItem } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useAuthStore } from "@/store/authStore"
import { analyticsAPI, interviewAPI } from "@/services/api"
import { Analytics, Interview } from "@/types"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"
import {
  Home,
  FileText,
  TrendingUp,
  Users,
  Settings,
  Plus,
  Play,
  Calendar,
  Target,
  Award,
  Clock,
  Star
} from "lucide-react"

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const [analyticsRes, interviewsRes] = await Promise.all([
          analyticsAPI.getUserAnalytics(user.id),
          interviewAPI.getUserInterviews(user.id),
        ])
        setAnalytics(analyticsRes.data)
        setInterviews(interviewsRes.data)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user?.id])

  const categoryColors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"]

  const dashboardData = useMemo(() => {
    const completedInterviews = interviews.filter(interview => interview.status === 'completed')
    const recordingsCount = completedInterviews.filter(interview => Boolean(interview.recordingUrl)).length
    const completionRate = interviews.length > 0
      ? Math.round((completedInterviews.length / interviews.length) * 100)
      : 0

    const recentInterviews = completedInterviews.slice(0, 3).map((interview) => {
      const categoryCounts = interview.questions.reduce<Record<string, number>>((counts, question) => {
        counts[question.category] = (counts[question.category] || 0) + 1
        return counts
      }, {})
      const primaryCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Interview'

      return {
        id: interview._id,
        type: primaryCategory,
        score: interview.finalScore,
        date: interview.completedAt || interview.startedAt || '',
        duration: interview.recordingDuration
          ? `${Math.round(interview.recordingDuration / 60)} min`
          : `${interview.duration || 0} min`,
        status: interview.recordingUrl ? 'recording saved' : 'completed',
      }
    })

    const performanceData = [...(analytics?.scoreTrends || [])]
      .reverse()
      .map((trend) => ({
        month: trend.date ? new Date(trend.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A',
        score: Number(trend.score || 0),
      }))

    const categoryScores = completedInterviews.reduce<Record<string, number[]>>((acc, interview) => {
      interview.questions.forEach((question) => {
        if (typeof question.score !== 'number') return
        if (!acc[question.category]) acc[question.category] = []
        acc[question.category].push(question.score)
      })
      return acc
    }, {})

    const categoryPerformance = Object.entries(categoryScores)
      .map(([area, scores], index) => ({
        area,
        score: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        color: categoryColors[index % categoryColors.length],
      }))
      .sort((a, b) => a.score - b.score)

    const interviewTypes = completedInterviews.reduce<Record<string, number>>((acc, interview) => {
      interview.questions.forEach((question) => {
        acc[question.category] = (acc[question.category] || 0) + 1
      })
      return acc
    }, {})

    const interviewTypeData = Object.entries(interviewTypes).map(([name, value], index) => ({
      name,
      value,
      color: categoryColors[index % categoryColors.length],
    }))

    return {
      stats: {
        totalInterviews: analytics?.totalInterviews || completedInterviews.length,
        averageScore: analytics?.averageScore || 0,
        completionRate,
        recordingsCount,
      },
      recentInterviews,
      performanceData,
      categoryPerformance,
      interviewTypeData,
    }
  }, [analytics, interviews])

  const {
    stats,
    recentInterviews,
    performanceData,
    categoryPerformance,
    interviewTypeData,
  } = dashboardData

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <SidebarItem icon={<Home />} isActive={true}>
            {!sidebarCollapsed && "Dashboard"}
          </SidebarItem>
          <SidebarItem icon={<Play />} onClick={() => navigate('/interview')}>
            {!sidebarCollapsed && "Start Interview"}
          </SidebarItem>
          <SidebarItem icon={<FileText />} onClick={() => navigate('/resume')}>
            {!sidebarCollapsed && "Resume Analysis"}
          </SidebarItem>
          <SidebarItem icon={<TrendingUp />} onClick={() => navigate('/analytics')}>
            {!sidebarCollapsed && "Analytics"}
          </SidebarItem>
          <SidebarItem icon={<Users />} onClick={() => navigate('/profile')}>
            {!sidebarCollapsed && "Profile"}
          </SidebarItem>
          <SidebarItem icon={<Settings />} onClick={() => navigate('/settings')}>
            {!sidebarCollapsed && "Settings"}
          </SidebarItem>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 transition-all duration-300">
          {/* Header */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 p-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Welcome back, Developer
                </h1>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  {user?.name ? `Ready for your next practice round, ${user.name}?` : 'Ready for your next practice round?'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Button
                  onClick={() => navigate('/interview')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Start New Interview
                </Button>
              </div>
            </div>
          </motion.header>

          {/* Content */}
          <main className="p-6 space-y-6">
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Total Interviews
                  </CardTitle>
                  <Target className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {stats.totalInterviews}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Completed interviews
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Average Score
                  </CardTitle>
                  <Star className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {Number(stats.averageScore || 0).toFixed(1)}/5
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    From saved evaluations
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Completion Rate
                  </CardTitle>
                  <Award className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {stats.completionRate}%
                  </div>
                  <Progress value={stats.completionRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Saved Recordings
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {stats.recordingsCount}
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Completed interviews with video
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Over Time */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex h-[300px] items-center justify-center text-slate-500">Loading performance...</div>
                    ) : performanceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis domain={[0, 5]} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#4f46e5"
                            strokeWidth={3}
                            dot={{ fill: '#4f46e5', strokeWidth: 2, r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[300px] items-center justify-center text-slate-500">Complete an interview to see your trend.</div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Interview Types Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Interview Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex h-[300px] items-center justify-center text-slate-500">Loading categories...</div>
                    ) : interviewTypeData.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={interviewTypeData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {interviewTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                          {interviewTypeData.map((type, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: type.color }}
                              />
                              <span className="text-sm text-slate-600 dark:text-slate-300">
                                {type.name}: {type.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex h-[300px] items-center justify-center text-slate-500">No question categories yet.</div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Recent Interviews & Weak Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Interviews */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Interviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentInterviews.length > 0 ? recentInterviews.map((interview) => (
                        <div
                          key={interview.id}
                          onClick={() => navigate(`/interview-result/${interview.id}`)}
                          className="flex cursor-pointer items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700"
                        >
                          <div>
                            <p className="font-medium">{interview.type}</p>
                            <p className="text-sm text-slate-500">
                              {interview.date ? new Date(interview.date).toLocaleDateString('en-IN') : 'No date'} | {interview.duration}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="success" className="mb-1">
                              {typeof interview.score === 'number' ? interview.score.toFixed(1) : 'N/A'}/5
                            </Badge>
                            <p className="text-xs text-slate-500">
                              {interview.status}
                            </p>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-lg bg-slate-50 p-6 text-center text-slate-500 dark:bg-slate-800">
                          No completed interviews yet.
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => navigate('/analytics')}
                    >
                      View All Interviews
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Areas for Improvement */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {categoryPerformance.length > 0 ? categoryPerformance.map((area, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{area.area}</span>
                            <span className="text-sm text-slate-500">
                              {area.score.toFixed(1)}/5
                            </span>
                          </div>
                          <Progress
                            value={(area.score / 5) * 100}
                            className="h-2"
                          />
                        </div>
                      )) : (
                        <div className="rounded-lg bg-slate-50 p-6 text-center text-slate-500 dark:bg-slate-800">
                          Submit answers to see category analysis.
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => navigate('/analytics')}
                    >
                      Get Detailed Analysis
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
