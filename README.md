# JRCO_VehicleControl

> Full-featured FiveM vehicle control HUD with media player, window/door/seat controls, engine, lights, indicators, hazards.

---

## 📁 File Structure

```
JRCO_VehicleControl/
├── fxmanifest.lua          ← Resource manifest (FiveM)
├── config.lua              ← ALL configuration (edit this)
├── client/
│   ├── main.lua            ← NUI lifecycle, keybinds, command registration
│   ├── controls.lua        ← Vehicle control logic (engine, doors, windows…)
│   └── music.lua           ← Media player client callbacks
├── server/
│   └── main.lua            ← Lock sync, permission callbacks
└── html/
    ├── index.html          ← NUI entry point
    ├── css/
    │   └── style.css       ← All HUD styles + CSS variables
    └── js/
        ├── app.js          ← NUI message handler, theme, open/close
        └── music.js        ← Playlist, playback, volume
```

---

## ⚙️ Installation

1. Drop the `JRCO_VehicleControl` folder into your **`resources/`** directory.
2. Add to your `server.cfg`:
   ```
   ensure JRCO_VehicleControl
   ```
3. Configure `config.lua` to your needs (see below).
4. Restart your server.

---

## 🔧 Configuration (`config.lua`)

### General
| Option | Default | Description |
|---|---|---|
| `Config.CommandName` | `'vcontrol'` | Chat command to open HUD |
| `Config.Debug` | `false` | Print debug to console |
| `Config.Framework` | `'qb'` | `standalone` / `qb` / `esx` / `ox` / `vorp` |

### Features — enable/disable panels
```lua
Config.Features = {
    MediaPlayer  = true,
    Windows      = true,
    Seats        = true,
    Doors        = true,
    Auxiliary    = true,
}
```

### Keybinds
Every keybind has three fields:
```lua
Config.Keybinds.Engine = {
    key     = 'F8',          -- Default key (player can remap in GTA settings)
    label   = 'Toggle Engine',
    enabled = true,          -- Set false to disable this keybind entirely
}
```

### Theme
All colors are standard hex values. Change them to reskin the HUD:
```lua
Config.Theme = {
    Accent     = '#2060cc',
    Background = '#131313',
    -- ... (see config.lua for full list)
}
```

### Permissions
```lua
Config.PermissionType = 'none'   -- 'none' | 'ace' | 'group' | 'job'
```
- **none** — everyone can open the HUD
- **ace** — add `add_ace <group> JRCO_VehicleControl.use allow` to `server.cfg`
- **group** — define groups in `Config.AllowedGroups`
- **job** — define jobs/grades in `Config.AllowedJobs`

---

## 🎮 Default Keybinds

| Action | Key |
|---|---|
| Open HUD | F5 |
| Toggle Engine | F8 |
| Hazards | F7 |
| Lights | F6 |
| Left Indicator | Z |
| Right Indicator | X |
| Lock Vehicle | L |
| Window FL/FR/RL/RR | NUMPAD 1–4 (disabled by default) |
| Door FL/FR | NUMPAD 5–6 (disabled by default) |

Players can remap all keybinds from **GTA V Settings → Key Bindings → FiveM**.

---

## 🔌 NUI → Lua Events

The HUD communicates back to Lua via `RegisterNUICallback`. Each button fires the matching callback:

| NUI Action | Lua Event Triggered |
|---|---|
| `toggleEngine` | `JRCO_VehicleControl:client:toggleEngine` |
| `toggleWindow` | `JRCO_VehicleControl:client:toggleWindow` |
| `toggleDoor` | `JRCO_VehicleControl:client:toggleDoor` |
| `seatEject` | `JRCO_VehicleControl:client:seatEject` |
| `toggleLock` | `JRCO_VehicleControl:client:toggleLock` |
| `toggleLights` | `JRCO_VehicleControl:client:toggleLights` |
| `toggleIndicator` | `JRCO_VehicleControl:client:toggleIndicator` |
| `toggleHazards` | `JRCO_VehicleControl:client:toggleHazards` |

---

## 📝 License

Free to use and modify. Credit **JRCO Development** appreciated.