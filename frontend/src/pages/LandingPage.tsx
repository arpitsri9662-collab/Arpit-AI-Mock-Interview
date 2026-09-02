import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Logo } from "@/components/Logo"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { useAuthStore } from "../store/authStore"
import {
  ArrowRight,
  Bot,
  Brain,
  Code,
  FileText,
  MessageSquare,
  PlayCircle,
  Users,
  TrendingUp,
  Shield,
  Star,
  Upload
} from "lucide-react"

export default function LandingPage() {
  const navigate = useNavigate()
  const { token } = useAuthStore()

  useEffect(() => {
    if (token) {
      navigate('/dashboard')
    }
  }, [token, navigate])

  const features = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Interviews",
      description: "Experience realistic mock interviews with advanced AI that adapts to your responses and provides personalized feedback."
    },
    {
      icon: <Code className="h-8 w-8" />,
      title: "Live Coding Challenges",
      description: "Practice coding interviews with our integrated code editor and real-time syntax highlighting."
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Resume Analysis",
      description: "Upload your resume and get AI-powered insights on how to improve it for better job prospects."
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Performance Analytics",
      description: "Track your progress with detailed analytics, identify weak areas, and see your improvement over time."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Multiple Interview Types",
      description: "Prepare for technical, behavioral, system design, and HR interviews with our comprehensive question bank."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Privacy First",
      description: "Your data is secure. We use enterprise-grade encryption and never share your personal information."
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      content: "This platform helped me land my dream job. The AI interviewer was incredibly realistic and the feedback was spot-on.",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Frontend Developer",
      content: "The live coding environment is amazing. It feels just like the real thing. Highly recommended!",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Product Manager",
      content: "Perfect for practicing behavioral interviews. The AI understands context and gives meaningful feedback.",
      rating: 5
    }
  ]

  const workflowSteps = [
    {
      icon: <Upload className="h-7 w-7" />,
      title: "Upload your resume",
      description: "Start with your resume or continue without one. The platform prepares questions around your profile and goals."
    },
    {
      icon: <MessageSquare className="h-7 w-7" />,
      title: "Practice realistic rounds",
      description: "Choose your role, interview type, and difficulty, then answer AI-generated questions in a focused session."
    },
    {
      icon: <TrendingUp className="h-7 w-7" />,
      title: "Review your feedback",
      description: "Get scores, improvement areas, transcripts, and analytics so your next attempt is sharper than the last."
    }
  ]

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
            <motion.div
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
            >
              <Logo />
            </motion.div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">
                Features
              </a>
              <a href="#testimonials" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">
                Testimonials
              </a>
              <a href="#workflow" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">
                How It Works
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/register')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Badge variant="indigo" className="mb-6">
              Now in Beta - Join 10,000+ users
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent">
                Master Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Interview Skills
              </span>
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Practice with AI-powered interviewers, get real-time feedback, and boost your confidence.
              Join thousands of developers who landed their dream jobs with PrepVerse.
            </p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <Button
                size="xl"
                className="group"
                onClick={() => navigate('/register')}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="xl"
                className="group"
                onClick={() => navigate('/demo')}
              >
                Watch Demo
                <PlayCircle className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Hero Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-16 relative"
          >
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl rounded-3xl" />
              <div className="relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-slate-700/50 p-8 shadow-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Mock Interview Interface */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Bot className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">Interview AI</p>
                        <p className="text-sm text-slate-500">AI Interviewer</p>
                      </div>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl p-4">
                      <p className="text-slate-800 dark:text-slate-200">
                        "Can you explain the difference between let, const, and var in JavaScript?"
                      </p>
                    </div>
                  </div>

                  {/* Code Editor */}
                  <div className="bg-slate-900 rounded-2xl p-4 text-green-400 font-mono text-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-400">solution.js</span>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                    <pre className="text-xs">
{`// Explain scope differences
let x = 10; // Block scope
const y = 20; // Block scope, immutable
var z = 30; // Function scope

function example() {
  if (true) {
    let x = 100; // Only accessible here
    var z = 300; // Accessible throughout function
  }
  console.log(z); // 300
  // console.log(x); // ReferenceError
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Comprehensive tools and AI-powered features to help you prepare for any interview scenario.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-large transition-all duration-300 hover:-translate-y-1 group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <Badge variant="indigo" className="mb-5">
              Built for repeated practice
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Practice, improve, repeat
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              A simple flow that takes you from setup to actionable feedback without checkout distractions.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12 }}
              >
                <Card className="h-full border-slate-200/80 bg-white/80 shadow-soft backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
                  <CardContent className="p-6">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                      {step.icon}
                    </div>
                    <div className="mb-3 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                      Step {index + 1}
                    </div>
                    <h3 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Button
              size="lg"
              className="group"
              onClick={() => navigate(token ? '/interview' : '/register')}
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Start Practicing
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Loved by Developers Worldwide
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Join thousands of developers who transformed their careers with PrepVerse.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-6 italic">
                      "{testimonial.content}"
                    </p>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-slate-500">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Ace Your Next Interview?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Join over 10,000 developers who are already practicing smarter, not harder.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="xl"
                variant="secondary"
                className="bg-white text-indigo-600 hover:bg-slate-50"
                onClick={() => navigate('/register')}
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="xl"
                variant="secondary"
                className="bg-white text-indigo-600 hover:bg-slate-50"
                onClick={() => navigate('/demo')}
              >
                Watch Demo
                <PlayCircle className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <Logo />
              </div>
              <p className="text-slate-400">
                The most advanced AI-powered interview preparation platform.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#workflow" className="hover:text-white transition-colors">How It Works</a></li>
                <li><button onClick={() => navigate('/demo')} className="hover:text-white transition-colors">Demo</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2026 PrepVerse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
