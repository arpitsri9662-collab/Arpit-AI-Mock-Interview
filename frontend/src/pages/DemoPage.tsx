import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { demoAPI } from "../services/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Logo } from "@/components/Logo"
import {
  ArrowLeft,
  Play,
  Clock,
  Award,
  HelpCircle,
  X,
} from "lucide-react"

interface DemoVideo {
  id: string
  recordingUrl: string
  duration: number
  score: number
  questionsCount: number
  userName: string
  completedAt: string
}

export default function DemoPage() {
  const navigate = useNavigate()
  const [demos, setDemos] = useState<DemoVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<DemoVideo | null>(null)

  useEffect(() => {
    loadDemos()
  }, [])

  const loadDemos = async () => {
    try {
      const res = await demoAPI.getPublicDemos()
      setDemos(res.data)
    } catch (error) {
      console.error("Error loading demos:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div className="flex items-center" whileHover={{ scale: 1.05 }}>
              <Logo />
            </motion.div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" onClick={() => navigate("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
              <Button onClick={() => navigate("/register")}>Get Started</Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Header */}
      <section className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="indigo" className="mb-4">
              Watch Real Interviews
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Interview Demos
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Watch how other candidates tackle mock interviews. Learn from their approaches and get inspired to practice more.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Demo Grid */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-300">Loading demos...</p>
              </div>
            </div>
          ) : demos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-6">
                <Play className="h-12 w-12 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">No Demos Yet</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
                Be the first to share your interview recording! Complete a mock interview and publish your recording from your profile.
              </p>
              <Button onClick={() => navigate("/register")} className="bg-gradient-to-r from-indigo-600 to-purple-600">
                Start Your First Interview
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demos.map((demo, index) => (
                <motion.div
                  key={demo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md"
                    onClick={() => setSelectedVideo(demo)}
                  >
                    {/* Video Thumbnail */}
                    <div className="relative aspect-video bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        className="w-16 h-16 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center"
                      >
                        <Play className="h-8 w-8 text-white ml-1" />
                      </motion.div>
                      <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md font-mono">
                        {formatDuration(demo.duration)}
                      </div>
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-emerald-500 text-white border-0">
                          Score: {typeof demo.score === "number" ? demo.score.toFixed(1) : "N/A"}/5
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {demo.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{demo.userName}</p>
                          <p className="text-xs text-slate-500">{formatDate(demo.completedAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <HelpCircle className="h-3.5 w-3.5" />
                          {demo.questionsCount} Questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(demo.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="h-3.5 w-3.5" />
                          {typeof demo.score === "number" ? demo.score.toFixed(1) : "N/A"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Video Player Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl overflow-hidden max-w-4xl w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {selectedVideo.userName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{selectedVideo.userName}'s Interview</p>
                    <p className="text-white/50 text-xs">
                      Score: {typeof selectedVideo.score === "number" ? selectedVideo.score.toFixed(1) : "N/A"}/5 • {selectedVideo.questionsCount} questions • {formatDuration(selectedVideo.duration)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-white/50 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="aspect-video">
                <video
                  controls
                  autoPlay
                  className="w-full h-full"
                  src={selectedVideo.recordingUrl}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
