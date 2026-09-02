import { motion } from "framer-motion"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Play,
  RotateCcw,
  Code,
  Terminal,
  CheckCircle,
  XCircle,
  Clock,
  Zap
} from "lucide-react"
import Editor from "@monaco-editor/react"

interface CodingChallenge {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit: number
  language: string
  starterCode: string
  testCases: Array<{
    input: string
    expectedOutput: string
  }>
}

export default function LiveCodingEditor() {
  const [code, setCode] = useState(`function twoSum(nums, target) {
    // Write your solution here
    // Example: nums = [2,7,11,15], target = 9
    // Return indices of two numbers that add up to target

    return [];
}`)
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<Array<{ passed: boolean, input: string, expected: string, actual: string }>>([])
  const [timeLeft] = useState(30 * 60) // 30 minutes
  const editorRef = useRef<any>(null)

  const challenge: CodingChallenge = {
    id: 'two-sum',
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    difficulty: 'easy',
    timeLimit: 30,
    language: 'javascript',
    starterCode: code,
    testCases: [
      { input: '[2,7,11,15], 9', expectedOutput: '[0,1]' },
      { input: '[3,2,4], 6', expectedOutput: '[1,2]' },
      { input: '[3,3], 6', expectedOutput: '[0,1]' }
    ]
  }

  const runCode = async () => {
    setIsRunning(true)
    setOutput('Running tests...\n')

    try {
      const solution = new Function(`${code}; return typeof twoSum === "function" ? twoSum : null;`)()
      if (!solution) {
        setOutput('Error: define a function named twoSum.\n')
        setTestResults([])
        return
      }

      const results = challenge.testCases.map((testCase, index) => {
        try {
          const args = new Function(`return [${testCase.input}];`)()
          const actualValue = solution(...args)
          const actual = JSON.stringify(actualValue)
          const expected = JSON.stringify(JSON.parse(testCase.expectedOutput))
          const passed = actual === expected

          setOutput(prev => prev + `Test ${index + 1}: ${passed ? 'PASS' : 'FAIL'}\n`)

          return {
            passed,
            input: testCase.input,
            expected: testCase.expectedOutput,
            actual
          }
        } catch (error) {
          const actual = error instanceof Error ? error.message : 'Execution error'
          setOutput(prev => prev + `Test ${index + 1}: FAIL\n`)
          return {
            passed: false,
            input: testCase.input,
            expected: testCase.expectedOutput,
            actual,
          }
        }
      })

      setTestResults(results)
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unable to run code'}\n`)
      setTestResults([])
    } finally {
      setIsRunning(false)
    }
  }

  const resetCode = () => {
    setCode(challenge.starterCode)
    setOutput('')
    setTestResults([])
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 p-4"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Code className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Live Coding Challenge
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {challenge.title}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
              {challenge.difficulty}
            </Badge>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Challenge Description */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-indigo-600" />
                  Problem Statement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                  {challenge.description}
                </p>

                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">Example:</h4>
                  <div className="font-mono text-sm space-y-1">
                    <div><span className="text-blue-600">Input:</span> nums = [2,7,11,15], target = 9</div>
                    <div><span className="text-green-600">Output:</span> [0,1]</div>
                    <div><span className="text-slate-500">Explanation:</span> Because nums[0] + nums[1] == 9</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">Easy</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Difficulty</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">30min</div>
                    <div className="text-sm text-green-700 dark:text-green-300">Time Limit</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">Test Cases</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            {testResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.passed
                            ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                            : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Test Case {index + 1}</span>
                          {result.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="text-sm space-y-1">
                          <div><span className="font-medium">Input:</span> {result.input}</div>
                          <div><span className="font-medium">Expected:</span> {result.expected}</div>
                          {!result.passed && (
                            <div><span className="font-medium">Actual:</span> {result.actual}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Right Panel - Code Editor */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="h-[600px]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Code Editor
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={resetCode}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      onClick={runCode}
                      disabled={isRunning}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {isRunning ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {isRunning ? 'Running...' : 'Run Tests'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <div className="h-[500px] border rounded-lg overflow-hidden">
                  <Editor
                    height="100%"
                    language="javascript"
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    onMount={(editor) => {
                      editorRef.current = editor
                    }}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: 'on'
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Output Console */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Console Output
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={output}
                  readOnly
                  className="h-32 font-mono text-sm bg-slate-900 text-green-400 border-slate-700"
                  placeholder="Run your code to see output here..."
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
