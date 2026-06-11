let _hudIsOpen   = false;
let _pendingOpen = null;

const _btnState = {
    engBtn:  false,
    wfl:     false, wfr:     false, wrl:     false, wrr:     false,
    ltBtn:   false,
    hazBtn:  false,
    indL:    false, indR:    false,
    dfl:     false, dfr:     false, drl:     false, drr:     false,
    dtrunk:  false, dhood:   false,
};

function _applyBtnState() {
    for (const [id, on] of Object.entries(_btnState)) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (id === 'engBtn') {
            el.classList.toggle('on', on);
        } else {
            el.classList.toggle('on', on);
        }
    }
}

function nuiFetch(action, data) {
    return fetch('https://JRCO_VehicleControl/' + action, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data || {}),
    }).catch(() => {});
}

function applyTheme(theme) {
    if (!theme) return;
    const map = {
        Accent:       '--acc',    AccentDark:   '--acc2',
        Background:   '--bg',    Panel:        '--panel',
        Text:         '--text',  TextMuted:    '--text2',
        TextDim:      '--text3', Border:       '--bdr',
        DotOff:       '--dot-off', DotOn:      '--dot-on',
        ButtonBg:     '--btn',   ButtonActive: '--btn-on',
        BarOff:       '--bar-off', BarOn:      '--bar-on',
    };
    const root = document.documentElement;
    for (const [key, cssVar] of Object.entries(map)) {
        if (theme[key]) root.style.setProperty(cssVar, theme[key]);
    }
}

function applyFeatures(features) {
    if (!features) return;
    const toggle = (id, visible) => {
        const el = document.getElementById(id);
        if (el) el.style.display = visible ? '' : 'none';
    };
    toggle('panel-media',   features.MediaPlayer);
    toggle('panel-windows', features.Windows);
    toggle('panel-seats',   features.Seats);
    toggle('panel-doors',   features.Doors);
    toggle('panel-aux',     features.Auxiliary);
}

function _showHUD(data) {
    const hud = document.getElementById('mainHud');

    if (data.theme)    applyTheme(data.theme);
    if (data.features) applyFeatures(data.features);

    if (data.mediaPlayer && data.mediaPlayer.stations) {
        loadStationsOnce(data.mediaPlayer.stations);
    }

    _applyBtnState();

    nuiFetch('requestSeatInfo', {});

    hud.style.display = '';
    void hud.offsetHeight;  
    document.body.classList.add('visible');
    hud.classList.add('open');

    _hudIsOpen   = true;
    _pendingOpen = null;
}

function openHUD(data) {
    const hud = document.getElementById('mainHud');
    if (hud.classList.contains('closing')) {
        _pendingOpen = data;
        return;
    }
    _showHUD(data);
}

function closeHUD() {
    if (!_hudIsOpen) return;
    const hud = document.getElementById('mainHud');
    _hudIsOpen = false;
    hud.classList.add('closing');
    hud.classList.remove('open');
    document.body.classList.remove('visible');
    nuiFetch('closeHUD');
}

document.getElementById('mainHud').addEventListener('transitionend', function(e) {
    if (e.propertyName !== 'opacity') return;
    const hud = document.getElementById('mainHud');
    if (hud.classList.contains('closing')) {
        hud.classList.remove('closing');
        if (_pendingOpen) {
            const data = _pendingOpen;
            _pendingOpen = null;
            _showHUD(data);
        }
    }
});

window.addEventListener('message', (e) => {
    const msg = e.data;
    if (!msg || !msg.action) return;

    switch (msg.action) {
        case 'openHUD':  openHUD(msg);  break;
        case 'closeHUD': closeHUD();    break;

        case 'syncEngine':
            _btnState.engBtn = !!msg.state;
            document.getElementById('engBtn')?.classList.toggle('on', _btnState.engBtn);
            break;

        case 'syncWindow': {
            const ids = ['wfl','wfr','wrl','wrr'];
            const id  = ids[msg.index];
            if (id) {
                _btnState[id] = !!msg.state;
                document.getElementById(id)?.classList.toggle('on', _btnState[id]);
            }
            break;
        }

        case 'syncDoor': {
            const doorIds = ['dfl','dfr','drl','drr','dtrunk','dhood'];
            const did = doorIds[msg.index];
            if (did) {
                _btnState[did] = !!msg.state;
                document.getElementById(did)?.classList.toggle('on', _btnState[did]);
            }
            break;
        }

        case 'syncLights':
            _btnState.ltBtn = !!msg.state;
            document.getElementById('ltBtn')?.classList.toggle('on', _btnState.ltBtn);
            break;

        case 'syncHazards':
            _btnState.hazBtn = !!msg.state;
            document.getElementById('hazBtn')?.classList.toggle('on', _btnState.hazBtn);
            break;

        case 'syncIndicator':
            if (msg.side === 'left') {
                _btnState.indL = !!msg.state;
                document.getElementById('indL')?.classList.toggle('on', _btnState.indL);
            }
            if (msg.side === 'right') {
                _btnState.indR = !!msg.state;
                document.getElementById('indR')?.classList.toggle('on', _btnState.indR);
            }
            break;
        case 'mediaPause':
            pauseMedia();
            break;
    }
});

const ONE_SHOT_ACTIONS = new Set(['seatEject']);

function nuiAction(action, data, btn) {
    nuiFetch(action, data);
    if (btn) {
        if (ONE_SHOT_ACTIONS.has(action)) {
            btn.classList.add('on');
            setTimeout(() => btn.classList.remove('on'), 300);
        } else {
            const on = btn.classList.toggle('on');
            if (btn.id && btn.id in _btnState) _btnState[btn.id] = on;
        }
    }
}

function engTog() {
    const btn = document.getElementById('engBtn');
    _btnState.engBtn = btn.classList.contains('on');
}

function showNotif(msg) {
    const n = document.getElementById('notif');
    document.getElementById('notif-msg').textContent = msg;
    n.classList.add('show');
    setTimeout(() => n.classList.remove('show'), 2500);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeHUD();
});


const SEAT_LABELS = ['Driver', 'Front R', 'Rear L', 'Rear R', 'Seat 5', 'Seat 6'];
const SEAT_ICONS = [
    `<svg viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="9" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="18" r="3" stroke="currentColor" stroke-width="1.3"/><line x1="18" y1="9" x2="18" y2="15" stroke="currentColor" stroke-width="1.3"/><line x1="11" y1="22" x2="15" y2="19.5" stroke="currentColor" stroke-width="1.3"/><line x1="25" y1="22" x2="21" y2="19.5" stroke="currentColor" stroke-width="1.3"/></svg>`,
    `<svg viewBox="0 0 36 36" fill="none"><rect x="11" y="7" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/><rect x="9" y="18" width="18" height="8" rx="2" stroke="currentColor" stroke-width="1.6"/><line x1="10" y1="26" x2="8"  y2="31" stroke="currentColor" stroke-width="1.4"/><line x1="26" y1="26" x2="28" y2="31" stroke="currentColor" stroke-width="1.4"/></svg>`,
    `<svg viewBox="0 0 36 36" fill="none"><rect x="7"  y="8" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.6"/><rect x="5"  y="18" width="14" height="8" rx="2" stroke="currentColor" stroke-width="1.6"/><line x1="6"  y1="26" x2="4"  y2="31" stroke="currentColor" stroke-width="1.4"/><line x1="18" y1="26" x2="20" y2="31" stroke="currentColor" stroke-width="1.4"/></svg>`,
    `<svg viewBox="0 0 36 36" fill="none"><rect x="19" y="8" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.6"/><rect x="17" y="18" width="14" height="8" rx="2" stroke="currentColor" stroke-width="1.6"/><line x1="18" y1="26" x2="16" y2="31" stroke="currentColor" stroke-width="1.4"/><line x1="30" y1="26" x2="32" y2="31" stroke="currentColor" stroke-width="1.4"/></svg>`,
    `<svg viewBox="0 0 36 36" fill="none"><rect x="7"  y="10" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="5"  y="19" width="13" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="19" y="10" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="17" y="19" width="13" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><line x1="18" y1="12" x2="18" y2="24" stroke="var(--acc2)" stroke-width="1"/></svg>`,
    `<svg viewBox="0 0 36 36" fill="none"><rect x="5"  y="10" width="8" height="9" rx="2" stroke="currentColor" stroke-width="1.4"/><rect x="14" y="10" width="8" height="9" rx="2" stroke="currentColor" stroke-width="1.4"/><rect x="23" y="10" width="8" height="9" rx="2" stroke="currentColor" stroke-width="1.4"/><rect x="5"  y="19" width="8" height="7" rx="2" stroke="currentColor" stroke-width="1.4"/><rect x="14" y="19" width="8" height="7" rx="2" stroke="currentColor" stroke-width="1.4"/><rect x="23" y="19" width="8" height="7" rx="2" stroke="currentColor" stroke-width="1.4"/></svg>`,
];

let _currentSeat = 1; 

function initSeatPanel(maxSeats) {
    const grid   = document.getElementById('seatGrid');
    const noCar  = document.getElementById('seatNoCar');
    grid.innerHTML = '';

    if (!maxSeats || maxSeats < 1) {
        grid.style.display = 'none';
        noCar.style.display = '';
        return;
    }

    noCar.style.display = 'none';
    grid.style.display = '';

    const count = Math.min(maxSeats, 6);

    const cols = count <= 2 ? count : count <= 4 ? 2 : 3;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    for (let i = 1; i <= count; i++) {
        const btn = document.createElement('div');
        btn.className = 'kbtn seat-btn' + (i === _currentSeat ? ' on' : '');
        btn.id = 'seatBtn' + i;
        btn.dataset.seat = i;
        btn.innerHTML = `
            ${SEAT_ICONS[i - 1] || SEAT_ICONS[1]}
            <span class="klabel">${SEAT_LABELS[i - 1] || 'Seat ' + i}</span>
            <span class="kstatus"></span>`;
        btn.addEventListener('click', () => changeSeat(i));
        grid.appendChild(btn);
    }
}

function changeSeat(seatNum) {
    _currentSeat = seatNum;
    document.querySelectorAll('.seat-btn').forEach(b => {
        b.classList.toggle('on', parseInt(b.dataset.seat) === seatNum);
    });
    nuiFetch('changeSeat', { seat: seatNum });
}

function requestSeatInfo() {
    nuiFetch('requestSeatInfo', {});
}

window.addEventListener('message', (e) => {
    const msg = e.data;
    if (!msg || !msg.action) return;

    if (msg.action === 'syncSeatInfo') {
        initSeatPanel(msg.maxSeats);
    }

    if (msg.action === 'syncSeat') {
        _currentSeat = msg.seat;
        document.querySelectorAll('.seat-btn').forEach(b => {
            b.classList.toggle('on', parseInt(b.dataset.seat) === msg.seat);
        });
    }
});