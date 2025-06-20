require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const DATA_FILE = './data.json';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder()
    .setName('results')
    .setDescription('Submit Minecraft TierX result')
    .addStringOption(opt => opt.setName('player').setDescription('Player name').setRequired(true))
    .addStringOption(opt => opt.setName('discord_id').setDescription('Discord ID').setRequired(true))
    .addStringOption(opt => opt.setName('gamemode').setDescription('Gamemode').setRequired(true))
    .addStringOption(opt => opt.setName('previous_tier').setDescription('Previous tier').setRequired(true))
    .addStringOption(opt => opt.setName('obtained_tier').setDescription('Obtained tier').setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);
rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });

client.on('ready', () => console.log(`✅ Logged in as ${client.user.tag}`));

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'results') {
    const player = interaction.options.getString('player');
    const discordId = interaction.options.getString('discord_id');
    const gamemode = interaction.options.getString('gamemode');
    const previousTier = interaction.options.getString('previous_tier');
    const obtainedTier = interaction.options.getString('obtained_tier');

    let data = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE)) : [];
    let entry = data.find(e => e.player === player);
    if (!entry) {
      entry = { player, tests: [] };
      data.push(entry);
    }

    entry.tests.push({ discordId, gamemode, previousTier, obtainedTier });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    await interaction.reply(`✅ Saved results for **${player}**`);
  }
});

client.login(TOKEN);

// API Setup
const app = express();
app.use(cors());

app.get('/players', (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  res.json(data.map(d => d.player));
});

app.get('/player/:name', (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  const player = data.find(p => p.player.toLowerCase() === req.params.name.toLowerCase());
  player ? res.json(player) : res.status(404).json({ error: 'Not found' });
});

app.listen(3000, () => console.log('🌐 API running on port 3000'));
