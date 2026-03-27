'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Bot, LogOut, RefreshCw, Crown, ExternalLink } from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [guilds, setGuilds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
  }, [status, router])

  useEffect(() => {
    if (session) fetchGuilds()
  }, [session])

  const fetchGuilds = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/guilds')
      if (res.ok) {
        const data = await res.json()
        setGuilds(data)
      }
    } catch (err) {
      console.error('Failed to fetch guilds:', err)
    }
    setLoading(false)
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-gradient">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 animate-pulse bg-red-500/20"></div>
          <p className="text-muted-foreground">Loading your servers...</p>
        </div>
      </div>
    )
  }

  const getGuildIcon = (guild) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`
    }
    return null
  }

  return (
    <div className="min-h-screen animated-gradient">
      {/* Header */}
      <nav className="sticky top-0 z-50 glass-card border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
            <img src="/thundercore-logo.jpg" alt="ThunderCore" className="w-9 h-9 rounded-full" />
            <span className="text-lg font-bold bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
              ThunderCore
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {session.user?.image && (
                <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
              )}
              <span className="text-sm text-muted-foreground hidden sm:block">{session.user?.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-muted-foreground hover:text-red-400"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Select a Server</h1>
            <p className="text-muted-foreground">Choose a server to manage with ThunderCore</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchGuilds}
            disabled={loading}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i} className="glass-card border-white/5 animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/5"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-white/5 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-white/5 rounded w-20"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guilds.map((guild) => (
              <Card
                key={guild.id}
                className={`glass-card border-white/5 transition-all duration-300 cursor-pointer group ${
                  guild.botPresent
                    ? 'hover:border-red-500/30 hover:-translate-y-1 hover:neon-glow'
                    : 'hover:border-amber-500/20 opacity-80'
                }`}
                onClick={() => {
                  if (guild.botPresent) {
                    router.push(`/dashboard/${guild.id}`)
                  } else {
                    window.open(`https://discord.com/api/oauth2/authorize?client_id=1485172418128510987&permissions=8&scope=bot%20applications.commands&guild_id=${guild.id}`, '_blank')
                  }
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {getGuildIcon(guild) ? (
                        <img src={getGuildIcon(guild)} alt={guild.name} className="w-14 h-14 rounded-full" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500/20 to-amber-500/20 flex items-center justify-center">
                          <span className="text-lg font-bold text-white">{guild.name.charAt(0)}</span>
                        </div>
                      )}
                      {guild.owner && (
                        <Crown className="w-4 h-4 text-amber-500 absolute -top-1 -right-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                        {guild.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {guild.botPresent ? (
                          <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                            <Shield className="w-3 h-3 mr-1" /> Bot Active
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                            <Bot className="w-3 h-3 mr-1" /> Invite Bot
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-muted-foreground group-hover:text-red-400 transition-colors">
                      {guild.botPresent ? (
                        <Shield className="w-5 h-5" />
                      ) : (
                        <ExternalLink className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && guilds.length === 0 && (
          <div className="text-center py-20">
            <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No servers found</h3>
            <p className="text-sm text-muted-foreground/60">You need Manage Server permission to configure ThunderCore</p>
          </div>
        )}
      </div>
    </div>
  )
}
