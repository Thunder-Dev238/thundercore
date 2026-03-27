'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Shield, Brain, Zap, Eye, Gavel, ScrollText, Settings, Terminal,
  ArrowLeft, RefreshCw, Save, CheckCircle, LogOut, ChevronRight,
  AlertTriangle, Lock, Users, MessageSquare, Hash, Trash2, Check, X,
  Home, Bot
} from 'lucide-react'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'moderation', label: 'Moderation', icon: Gavel },
  { id: 'automod', label: 'AutoMod', icon: Zap },
  { id: 'antinuke', label: 'Anti-Nuke', icon: Shield },
  { id: 'aimod', label: 'AI Moderation', icon: Brain },
  { id: 'logging', label: 'Logging', icon: Eye },
  { id: 'raidmode', label: 'Raid Protection', icon: AlertTriangle },
  { id: 'appeals', label: 'Appeals', icon: ScrollText },
  { id: 'commands', label: 'Commands', icon: Terminal },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function GuildDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const guildId = params.guildId

  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Data states
  const [guildSettings, setGuildSettings] = useState(null)
  const [commandSettings, setCommandSettings] = useState(null)
  const [appeals, setAppeals] = useState([])
  const [cases, setCases] = useState([])
  const [channels, setChannels] = useState([])
  const [roles, setRoles] = useState([])

  // Editable copies
  const [moderation, setModeration] = useState({})
  const [autoMod, setAutoMod] = useState({})
  const [antiNuke, setAntiNuke] = useState({})
  const [aiMod, setAiMod] = useState({})
  const [logs, setLogs] = useState({})
  const [raidMode, setRaidMode] = useState({})
  const [appealsConfig, setAppealsConfig] = useState({})
  const [commands, setCommands] = useState({})
  const [prefix, setPrefix] = useState('t!')
  const [security, setSecurity] = useState({ whitelist: [], trusted: [] })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
  }, [status, router])

  const fetchData = useCallback(async () => {
    if (!guildId || !session) return
    setLoading(true)
    try {
      const [settingsRes, cmdsRes, appealsRes, casesRes, channelsRes, rolesRes] = await Promise.all([
        fetch(`/api/guilds/${guildId}`),
        fetch(`/api/guilds/${guildId}/commands`),
        fetch(`/api/guilds/${guildId}/appeals`),
        fetch(`/api/guilds/${guildId}/cases`),
        fetch(`/api/guilds/${guildId}/channels`),
        fetch(`/api/guilds/${guildId}/roles`),
      ])

      if (settingsRes.ok) {
        const s = await settingsRes.json()
        setGuildSettings(s)
        setModeration(s.moderation || {})
        setAutoMod(s.autoMod || {})
        setAntiNuke(s.antiNuke || {})
        setAiMod(s.aiMod || {})
        setLogs(s.logs || {})
        setRaidMode(s.raidMode || {})
        setAppealsConfig(s.appeals || {})
        setPrefix(s.prefix || 't!')
        setSecurity(s.security || { whitelist: [], trusted: [] })
      }
      if (cmdsRes.ok) {
        const c = await cmdsRes.json()
        setCommandSettings(c)
        setCommands(c.commands || {})
      }
      if (appealsRes.ok) setAppeals(await appealsRes.json())
      if (casesRes.ok) setCases(await casesRes.json())
      if (channelsRes.ok) setChannels(await channelsRes.json())
      if (rolesRes.ok) setRoles(await rolesRes.json())
    } catch (err) {
      console.error('Failed to fetch data:', err)
    }
    setLoading(false)
  }, [guildId, session])

  useEffect(() => { fetchData() }, [fetchData])

  const applyChanges = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/guilds/${guildId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moderation, autoMod, antiNuke, aiMod, logs, raidMode,
          appeals: appealsConfig, prefix, security, commands,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setHasChanges(false)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Failed to apply:', err)
    }
    setSaving(false)
  }

  const markChanged = () => setHasChanges(true)

  const updateModeration = (key, value) => {
    setModeration(prev => ({ ...prev, [key]: value }))
    markChanged()
  }

  const updateAutoMod = (key, value) => {
    setAutoMod(prev => ({ ...prev, [key]: value }))
    markChanged()
  }

  const updateAntiNuke = (key, value) => {
    setAntiNuke(prev => ({ ...prev, [key]: value }))
    markChanged()
  }

  const updateAntiNukeThreshold = (key, value) => {
    setAntiNuke(prev => ({
      ...prev,
      thresholds: { ...(prev.thresholds || {}), [key]: value }
    }))
    markChanged()
  }

  const updateAiMod = (key, value) => {
    setAiMod(prev => ({ ...prev, [key]: value }))
    markChanged()
  }

  const updateLogs = (key, value) => {
    setLogs(prev => ({ ...prev, [key]: value }))
    markChanged()
  }

  const updateRaidMode = (key, value) => {
    setRaidMode(prev => ({ ...prev, [key]: value }))
    markChanged()
  }

  const updateAppealsConfig = (key, value) => {
    setAppealsConfig(prev => ({ ...prev, [key]: value }))
    markChanged()
  }

  const toggleCommand = (category, cmdName) => {
    setCommands(prev => {
      const updated = { ...prev }
      if (updated[category]) {
        updated[category] = updated[category].map(cmd =>
          cmd.name === cmdName ? { ...cmd, enabled: !cmd.enabled } : cmd
        )
      }
      return updated
    })
    markChanged()
  }

  const reviewAppeal = async (appealId, status) => {
    try {
      await fetch(`/api/guilds/${guildId}/appeals/${appealId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNote: '' }),
      })
      fetchData()
    } catch (err) {
      console.error('Failed to review appeal:', err)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-gradient">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 animate-pulse bg-red-500/20"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 glass-card border-r border-white/5 flex flex-col fixed h-full z-40`}>
        <div className="p-4 flex items-center gap-3 border-b border-white/5">
          <img src="/thundercore-logo.jpg" alt="TC" className="w-9 h-9 rounded-full flex-shrink-0" />
          {sidebarOpen && (
            <span className="text-sm font-bold bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent truncate">
              ThunderCore
            </span>
          )}
        </div>

        <ScrollArea className="flex-1 py-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                activeTab === tab.id
                  ? 'text-red-400 bg-red-500/10 border-r-2 border-red-500'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{tab.label}</span>}
            </button>
          ))}
        </ScrollArea>

        <div className="p-4 border-t border-white/5 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-white"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> {sidebarOpen && 'Back to Servers'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-red-400"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="w-4 h-4 mr-2" /> {sidebarOpen && 'Logout'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 glass-card border-b border-white/5 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-white">
                <ChevronRight className={`w-5 h-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
              </button>
              <h1 className="text-lg font-semibold text-white">
                {TABS.find(t => t.id === activeTab)?.label}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={fetchData} className="border-white/10 text-muted-foreground hover:text-white">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              {hasChanges && (
                <Button
                  size="sm"
                  onClick={applyChanges}
                  disabled={saving}
                  className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white neon-glow"
                >
                  {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Apply Changes
                </Button>
              )}
              {saved && (
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" /> Saved!
                </Badge>
              )}
            </div>
          </div>
        </header>

        <div className="p-6 max-w-5xl">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'AutoMod', enabled: autoMod.enabled, icon: Zap, color: 'red' },
                  { label: 'Anti-Nuke', enabled: antiNuke.enabled, icon: Shield, color: 'amber' },
                  { label: 'AI Moderation', enabled: aiMod.enabled, icon: Brain, color: 'red' },
                  { label: 'Raid Protection', enabled: raidMode.enabled, icon: AlertTriangle, color: 'amber' },
                ].map((item, i) => (
                  <Card key={i} className="glass-card border-white/5">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <item.icon className={`w-8 h-8 text-${item.color}-500`} />
                        <Badge className={item.enabled
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-white/5 text-muted-foreground border-white/10'
                        }>
                          {item.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-white">{item.label}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="glass-card border-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Recent Moderation Cases</CardTitle>
                  <CardDescription>Last 10 moderation actions</CardDescription>
                </CardHeader>
                <CardContent>
                  {cases.length > 0 ? (
                    <div className="space-y-3">
                      {cases.slice(0, 10).map((c, i) => (
                        <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">{c.type}</Badge>
                            <span className="text-sm text-white">Case #{c.caseId}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Target: {c.target?.tag || c.target?.id || 'N/A'}</span>
                            <span>|</span>
                            <span>{c.reason?.substring(0, 40)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No moderation cases yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card border-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Quick Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Bot Prefix</p>
                      <p className="text-xs text-muted-foreground">Current: {prefix}</p>
                    </div>
                    <Input
                      value={prefix}
                      onChange={(e) => { setPrefix(e.target.value); markChanged() }}
                      className="w-24 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Appeals System</p>
                      <p className="text-xs text-muted-foreground">Allow users to appeal punishments</p>
                    </div>
                    <Switch
                      checked={appealsConfig.enabled || false}
                      onCheckedChange={(v) => updateAppealsConfig('enabled', v)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Moderation Tab */}
          {activeTab === 'moderation' && (
            <div className="space-y-6">
              <Card className="glass-card border-white/5">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Gavel className="w-5 h-5 text-red-500" /> Moderation Settings
                  </CardTitle>
                  <CardDescription>Configure punishment thresholds and behaviors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white">Warning Limit</Label>
                      <p className="text-xs text-muted-foreground">Warnings before auto-punishment</p>
                      <Input
                        type="number"
                        value={moderation.warnLimit || 3}
                        onChange={(e) => updateModeration('warnLimit', parseInt(e.target.value) || 3)}
                        className="bg-white/5 border-white/10 text-white"
                        min={1} max={20}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Warning Punishment</Label>
                      <p className="text-xs text-muted-foreground">Action after limit reached</p>
                      <Select
                        value={moderation.warnPunishment || 'kick'}
                        onValueChange={(v) => updateModeration('warnPunishment', v)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-white/10">
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="kick">Kick</SelectItem>
                          <SelectItem value="ban">Ban</SelectItem>
                          <SelectItem value="timeout">Timeout</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Timeout Duration (minutes)</Label>
                      <p className="text-xs text-muted-foreground">Duration for timeout punishments</p>
                      <Input
                        type="number"
                        value={Math.floor((moderation.timeoutDuration || 3600000) / 60000)}
                        onChange={(e) => updateModeration('timeoutDuration', (parseInt(e.target.value) || 60) * 60000)}
                        className="bg-white/5 border-white/10 text-white"
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Mute Role</Label>
                      <p className="text-xs text-muted-foreground">Role applied when muting users</p>
                      <Select
                        value={moderation.muteRole || 'none'}
                        onValueChange={(v) => updateModeration('muteRole', v === 'none' ? null : v)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-white/10">
                          <SelectItem value="none">None</SelectItem>
                          {roles.map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Jail Role</Label>
                      <p className="text-xs text-muted-foreground">Role applied when jailing users</p>
                      <Select
                        value={moderation.jailRole || 'none'}
                        onValueChange={(v) => updateModeration('jailRole', v === 'none' ? null : v)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-white/10">
                          <SelectItem value="none">None</SelectItem>
                          {roles.map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Jail Channel</Label>
                      <p className="text-xs text-muted-foreground">Channel for jailed users</p>
                      <Select
                        value={moderation.jailChannel || 'none'}
                        onValueChange={(v) => updateModeration('jailChannel', v === 'none' ? null : v)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-white/10">
                          <SelectItem value="none">None</SelectItem>
                          {channels.map(c => (
                            <SelectItem key={c.id} value={c.id}>#{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AutoMod Tab */}
          {activeTab === 'automod' && (
            <div className="space-y-6">
              <Card className="glass-card border-white/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-red-500" /> AutoMod Engine
                      </CardTitle>
                      <CardDescription>Automatically moderate messages</CardDescription>
                    </div>
                    <Switch checked={autoMod.enabled || false} onCheckedChange={(v) => updateAutoMod('enabled', v)} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'blockSpam', label: 'Block Spam', desc: 'Detect and remove spam messages' },
                      { key: 'blockLinks', label: 'Block Links', desc: 'Block all external links' },
                      { key: 'blockInvites', label: 'Block Invites', desc: 'Block Discord server invites' },
                      { key: 'blockCaps', label: 'Block Excessive Caps', desc: 'Detect and remove all-caps messages' },
                      { key: 'blockZalgo', label: 'Block Zalgo Text', desc: 'Block corrupted/glitchy text' },
                      { key: 'logViolations', label: 'Log Violations', desc: 'Log all automod actions' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                        <div>
                          <p className="text-sm font-medium text-white">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch checked={autoMod[item.key] || false} onCheckedChange={(v) => updateAutoMod(item.key, v)} />
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-white/5" />

                  <div className="space-y-2">
                    <Label className="text-white">AutoMod Punishment</Label>
                    <Select value={autoMod.punishment || 'delete'} onValueChange={(v) => updateAutoMod('punishment', v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        <SelectItem value="delete">Delete Message</SelectItem>
                        <SelectItem value="warn">Warn User</SelectItem>
                        <SelectItem value="timeout">Timeout User</SelectItem>
                        <SelectItem value="kick">Kick User</SelectItem>
                        <SelectItem value="ban">Ban User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Banned Words</Label>
                    <p className="text-xs text-muted-foreground">Comma-separated list of banned words</p>
                    <Textarea
                      value={(autoMod.bannedWords || []).join(', ')}
                      onChange={(e) => updateAutoMod('bannedWords', e.target.value.split(',').map(w => w.trim()).filter(Boolean))}
                      className="bg-white/5 border-white/10 text-white min-h-[80px]"
                      placeholder="word1, word2, word3..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Anti-Nuke Tab */}
          {activeTab === 'antinuke' && (
            <div className="space-y-6">
              <Card className="glass-card border-white/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-amber-500" /> Anti-Nuke Protection
                      </CardTitle>
                      <CardDescription>Protect your server from mass destructive actions</CardDescription>
                    </div>
                    <Switch checked={antiNuke.enabled || false} onCheckedChange={(v) => updateAntiNuke('enabled', v)} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white">Sensitivity Level</Label>
                      <Select value={antiNuke.sensitivity || 'medium'} onValueChange={(v) => updateAntiNuke('sensitivity', v)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-white/10">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Punishment</Label>
                      <Select value={antiNuke.punishment || 'ban'} onValueChange={(v) => updateAntiNuke('punishment', v)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-white/10">
                          <SelectItem value="ban">Ban</SelectItem>
                          <SelectItem value="kick">Kick</SelectItem>
                          <SelectItem value="removeRoles">Remove Roles</SelectItem>
                          <SelectItem value="quarantine">Quarantine</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator className="bg-white/5" />
                  <h3 className="text-white font-medium">Thresholds</h3>
                  <p className="text-xs text-muted-foreground">Maximum actions allowed before triggering anti-nuke</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { key: 'channelDelete', label: 'Channel Deletes', default: 3 },
                      { key: 'channelCreate', label: 'Channel Creates', default: 5 },
                      { key: 'roleDelete', label: 'Role Deletes', default: 3 },
                      { key: 'roleCreate', label: 'Role Creates', default: 5 },
                      { key: 'massBan', label: 'Mass Bans', default: 3 },
                      { key: 'massKick', label: 'Mass Kicks', default: 3 },
                      { key: 'webhookCreate', label: 'Webhook Creates', default: 3 },
                    ].map((item) => (
                      <div key={item.key} className="space-y-2">
                        <Label className="text-white text-sm">{item.label}</Label>
                        <Input
                          type="number"
                          value={antiNuke.thresholds?.[item.key] ?? item.default}
                          onChange={(e) => updateAntiNukeThreshold(item.key, parseInt(e.target.value) || item.default)}
                          className="bg-white/5 border-white/10 text-white"
                          min={1} max={20}
                        />
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-white/5" />
                  <div className="space-y-2">
                    <Label className="text-white">Whitelisted Users (IDs)</Label>
                    <p className="text-xs text-muted-foreground">Users exempt from anti-nuke (comma-separated IDs)</p>
                    <Textarea
                      value={(antiNuke.whitelist || []).join(', ')}
                      onChange={(e) => {
                        updateAntiNuke('whitelist', e.target.value.split(',').map(w => w.trim()).filter(Boolean))
                      }}
                      className="bg-white/5 border-white/10 text-white min-h-[60px]"
                      placeholder="User ID 1, User ID 2..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Moderation Tab */}
          {activeTab === 'aimod' && (
            <div className="space-y-6">
              <Card className="glass-card border-white/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Brain className="w-5 h-5 text-red-500" /> AI Moderation
                      </CardTitle>
                      <CardDescription>AI-powered content filtering and analysis</CardDescription>
                    </div>
                    <Switch checked={aiMod.enabled || false} onCheckedChange={(v) => updateAiMod('enabled', v)} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-white">Toxicity Threshold: {((aiMod.toxicityThreshold || 0.8) * 100).toFixed(0)}%</Label>
                    <p className="text-xs text-muted-foreground">Messages above this threshold will be flagged</p>
                    <Slider
                      value={[(aiMod.toxicityThreshold || 0.8) * 100]}
                      onValueChange={([v]) => updateAiMod('toxicityThreshold', v / 100)}
                      max={100} min={10} step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Strict (10%)</span>
                      <span>Lenient (100%)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                      <div>
                        <p className="text-sm font-medium text-white">Detect Spam</p>
                        <p className="text-xs text-muted-foreground">AI spam detection</p>
                      </div>
                      <Switch checked={aiMod.detectSpam ?? true} onCheckedChange={(v) => updateAiMod('detectSpam', v)} />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                      <div>
                        <p className="text-sm font-medium text-white">Detect Links</p>
                        <p className="text-xs text-muted-foreground">AI link analysis</p>
                      </div>
                      <Switch checked={aiMod.detectLinks || false} onCheckedChange={(v) => updateAiMod('detectLinks', v)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">AI Punishment</Label>
                    <Select value={aiMod.punishment || 'warn'} onValueChange={(v) => updateAiMod('punishment', v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        <SelectItem value="delete">Delete Message</SelectItem>
                        <SelectItem value="warn">Warn User</SelectItem>
                        <SelectItem value="timeout">Timeout User</SelectItem>
                        <SelectItem value="kick">Kick User</SelectItem>
                        <SelectItem value="ban">Ban User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Log Channel</Label>
                    <Select value={aiMod.logChannel || 'none'} onValueChange={(v) => updateAiMod('logChannel', v === 'none' ? null : v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white w-64">
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        <SelectItem value="none">None</SelectItem>
                        {channels.map(c => (
                          <SelectItem key={c.id} value={c.id}>#{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Logging Tab */}
          {activeTab === 'logging' && (
            <div className="space-y-6">
              <Card className="glass-card border-white/5">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Eye className="w-5 h-5 text-amber-500" /> Logging Configuration
                  </CardTitle>
                  <CardDescription>Set up logging channels for different events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'modLog', label: 'Moderation Log', desc: 'Bans, kicks, warns, timeouts', icon: Gavel },
                    { key: 'joinLeave', label: 'Join/Leave Log', desc: 'Member join and leave events', icon: Users },
                    { key: 'messageLog', label: 'Message Log', desc: 'Deleted and edited messages', icon: MessageSquare },
                    { key: 'voiceLog', label: 'Voice Log', desc: 'Voice channel activity', icon: Hash },
                    { key: 'antiNukeLog', label: 'Anti-Nuke Log', desc: 'Anti-nuke triggers and actions', icon: Shield },
                    { key: 'appealLog', label: 'Appeal Log', desc: 'Appeal submissions and reviews', icon: ScrollText },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="text-sm font-medium text-white">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Select
                        value={logs[item.key] || 'none'}
                        onValueChange={(v) => updateLogs(item.key, v === 'none' ? null : v)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white w-48">
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-white/10">
                          <SelectItem value="none">Disabled</SelectItem>
                          {channels.map(c => (
                            <SelectItem key={c.id} value={c.id}>#{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Raid Protection Tab */}
          {activeTab === 'raidmode' && (
            <div className="space-y-6">
              <Card className="glass-card border-white/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" /> Raid Protection
                      </CardTitle>
                      <CardDescription>Protect against mass-join raids</CardDescription>
                    </div>
                    <Switch checked={raidMode.enabled || false} onCheckedChange={(v) => updateRaidMode('enabled', v)} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div>
                      <p className="text-sm font-medium text-white">Auto-Enable on Raid</p>
                      <p className="text-xs text-muted-foreground">Automatically enable raid mode on detection</p>
                    </div>
                    <Switch checked={raidMode.autoEnable ?? true} onCheckedChange={(v) => updateRaidMode('autoEnable', v)} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white">Join Threshold</Label>
                      <p className="text-xs text-muted-foreground">Number of joins to trigger raid mode</p>
                      <Input
                        type="number"
                        value={raidMode.joinThreshold || 10}
                        onChange={(e) => updateRaidMode('joinThreshold', parseInt(e.target.value) || 10)}
                        className="bg-white/5 border-white/10 text-white"
                        min={3} max={50}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Time Window (seconds)</Label>
                      <p className="text-xs text-muted-foreground">Time window for counting joins</p>
                      <Input
                        type="number"
                        value={(raidMode.joinWindow || 10000) / 1000}
                        onChange={(e) => updateRaidMode('joinWindow', (parseInt(e.target.value) || 10) * 1000)}
                        className="bg-white/5 border-white/10 text-white"
                        min={5} max={120}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Raid Action</Label>
                    <Select value={raidMode.action || 'lock'} onValueChange={(v) => updateRaidMode('action', v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-white/10">
                        <SelectItem value="lock">Lock Server</SelectItem>
                        <SelectItem value="kick">Kick New Joins</SelectItem>
                        <SelectItem value="ban">Ban New Joins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Appeals Tab */}
          {activeTab === 'appeals' && (
            <div className="space-y-6">
              <Card className="glass-card border-white/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <ScrollText className="w-5 h-5 text-amber-500" /> Appeal System
                      </CardTitle>
                      <CardDescription>Manage moderation appeal settings and review appeals</CardDescription>
                    </div>
                    <Switch checked={appealsConfig.enabled || false} onCheckedChange={(v) => updateAppealsConfig('enabled', v)} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white">Appeal Channel</Label>
                      <Select
                        value={appealsConfig.channel || 'none'}
                        onValueChange={(v) => updateAppealsConfig('channel', v === 'none' ? null : v)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-white/10">
                          <SelectItem value="none">None</SelectItem>
                          {channels.map(c => (
                            <SelectItem key={c.id} value={c.id}>#{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Appeal Cooldown (hours)</Label>
                      <Input
                        type="number"
                        value={Math.floor((appealsConfig.cooldown || 86400000) / 3600000)}
                        onChange={(e) => updateAppealsConfig('cooldown', (parseInt(e.target.value) || 24) * 3600000)}
                        className="bg-white/5 border-white/10 text-white"
                        min={1}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Appeal Submissions</CardTitle>
                  <CardDescription>{appeals.length} total appeals</CardDescription>
                </CardHeader>
                <CardContent>
                  {appeals.length > 0 ? (
                    <div className="space-y-3">
                      {appeals.map((appeal, i) => (
                        <div key={i} className="p-4 rounded-lg bg-white/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium text-sm">{appeal.userTag || appeal.userId}</span>
                              <Badge className={
                                appeal.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                appeal.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }>
                                {appeal.status}
                              </Badge>
                            </div>
                            {appeal.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="text-green-400 hover:bg-green-500/10 h-8"
                                  onClick={() => reviewAppeal(appeal._id, 'approved')}
                                >
                                  <Check className="w-4 h-4 mr-1" /> Accept
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10 h-8"
                                  onClick={() => reviewAppeal(appeal._id, 'rejected')}
                                >
                                  <X className="w-4 h-4 mr-1" /> Reject
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground"><strong>Reason:</strong> {appeal.reason}</p>
                          <p className="text-xs text-muted-foreground">{appeal.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No appeals submitted yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Commands Tab */}
          {activeTab === 'commands' && (
            <div className="space-y-6">
              {Object.entries(commands).map(([category, cmds]) => (
                <Card key={category} className="glass-card border-white/5">
                  <CardHeader>
                    <CardTitle className="text-white capitalize flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-red-500" />
                      {category} Commands
                    </CardTitle>
                    <CardDescription>{(cmds || []).filter(c => c.enabled).length}/{(cmds || []).length} enabled</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(cmds || []).map((cmd) => (
                        <div key={cmd.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                          <div>
                            <p className="text-sm font-medium text-white">/{cmd.name}</p>
                            <p className="text-xs text-muted-foreground">{cmd.description}</p>
                          </div>
                          <Switch
                            checked={cmd.enabled}
                            onCheckedChange={() => toggleCommand(category, cmd.name)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <Card className="glass-card border-white/5">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-amber-500" /> Server Settings
                  </CardTitle>
                  <CardDescription>General bot configuration for this server</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white">Bot Prefix</Label>
                      <p className="text-xs text-muted-foreground">Command prefix for text commands</p>
                      <Input
                        value={prefix}
                        onChange={(e) => { setPrefix(e.target.value); markChanged() }}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="t!"
                      />
                    </div>
                  </div>

                  <Separator className="bg-white/5" />

                  <div className="space-y-2">
                    <Label className="text-white">Trusted Users (Full Access)</Label>
                    <p className="text-xs text-muted-foreground">User IDs with full bot access (comma-separated)</p>
                    <Textarea
                      value={(security.trusted || []).join(', ')}
                      onChange={(e) => {
                        setSecurity(prev => ({ ...prev, trusted: e.target.value.split(',').map(w => w.trim()).filter(Boolean) }))
                        markChanged()
                      }}
                      className="bg-white/5 border-white/10 text-white min-h-[60px]"
                      placeholder="User ID 1, User ID 2..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Whitelisted Users (Channel Management)</Label>
                    <p className="text-xs text-muted-foreground">User IDs with channel management bypass (comma-separated)</p>
                    <Textarea
                      value={(security.whitelist || []).join(', ')}
                      onChange={(e) => {
                        setSecurity(prev => ({ ...prev, whitelist: e.target.value.split(',').map(w => w.trim()).filter(Boolean) }))
                        markChanged()
                      }}
                      className="bg-white/5 border-white/10 text-white min-h-[60px]"
                      placeholder="User ID 1, User ID 2..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/5 border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center gap-2">
                    <Lock className="w-5 h-5" /> Bot Integration Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    All changes made on this dashboard are synced to the ThunderCore bot via the shared database.
                    When you click &quot;Apply Changes&quot;, the settings are saved to MongoDB and the bot picks them up automatically.
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      <CheckCircle className="w-3 h-3 mr-1" /> Database Connected
                    </Badge>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      <Bot className="w-3 h-3 mr-1" /> Bot Synced
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Apply Changes floating button */}
          {hasChanges && (
            <div className="fixed bottom-6 right-6 z-50">
              <Button
                size="lg"
                onClick={applyChanges}
                disabled={saving}
                className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-2xl neon-glow"
              >
                {saving ? (
                  <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Applying...</>
                ) : (
                  <><Save className="w-5 h-5 mr-2" /> Apply Changes</>
                )}
              </Button>
            </div>
          )}
          {saved && (
            <div className="fixed bottom-6 right-6 z-50">
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-6 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Changes applied successfully!
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
