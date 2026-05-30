import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout'

const Landing = lazy(() => import('./pages/Landing'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const History = lazy(() => import('./pages/History'))
const RunDetail = lazy(() => import('./pages/RunDetail'))
const PRs = lazy(() => import('./pages/PRs'))
const Pricing = lazy(() => import('./pages/Pricing'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Docs = lazy(() => import('./pages/Docs'))
const About = lazy(() => import('./pages/About'))
const Settings = lazy(() => import('./pages/Settings'))

function Loading() {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Suspense fallback={<div className="text-gray-400 p-8">Loading...</div>}><Landing /></Suspense></Layout>} />
        <Route path="/dashboard" element={<Layout><Suspense fallback={<Loading />}><Dashboard /></Suspense></Layout>} />
        <Route path="/history" element={<Layout><Suspense fallback={<Loading />}><History /></Suspense></Layout>} />
        <Route path="/runs/:runId" element={<Layout><Suspense fallback={<Loading />}><RunDetail /></Suspense></Layout>} />
        <Route path="/prs" element={<Layout><Suspense fallback={<Loading />}><PRs /></Suspense></Layout>} />
        <Route path="/pricing" element={<Layout><Suspense fallback={<Loading />}><Pricing /></Suspense></Layout>} />
        <Route path="/login" element={<Layout><Suspense fallback={<Loading />}><Login /></Suspense></Layout>} />
        <Route path="/signup" element={<Layout><Suspense fallback={<Loading />}><Signup /></Suspense></Layout>} />
        <Route path="/docs" element={<Layout><Suspense fallback={<Loading />}><Docs /></Suspense></Layout>} />
        <Route path="/about" element={<Layout><Suspense fallback={<Loading />}><About /></Suspense></Layout>} />
        <Route path="/settings" element={<Layout><Suspense fallback={<Loading />}><Settings /></Suspense></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}
