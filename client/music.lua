local currentURL    = ''
local volume        = Config.MediaPlayer.DefaultVolume
local isPlaying     = false


RegisterNUICallback('mediaPlay', function(data, cb)
    currentURL = data.url or ''
    isPlaying  = true
    if Config.Debug then
        print('[VehicleControl:Music] Playing: ' .. currentURL)
    end
    cb('ok')
end)

RegisterNUICallback('mediaPause', function(_, cb)
    isPlaying = false
    cb('ok')
end)

RegisterNUICallback('mediaSetVolume', function(data, cb)
    volume = data.volume or volume
    cb('ok')
end)

RegisterNUICallback('mediaAddStation', function(data, cb)
    if not Config.MediaPlayer.AllowCustomURLs then
        cb('denied')
        return
    end
    if not data.url or data.url == '' then
        cb('invalid')
        return
    end
    if Config.Debug then
        print('[VehicleControl:Music] Added station: ' .. data.url)
    end
    cb('ok')
end)

if Config.MediaPlayer.InVehicleOnly then
    local _wasInVehicle = false
    CreateThread(function()
        while true do
            local inVeh = IsPedInAnyVehicle(PlayerPedId(), false)
            if _wasInVehicle and not inVeh and isPlaying then
                isPlaying = false
                SendNUIMessage({ action = 'mediaPause' })
                if Config.Debug then
                    print('[VehicleControl:Music] Left vehicle — music paused.')
                end
            end
            _wasInVehicle = inVeh
            Wait(500)
        end
    end)
end

if Config.Debug then
    print('[' .. Config.ScriptName .. '] Client music.lua loaded.')
end
RegisterNUICallback('mediaDeleteStation', function(data, cb)
    if Config.Debug then
        print('[VehicleControl:Music] Deleted station at index: ' .. tostring(data.index))
    end
    cb('ok')
end)