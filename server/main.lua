if Config.PermissionType == 'group' then
    RegisterNetEvent('JRCO_VehicleControl:server:checkPermission', function()
        local src    = source
        local player = source

        if Config.Framework == 'qb' then
            local QBCore = exports['qb-core']:GetCoreObject()
            local Player = QBCore.Functions.GetPlayer(player)
            if Player then
                local group = Player.PlayerData.group
                for _, g in ipairs(Config.AllowedGroups) do
                    if group == g then
                        TriggerClientEvent('JRCO_VehicleControl:client:permissionResult', src, true)
                        return
                    end
                end
            end
        end

        if Config.Framework == 'esx' then
            local ESX    = exports.es_extended:getSharedObject()
            local xPlayer = ESX.GetPlayerFromId(player)
            if xPlayer then
                local group = xPlayer.getGroup()
                for _, g in ipairs(Config.AllowedGroups) do
                    if group == g then
                        TriggerClientEvent('JRCO_VehicleControl:client:permissionResult', src, true)
                        return
                    end
                end
            end
        end

        TriggerClientEvent('JRCO_VehicleControl:client:permissionResult', src, false)
    end)
end

if Config.PermissionType == 'job' then
    RegisterNetEvent('JRCO_VehicleControl:server:checkPermission', function()
        local src    = source
        local player = source
        local allowed = false

        if Config.Framework == 'qb' then
            local QBCore = exports['qb-core']:GetCoreObject()
            local Player = QBCore.Functions.GetPlayer(player)
            if Player then
                local job   = Player.PlayerData.job.name
                local grade = Player.PlayerData.job.grade.level
                if Config.AllowedJobs[job] and grade >= Config.AllowedJobs[job] then
                    allowed = true
                end
            end
        end

        if Config.Framework == 'esx' then
            local ESX    = exports.es_extended:getSharedObject()
            local xPlayer = ESX.GetPlayerFromId(player)
            if xPlayer then
                local job   = xPlayer.getJob().name
                local grade = xPlayer.getJob().grade
                if Config.AllowedJobs[job] and grade >= Config.AllowedJobs[job] then
                    allowed = true
                end
            end
        end

        TriggerClientEvent('JRCO_VehicleControl:client:permissionResult', src, allowed)
    end)
end

if Config.Debug then
    print('[' .. Config.ScriptName .. '] Server main.lua loaded.')
end