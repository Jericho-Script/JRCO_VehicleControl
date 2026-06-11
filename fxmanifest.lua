fx_version 'cerulean'
game 'gta5'

author      'Jericho Script'
description 'JRCO Vehicle Control — Full vehicle HUD with media player, windows, doors, seats & auxiliary controls'
version     '1.0.0'

client_scripts {
    'config.lua',
    'client/main.lua',
    'client/controls.lua',
    'client/music.lua',
}

server_scripts {
    'config.lua',
    'server/main.lua',
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/css/style.css',
    'html/js/app.js',
    'html/js/music.js',
}

lua54 'yes'