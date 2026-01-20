import { Link, Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { ArrowRight, Code2, MessageSquare, Share2, Zap, Users, Lock, GitBranch, Play, BarChart3, Coffee } from 'lucide-react'

const Home: React.FC = () => {
  const {
    isAuthenticated,
    loading,
    isClerkLoaded,
    hasBackendSyncFailed,
  } = useAuth()

  const shouldRedirect =
    isClerkLoaded && !loading && isAuthenticated && !hasBackendSyncFailed

  if (shouldRedirect) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F14] via-[#0D1117] to-[#0B0F14] text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0B0F14]/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Code2 size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg">CodeCollab</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-300 hover:text-white transition">Features</a>
            <a href="/profile" className="text-sm text-gray-300 hover:text-white transition">Profile</a>
            <a href="#hit" className="text-sm text-gray-300 hover:text-white transition">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <button className="text-gray-300 hover:text-white px-4 py-2 rounded-md transition">
                Sign In
              </button>
            </Link>
            <Link to="/signup">
              <button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 px-4 py-2 rounded-md transition">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
           
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-balance">
              Code together,
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent"> instantly.</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8 text-balance">
              Share live coding sessions with your team. Real-time editing, instant sync, and seamless collaboration in multiple programming languages.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-6 text-lg rounded-lg border-0 gap-2 flex items-center justify-center">
                  Start Coding Together <ArrowRight size={20} />
                </button>
              </Link>
              <Link to={"/dashboard"}>
              <button className="px-8 py-6 text-lg rounded-lg border-gray-700 text-white hover:bg-gray-800 bg-transparent border">
                Dashboard
              </button>
              </Link>

            </div>
          </div>

          {/* Editor Preview */}
          <div className="relative max-w-5xl mx-auto mt-16">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-20"></div>
            <div className="relative bg-[#0D1117] rounded-lg border border-gray-700 overflow-hidden shadow-2xl">
              <div className="bg-[#0B0F14] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-xs text-gray-500">collaborate.ts</span>
                <div className="w-3 h-3"></div>
              </div>
              <div className="p-6 font-mono text-sm">
                <div className="space-y-2">
                  <div><span className="text-blue-400">function</span> <span className="text-green-400">createSession</span>() {"{"}</div>
                  <div className="ml-4"><span className="text-gray-500">// Share link with team</span></div>
                  <div className="ml-4"><span className="text-blue-400">const</span> link = <span className="text-yellow-400">generateShareLink</span>()</div>
                  <div className="ml-4"><span className="text-gray-500">// See changes in real-time</span></div>
                  <div className="ml-4"><span className="text-blue-400">return</span> {"{"} link, editing: true, users: 5 {"}"}</div>
                  <div>{"}"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features Built for Teams</h2>
            <p className="text-xl text-gray-400">Everything you need for seamless code collaboration</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-lg p-8 hover:border-blue-500/50 transition group">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition">
                <Zap size={24} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Sync</h3>
              <p className="text-gray-400">See every keystroke instantly. Watch cursors move and edits appear live across all connected users.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-lg p-8 hover:border-cyan-500/50 transition group">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition">
                <Code2 size={24} className="text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Multi-Language Support</h3>
              <p className="text-gray-400">Code in Python, JavaScript, Java, C++, Go, Rust, and more. Syntax highlighting for every language.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-lg p-8 hover:border-blue-500/50 transition group">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition">
                <Share2 size={24} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Sharing</h3>
              <p className="text-gray-400">Generate shareable links instantly. Invite teammates without signup, no barriers to collaboration.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-lg p-8 hover:border-cyan-500/50 transition group">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition">
                <MessageSquare size={24} className="text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
              <p className="text-gray-400">Discuss ideas without leaving the editor. Built-in messaging keeps conversations in context.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-lg p-8 hover:border-blue-500/50 transition group">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition">
                <GitBranch size={24} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Session History</h3>
              <p className="text-gray-400">Save and revisit every session. Track changes, compare versions, and build on previous work.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-lg p-8 hover:border-cyan-500/50 transition group">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition">
                <Lock size={24} className="text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
              <p className="text-gray-400">End-to-end encryption keeps your code safe. Control who accesses each session with ease.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="hit" className="py-24 px-6 border-t border-gray-800 bg-gradient-to-b from-transparent to-blue-500/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-400">Three simple steps to start collaborating</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Create a Session</h3>
                <p className="text-gray-400">Sign up and create a new coding session. Choose your language and set up your workspace.</p>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute top-20 -right-4 w-8 h-1 bg-gradient-to-r from-blue-500 to-transparent"></div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Share & Invite</h3>
                <p className="text-gray-400">Share the session link with teammates. They join instantly without needing to sign up.</p>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute top-20 -right-4 w-8 h-1 bg-gradient-to-r from-blue-500 to-transparent"></div>
            </div>

            {/* Step 3 */}
            <div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Collaborate in Real-time</h3>
                <p className="text-gray-400">Edit together, chat, and save sessions. Your code is always synced across all participants.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Perfect For</h2>
            <p className="text-xl text-gray-400">Teams of all sizes and use cases</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Use Case 1 */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-8">
              <Users size={32} className="text-blue-400 mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Development Teams</h3>
              <p className="text-gray-300">Pair programming, code reviews, and collaborative debugging in real-time.</p>
            </div>

            {/* Use Case 2 */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-8">
              <Coffee size={32} className="text-cyan-400 mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Bootcamp Instructors</h3>
              <p className="text-gray-300">Teach live coding sessions and help students debug together in one shared editor.</p>
            </div>

            {/* Use Case 3 */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-8">
              <BarChart3 size={32} className="text-blue-400 mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Technical Interviews</h3>
              <p className="text-gray-300">Conduct live coding interviews with candidates. See their work and collaborate in real-time.</p>
            </div>

            {/* Use Case 4 */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-8">
              <Play size={32} className="text-cyan-400 mb-4" />
              <h3 className="text-2xl font-semibold mb-3">Coding Competitions</h3>
              <p className="text-gray-300">Host coding challenges where teams compete while collaborating on solutions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Dashboard Preview */}
      <section className="py-24 px-6 border-t border-gray-800 bg-gradient-to-b from-transparent to-cyan-500/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Admin Dashboard</h2>
              <p className="text-xl text-gray-400 mb-8">Manage users, sessions, and team activity from one powerful dashboard.</p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-1 flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">User Management</h4>
                    <p className="text-gray-400">Control user access, roles, and permissions</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center mt-1 flex-shrink-0">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Session Analytics</h4>
                    <p className="text-gray-400">Track usage, activity, and team metrics</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-1 flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Content Moderation</h4>
                    <p className="text-gray-400">Monitor and manage session content</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center mt-1 flex-shrink-0">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Security & Compliance</h4>
                    <p className="text-gray-400">Maintain control with audit logs and security features</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-20"></div>
              <div className="relative bg-[#0D1117] rounded-lg border border-gray-700 p-6">
                <div className="bg-[#0B0F14] border-b border-gray-800 px-4 py-3 -m-6 mb-4 rounded-t-lg">
                  <span className="text-sm text-gray-400">Admin Panel • Dashboard</span>
                </div>
                <div className="space-y-4">
                  <div className="h-2 bg-gray-800 rounded w-32"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded border border-blue-500/20"></div>
                    <div className="h-20 bg-gradient-to-br from-cyan-500/20 to-transparent rounded border border-cyan-500/20"></div>
                  </div>
                  <div className="h-24 bg-gradient-to-br from-gray-800/50 to-transparent rounded border border-gray-700"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Code Together?</h2>
          <p className="text-xl text-gray-400 mb-12">Join teams around the world who are collaborating better with CodeCollab.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-6 text-lg rounded-lg border-0 gap-2 w-full sm:w-auto flex items-center justify-center">
                Get Started Free <ArrowRight size={20} />
              </button>
            </Link>
            <Link to={"/dashboard"}>
              <button className="px-8 py-6 text-lg rounded-lg border-gray-700 text-white hover:bg-gray-800 bg-transparent border">
                Dashboard
              </button>
              </Link>
          </div>
          <p className="text-sm text-gray-500 mt-8">No credit card required. Start coding together in seconds.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-6 bg-[#0B0F14]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Code2 size={20} className="text-white" />
                </div>
                <span className="font-bold">CodeCollab</span>
              </div>
              <p className="text-sm text-gray-500">Real-time code collaboration for teams.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 flex gap-4 text-sm text-gray-400">
                <li><a href="/profile" className="hover:text-white transition">Profile</a></li>
                <li><a href="/admin" className="hover:text-white transition">Admin</a></li>
                <li><a href="/dashboard" className="hover:text-white transition">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 flex gap-5 text-sm text-gray-400">
                <li><a href="/login" className="hover:text-white transition">Login</a></li>
                <li><a href="/signup" className="hover:text-white transition">Signup</a></li>
                <li><a href="/signup" className="hover:text-white transition">Start</a></li>
              </ul>
            </div>
           
          </div>
          
        </div>
      </footer>
    </div>
  )
}

export default Home
