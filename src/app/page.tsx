'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Truck, Package, CheckCircle, Clock, AlertTriangle, TrendingUp,
  Search, Filter, ChevronLeft, ChevronRight, MapPin, Building2,
  BarChart3, PieChart, Activity, Upload, X, RefreshCw, LogOut, User, Calendar,
  Lock, Eye, EyeOff, Heart, Globe, Layers
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  BarChart, Bar, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'

// ==================== INTERFACES ====================
interface Entrega {
  nf: string
  cte: string | null
  pedido: number
  cliente: number
  loja: number
  nome: string
  valorBru: number
  classe: string
  volume: number
  pesoBruto: number
  pesoLiq: number
  cidade: string
  uf: string
  codTransp: number
  transportadora: string
  dataEnvio: string | null
  picking: number | null
  dataEmissaoNf: string | null
  dataLiberacao: string | null
  emissPed: string | null
  valFret: number
  tpFrete: string
  previsaoEntrega: string | null
  entregaRealizada: string | null
  situacao: string
  deadline: number | null
  ocorrencia: string | null
  realizado: number | null
  fulfillment: number | null
}

interface Stats {
  totalEntregas: number
  entreguesNoPrazo: number
  entreguesAntecipada: number
  entreguesComAtraso: number
  emTransito: number
  emAtraso: number
  devolucoes: number
  freteTotal: number
  volumeTotal: number
  pesoTotal: number
}

interface PorUF {
  uf: string
  total: number
  entregues: number
}

interface PorTransportadora {
  nome: string
  total: number
  entregues: number
  percentual: number
  volume: number
  peso: number
}

interface SituacaoCount {
  situacao: string
  total: number
}

interface PorMes {
  mes: string
  mesNome: string
  total: number
  antecipada: number
  noPrazo: number
  comAtraso: number
  emTransito: number
  emAtraso: number
  devolucao: number
}

interface PorTrimestre {
  trimestre: string
  trimestreNome: string
  total: number
  antecipada: number
  noPrazo: number
  comAtraso: number
  emTransito: number
  emAtraso: number
  devolucao: number
}

interface PorRegiao {
  regiao: string
  total: number
  entregues: number
  ufs: string[]
}

interface Filtros {
  ufs: string[]
  transportadoras: string[]
  situacoes: string[]
  meses: string[]
  trimestres: string[]
  regioes: string[]
}

interface ApiResponse {
  entregas: Entrega[]
  stats: Stats
  porUF: PorUF[]
  porTransportadora: PorTransportadora[]
  porSituacao: SituacaoCount[]
  porMes: PorMes[]
  porTrimestre: PorTrimestre[]
  porRegiao: PorRegiao[]
  filtros: Filtros
  paginacao: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Cores específicas por situação
const STATUS_COLORS: Record<string, string> = {
  'ENTREGUE ANTECIPADA': '#166534',
  'ENTREGUE NO PRAZO': '#22c55e',
  'EM TRÂNSITO': '#eab308',
  'ENTREGUE COM ATRASO': '#f97316',
  'EM ATRASO': '#ef4444',
  'DEVOLUÇÃO': '#8b5cf6',
}

// Cores para o gráfico de volume por transportadora
const VOLUME_TRANSP_COLORS = [
  '#ec4899', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#a855f7', '#d946ef',
  '#f43f5e', '#fb923c', '#fbbf24', '#4ade80', '#2dd4bf',
  '#22d3ee', '#60a5fa', '#a78bfa', '#c084fc', '#e879f9',
]

// Logos das transportadoras brasileiras
const TRANSPORTADORA_LOGOS: Record<string, { url: string; bgColor: string }> = {
  // Transportadoras principais
  'JADLOG': { 
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Jadlog_logo.svg/512px-Jadlog_logo.svg.png', 
    bgColor: '#FFD700' 
  },
  'CORREIOS': { 
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Logomarca_dos_Correios.svg/512px-Logomarca_dos_Correios.svg.png', 
    bgColor: '#FFCC00' 
  },
  'TOTAL EXPRESS': { 
    url: 'https://www.totalexpress.com.br/assets/images/logo-total-express.png', 
    bgColor: '#003366' 
  },
  'RAPIDÃO COMETA': { 
    url: 'https://www.rapidaocometa.com.br/assets/img/logo.png', 
    bgColor: '#E31C23' 
  },
  'BRASPRESS': { 
    url: 'https://www.sertaozinhoindustrial.com.br/painel/user_images/307fa2398de99507beff25d5452ec120.png', 
    bgColor: '#F97316' 
  },
  'SÓLIDA': { 
    url: 'data:image/png;base64,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', 
    bgColor: '#991B1B' 
  },
  'ACCERT': { 
    url: 'https://cliente.accertlogistica.com.br/empresas/accert/logo.png', 
    bgColor: '#DC2626' 
  },
  'ACCERT LOGÍSTICA': { 
    url: 'https://cliente.accertlogistica.com.br/empresas/accert/logo.png', 
    bgColor: '#DC2626' 
  },
  'VIAÇÃO ESTRELA': { 
    url: 'https://s3-sa-east-1.amazonaws.com/projetos-artes/fullsize%2F2019%2F09%2F21%2F16%2FLogo-e-Cartao-de-Visita-261846_672318_162616706_1574608726.jpg', 
    bgColor: '#1E40AF' 
  },
  '5S': { 
    url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLLI2_ChD1PWKO8p_Pa5Iv06b-bXLy_IRmIQ&s', 
    bgColor: '#1E3A5A' 
  },
  '5S TRANSPORTES': { 
    url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLLI2_ChD1PWKO8p_Pa5Iv06b-bXLy_IRmIQ&s', 
    bgColor: '#1E3A5A' 
  },
  '5 S TRANSPORTES': { 
    url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLLI2_ChD1PWKO8p_Pa5Iv06b-bXLy_IRmIQ&s', 
    bgColor: '#1E3A5A' 
  },
  'ALFA': { 
    url: 'https://alfatransportes.com.br/assets/uploads/certificados/downloads/Logo-Alfa-Transportes.jpg', 
    bgColor: '#DC2626' 
  },
  'ALFA TRANSPORTES': { 
    url: 'https://alfatransportes.com.br/assets/uploads/certificados/downloads/Logo-Alfa-Transportes.jpg', 
    bgColor: '#DC2626' 
  },
  'JAMEF': { 
    url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_N6k2KnUoYfTKYfSV_NHwIigD8Ew8UWepHQ&s', 
    bgColor: '#DC2626' 
  },
  'RODONAVES': { 
    url: 'https://play-lh.googleusercontent.com/kiRhmm7u8i0beT3ayylLBOSteiJDpCR32J8kbx8KDoNvVdqn4FqUXnxIG44043D6FNc', 
    bgColor: '#1E3A5A' 
  },
  'RODONOVAS': { 
    url: 'https://play-lh.googleusercontent.com/kiRhmm7u8i0beT3ayylLBOSteiJDpCR32J8kbx8KDoNvVdqn4FqUXnxIG44043D6FNc', 
    bgColor: '#1E3A5A' 
  },
  'TNT': { 
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/TNT_Express_logo.svg/512px-TNT_Express_logo.svg.png', 
    bgColor: '#FF6600' 
  },
  'DHL': { 
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/DHL_Express_logo.svg/512px-DHL_Express_logo.svg.png', 
    bgColor: '#FFCC00' 
  },
  'FEDEX': { 
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/FedEx_logo.svg/512px-FedEx_logo.svg.png', 
    bgColor: '#4D148C' 
  },
  'AZUL CARGO': { 
    url: 'https://www.azulcargoexpress.com.br/img/logo-azul-cargo.png', 
    bgColor: '#0055A5' 
  },
  'LATAM CARGO': { 
    url: 'https://www.latamcargo.com/img/logo-latam.png', 
    bgColor: '#ED1C24' 
  },
  'GOL LOG': { 
    url: 'https://www.gollog.com.br/img/logo-gol-log.png', 
    bgColor: '#FF6600' 
  },
  'ATIVA': {
    url: '',
    bgColor: '#0891B2'
  },
  'BRAEX': {
    url: '',
    bgColor: '#DC2626'
  },
  'CAIAPÓ CARGAS': {
    url: '',
    bgColor: '#059669'
  },
  'EMPRESA-GOTIJO': {
    url: '',
    bgColor: '#7C3AED'
  },
  'JMF': {
    url: '',
    bgColor: '#D97706'
  },
  'KM TRANSPORTE': {
    url: '',
    bgColor: '#2563EB'
  },
  'MIRA': {
    url: '',
    bgColor: '#4F46E5'
  },
  'TOC LOG': {
    url: '',
    bgColor: '#BE185D'
  },
  'UNINDO': {
    url: '',
    bgColor: '#374151'
  },
  'VITORIA': {
    url: '',
    bgColor: '#B45309'
  },
}

// Função para obter logo da transportadora
function getTransportadoraLogo(nome: string): { url: string; bgColor: string; found: boolean } {
  const nomeUpper = nome.toUpperCase()
  
  // Busca exata
  const exact = TRANSPORTADORA_LOGOS[nomeUpper]
  if (exact && exact.url) {
    return { ...exact, found: true }
  }
  if (exact && !exact.url) {
    return { ...exact, found: false }
  }
  
  // Busca parcial
  for (const [key, value] of Object.entries(TRANSPORTADORA_LOGOS)) {
    if ((nomeUpper.includes(key) || key.includes(nomeUpper)) && value.url) {
      return { ...value, found: true }
    }
  }
  
  // Padrão para transportadoras não mapeadas
  return { url: '', bgColor: '#6B7280', found: false }
}

// ==================== USER TYPES ====================
interface User {
  id: string
  username: string
  password: string
  name: string
  role: 'admin' | 'gerente'
  email: string
  avatar?: string
}

// ==================== USERS LIST ====================
const USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'abelha2026',
    name: 'Administrador',
    role: 'admin',
    email: 'admin@abelharainha.com'
  },
  {
    id: '2',
    username: 'francimar',
    password: 'francimar2026',
    name: 'Francimar',
    role: 'gerente',
    email: 'francimar@abelharainha.com',
    avatar: 'https://distribuidor.abelharainha.com.br/storage/users/11075/WTVd6VUZjgCEXf8L3a7XrbMgztXZaIKy2Cv9Py7u.jpg'
  },
  {
    id: '3',
    username: 'danilo',
    password: 'danilo2026',
    name: 'Danilo',
    role: 'gerente',
    email: 'danilo@abelharainha.com',
    avatar: '/danilo-avatar.png'
  }
]

// ==================== CONSULTA RESULTADO INTERFACE ====================
interface ConsultaResultado {
  nf: string
  pedido: number
  cliente: number
  nome: string
  dataEmissaoNf: string | null
  previsaoEntrega: string | null
  entregaRealizada: string | null
  situacao: string
  cidade: string
  uf: string
  transportadora: string
}

// ==================== MAIN APP ====================
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    setTimeout(() => {
      const user = USERS.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password
      )
      
      if (user) {
        setCurrentUser(user)
        setIsLoggedIn(true)
        setError('')
      } else {
        setError('Usuário ou senha incorretos!')
      }
      setIsLoading(false)
    }, 800)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser(null)
    setUsername('')
    setPassword('')
    setError('')
  }

  if (!isLoggedIn || !currentUser) {
    return <LoginPage 
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      username={username}
      setUsername={setUsername}
      password={password}
      setPassword={setPassword}
      onLogin={handleLogin}
      error={error}
      isLoading={isLoading}
    />
  }

  return <DashboardPage onLogout={handleLogout} currentUser={currentUser} />
}

// ==================== LOGIN PAGE ====================
interface LoginPageProps {
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  username: string
  setUsername: (v: string) => void
  password: string
  setPassword: (v: string) => void
  onLogin: (e: React.FormEvent) => void
  error: string
  isLoading: boolean
}

function LoginPage({ showPassword, setShowPassword, username, setUsername, password, setPassword, onLogin, error, isLoading }: LoginPageProps) {
  // Estados para consulta
  const [consultaTermo, setConsultaTermo] = useState('')
  const [consultaLoading, setConsultaLoading] = useState(false)
  const [consultaResultados, setConsultaResultados] = useState<ConsultaResultado[]>([])
  const [consultaMessage, setConsultaMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showConsulta, setShowConsulta] = useState(false)

  const handleConsulta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consultaTermo.trim()) return

    setConsultaLoading(true)
    setConsultaMessage(null)
    setConsultaResultados([])

    try {
      const response = await fetch(`/api/consulta?termo=${encodeURIComponent(consultaTermo.trim())}`)
      if (!response.ok) throw new Error(`Erro ${response.status}`)
      const text = await response.text()
      if (!text.startsWith('{')) throw new Error('Resposta inválida do servidor')
      const data = JSON.parse(text)

      if (data.success) {
        setConsultaResultados(data.resultados)
        setConsultaMessage({ type: 'success', text: data.message })
      } else {
        setConsultaMessage({ type: 'error', text: data.message })
      }
    } catch {
      setConsultaMessage({ type: 'error', text: 'Erro ao realizar busca. Tente novamente.' })
    } finally {
      setConsultaLoading(false)
    }
  }

  const formatDateBR = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-'
    if (dateStr.includes('/') && dateStr.split('/').length === 3) {
      return dateStr
    }
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
    }
    return dateStr || '-'
  }

  const getSituacaoBadge = (situacao: string) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium"
    if (situacao === 'ENTREGUE ANTECIPADA') {
      return <span className={`${baseClasses} bg-green-800 text-white`}>Antecipada</span>
    }
    if (situacao === 'ENTREGUE NO PRAZO') {
      return <span className={`${baseClasses} bg-green-500 text-white`}>No Prazo</span>
    }
    if (situacao === 'EM TRÂNSITO') {
      return <span className={`${baseClasses} bg-yellow-500 text-black`}>Em Trânsito</span>
    }
    if (situacao === 'ENTREGUE COM ATRASO') {
      return <span className={`${baseClasses} bg-orange-500 text-white`}>C/ Atraso</span>
    }
    if (situacao === 'EM ATRASO') {
      return <span className={`${baseClasses} bg-red-500 text-white`}>Em Atraso</span>
    }
    if (situacao === 'DEVOLUÇÃO') {
      return <span className={`${baseClasses} bg-violet-500 text-white`}>Devolução</span>
    }
    return <span className={`${baseClasses} bg-gray-400 text-white`}>{situacao || 'N/D'}</span>
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          alt="Background"
          className="object-cover blur-sm scale-105 w-full h-full"
          src="https://cdn.prod.website-files.com/63e673205f519903722d46dd/64a874197dba1d158813fc91_64945a0500c2898fa77f9d46_Armazem-geral-ou-deposito-fechado.jpeg"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-pink-950/80 via-rose-900/70 to-fuchsia-950/70"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10">
        {/* Left Side - Branding (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
          {/* Honeycomb Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="honeycomb" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                  <path d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100" fill="none" stroke="currentColor" strokeWidth="1" className="text-pink-300"></path>
                  <path d="M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34" fill="none" stroke="currentColor" strokeWidth="1" className="text-pink-300"></path>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#honeycomb)"></rect>
            </svg>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-pink-950/60 via-transparent to-fuchsia-900/30"></div>

          {/* Decorative Glows */}
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-gradient-to-br from-pink-400/30 to-transparent blur-2xl"></div>
          <div className="absolute bottom-40 left-10 w-48 h-48 rounded-full bg-gradient-to-tr from-rose-500/30 to-transparent blur-3xl"></div>
          <div className="absolute top-1/3 right-20 w-40 h-40 rounded-full bg-gradient-to-bl from-fuchsia-400/25 to-transparent blur-2xl"></div>
          <div className="absolute bottom-20 right-40 w-24 h-24 rounded-full bg-gradient-to-r from-yellow-400/20 to-pink-400/20 blur-xl"></div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center items-center px-12 xl:px-20 text-center">
            {/* Logo Icon */}
            <div className="mb-8 animate-float-subtle">
              <div className="w-28 h-28 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-pink-500/30 border border-pink-300/20 hover:shadow-pink-400/50 transition-shadow duration-300">
                <img
                  alt="Abelha Rainha Logo"
                  className="rounded-2xl w-[100px] h-[100px] transition-transform duration-500 hover:scale-110"
                  src="https://play-lh.googleusercontent.com/wAZe4EgTT5MYO4dEYYPs0jhqIYDeDqX817W7h4o0_Ty3M6qaenLbYoOH6JeTswUls3UP"
                />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl xl:text-5xl 2xl:text-6xl font-bold text-white mb-6 leading-tight">
              Gestão de Entregas{' '}
              <span className="bg-gradient-to-r from-pink-300 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent">Inteligente</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl xl:text-2xl text-pink-100/80 max-w-xl leading-relaxed mb-10">
              Gestão simples, rápida e eficiente com a força da{' '}
              <span className="text-pink-300 font-semibold">Abelha Rainha</span>
            </p>

            {/* Main Logo */}
            <div className="relative hover:scale-105 transition-transform duration-500">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/30 to-rose-500/30 rounded-3xl blur-xl opacity-50 hover:opacity-80 transition-opacity duration-300"></div>
                <img
                  alt="Abelha Rainha"
                  width="320"
                  height="320"
                  className="relative z-10 drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                  src="/login-bg.png"
                />
              </div>
            </div>

            {/* Wave SVG */}
            <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,120 C150,60 350,0 600,30 C850,60 1050,90 1200,60 L1200,120 Z" fill="rgba(157, 23, 77, 0.3)"></path>
            </svg>
          </div>
        </div>

        {/* Right Side - Login Forms */}
        <div className="flex-1 lg:w-1/2 xl:w-[45%] relative z-10 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md animate-fade-in-up">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-pink-500/20 border border-pink-300/20 hover:scale-110 transition-transform duration-300">
                  <img
                    alt="Abelha Rainha Logo"
                    className="rounded-lg w-12 h-12 transition-transform duration-300 hover:scale-110"
                    src="https://play-lh.googleusercontent.com/wAZe4EgTT5MYO4dEYYPs0jhqIYDeDqX817W7h4o0_Ty3M6qaenLbYoOH6JeTswUls3UP"
                  />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-pink-300 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent hover:opacity-80 transition-opacity duration-300">Abelha Rainha</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Bem-vindo de volta!</h2>
              <p className="text-pink-100/80">Acesse sua conta para continuar</p>
            </div>

            {/* Login Form */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-pink-900/30 border border-pink-200/40 p-6 sm:p-8 mb-6 hover:shadow-pink-500/20 transition-shadow duration-300">
              <form className="space-y-5" onSubmit={onLogin}>
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                )}
                
                {/* Username Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-pink-500" />
                    Usuário
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-300 focus:ring-0 bg-pink-50/30 border-pink-100 focus:border-pink-400 hover:border-pink-300 hover:bg-pink-50/50 outline-none focus:shadow-md focus:shadow-pink-200"
                    placeholder="Digite seu usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-pink-500" />
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full px-4 pr-12 py-3.5 rounded-xl border-2 transition-all duration-300 focus:ring-0 bg-pink-50/30 border-pink-100 focus:border-pink-400 hover:border-pink-300 hover:bg-pink-50/50 outline-none focus:shadow-md focus:shadow-pink-200"
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-pink-500 transition-all duration-300 hover:scale-110"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-pink-500/40 hover:shadow-xl hover:shadow-pink-500/50 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 overflow-hidden relative group"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Entrando...
                    </>
                  ) : (
                    <span className="relative z-10">ENTRAR</span>
                  )}
                </button>
              </form>
            </div>

            {/* Link para Consulta */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setShowConsulta(!showConsulta)}
                className="text-pink-200 hover:text-white text-sm font-medium transition-all flex items-center gap-2 mx-auto hover:scale-105 active:scale-95"
              >
                <Search className={`h-4 w-4 transition-transform duration-300 ${showConsulta ? 'rotate-90' : ''}`} />
                {showConsulta ? 'Ocultar Consulta' : 'Consultar NF ou Pedido'}
              </button>
            </div>

            {/* Área de Consulta */}
            {showConsulta && (
              <div className="mt-4 animate-slide-down">
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-pink-900/30 border border-pink-200/40 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-5 w-5 text-pink-500" />
                    <h3 className="font-semibold text-gray-800">Consulta de Entregas</h3>
                  </div>
                  
                  <form onSubmit={handleConsulta} className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Digite a NF ou número do pedido..."
                        value={consultaTermo}
                        onChange={(e) => setConsultaTermo(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-400 outline-none transition-all"
                      />
                      <button
                        type="submit"
                        disabled={consultaLoading}
                        className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {consultaLoading ? (
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <Search className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Mensagem */}
                  {consultaMessage && (
                    <div className={`mt-4 p-3 rounded-lg text-sm ${
                      consultaMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {consultaMessage.text}
                    </div>
                  )}

                  {/* Resultados */}
                  {consultaResultados.length > 0 && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-2 font-medium text-gray-600">Cliente</th>
                            <th className="text-left py-2 px-2 font-medium text-gray-600">Data Emissão</th>
                            <th className="text-left py-2 px-2 font-medium text-gray-600">Previsão</th>
                            <th className="text-left py-2 px-2 font-medium text-gray-600">Entrega</th>
                            <th className="text-left py-2 px-2 font-medium text-gray-600">Situação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {consultaResultados.map((r, idx) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-pink-50/50">
                              <td className="py-3 px-2">
                                <div className="font-medium text-gray-800 truncate max-w-[200px]" title={r.nome}>{r.nome}</div>
                                <div className="text-xs text-gray-500">NF: {r.nf} | Pedido: {r.pedido}</div>
                              </td>
                              <td className="py-3 px-2 text-gray-600">{formatDateBR(r.dataEmissaoNf)}</td>
                              <td className="py-3 px-2 text-gray-600">{formatDateBR(r.previsaoEntrega)}</td>
                              <td className="py-3 px-2 text-gray-600">{formatDateBR(r.entregaRealizada)}</td>
                              <td className="py-3 px-2">{getSituacaoBadge(r.situacao)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-20 bg-gradient-to-r from-pink-950/90 via-rose-900/90 to-fuchsia-950/90 backdrop-blur-md border-t border-pink-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-pink-300/20">
                <img
                  alt="Abelha Rainha"
                  className="rounded-md w-7 h-7"
                  src="https://play-lh.googleusercontent.com/wAZe4EgTT5MYO4dEYYPs0jhqIYDeDqX817W7h4o0_Ty3M6qaenLbYoOH6JeTswUls3UP"
                />
              </div>
              <span className="text-sm font-semibold bg-gradient-to-r from-pink-300 to-rose-300 bg-clip-text text-transparent">Abelha Rainha</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-pink-200/60">
              <span>© 2026 Abelha Rainha</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                Feito com <Heart className="w-3 h-3 text-pink-400 fill-pink-400 animate-pulse-soft" /> no Brasil
              </span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}

// ==================== DASHBOARD PAGE ====================
interface DashboardPageProps {
  onLogout: () => void
  currentUser: User
}

function DashboardPage({ onLogout, currentUser }: DashboardPageProps) {
  const userRole = currentUser.role

  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [ufFiltro, setUfFiltro] = useState('todos')
  const [transportadoraFiltro, setTransportadoraFiltro] = useState('todos')
  const [situacaoFiltro, setSituacaoFiltro] = useState('todos')
  const [mesFiltro, setMesFiltro] = useState('todos')
  const [trimestreFiltro, setTrimestreFiltro] = useState('todos')
  const [regiaoFiltro, setRegiaoFiltro] = useState('todos')
  const [page, setPage] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [buscaTabelaInput, setBuscaTabelaInput] = useState('')
  const [buscaTabela, setBuscaTabela] = useState('')

  // Debounce para busca na tabela
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaTabela(buscaTabelaInput)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [buscaTabelaInput])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('role', userRole)
      if (busca) params.append('busca', busca)
      if (buscaTabela) params.append('buscaTabela', buscaTabela)
      if (ufFiltro !== 'todos') params.append('uf', ufFiltro)
      if (transportadoraFiltro !== 'todos') params.append('transportadora', transportadoraFiltro)
      if (situacaoFiltro !== 'todos') params.append('situacao', situacaoFiltro)
      if (mesFiltro !== 'todos') params.append('mes', mesFiltro)
      if (trimestreFiltro !== 'todos') params.append('trimestre', trimestreFiltro)
      if (regiaoFiltro !== 'todos') params.append('regiao', regiaoFiltro)

      if (buscaTabela) {
        params.append('limit', '9999')
      } else {
        params.append('page', String(page))
        params.append('limit', '20')
      }

      // Retry automático para fetch de dados (inclui 5xx como 502/503)
      let response: Response | null = null
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          response = await fetch(`/api/entregas?${params.toString()}`)
          if (response.ok) break
          if (response.status >= 500 && response.status < 600 && attempt < 5) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
            response = null
            continue
          }
          break
        } catch {
          if (attempt < 5) await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
        }
      }
      if (!response) return
      if (!response.ok) throw new Error(`Erro ${response.status}`)
      const text = await response.text()
      if (!text.startsWith('{')) throw new Error('Resposta inválida do servidor')
      const result = JSON.parse(text)
      setData(result)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao carregar dados'
      if (!msg.includes('502') && !msg.includes('503')) {
        // Mostrar erro apenas se não for temporário
      }
    } finally {
      setLoading(false)
    }
  }, [busca, buscaTabela, ufFiltro, transportadoraFiltro, situacaoFiltro, mesFiltro, trimestreFiltro, regiaoFiltro, page, userRole])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadMessage(null)

    try {
      // --- Ler arquivo como ArrayBuffer ---
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // --- Comprimir com gzip ---
      let compressedBase64: string
      try {
        const cs = new CompressionStream('gzip')
        const writer = cs.writable.getWriter()
        const reader = cs.readable.getReader()
        writer.write(uint8Array)
        writer.close()
        const chunks: Uint8Array[] = []
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
        }
        const totalLen = chunks.reduce((acc, c) => acc + c.length, 0)
        const compressed = new Uint8Array(totalLen)
        let offset = 0
        for (const chunk of chunks) {
          compressed.set(chunk, offset)
          offset += chunk.length
        }
        let binary = ''
        for (let i = 0; i < compressed.length; i++) {
          binary += String.fromCharCode(compressed[i])
        }
        compressedBase64 = btoa(binary)
      } catch {
        let binary = ''
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i])
        }
        compressedBase64 = btoa(binary)
      }

      const CHUNK_SIZE = 500000 // 500KB por chunk
      const totalChunks = Math.ceil(compressedBase64.length / CHUNK_SIZE)
      const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`

      setUploadMessage({ type: 'success', text: `Enviando "${file.name}" em ${totalChunks} pedaço(s)...` })

      // --- Enviar cada chunk ---
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, compressedBase64.length)
        const chunkData = compressedBase64.substring(start, end)

        let sent = false
        for (let attempt = 1; attempt <= 3 && !sent; attempt++) {
          try {
            if (attempt > 1) {
              await new Promise(resolve => setTimeout(resolve, 1500))
            }
            const res = await fetch('/api/upload/chunk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId,
                chunkIndex: i,
                totalChunks,
                chunk: chunkData,
              }),
            })
            if (res.ok) {
              sent = true
            } else {
              const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
              // chunk error handled above
              if (attempt === 3) {
                setUploadMessage({ type: 'error', text: `Erro no pedaço ${i + 1}: ${err.error}` })
                return
              }
            }
          } catch (err) {
              // retry handled above
            if (attempt === 3) {
              setUploadMessage({ type: 'error', text: `Erro de conexão no pedaço ${i + 1}. Tente novamente.` })
              return
            }
          }
        }
        setUploadMessage({ type: 'success', text: `Enviando "${file.name}"... pedaço ${i + 1}/${totalChunks}` })
      }

      // --- Finalizar upload ---
      setUploadMessage({ type: 'success', text: `Processando "${file.name}"...` })

      let response: Response | null = null
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          if (attempt > 1) await new Promise(resolve => setTimeout(resolve, 2000))
          response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, fileName: file.name }),
          })
          break
        } catch {
          if (attempt === 3) {
            setUploadMessage({ type: 'error', text: 'Erro ao processar. Tente novamente.' })
            return
          }
        }
      }
      if (!response) return

      const responseText = await response.text()
      let result: Record<string, unknown> | null = null
      try {
        result = JSON.parse(responseText)
      } catch {
        setUploadMessage({ type: 'error', text: `Erro no servidor (HTTP ${response.status}). Tente novamente.` })
        return
      }

      if (result && result.success) {
        setUploadMessage({ type: 'success', text: result.message as string || 'Arquivo enviado com sucesso!' })
        fetchData()
      } else {
        const errorMsg = (result?.error as string) || (result?.details as string) || 'Erro ao enviar arquivo.'
        setUploadMessage({ type: 'error', text: errorMsg })
      }
    } catch (error) {
      setUploadMessage({ type: 'error', text: `Erro no envio: ${error instanceof Error ? error.message : 'Tente novamente.'}` })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await fetch('/api/entregas', { method: 'DELETE' })
      fetchData()
    } catch {
      // silent error for refresh
      setLoading(false)
    }
  }

  const getSituacaoBadge = (situacao: string) => {
    const baseClasses = "transition-all hover:scale-105"
    if (situacao === 'ENTREGUE ANTECIPADA') {
      return <Badge className={`bg-green-800 hover:bg-green-900 text-white ${baseClasses}`}>Antecipada</Badge>
    }
    if (situacao === 'ENTREGUE NO PRAZO') {
      return <Badge className={`bg-green-500 hover:bg-green-600 text-white ${baseClasses}`}>No Prazo</Badge>
    }
    if (situacao === 'EM TRÂNSITO') {
      return <Badge className={`bg-yellow-500 hover:bg-yellow-600 text-black ${baseClasses} animate-pulse`}>Em Trânsito</Badge>
    }
    if (situacao === 'ENTREGUE COM ATRASO') {
      return <Badge className={`bg-orange-500 hover:bg-orange-600 text-white ${baseClasses}`}>C/ Atraso</Badge>
    }
    if (situacao === 'EM ATRASO') {
      return <Badge className={`bg-red-500 hover:bg-red-600 text-white ${baseClasses} animate-pulse`}>Em Atraso</Badge>
    }
    if (situacao === 'DEVOLUÇÃO') {
      return <Badge className={`bg-violet-500 hover:bg-violet-600 text-white ${baseClasses}`}>Devolução</Badge>
    }
    return <Badge variant="secondary" className={baseClasses}>{situacao || 'N/D'}</Badge>
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const formatDateBR = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-'
    if (dateStr.includes('/') && dateStr.split('/').length === 3) {
      return dateStr
    }
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
    }
    return dateStr || '-'
  }

  // Função para calcular diferença de dias entre duas datas
  const calcularDiferencaDias = (dataInicio: string | null | undefined, dataFim: string | null | undefined): number | null => {
    if (!dataInicio || !dataFim) return null
    
    const parseDate = (dateStr: string): Date | null => {
      // Formato DD/MM/YYYY
      if (dateStr.includes('/') && dateStr.split('/').length === 3) {
        const parts = dateStr.split('/')
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
      }
      // Formato YYYY-MM-DD
      if (dateStr.includes('-') && dateStr.split('-').length === 3) {
        const parts = dateStr.split('-')
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
      }
      return null
    }
    
    const inicio = parseDate(dataInicio)
    const fim = parseDate(dataFim)
    
    if (!inicio || !fim) return null
    
    const diffTime = fim.getTime() - inicio.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  // Função para formatar a diferença de dias com cor
  const formatarDiferencaDias = (dias: number | null, tipo: 'envio' | 'deadline'): React.ReactNode => {
    if (dias === null) return <span className="text-gray-400">-</span>
    
    if (tipo === 'envio') {
      // Dias em trânsito (data envio -> entrega)
      const corTexto = dias <= 5 ? 'text-green-600' : dias <= 10 ? 'text-yellow-600' : 'text-red-600'
      const corBg = dias <= 5 ? 'bg-green-50' : dias <= 10 ? 'bg-yellow-50' : 'bg-red-50'
      return (
        <span className={`px-2 py-1 rounded-md font-semibold ${corTexto} ${corBg}`}>
          {dias} dias
        </span>
      )
    } else {
      // Deadline (diferença entre previsão e entrega)
      // Negativo = antecipada, 0 = no prazo, Positivo = atraso
      if (dias < 0) {
        return (
          <span className="px-2 py-1 rounded-md font-semibold text-green-600 bg-green-50">
            {Math.abs(dias)} dias adiantado
          </span>
        )
      } else if (dias === 0) {
        return (
          <span className="px-2 py-1 rounded-md font-semibold text-green-600 bg-green-50">
            No prazo
          </span>
        )
      } else {
        return (
          <span className="px-2 py-1 rounded-md font-semibold text-red-600 bg-red-50">
            {dias} dias atrasado
          </span>
        )
      }
    }
  }

  // ========== KPI COMPUTATIONS ==========
  const total = data?.stats.totalEntregas || 0
  const entreguesAntecipada = data?.stats.entreguesAntecipada || 0
  const entreguesNoPrazo = data?.stats.entreguesNoPrazo || 0
  const entreguesComAtraso = data?.stats.entreguesComAtraso || 0
  const emTransito = data?.stats.emTransito || 0
  const emAtraso = data?.stats.emAtraso || 0
  const devolucoes = data?.stats.devolucoes || 0

  // Taxa de sucesso = (antecipadas + no prazo) / total entregues concluídos (excluindo em trânsito, em atraso e devolução)
  const totalConcluidas = entreguesAntecipada + entreguesNoPrazo + entreguesComAtraso
  const taxaSucesso = totalConcluidas > 0 
    ? ((entreguesAntecipada + entreguesNoPrazo) / totalConcluidas) * 100 
    : 0

  // Percentuais por situação
  const pctAntecipada = total > 0 ? ((entreguesAntecipada / total) * 100).toFixed(1) : '0'
  const pctNoPrazo = total > 0 ? ((entreguesNoPrazo / total) * 100).toFixed(1) : '0'
  const pctComAtraso = total > 0 ? ((entreguesComAtraso / total) * 100).toFixed(1) : '0'
  const pctEmTransito = total > 0 ? ((emTransito / total) * 100).toFixed(1) : '0'
  const pctEmAtraso = total > 0 ? ((emAtraso / total) * 100).toFixed(1) : '0'
  const pctDevolucoes = total > 0 ? ((devolucoes / total) * 100).toFixed(1) : '0'

  // Tempo médio de trânsito (calculado das entregas realizadas)
  const entregasRealizadas = (data?.entregas || []).filter(
    e => e.dataEnvio && e.entregaRealizada && e.entregaRealizada !== '-'
  )
  let tempoMedioTransito = '-'
  if (entregasRealizadas.length > 0) {
    const totalDias = entregasRealizadas.reduce((acc, e) => {
      const diff = calcularDiferencaDias(e.dataEnvio, e.entregaRealizada)
      return acc + (diff || 0)
    }, 0)
    tempoMedioTransito = (totalDias / entregasRealizadas.length).toFixed(1)
  }

  // Custo médio por frete
  const custoMedioFrete = total > 0 ? (data?.stats.freteTotal || 0) / total : 0

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 shadow-xl sticky top-0 z-50">
        <div className="h-1 bg-gradient-to-r from-yellow-400 via-pink-300 to-yellow-400"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Logo e Título */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-md animate-pulse"></div>
                <div className="relative bg-white rounded-full p-2 shadow-lg ring-2 ring-white/50 animate-float">
                  <img 
                    src="https://play-lh.googleusercontent.com/wAZe4EgTT5MYO4dEYYPs0jhqIYDeDqX817W7h4o0_Ty3M6qaenLbYoOH6JeTswUls3UP" 
                    alt="Abelha Rainha" 
                    className="h-12 w-12 object-contain rounded-full"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
                  Abelha Rainha
                </h1>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                  </span>
                  <p className="text-pink-100 text-sm font-medium">
                    Sistema de Gestão de Entregas • {new Date().getFullYear()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Informações à direita */}
            <div className="hidden md:flex items-center gap-6">
              {/* Card de Entregas */}
              <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Package className="h-5 w-5 text-white animate-bounce-soft" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-pink-100 font-medium">Total Entregas</span>
                  <span className="text-lg font-bold text-white number-animate">{formatNumber(data?.stats.totalEntregas || 0)}</span>
                </div>
              </div>
              
              {/* Separador */}
              <div className="h-10 w-px bg-white/20"></div>
              
              {/* Usuário */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-white font-semibold">{currentUser.name}</span>
                  <span className="text-xs text-pink-200 capitalize">{currentUser.role === 'admin' ? 'Administrador' : 'Gerente'}</span>
                </div>
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-10 w-10 rounded-full object-cover border-2 border-white/50 shadow-lg"
                  />
                ) : (
                  <div className="p-2 bg-white/20 rounded-full">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
              
              {/* Botão Sair */}
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
            
            {/* Mobile Menu */}
            <div className="md:hidden flex items-center gap-2">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-8 w-8 rounded-full object-cover border-2 border-white/50"
                />
              ) : (
                <div className="p-2 bg-white/20 rounded-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Barra inferior com stats rápidos */}
        <div className="bg-black/10 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-white/90">
                <TrendingUp className="h-4 w-4 text-green-300 animate-bounce-soft" />
                <span className="font-medium">{formatNumber(data?.stats.entreguesAntecipada || 0)}</span>
                <span className="text-white/60">Antecipadas</span>
              </div>
              <div className="h-4 w-px bg-white/20"></div>
              <div className="flex items-center gap-2 text-white/90">
                <CheckCircle className="h-4 w-4 text-green-400 animate-check-pulse" />
                <span className="font-medium">{formatNumber(data?.stats.entreguesNoPrazo || 0)}</span>
                <span className="text-white/60">No Prazo</span>
              </div>
              <div className="h-4 w-px bg-white/20"></div>
              <div className="flex items-center gap-2 text-white/90">
                <Truck className="h-4 w-4 text-yellow-300 animate-truck-move" />
                <span className="font-medium">{formatNumber(data?.stats.emTransito || 0)}</span>
                <span className="text-white/60">Em Trânsito</span>
              </div>
              <div className="h-4 w-px bg-white/20"></div>
              <div className="flex items-center gap-2 text-white/90">
                <AlertTriangle className="h-4 w-4 text-red-300 animate-alert-pulse" />
                <span className="font-medium">{formatNumber(data?.stats.emAtraso || 0)}</span>
                <span className="text-white/60">Em Atraso</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Filtros */}
        <Card className="mb-6 shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-rose-400 px-4 py-2">
            <div className="flex items-center gap-2 text-white">
              <Filter className="h-4 w-4" />
              <span className="font-semibold text-sm">Filtros</span>
            </div>
          </div>
          <CardContent className="p-4 bg-white">
            <div className="flex flex-wrap gap-3">
              {/* Busca */}
              <div className="relative group shrink-0 w-full sm:w-[220px] h-9">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-pink-500 transition-colors pointer-events-none z-10" />
                <Input
                  placeholder="Buscar cliente, cidade, NF..."
                  value={busca}
                  onChange={(e) => { setBusca(e.target.value); setPage(1); }}
                  className="absolute inset-0 pl-10 w-full h-full border-gray-200 hover:border-pink-300 focus:border-pink-500 transition-colors"
                />
              </div>
              
              {/* Selects container */}
              <div className="flex flex-wrap gap-3 flex-1 min-w-0">
              {/* Trimestre */}
              <Select value={trimestreFiltro} onValueChange={(v) => { setTrimestreFiltro(v); setPage(1); }}>
                <SelectTrigger className="border-gray-200 hover:border-pink-300 focus:border-pink-500 transition-colors min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-pink-500" />
                    <SelectValue placeholder="Trimestre" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="todos">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400"></span>
                      Todos os Trimestres
                    </span>
                  </SelectItem>
                  {data?.filtros?.trimestres?.map((t) => {
                    const nomesTri: Record<string, string> = {
                      'T1': '1º Trimestre (Jan-Mar)',
                      'T2': '2º Trimestre (Abr-Jun)',
                      'T3': '3º Trimestre (Jul-Set)',
                      'T4': '4º Trimestre (Out-Dez)',
                    }
                    return (
                      <SelectItem key={t} value={t}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                          {nomesTri[t] || t}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              
              {/* Região */}
              <Select value={regiaoFiltro} onValueChange={(v) => { setRegiaoFiltro(v); setPage(1); }}>
                <SelectTrigger className="border-gray-200 hover:border-pink-300 focus:border-pink-500 transition-colors min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-pink-500" />
                    <SelectValue placeholder="Região" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="todos">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400"></span>
                      Todas as Regiões
                    </span>
                  </SelectItem>
                  {data?.filtros?.regioes?.map((r) => {
                    const iconesRegiao: Record<string, string> = {
                      'Norte': '🟢',
                      'Nordeste': '🟡',
                      'Centro-Oeste': '🟠',
                      'Sudeste': '🔴',
                      'Sul': '🔵',
                    }
                    return (
                      <SelectItem key={r} value={r}>
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{iconesRegiao[r] || '📍'}</span>
                          {r}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              
              {/* Mês */}
              <Select value={mesFiltro} onValueChange={(v) => { setMesFiltro(v); setPage(1); }}>
                <SelectTrigger className="border-gray-200 hover:border-pink-300 focus:border-pink-500 transition-colors min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-pink-500" />
                    <SelectValue placeholder="Mês" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="todos">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400"></span>
                      Todos os Meses
                    </span>
                  </SelectItem>
                  {data?.filtros?.meses?.map((m) => {
                    const nomesMeses: Record<string, string> = {
                      '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março',
                      '04': 'Abril', '05': 'Maio', '06': 'Junho',
                      '07': 'Julho', '08': 'Agosto', '09': 'Setembro',
                      '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
                    }
                    return (
                      <SelectItem key={m} value={m}>{nomesMeses[m] || m}</SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              
              {/* Estado */}
              <Select value={ufFiltro} onValueChange={(v) => { setUfFiltro(v); setPage(1); }}>
                <SelectTrigger className="border-gray-200 hover:border-pink-300 focus:border-pink-500 transition-colors min-w-[130px]">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-pink-500" />
                    <SelectValue placeholder="Estado" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="todos">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400"></span>
                      Todos os Estados
                    </span>
                  </SelectItem>
                  {data?.filtros?.ufs?.filter(uf => uf).map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Transportadora */}
              <Select value={transportadoraFiltro} onValueChange={(v) => { setTransportadoraFiltro(v); setPage(1); }}>
                <SelectTrigger className="border-gray-200 hover:border-pink-300 focus:border-pink-500 transition-colors min-w-[170px]">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-pink-500" />
                    <SelectValue placeholder="Transportadora" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="todos">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400"></span>
                      Todas as Transportadoras
                    </span>
                  </SelectItem>
                  {data?.filtros?.transportadoras?.filter(t => t).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Situação */}
              <Select value={situacaoFiltro} onValueChange={(v) => { setSituacaoFiltro(v); setPage(1); }}>
                <SelectTrigger className="border-gray-200 hover:border-pink-300 focus:border-pink-500 transition-colors min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-pink-500" />
                    <SelectValue placeholder="Situação" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="todos">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400"></span>
                      Todas as Situações
                    </span>
                  </SelectItem>
                  {data?.filtros?.situacoes?.filter(s => s).map((s) => {
                    const coresSituacao: Record<string, string> = {
                      'ENTREGUE ANTECIPADA': 'bg-green-800',
                      'ENTREGUE NO PRAZO': 'bg-green-500',
                      'EM TRÂNSITO': 'bg-yellow-500',
                      'ENTREGUE COM ATRASO': 'bg-orange-500',
                      'EM ATRASO': 'bg-red-500',
                      'DEVOLUÇÃO': 'bg-violet-500',
                    }
                    const nomesCurtos: Record<string, string> = {
                      'ENTREGUE ANTECIPADA': 'Antecipada',
                      'ENTREGUE NO PRAZO': 'No Prazo',
                      'ENTREGUE COM ATRASO': 'C/ Atraso',
                      'EM TRÂNSITO': 'Em Trânsito',
                      'EM ATRASO': 'Em Atraso',
                      'DEVOLUÇÃO': 'Devolução',
                    }
                    return (
                      <SelectItem key={s} value={s}>
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${coresSituacao[s] || 'bg-gray-400'}`}></span>
                          {nomesCurtos[s] || s}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              </div>
            </div>
            
            {/* Filtros Ativos */}
            {(ufFiltro !== 'todos' || transportadoraFiltro !== 'todos' || situacaoFiltro !== 'todos' || mesFiltro !== 'todos' || trimestreFiltro !== 'todos' || regiaoFiltro !== 'todos' || busca) && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Filtros ativos:</span>
                {busca && (
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-200 cursor-pointer" onClick={() => setBusca('')}>
                    Busca: {busca} <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                {trimestreFiltro !== 'todos' && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer" onClick={() => { setTrimestreFiltro('todos'); setPage(1); }}>
                    Trimestre: {trimestreFiltro === 'T1' ? '1º Tri' : trimestreFiltro === 'T2' ? '2º Tri' : trimestreFiltro === 'T3' ? '3º Tri' : '4º Tri'} <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                {regiaoFiltro !== 'todos' && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer" onClick={() => { setRegiaoFiltro('todos'); setPage(1); }}>
                    Região: {regiaoFiltro} <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                {mesFiltro !== 'todos' && (
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-200 cursor-pointer" onClick={() => { setMesFiltro('todos'); setPage(1); }}>
                    Mês: {mesFiltro} <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                {ufFiltro !== 'todos' && (
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-200 cursor-pointer" onClick={() => { setUfFiltro('todos'); setPage(1); }}>
                    Estado: {ufFiltro} <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                {transportadoraFiltro !== 'todos' && (
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-200 cursor-pointer" onClick={() => { setTransportadoraFiltro('todos'); setPage(1); }}>
                    Transportadora <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                {situacaoFiltro !== 'todos' && (
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-200 cursor-pointer" onClick={() => { setSituacaoFiltro('todos'); setPage(1); }}>
                    Situação <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:text-pink-600 text-xs"
                  onClick={() => {
                    setBusca('')
                    setMesFiltro('todos')
                    setUfFiltro('todos')
                    setTransportadoraFiltro('todos')
                    setSituacaoFiltro('todos')
                    setTrimestreFiltro('todos')
                    setRegiaoFiltro('todos')
                    setPage(1)
                  }}
                >
                  Limpar todos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload de Planilha - Apenas Admin */}
        {currentUser.role === 'admin' && (
        <Card className="mb-6 shadow-md border-2 border-dashed border-pink-300 bg-pink-50/50 animate-fade-in-up">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg animate-pulse-soft">
                  <Upload className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Atualizar Planilha de Entregas</p>
                  <p className="text-sm text-gray-500">Envie um arquivo .xlsx ou .xlsm para atualizar os dados</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xlsm,.xls"
                    onChange={handleUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <Button 
                    asChild
                    disabled={uploading}
                    className="bg-pink-500 hover:bg-pink-600 text-white transition-all hover:scale-105"
                  >
                    <span className="flex items-center gap-2">
                      {uploading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Selecionar Arquivo
                        </>
                      )}
                    </span>
                  </Button>
                </label>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center gap-2 hover:bg-pink-50 transition-all"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar Dados
                </Button>
              </div>
            </div>
            {uploadMessage && (
              <div className={`mt-3 p-2 rounded flex items-center justify-between ${
                uploadMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <span>{uploadMessage.text}</span>
                <button onClick={() => setUploadMessage(null)} className="p-1 hover:bg-white/50 rounded">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* KPI Principal - Taxa de Sucesso */}
        <Card className="mb-6 shadow-lg border-0 overflow-hidden animate-fade-in-up">
          <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-500 px-6 py-4">
            <div className="flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5" />
              <span className="font-semibold">Indicadores-Chave de Performance (KPIs)</span>
            </div>
          </div>
          <CardContent className="p-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Taxa de Entrega no Prazo */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                    <circle 
                      cx="60" cy="60" r="52" fill="none" 
                      stroke="url(#successGradient)" 
                      strokeWidth="10" 
                      strokeLinecap="round"
                      strokeDasharray={`${(taxaSucesso / 100) * 326.73} 326.73`}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#166534" />
                        <stop offset="50%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#16a34a" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black" style={{ color: taxaSucesso >= 80 ? '#166534' : taxaSucesso >= 60 ? '#d97706' : '#dc2626' }}>{taxaSucesso.toFixed(1)}%</span>
                    <span className="text-xs text-gray-500 font-medium">No Prazo</span>
                  </div>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-gray-700">Taxa de Entrega no Prazo</h3>
                <p className="text-xs text-gray-500 mt-1">Entregues antecipadas + no prazo</p>
              </div>

              {/* Tempo Médio de Trânsito */}
              <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100">
                <div className="p-4 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl mb-3">
                  <Truck className="h-10 w-10 text-pink-600" />
                </div>
                <span className="text-4xl font-black text-gray-800">{tempoMedioTransito}</span>
                <span className="text-sm text-gray-500 font-medium">dias em média</span>
                <h3 className="mt-2 text-sm font-semibold text-gray-700">Tempo Médio de Trânsito</h3>
                <p className="text-xs text-gray-500 mt-1">Do envio até a entrega</p>
              </div>

              {/* Custo Médio por Frete */}
              <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100">
                <div className="p-4 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl mb-3">
                  <Activity className="h-10 w-10 text-amber-600" />
                </div>
                <span className="text-4xl font-black text-gray-800">{formatCurrency(custoMedioFrete)}</span>
                <span className="text-sm text-gray-500 font-medium">por entrega</span>
                <h3 className="mt-2 text-sm font-semibold text-gray-700">Custo Médio por Frete</h3>
                <p className="text-xs text-gray-500 mt-1">Valor médio do frete por NF</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-md hover:shadow-lg transition-all hover-lift animate-fade-in-up">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Total Entregas</p>
                  <p className="text-2xl font-bold text-gray-800 number-animate">{formatNumber(data?.stats.totalEntregas || 0)}</p>
                  <p className="text-xs text-gray-400 mt-1">Registros na base</p>
                </div>
                <Package className="h-8 w-8 text-pink-500 animate-float" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-all border-l-4 border-l-green-800 hover-lift animate-fade-in-up delay-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Antecipadas</p>
                  <p className="text-2xl font-bold text-green-800 number-animate">{formatNumber(data?.stats.entreguesAntecipada || 0)}</p>
                  <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-green-800 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pctAntecipada}%` }}></div>
                  </div>
                  <p className="text-xs text-green-700 mt-1">{pctAntecipada}% do total</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-800 animate-bounce-soft" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-all border-l-4 border-l-green-500 hover-lift animate-fade-in-up delay-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">No Prazo</p>
                  <p className="text-2xl font-bold text-green-500 number-animate">{formatNumber(data?.stats.entreguesNoPrazo || 0)}</p>
                  <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pctNoPrazo}%` }}></div>
                  </div>
                  <p className="text-xs text-green-600 mt-1">{pctNoPrazo}% do total</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 animate-check-pulse" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-all border-l-4 border-l-orange-500 hover-lift animate-fade-in-up delay-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">C/ Atraso</p>
                  <p className="text-2xl font-bold text-orange-500 number-animate">{formatNumber(data?.stats.entreguesComAtraso || 0)}</p>
                  <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-orange-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pctComAtraso}%` }}></div>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">{pctComAtraso}% do total</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500 animate-shake" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-all border-l-4 border-l-yellow-500 hover-lift animate-fade-in-up delay-400">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Em Trânsito</p>
                  <p className="text-2xl font-bold text-yellow-600 number-animate">{formatNumber(data?.stats.emTransito || 0)}</p>
                  <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-yellow-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pctEmTransito}%` }}></div>
                  </div>
                  <p className="text-xs text-yellow-600 mt-1">{pctEmTransito}% do total</p>
                </div>
                <Truck className="h-8 w-8 text-yellow-500 animate-truck-move" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-all border-l-4 border-l-red-500 hover-lift animate-fade-in-up delay-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Em Atraso</p>
                  <p className="text-2xl font-bold text-red-500 number-animate">{formatNumber(data?.stats.emAtraso || 0)}</p>
                  <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-red-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pctEmAtraso}%` }}></div>
                  </div>
                  <p className="text-xs text-red-600 mt-1">{pctEmAtraso}% do total</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500 animate-alert-pulse" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-all border-l-4 border-l-violet-500 hover-lift animate-fade-in-up delay-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Devoluções</p>
                  <p className="text-2xl font-bold text-violet-500 number-animate">{formatNumber(data?.stats.devolucoes || 0)}</p>
                  <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-violet-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pctDevolucoes}%` }}></div>
                  </div>
                  <p className="text-xs text-violet-600 mt-1">{pctDevolucoes}% do total</p>
                </div>
                <Activity className="h-8 w-8 text-violet-500 animate-rotate-soft" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-all hover-lift animate-fade-in-up delay-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Frete Total</p>
                  <p className="text-lg font-bold text-gray-800 number-animate">{formatCurrency(data?.stats.freteTotal || 0)}</p>
                  <p className="text-xs text-gray-400 mt-1">Volume e Peso: {formatNumber(data?.stats.volumeTotal || 0)} vol / {formatNumber(Math.round(data?.stats.pesoTotal || 0))} kg</p>
                </div>
                <Activity className="h-8 w-8 text-pink-500 animate-float" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico Volume por Transportadora - Pizza */}
        <Card className="shadow-lg mb-6 hover:shadow-xl transition-all border-0 overflow-hidden animate-fade-in-up">
          <div className="bg-gradient-to-r from-pink-500 to-rose-400 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Truck className="h-5 w-5 animate-pulse-soft" />
                <span className="font-semibold text-lg">Análise de Volume por Transportadora</span>
              </div>
            </div>
          </div>
          <CardContent className="p-6 bg-white">
            <div className="h-[480px] flex items-center">
              {(data?.porTransportadora?.length || 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={420}>
                  <RechartsPie>
                    <Pie
                      data={(() => {
                        const all = data?.porTransportadora || []
                        const top7 = all.slice(0, 7)
                        const rest = all.slice(7)
                        if (rest.length === 0) return all
                        const outrosVolume = rest.reduce((sum: number, t: { volume: number }) => sum + t.volume, 0)
                        return [...top7, { nome: 'OUTROS', volume: outrosVolume, total: 0, entregues: 0, percentual: 0, peso: 0 }]
                      })()}
                      dataKey="volume"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      outerRadius={170}
                      paddingAngle={1}
                      stroke="#fff"
                      strokeWidth={2}
                      label={({ name, percent }: { name?: string; percent?: number }) => {
                        if (!percent || percent < 0.015) return ''
                        const shortName = (name || '').length > 18 ? (name || '').slice(0, 16) + '…' : (name || '')
                        return `${shortName} ${(percent * 100).toFixed(0)}%`
                      }}
                    >
                      {VOLUME_TRANSP_COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [formatNumber(Number(value)), 'Volume']}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        padding: '10px 14px',
                        background: '#fff',
                        fontSize: '13px',
                      }}
                    />

                  </RechartsPie>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl w-full">
                  <div className="text-center text-gray-400">
                    <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Sem dados para exibir</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico por UF */}
          <Card className="shadow-md hover:shadow-xl transition-all animate-fade-in-left">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-pink-500 animate-pulse-soft" />
                Entregas por Estado (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {(data?.porUF?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                    <BarChart data={data?.porUF || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis 
                        dataKey="uf" 
                        type="category" 
                        width={45} 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        tick={{ fontWeight: 600 }}
                      />
                      <Tooltip 
                        formatter={(value) => [formatNumber(Number(value)), 'Total']}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          padding: '12px 16px',
                          background: 'rgba(255,255,255,0.98)',
                        }}
                      />
                      <Bar 
                        dataKey="total" 
                        fill="#ec4899" 
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl">
                    <div className="text-center text-gray-400">
                      <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Sem dados para exibir</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico por Situação - Pizza */}
          <Card className="shadow-md hover:shadow-xl transition-all animate-fade-in-right">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5 text-pink-500 animate-pulse-soft" />
                Distribuição por Situação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {(data?.porSituacao?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                    <RechartsPie>
                      <Pie
                        data={data?.porSituacao || []}
                        dataKey="total"
                        nameKey="situacao"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={40}
                        paddingAngle={3}
                        label={({ name, percent }: { name?: string; percent?: number }) => {
                          const nomesCurtos: Record<string, string> = {
                            'ENTREGUE ANTECIPADA': 'Antecipada',
                            'ENTREGUE NO PRAZO': 'No Prazo',
                            'ENTREGUE COM ATRASO': 'C/ Atraso',
                            'EM TRÂNSITO': 'Em Trânsito',
                            'EM ATRASO': 'Em Atraso',
                            'DEVOLUÇÃO': 'Devolução',
                          }
                          return `${nomesCurtos[name ?? ''] ?? name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                        }}
                      >
                        {(data?.porSituacao || []).map((entry) => (
                          <Cell 
                            key={`cell-${entry.situacao}`} 
                            fill={STATUS_COLORS[entry.situacao] || '#8884d8'}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => {
                          const nomesCurtos: Record<string, string> = {
                            'ENTREGUE ANTECIPADA': 'Antecipada',
                            'ENTREGUE NO PRAZO': 'No Prazo',
                            'ENTREGUE COM ATRASO': 'C/ Atraso',
                            'EM TRÂNSITO': 'Em Trânsito',
                            'EM ATRASO': 'Em Atraso',
                            'DEVOLUÇÃO': 'Devolução',
                          }
                          return [formatNumber(Number(value)), nomesCurtos[String(name)] || String(name)]
                        }}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                          padding: '12px 16px',
                          background: 'rgba(255,255,255,0.98)',
                        }}
                      />
                      <Legend 
                        formatter={(value) => {
                          const nomesCurtos: Record<string, string> = {
                            'ENTREGUE ANTECIPADA': 'Antecipada',
                            'ENTREGUE NO PRAZO': 'No Prazo',
                            'ENTREGUE COM ATRASO': 'C/ Atraso',
                            'EM TRÂNSITO': 'Em Trânsito',
                            'EM ATRASO': 'Em Atraso',
                            'DEVOLUÇÃO': 'Devolução',
                          }
                          return nomesCurtos[String(value)] || String(value)
                        }}
                        iconType="circle"
                        iconSize={12}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl">
                    <div className="text-center text-gray-400">
                      <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Sem dados para exibir</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico por Mês */}
        <Card className="shadow-lg mb-6 hover:shadow-xl transition-all border-0 overflow-hidden animate-fade-in-up">
          <div className="bg-gradient-to-r from-pink-500 to-rose-400 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Calendar className="h-5 w-5 animate-pulse-soft" />
                <span className="font-semibold">Entregas por Mês</span>
              </div>
              <div className="text-pink-100 text-sm">
                Distribuição mensal por situação
              </div>
            </div>
          </div>
          <CardContent className="p-4 bg-white">
            {/* Legenda explicativa */}
            <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-green-800"></span>
                <span className="text-sm text-gray-700"><strong>Antecipada</strong> - Entregue antes do prazo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-green-500"></span>
                <span className="text-sm text-gray-700"><strong>No Prazo</strong> - Entregue na data prevista</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-yellow-500"></span>
                <span className="text-sm text-gray-700"><strong>Em Trânsito</strong> - Ainda em transporte</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-orange-500"></span>
                <span className="text-sm text-gray-700"><strong>C/ Atraso</strong> - Entregue após o prazo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-red-500"></span>
                <span className="text-sm text-gray-700"><strong>Em Atraso</strong> - Pendente após prazo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-violet-500"></span>
                <span className="text-sm text-gray-700"><strong>Devolução</strong> - Retorno ao remetente</span>
              </div>
            </div>
            
            <div className="h-80">
              {(data?.porMes?.length || 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                  <BarChart data={data?.porMes || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="mesNome" 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontWeight: 600, fill: '#374151' }}
                    />
                    <YAxis 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#6b7280' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        const nomes: Record<string, string> = {
                          'antecipada': 'Antecipada',
                          'noPrazo': 'No Prazo',
                          'comAtraso': 'C/ Atraso',
                          'emTransito': 'Em Trânsito',
                          'emAtraso': 'Em Atraso',
                          'devolucao': 'Devolução',
                        }
                        return [formatNumber(Number(value)), nomes[String(name)] || String(name)]
                      }}
                      labelFormatter={(label) => `Mês: ${label}`}
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.98)',
                      }}
                    />
                    <Legend 
                      formatter={(value) => {
                        const nomes: Record<string, string> = {
                          'antecipada': 'Antecipada',
                          'noPrazo': 'No Prazo',
                          'comAtraso': 'C/ Atraso',
                          'emTransito': 'Em Trânsito',
                          'emAtraso': 'Em Atraso',
                          'devolucao': 'Devolução',
                        }
                        return nomes[String(value)] || String(value)
                      }}
                      iconType="circle"
                      iconSize={10}
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                    <Bar dataKey="antecipada" stackId="a" fill="#166534" name="antecipada" />
                    <Bar dataKey="noPrazo" stackId="a" fill="#22c55e" name="noPrazo" />
                    <Bar dataKey="emTransito" stackId="a" fill="#eab308" name="emTransito" />
                    <Bar dataKey="comAtraso" stackId="a" fill="#f97316" name="comAtraso" />
                    <Bar dataKey="emAtraso" stackId="a" fill="#ef4444" name="emAtraso" />
                    <Bar dataKey="devolucao" stackId="a" fill="#8b5cf6" name="devolucao" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl">
                  <div className="text-center text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Sem dados para exibir</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Análise por Trimestre e Região */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico por Trimestre */}
          <Card className="shadow-md hover:shadow-xl transition-all animate-fade-in-left border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-fuchsia-500 px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Layers className="h-5 w-5 animate-pulse-soft" />
                  <span className="font-semibold">Análise por Trimestre</span>
                </div>
                <div className="text-purple-100 text-sm">
                  Distribuição trimestral
                </div>
              </div>
            </div>
            <CardContent className="p-4 bg-white">
              <div className="h-80">
                {(data?.porTrimestre?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                    <BarChart data={data?.porTrimestre || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="trimestreNome" 
                        fontSize={11} 
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontWeight: 600, fill: '#374151' }}
                      />
                      <YAxis 
                        fontSize={12} 
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#6b7280' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          const nomes: Record<string, string> = {
                            'antecipada': 'Antecipada',
                            'noPrazo': 'No Prazo',
                            'comAtraso': 'C/ Atraso',
                            'emTransito': 'Em Trânsito',
                            'emAtraso': 'Em Atraso',
                            'devolucao': 'Devolução',
                          }
                          return [formatNumber(Number(value)), nomes[String(name)] || String(name)]
                        }}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                          padding: '12px 16px',
                          background: 'rgba(255,255,255,0.98)',
                        }}
                      />
                      <Legend 
                        formatter={(value) => {
                          const nomes: Record<string, string> = {
                            'antecipada': 'Antecipada',
                            'noPrazo': 'No Prazo',
                            'comAtraso': 'C/ Atraso',
                            'emTransito': 'Em Trânsito',
                            'emAtraso': 'Em Atraso',
                            'devolucao': 'Devolução',
                          }
                          return nomes[String(value)] || String(value)
                        }}
                        iconType="circle"
                        iconSize={10}
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                      <Bar dataKey="antecipada" stackId="tri" fill="#166534" name="antecipada" />
                      <Bar dataKey="noPrazo" stackId="tri" fill="#22c55e" name="noPrazo" />
                      <Bar dataKey="emTransito" stackId="tri" fill="#eab308" name="emTransito" />
                      <Bar dataKey="comAtraso" stackId="tri" fill="#f97316" name="comAtraso" />
                      <Bar dataKey="emAtraso" stackId="tri" fill="#ef4444" name="emAtraso" />
                      <Bar dataKey="devolucao" stackId="tri" fill="#8b5cf6" name="devolucao" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl">
                    <div className="text-center text-gray-400">
                      <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Sem dados para exibir</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico por Região */}
          <Card className="shadow-md hover:shadow-xl transition-all animate-fade-in-right border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Globe className="h-5 w-5 animate-pulse-soft" />
                  <span className="font-semibold">Análise por Região</span>
                </div>
                <div className="text-emerald-100 text-sm">
                  Entregas por região do Brasil
                </div>
              </div>
            </div>
            <CardContent className="p-4 bg-white">
              <div className="h-80">
                {(data?.porRegiao?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                    <BarChart data={data?.porRegiao || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="regiao" 
                        fontSize={12} 
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontWeight: 600, fill: '#374151' }}
                      />
                      <YAxis 
                        fontSize={12} 
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#6b7280' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          const labels: Record<string, string> = {
                            'total': 'Total',
                            'entregues': 'Entregues',
                          }
                          return [formatNumber(Number(value)), labels[String(name)] || String(name)]
                        }}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                          padding: '12px 16px',
                          background: 'rgba(255,255,255,0.98)',
                        }}
                        labelFormatter={(label, payload) => {
                          const items = payload as Array<Record<string, unknown>> | undefined
                          const item = items?.[0]?.payload as Record<string, unknown> | undefined
                          const ufs = item?.ufs as string[] | undefined
                          if (ufs?.length) {
                            return `${label} (${ufs.join(', ')})`
                          }
                          return label
                        }}
                      />
                      <Legend 
                        formatter={(value) => String(value) === 'total' ? 'Total' : 'Entregues'}
                        iconType="circle"
                        iconSize={10}
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                      <Bar dataKey="total" fill="#10b981" name="total" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="entregues" fill="#059669" name="entregues" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl">
                    <div className="text-center text-gray-400">
                      <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Sem dados para exibir</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Por Transportadora */}
        <Card className="shadow-lg mb-6 hover:shadow-xl transition-all border-0 overflow-hidden animate-fade-in-up">
          <div className="bg-gradient-to-r from-pink-500 to-rose-400 px-4 py-2">
            <div className="flex items-center gap-2 text-white">
              <Building2 className="h-5 w-5 animate-pulse-soft" />
              <span className="font-semibold">Performance por Transportadora</span>
            </div>
          </div>
          <CardContent className="p-4 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(data?.porTransportadora || []).slice(0, 8).map((t, i) => {
                const logo = getTransportadoraLogo(t.nome)
                const pendentes = t.total - t.entregues
                
                // Usar cor da transportadora ou cor padrão baseada no índice
                const mainColor = logo.found ? logo.bgColor : ['#ec4899', '#8b5cf6', '#6366f1', '#14b8a6'][i % 4]
                
                // Função para converter hex em RGB
                const hexToRgb = (hex: string) => {
                  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
                  return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                  } : { r: 236, g: 72, b: 153 }
                }
                
                const rgb = hexToRgb(mainColor)
                
                return (
                  <Card 
                    key={t.nome} 
                    className="border-0 hover:shadow-lg transition-all hover:scale-[1.02] overflow-hidden"
                    style={{ backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)` }}
                  >
                    <CardContent className="p-4">
                      {/* Header do Card com Logo */}
                      <div className="flex items-center gap-3 mb-4">
                        <div 
                          className="w-14 h-14 rounded-xl shadow-lg overflow-hidden flex items-center justify-center"
                          style={{ backgroundColor: logo.found ? '#ffffff' : mainColor }}
                        >
                          {logo.found ? (
                            <img 
                              src={logo.url} 
                              alt={t.nome}
                              className="w-12 h-12 object-contain p-1"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                if (e.currentTarget.nextElementSibling) {
                                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'
                                }
                              }}
                            />
                          ) : null}
                          <div className={`${logo.found ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}>
                            <Truck className="h-7 w-7 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p 
                            className="font-bold text-sm truncate"
                            style={{ color: mainColor }}
                          >
                            {t.nome}
                          </p>
                          <p className="text-xs text-gray-500">Transportadora</p>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-white/50 rounded-lg px-3 py-2">
                          <span className="text-xs text-gray-600 flex items-center gap-2 font-medium">
                            <Package className="h-4 w-4 text-gray-600" /> Total
                          </span>
                          <span className="font-bold text-base">{formatNumber(t.total)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-green-50 rounded-lg px-3 py-2">
                          <span className="text-xs text-green-700 flex items-center gap-2 font-medium">
                            <CheckCircle className="h-4 w-4 text-green-600" /> Entregues
                          </span>
                          <span className="font-bold text-base text-green-600">{formatNumber(t.entregues)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-yellow-50 rounded-lg px-3 py-2">
                          <span className="text-xs text-yellow-700 flex items-center gap-2 font-medium">
                            <Truck className="h-4 w-4 text-yellow-500 animate-truck-move" /> Em Trânsito
                          </span>
                          <span className="font-bold text-base text-yellow-600">{formatNumber(pendentes)}</span>
                        </div>
                      </div>
                      
                      {/* Barra de Progresso */}
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-500 font-medium">Progresso</span>
                          <span 
                            className="text-sm font-bold"
                            style={{ color: mainColor }}
                          >
                            {t.percentual}%
                          </span>
                        </div>
                        <div className="bg-white/60 rounded-full h-4 overflow-hidden shadow-inner">
                          <div 
                            className="rounded-full h-4 transition-all duration-1000"
                            style={{ 
                              width: `${t.percentual}%`,
                              backgroundColor: mainColor
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            
            {/* Resumo Geral */}
            {(data?.porTransportadora?.length || 0) > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-400"></span>
                    <span className="text-gray-600">
                      <strong>{data?.porTransportadora?.length || 0}</strong> transportadoras ativas
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-gray-600">
                      Média: <strong>
                        {Math.round(
                          (data?.porTransportadora || []).reduce((acc, t) => acc + t.percentual, 0) / 
                          Math.max(1, (data?.porTransportadora || []).length)
                        )}%
                      </strong> de conclusão
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de Entregas */}
        <Card className="shadow-md hover:shadow-xl transition-all animate-fade-in-up">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-pink-500 animate-pulse-soft" />
                Detalhamento de Entregas
              </CardTitle>
              <div className="relative w-full sm:w-80 h-9">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                <Input
                  placeholder="Buscar cliente, código ou NF..."
                  value={buscaTabelaInput}
                  onChange={(e) => setBuscaTabelaInput(e.target.value)}
                  className="absolute inset-0 pl-10 w-full h-full transition-all focus:ring-2 focus:ring-pink-300"
                />
                {buscaTabelaInput && (
                  <button
                    onClick={() => setBuscaTabelaInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="whitespace-nowrap font-semibold">NF</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Cod. Cliente</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Cliente</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Cidade/UF</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Frete</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Transportadora</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Tempo Trânsito</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Previsão</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Entrega</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Deadline</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.entregas || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data?.entregas || []).map((entrega, idx) => (
                      <TableRow 
                        key={`${entrega.nf}-${idx}`} 
                        className="hover:bg-pink-50/50 transition-all"
                      >
                        <TableCell className="font-medium whitespace-nowrap">{entrega.nf}</TableCell>
                        <TableCell className="whitespace-nowrap">{entrega.cliente}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={entrega.nome}>
                          {entrega.nome}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            {entrega.cidade}/{entrega.uf}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatCurrency(entrega.valFret)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{entrega.transportadora}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatarDiferencaDias(calcularDiferencaDias(entrega.dataEnvio, entrega.entregaRealizada), 'envio')}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatDateBR(entrega.previsaoEntrega)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDateBR(entrega.entregaRealizada)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatarDiferencaDias(calcularDiferencaDias(entrega.previsaoEntrega, entrega.entregaRealizada), 'deadline')}
                        </TableCell>
                        <TableCell>{getSituacaoBadge(entrega.situacao)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            {data && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  {buscaTabela ? (
                    <>
                      {data.entregas.length} resultado{data.entregas.length !== 1 ? 's' : ''} encontrado{data.entregas.length !== 1 ? 's' : ''} para &quot;{buscaTabela}&quot;
                    </>
                  ) : (
                    <>
                      Mostrando {((page - 1) * 20) + 1} a {Math.min(page * 20, data.paginacao.total)} de {data.paginacao.total} registros
                    </>
                  )}
                </p>
                {!buscaTabela && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-500">
                    Página {page} de {data.paginacao.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(data.paginacao.totalPages, p + 1))}
                    disabled={page === data.paginacao.totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4 mt-auto animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-400"></span>
              </span>
              <p className="text-sm text-gray-400">
                © 2026 Abelha Rainha - Sistema de Gestão de Entregas
              </p>
            </div>
            <span className="hidden sm:inline text-gray-600">|</span>
            <p className="text-sm text-gray-500">
              Site criado pelo <span className="text-pink-400 font-medium">Welington F.</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
