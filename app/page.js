'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Zap, Brain, Eye, Gavel, ScrollText, ArrowRight, Bot, ChevronRight } from 'lucide-react'

const features = [
  { icon: Brain, title: 'AI Moderation', desc: 'Advanced AI-powered content filtering with customizable toxicity thresholds', color: 'text-red-500' },
  { icon: Shield, title: 'Anti-Nuke Protection', desc: 'Detect and prevent mass actions like channel/role deletions and mass bans', color: 'text-amber-500' },
  { icon: Zap, title: 'AutoMod Engine', desc: 'Block spam, invites, links, caps, and banned words automatically', color: 'text-red-400' },
  { icon: Eye, title: 'Advanced Logging', desc: 'Track every action with detailed logs for moderation, messages, and voice', color: 'text-amber-400' },
  { icon: Gavel, title: 'Full Moderation Suite', desc: '25+ moderation commands: ban, kick, warn, timeout, jail, and more', color: 'text-red-300' },
  { icon: ScrollText, title: 'Appeal System', desc: 'Let users appeal bans and punishments with a built-in review system', color: 'text-amber-300' },
]

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session) router.push('/dashboard')
  }, [session, status, router])

  return (
    <div className="min-h-screen animated-gradient">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-card border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/thundercore-logo.jpg" alt="ThunderCore" className="w-10 h-10 rounded-full neon-glow" />
            <span className="text-xl font-bold bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
              ThunderCore
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`https://discord.com/api/oauth2/authorize?client_id=1485172418128510987&permissions=8&scope=bot%20applications.commands`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                <Bot className="w-4 h-4 mr-2" /> Invite Bot
              </Button>
            </a>
            <Button
              onClick={() => signIn('discord')}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white neon-glow"
            >
              Login with Discord <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8 inline-block">
            <div className="relative">
              <img
                src="/thundercore-logo.jpg"
                alt="ThunderCore"
                className="w-32 h-32 rounded-full mx-auto neon-glow"
                style={{animation: 'float 6s ease-in-out infinite'}}
              />
              <div className="absolute -inset-4 rounded-full bg-red-500/10 blur-xl -z-10"></div>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            <span className="bg-gradient-to-r from-red-500 via-amber-500 to-red-500 bg-clip-text text-transparent neon-text">
              ThunderCore
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto">
            The Ultimate Discord AI Moderation Bot
          </p>
          <p className="text-base text-muted-foreground/70 mb-10 max-w-xl mx-auto">
            Protect your server with AI-powered moderation, anti-nuke, automod, and a full command control dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => signIn('discord')}
              className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-lg px-8 py-6 neon-glow"
            >
              Open Dashboard <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <a
              href={`https://discord.com/api/oauth2/authorize?client_id=1485172418128510987&permissions=8&scope=bot%20applications.commands`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-lg px-8 py-6 w-full"
              >
                <Bot className="w-5 h-5 mr-2" /> Add to Discord
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
            Everything you need to keep your Discord server safe and well-moderated.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="glass-card border-white/5 hover:border-red-500/20 transition-all duration-300 group hover:-translate-y-1">
                <CardContent className="p-6">
                  <feature.icon className={`w-10 h-10 ${feature.color} mb-4 group-hover:scale-110 transition-transform`} />
                  <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto glass-card rounded-2xl p-8 neon-glow">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '25+', label: 'Mod Commands' },
              { value: 'AI', label: 'Powered' },
              { value: '24/7', label: 'Protection' },
              { value: '100%', label: 'Free' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-bold bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/thundercore-logo.jpg" alt="ThunderCore" className="w-6 h-6 rounded-full" />
            <span className="text-sm text-muted-foreground">ThunderCore</span>
          </div>
          <p className="text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} ThunderCore. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
