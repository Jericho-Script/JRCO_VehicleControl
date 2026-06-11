Config = {}


Config.ScriptName    = 'JRCO_VehicleControl'  -- Internal script identifier
Config.CommandName   = 'jcontrol'             -- Chat command to open HUD  (/vcontrol)
Config.Locale        = 'en'                   -- Language (reserved for future locale files)
Config.Debug         = false                  -- Print debug output to console


--  'standalone' | 'qb' | 'esx' | 'ox' | 'vorp'
Config.Framework = 'qb'

--  Who can open the HUD?
--  'none'  → everyone
--  'ace'   → ACE permission  (JRCO_VehicleControl.use)
--  'group' → player group/rank check (QBCore / ESX)
--  'job'   → job whitelist
Config.PermissionType = 'none'

-- ACE permission node (used when PermissionType = 'ace')
Config.AceNode = 'JRCO_VehicleControl.use'


Config.AllowedGroups = { 'admin', 'mod', 'vip' }

Config.AllowedJobs = {
    ['police']   = 0,   -- grade 0+ can use
    ['mechanic'] = 0,
}

Config.Features = {
    MediaPlayer  = true,   -- In-vehicle music / stream player
    Windows      = true,   -- Window controls (FL / FR / RL / RR)
    Seats        = true,   -- Seat eject controls
    Doors        = true,   -- Door controls (FL / FR / Both / Trunk)
    Auxiliary    = true,   -- Engine, indicators, hazards, lights
}

--  KEYBINDS
--  FiveM mapper keys: https://docs.fivem.net/docs/game-references/input-mapper-parameter-ids/

Config.Keybinds = {
    OpenHUD          = { key = 'F5',     label = 'Open Vehicle Control HUD', enabled = false  },
    Engine           = { key = 'F8',     label = 'Toggle Engine',            enabled = false  },
    Hazards          = { key = 'F7',     label = 'Toggle Hazard Lights',     enabled = false  },
    Lights           = { key = 'F6',     label = 'Toggle Lights',            enabled = false  },
    IndicatorLeft    = { key = 'Z',      label = 'Left Indicator',           enabled = false  },
    IndicatorRight   = { key = 'X',      label = 'Right Indicator',          enabled = false  },
    WindowFL         = { key = 'NUMPAD1',label = 'Window Front-Left',        enabled = false },
    WindowFR         = { key = 'NUMPAD2',label = 'Window Front-Right',       enabled = false },
    WindowRL         = { key = 'NUMPAD3',label = 'Window Rear-Left',         enabled = false },
    WindowRR         = { key = 'NUMPAD4',label = 'Window Rear-Right',        enabled = false },
    DoorFL           = { key = 'NUMPAD5',label = 'Door Front-Left',          enabled = false },
    DoorFR           = { key = 'NUMPAD6',label = 'Door Front-Right',         enabled = false },
}


Config.Commands = {
    -- /jcontrol  → opens the NUI HUD
    Open  = Config.CommandName,
}



Config.Engine = {
    -- Persist engine state when player exits vehicle
    PersistOnExit  = false,
    -- Automatically turn off engine when player leaves vehicle
    AutoOff        = true,
}


Config.Indicators = {
    -- Blink interval in milliseconds
    BlinkInterval  = 600,
    -- Auto-cancel left/right indicator when vehicle turns (degrees)
    AutoCancel     = true,
    AutoCancelAngle = 30,
}

Config.MediaPlayer = {
    -- Only allow media player while inside a vehicle
    InVehicleOnly   = true,
    -- Default volume (0–100)
    DefaultVolume   = 70,
    -- Allow adding custom stream URLs
    AllowCustomURLs = true,
    -- Max tracks in playlist
    MaxPlaylistSize = 50,
    -- Built-in radio stations (name, stream URL)
    DefaultStations = {
        { name = 'Neon Drive',     artist = 'Synthwave Radio', url = '' },
        { name = 'Midnight Cruise',artist = 'Lo-Fi City',      url = '' },
        { name = 'Street Runner',  artist = 'Urban Beats',     url = '' },
    },
}


Config.Theme = {
    Accent          = '#2060cc',
    AccentDark      = '#1a3d8a',
    Background      = '#131313',
    Panel           = '#0e0e0e',
    Text            = '#c8dcff',
    TextMuted       = '#4a7abf',
    TextDim         = '#2a4a7a',
    Border          = '#1a1a1a',
    DotOff          = '#8b1a1a',
    DotOn           = '#2060cc',
    ButtonBg        = '#111111',
    ButtonActive    = '#0a1a3a',
    BarOff          = '#1a2a4a',
    BarOn           = '#2060cc',
}

--  'native' = FiveM native notifications
--  'ox'     = ox_lib (if installed)
--  'qb'     = QBCore notifications
--  'esx'    = ESX notifications
--  'custom' = uses NUI toast only
Config.NotifyStyle = 'native'
