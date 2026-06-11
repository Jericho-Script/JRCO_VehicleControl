local hazardActive    = false
local hazardThread    = nil
local indicatorState  = { left = false, right = false }
local indicatorThread = nil
local lightsOn        = false
local engineOn        = false

local function GetPlayerVehicle()
    local ped = PlayerPedId()
    if IsPedInAnyVehicle(ped, false) then
        return GetVehiclePedIsIn(ped, false)
    end
    return nil
end

AddEventHandler('JRCO_VehicleControl:client:toggleEngine', function()
    local vehicle = GetPlayerVehicle()
    if not vehicle then return end

    engineOn = not engineOn
    SetVehicleEngineOn(vehicle, engineOn, true, true)

    SendNUIMessage({
        action  = 'syncEngine',
        state   = engineOn,
    })

    if Config.Debug then
        print('[VehicleControl] Engine → ' .. tostring(engineOn))
    end
end)

local windowStates = { false, false, false, false }   -- FL FR RL RR

AddEventHandler('JRCO_VehicleControl:client:toggleWindow', function(data)
    local vehicle = GetPlayerVehicle()
    if not vehicle then return end
    local idx = data.index 

    windowStates[idx + 1] = not windowStates[idx + 1]

    if windowStates[idx + 1] then
        RollDownWindow(vehicle, idx)
    else
        RollUpWindow(vehicle, idx)
    end

    SendNUIMessage({ action = 'syncWindow', index = idx, state = windowStates[idx + 1] })
end)

local doorStates = {}

AddEventHandler('JRCO_VehicleControl:client:toggleDoor', function(data)
    local vehicle = GetPlayerVehicle()
    if not vehicle then return end
    local idx = data.index

    doorStates[idx] = not doorStates[idx]
    local open = doorStates[idx]

    if open then
        SetVehicleDoorOpen(vehicle, idx, false, false)
    else
        SetVehicleDoorShut(vehicle, idx, false)
    end

    SendNUIMessage({ action = 'syncDoor', index = idx, state = open })
end)

AddEventHandler('JRCO_VehicleControl:client:changeSeat', function(data)
    local vehicle = GetPlayerVehicle()
    if not vehicle then return end
    local ped = PlayerPedId()

    local nativeSeat = data.seat - 2
    local maxPassengers = GetVehicleMaxNumberOfPassengers(vehicle)
    if nativeSeat > maxPassengers - 1 then
        SendNUIMessage({ action = 'seatChangeFailed', seat = data.seat })
        return
    end

    local occupant = GetPedInVehicleSeat(vehicle, nativeSeat)
    if occupant ~= 0 and occupant ~= ped then
        TaskLeaveVehicle(occupant, vehicle, 4160)
        Wait(100)
    end

    SetPedIntoVehicle(ped, vehicle, nativeSeat)
    SendNUIMessage({ action = 'syncSeat', seat = data.seat })

    if Config.Debug then
        print(('[VehicleControl] Player warped to seat %d (native %d)'):format(data.seat, nativeSeat))
    end
end)

AddEventHandler('JRCO_VehicleControl:client:requestSeatInfo', function()
    local vehicle = GetPlayerVehicle()
    if not vehicle then
        SendNUIMessage({ action = 'syncSeatInfo', maxSeats = 0 })
        return
    end
    local maxPassengers = GetVehicleMaxNumberOfPassengers(vehicle)
    local totalSeats    = maxPassengers + 1
    SendNUIMessage({ action = 'syncSeatInfo', maxSeats = totalSeats })
end)

AddEventHandler('JRCO_VehicleControl:client:toggleLights', function()
    local vehicle = GetPlayerVehicle()
    if not vehicle then return end

    lightsOn = not lightsOn
    SetVehicleLights(vehicle, lightsOn and 2 or 0)

    SendNUIMessage({ action = 'syncLights', state = lightsOn })
end)

local function StopIndicatorThread()
    if indicatorThread then
        indicatorState.left  = false
        indicatorState.right = false
        indicatorThread = nil
    end
end

local function StartIndicatorThread(side)
    StopIndicatorThread()
    indicatorThread = CreateThread(function()
        local vehicle = GetPlayerVehicle()
        if not vehicle then return end
        local tick = true
        while indicatorState[side] do
            local l = (side == 'left'  and tick) and 1 or 0
            local r = (side == 'right' and tick) and 1 or 0
            SetVehicleIndicatorLights(vehicle, 0, l == 1)
            SetVehicleIndicatorLights(vehicle, 1, r == 1)
            tick = not tick
            Wait(Config.Indicators.BlinkInterval)
        end
        local v = GetPlayerVehicle()
        if v then
            SetVehicleIndicatorLights(v, 0, false)
            SetVehicleIndicatorLights(v, 1, false)
        end
    end)
end

AddEventHandler('JRCO_VehicleControl:client:toggleIndicator', function(data)
    local side = data.side
    local opposite = side == 'left' and 'right' or 'left'

    indicatorState[opposite] = false
    indicatorState[side] = not indicatorState[side]

    if indicatorState[side] then
        StartIndicatorThread(side)
    else
        StopIndicatorThread()
    end

    SendNUIMessage({ action = 'syncIndicator', side = opposite, state = false })
    SendNUIMessage({ action = 'syncIndicator', side = side,     state = indicatorState[side] })
end)

AddEventHandler('JRCO_VehicleControl:client:toggleHazards', function()
    local vehicle = GetPlayerVehicle()
    if not vehicle then return end

    hazardActive = not hazardActive
    StopIndicatorThread()

    if hazardActive then
        hazardThread = CreateThread(function()
            local tick = true
            while hazardActive do
                SetVehicleIndicatorLights(vehicle, 0, tick)
                SetVehicleIndicatorLights(vehicle, 1, tick)
                tick = not tick
                Wait(Config.Indicators.BlinkInterval)
            end
            SetVehicleIndicatorLights(vehicle, 0, false)
            SetVehicleIndicatorLights(vehicle, 1, false)
        end)
    end

    SendNUIMessage({ action = 'syncHazards', state = hazardActive })
    if hazardActive then
        SendNUIMessage({ action = 'syncIndicator', side = 'left',  state = false })
        SendNUIMessage({ action = 'syncIndicator', side = 'right', state = false })
    end
end)

if Config.Engine.AutoOff then
    AddEventHandler('gameEventTriggered', function(name, args)
        if name == 'CEventNetworkPlayerEnteredVehicle' then return end
        if name == 'CEventLeaveVehicle' then
            local vehicle = args[2]
            if vehicle and DoesEntityExist(vehicle) then
                if Config.Engine.PersistOnExit then return end
                SetVehicleEngineOn(vehicle, false, true, true)
                engineOn = false
            end
        end
    end)
end

if Config.Debug then
    print('[' .. Config.ScriptName .. '] Client controls.lua loaded.')
end