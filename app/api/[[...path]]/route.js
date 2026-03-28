import { getDb } from '@/lib/mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { NextResponse } from 'next/server'

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const CLIENT_ID = process.env.DISCORD_CLIENT_ID

// Default guild settings matching the bot's schema
const DEFAULT_GUILD_SETTINGS = {
  logs: {
    modLog: null, joinLeave: null, messageLog: null,
    voiceLog: null, antiNukeLog: null, appealLog: null,
  },
  moderation: {
    muteRole: null, jailRole: null, jailChannel: null,
    warnLimit: 3, warnPunishment: 'kick', timeoutDuration: 3600000,
    timeoutEscalation: false,
    timeoutSteps: [
      { warns: 1, duration: 300000 },
      { warns: 2, duration: 3600000 },
      { warns: 3, duration: 86400000 },
    ],
  },
  giveaway: {
    enabled: false,
    managerRoles: [],
    defaultDuration: 86400000,
    maxWinners: 10,
    dmWinners: true,
    logChannel: null,
  },
  antiNuke: {
    enabled: false, sensitivity: 'medium', whitelist: [],
    thresholds: {
      channelDelete: 3, channelCreate: 5, roleDelete: 3,
      roleCreate: 5, massBan: 3, massKick: 3, webhookCreate: 3,
    },
    punishment: 'ban',
  },
  autoMod: {
    enabled: false, bannedWords: [], punishment: 'delete',
    bypass: [], ignoredChannels: [], blockInvites: false,
    blockLinks: false, blockZalgo: true, blockCaps: false,
    blockSpam: false, logViolations: true,
  },
  aiMod: {
    enabled: false, toxicityThreshold: 0.8,
    detectAbuse: false,
    detectThreats: false,
    detectSpam: true,
    detectDrugs: false,
    detectLinks: false,
    punishment: 'warn', logChannel: null,
  },
  raidMode: {
    enabled: false, autoEnable: true, joinThreshold: 10,
    joinWindow: 10000, action: 'lock',
  },
  appeals: {
    enabled: false, channel: null, cooldown: 86400000,
    questions: [
      'What was the reason for your punishment?',
      'Why should your punishment be revoked?',
      'What will you do differently if unbanned?',
    ],
  },
  prefix: 't!',
  security: { whitelist: [], trusted: [] },
}

// All bot commands (excluding fun)
const BOT_COMMANDS = {
  moderation: [
    { name: 'ban', description: 'Ban a user from the server', enabled: true },
    { name: 'kick', description: 'Kick a user from the server', enabled: true },
    { name: 'warn', description: 'Warn a user', enabled: true },
    { name: 'timeout', description: 'Timeout a user', enabled: true },
    { name: 'clear', description: 'Clear messages in a channel', enabled: true },
    { name: 'hackban', description: 'Ban a user by ID', enabled: true },
    { name: 'jail', description: 'Jail a user', enabled: true },
    { name: 'lockdown', description: 'Lock down a channel', enabled: true },
    { name: 'massban', description: 'Ban multiple users at once', enabled: true },
    { name: 'nickname', description: 'Change a user nickname', enabled: true },
    { name: 'nuke', description: 'Nuke and recreate a channel', enabled: true },
    { name: 'rolemanage', description: 'Manage user roles', enabled: true },
    { name: 'roles', description: 'View server roles', enabled: true },
    { name: 'slowmode', description: 'Set channel slowmode', enabled: true },
    { name: 'softban', description: 'Softban a user', enabled: true },
    { name: 'tempban', description: 'Temporarily ban a user', enabled: true },
    { name: 'unban', description: 'Unban a user', enabled: true },
    { name: 'untimeout', description: 'Remove timeout from user', enabled: true },
    { name: 'voicemod', description: 'Voice channel moderation', enabled: true },
    { name: 'voiceadv', description: 'Advanced voice moderation', enabled: true },
    { name: 'warnings', description: 'View user warnings', enabled: true },
    { name: 'warnmanage', description: 'Manage warnings', enabled: true },
    { name: 'case', description: 'View moderation cases', enabled: true },
    { name: 'advanced', description: 'Advanced moderation tools', enabled: true },
    { name: 'channels', description: 'Channel management', enabled: true },
    { name: 'server', description: 'Server management', enabled: true },
  ],
  antinuke: [
    { name: 'antinuke', description: 'Configure anti-nuke protection', enabled: true },
    { name: 'aimod', description: 'AI moderation settings', enabled: true },
    { name: 'raidmode', description: 'Toggle raid protection mode', enabled: true },
  ],
  config: [
    { name: 'automod', description: 'Configure auto-moderation', enabled: true },
    { name: 'config', description: 'Server configuration', enabled: true },
    { name: 'security', description: 'Security settings', enabled: true },
    { name: 'settings', description: 'Bot settings', enabled: true },
    { name: 'trust', description: 'Manage trusted users', enabled: true },
    { name: 'appealsetup', description: 'Setup appeal system', enabled: true },
    { name: 'deploy', description: 'Deploy slash commands', enabled: true },
  ],
  logging: [
    { name: 'logging', description: 'Configure logging channels', enabled: true },
  ],
  appeals: [
    { name: 'appeal', description: 'Submit a moderation appeal', enabled: true },
  ],
}

function cors(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

async function discordApi(url, token, method = 'GET') {
  const res = await fetch(`https://discord.com/api/v10${url}`, {
    method,
    headers: { Authorization: `Bot ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

async function discordApiUser(url, accessToken) {
  const res = await fetch(`https://discord.com/api/v10${url}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  return res.json()
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 200 }))
}

async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = path.join('/')
  const method = request.method

  try {
    // Root
    if ((!route || route === '/') && method === 'GET') {
      return cors(NextResponse.json({ status: 'ThunderCore Dashboard API', version: '1.0' }))
    }

    // Get session for auth
    const session = await getServerSession(authOptions)

    // Get user guilds
    if (route === 'guilds' && method === 'GET') {
      if (!session) return cors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

      const guilds = await discordApiUser('/users/@me/guilds', session.accessToken)
      if (!guilds) return cors(NextResponse.json({ error: 'Failed to fetch guilds' }, { status: 500 }))

      // Filter guilds where user has MANAGE_GUILD permission
      const manageableGuilds = guilds.filter(g => (parseInt(g.permissions) & 0x20) === 0x20 || (parseInt(g.permissions) & 0x8) === 0x8)

      // Check which guilds have the bot
      const guildsWithBotStatus = await Promise.all(
        manageableGuilds.map(async (guild) => {
          const botGuild = await discordApi(`/guilds/${guild.id}`, BOT_TOKEN)
          return {
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            owner: guild.owner,
            permissions: guild.permissions,
            botPresent: !!botGuild,
          }
        })
      )

      return cors(NextResponse.json(guildsWithBotStatus))
    }

    // Guild-specific routes
    const guildMatch = route.match(/^guilds\/(\d+)(.*)$/)
    if (guildMatch) {
      if (!session) return cors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

      const guildId = guildMatch[1]
      const subRoute = guildMatch[2] || ''
      const db = await getDb()

      // GET guild settings
      if (!subRoute && method === 'GET') {
        let guild = await db.collection('guilds').findOne({ guildId })
        if (!guild) {
          guild = { guildId, ...DEFAULT_GUILD_SETTINGS, createdAt: new Date(), updatedAt: new Date() }
          await db.collection('guilds').insertOne(guild)
        }
        return cors(NextResponse.json(guild))
      }

      // GET discord channels for guild
      if (subRoute === '/channels' && method === 'GET') {
        const channels = await discordApi(`/guilds/${guildId}/channels`, BOT_TOKEN)
        if (!channels) return cors(NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 }))
        const textChannels = channels.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }))
        return cors(NextResponse.json(textChannels))
      }

      // GET discord roles for guild
      if (subRoute === '/roles' && method === 'GET') {
        const roles = await discordApi(`/guilds/${guildId}/roles`, BOT_TOKEN)
        if (!roles) return cors(NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 }))
        const filtered = roles.filter(r => r.name !== '@everyone').map(r => ({ id: r.id, name: r.name, color: r.color }))
        return cors(NextResponse.json(filtered))
      }

      // PUT update moderation settings
      if (subRoute === '/moderation' && method === 'PUT') {
        const body = await request.json()
        await db.collection('guilds').updateOne(
          { guildId },
          { $set: { moderation: body, updatedAt: new Date() } },
          { upsert: true }
        )
        return cors(NextResponse.json({ success: true }))
      }

      // PUT update automod settings
      if (subRoute === '/automod' && method === 'PUT') {
        const body = await request.json()
        await db.collection('guilds').updateOne(
          { guildId },
          { $set: { autoMod: body, updatedAt: new Date() } },
          { upsert: true }
        )
        return cors(NextResponse.json({ success: true }))
      }

      // PUT update antinuke settings
      if (subRoute === '/antinuke' && method === 'PUT') {
        const body = await request.json()
        await db.collection('guilds').updateOne(
          { guildId },
          { $set: { antiNuke: body, updatedAt: new Date() } },
          { upsert: true }
        )
        return cors(NextResponse.json({ success: true }))
      }

      // PUT update AI mod settings
      if (subRoute === '/aimod' && method === 'PUT') {
        const body = await request.json()
        await db.collection('guilds').updateOne(
          { guildId },
          { $set: { aiMod: body, updatedAt: new Date() } },
          { upsert: true }
        )
        return cors(NextResponse.json({ success: true }))
      }

      // PUT update logging settings
      if (subRoute === '/logging' && method === 'PUT') {
        const body = await request.json()
        await db.collection('guilds').updateOne(
          { guildId },
          { $set: { logs: body, updatedAt: new Date() } },
          { upsert: true }
        )
        return cors(NextResponse.json({ success: true }))
      }

      // PUT update raidmode settings
      if (subRoute === '/raidmode' && method === 'PUT') {
        const body = await request.json()
        await db.collection('guilds').updateOne(
          { guildId },
          { $set: { raidMode: body, updatedAt: new Date() } },
          { upsert: true }
        )
        return cors(NextResponse.json({ success: true }))
      }

      // PUT update appeals config
      if (subRoute === '/appeals-config' && method === 'PUT') {
        const body = await request.json()
        await db.collection('guilds').updateOne(
          { guildId },
          { $set: { appeals: body, updatedAt: new Date() } },
          { upsert: true }
        )
        return cors(NextResponse.json({ success: true }))
      }

      // PUT update server settings (prefix, etc.)
      if (subRoute === '/settings' && method === 'PUT') {
        const body = await request.json()
        const updateFields = {}
        if (body.prefix !== undefined) updateFields.prefix = body.prefix
        if (body.security !== undefined) updateFields.security = body.security
        updateFields.updatedAt = new Date()
        await db.collection('guilds').updateOne(
          { guildId },
          { $set: updateFields },
          { upsert: true }
        )
        return cors(NextResponse.json({ success: true }))
      }

      // GET appeals list
      if (subRoute === '/appeals' && method === 'GET') {
        const appeals = await db.collection('appeals').find({ guildId }).sort({ createdAt: -1 }).toArray()
        return cors(NextResponse.json(appeals))
      }

      // PUT review appeal
      const appealReviewMatch = subRoute.match(/^\/appeals\/(.+)\/review$/)
      if (appealReviewMatch && method === 'PUT') {
        const appealId = appealReviewMatch[1]
        const body = await request.json()
        const { ObjectId } = await import('mongodb')
        let filter
        try {
          filter = { _id: new ObjectId(appealId), guildId }
        } catch {
          filter = { _id: appealId, guildId }
        }
        await db.collection('appeals').updateOne(
          filter,
          {
            $set: {
              status: body.status,
              reviewedBy: session.user.discordId || session.user.name,
              reviewNote: body.reviewNote || '',
              reviewedAt: new Date(),
            },
          }
        )
        return cors(NextResponse.json({ success: true }))
      }

      // GET command settings
      if (subRoute === '/commands' && method === 'GET') {
        let cmdSettings = await db.collection('commandsettings').findOne({ guildId })
        if (!cmdSettings) {
          cmdSettings = { guildId, commands: BOT_COMMANDS, createdAt: new Date() }
          await db.collection('commandsettings').insertOne(cmdSettings)
        }
        return cors(NextResponse.json(cmdSettings))
      }

      // PUT update command settings
      if (subRoute === '/commands' && method === 'PUT') {
        const body = await request.json()
        await db.collection('commandsettings').updateOne(
          { guildId },
          { $set: { commands: body.commands, updatedAt: new Date() } },
          { upsert: true }
        )
        return cors(NextResponse.json({ success: true }))
      }

      // POST apply all changes
      if (subRoute === '/apply' && method === 'POST') {
        const body = await request.json()
        const updateFields = { updatedAt: new Date() }
        if (body.moderation) updateFields.moderation = body.moderation
        if (body.autoMod) updateFields.autoMod = body.autoMod
        if (body.antiNuke) updateFields.antiNuke = body.antiNuke
        if (body.aiMod) updateFields.aiMod = body.aiMod
        if (body.logs) updateFields.logs = body.logs
        if (body.raidMode) updateFields.raidMode = body.raidMode
        if (body.appeals) updateFields.appeals = body.appeals
        if (body.giveaway) updateFields.giveaway = body.giveaway
        if (body.prefix !== undefined) updateFields.prefix = body.prefix
        if (body.security) updateFields.security = body.security

        await db.collection('guilds').updateOne(
          { guildId },
          { $set: updateFields },
          { upsert: true }
        )

        // Also update commands if provided
        if (body.commands) {
          await db.collection('commandsettings').updateOne(
            { guildId },
            { $set: { commands: body.commands, updatedAt: new Date() } },
            { upsert: true }
          )
        }

        return cors(NextResponse.json({ success: true, message: 'All settings applied successfully' }))
      }

      // PUT update giveaway settings
      if (subRoute === '/giveaway-config' && method === 'PUT') {
        const body = await request.json()
        await db.collection('guilds').updateOne(
          { guildId },
          { $set: { giveaway: body, updatedAt: new Date() } },
          { upsert: true }
        )
        return cors(NextResponse.json({ success: true }))
      }

      // GET giveaways list
      if (subRoute === '/giveaways' && method === 'GET') {
        const giveaways = await db.collection('giveaways').find({ guildId }).sort({ createdAt: -1 }).limit(50).toArray()
        return cors(NextResponse.json(giveaways))
      }

      // POST create giveaway
      if (subRoute === '/giveaways' && method === 'POST') {
        const body = await request.json()
        const { v4: uuidv4 } = await import('uuid')
        const giveaway = {
          id: uuidv4(),
          guildId,
          channelId: body.channelId,
          prize: body.prize,
          description: body.description || '',
          winnersCount: body.winnersCount || 1,
          duration: body.duration || 86400000,
          endsAt: new Date(Date.now() + (body.duration || 86400000)),
          hostId: session.user.discordId || 'dashboard',
          requirements: body.requirements || {},
          status: 'active',
          winners: [],
          entries: [],
          createdAt: new Date(),
        }
        await db.collection('giveaways').insertOne(giveaway)
        return cors(NextResponse.json({ success: true, giveaway }))
      }

      // PUT end/reroll giveaway
      const giveawayActionMatch = subRoute.match(/^\/giveaways\/(.+)\/(end|reroll)$/)
      if (giveawayActionMatch && method === 'PUT') {
        const giveawayId = giveawayActionMatch[1]
        const action = giveawayActionMatch[2]
        if (action === 'end') {
          await db.collection('giveaways').updateOne(
            { id: giveawayId, guildId },
            { $set: { status: 'ended', endedAt: new Date() } }
          )
        } else if (action === 'reroll') {
          await db.collection('giveaways').updateOne(
            { id: giveawayId, guildId },
            { $set: { status: 'active', winners: [], endedAt: null } }
          )
        }
        return cors(NextResponse.json({ success: true }))
      }

      // DELETE giveaway
      const giveawayDeleteMatch = subRoute.match(/^\/giveaways\/(.+)$/)
      if (giveawayDeleteMatch && method === 'DELETE') {
        const giveawayId = giveawayDeleteMatch[1]
        await db.collection('giveaways').deleteOne({ id: giveawayId, guildId })
        return cors(NextResponse.json({ success: true }))
      }

      // GET moderation logs / cases
      if (subRoute === '/cases' && method === 'GET') {
        const cases = await db.collection('cases').find({ guildId }).sort({ caseId: -1 }).limit(50).toArray()
        return cors(NextResponse.json(cases))
      }
    }

    return cors(NextResponse.json({ error: 'Route not found' }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', error)
    return cors(NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
