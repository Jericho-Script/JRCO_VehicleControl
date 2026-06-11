/**
 * JRCO_VehicleControl — html/js/music.js
 * Supports: direct audio streams/MP3, YouTube links (via IFrame API)
 */

const S = {
    playing: false, muted: false, shuffle: false, repeat: false,
    prog: 0, vol: 70, cur: 0, ticker: null, plOpen: true
};

const DEFAULT_TRACKS = [
    { name: 'Neon Drive',      artist: 'Synthwave Radio', dur: 222, url: '' },
    { name: 'Midnight Cruise', artist: 'Lo-Fi City',      dur: 255, url: '' },
    { name: 'Street Runner',   artist: 'Urban Beats',     dur: 178, url: '' },
];

let _playlistUserOwned = false;
let tracks = loadPlaylist();

// ─── YouTube IFrame API ───────────────────────────────────────────────────────
let ytPlayer    = null;
let ytReady     = false;
let ytPendingId = null;   // videoId waiting for player to be ready
let ytProgTimer = null;

// Inject YouTube IFrame API script once
(function loadYTApi() {
    if (document.getElementById('yt-api-script')) return;
    const s  = document.createElement('script');
    s.id     = 'yt-api-script';
    s.src    = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
})();

// Called by YouTube API when ready
window.onYouTubeIframeAPIReady = function() {
    const container = document.getElementById('yt-player-container');
    ytPlayer = new YT.Player('yt-player', {
        height: '0', width: '0',
        playerVars: { autoplay: 0, controls: 0 },
        events: {
            onReady: () => {
                ytReady = true;
                ytPlayer.setVolume(S.muted ? 0 : S.vol);
                if (ytPendingId) {
                    ytPlayer.loadVideoById(ytPendingId);
                    ytPendingId = null;
                }
            },
            onStateChange: (e) => {
                if (e.data === YT.PlayerState.ENDED) {
                    clearInterval(ytProgTimer);
                    if (S.repeat) {
                        ytPlayer.seekTo(0);
                        ytPlayer.playVideo();
                    } else {
                        nextT();
                    }
                }
                if (e.data === YT.PlayerState.PLAYING) {
                    startYtProgressTimer();
                }
                if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) {
                    clearInterval(ytProgTimer);
                }
            },
        },
    });
};

function startYtProgressTimer() {
    clearInterval(ytProgTimer);
    ytProgTimer = setInterval(() => {
        if (!ytPlayer || !ytReady) return;
        const dur = ytPlayer.getDuration();
        const cur = ytPlayer.getCurrentTime();
        if (dur > 0) {
            S.prog = (cur / dur) * 100;
            document.getElementById('pf').style.width = S.prog + '%';
            document.getElementById('tc').textContent = fmt(cur);
            document.getElementById('tt').textContent = fmt(dur);
        }
    }, 500);
}

function extractYouTubeId(url) {
    // Handles: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID
    const patterns = [
        /youtu\.be\/([^?&\s]+)/,
        /[?&]v=([^?&\s]+)/,
        /youtube\.com\/embed\/([^?&\s]+)/,
    ];
    for (const re of patterns) {
        const m = url.match(re);
        if (m) return m[1];
    }
    return null;
}

function isYouTubeUrl(url) {
    return /youtube\.com|youtu\.be/.test(url);
}

// ─── HTML5 Audio engine ───────────────────────────────────────────────────────
let audioEl   = null;
let _playLock = false;

function getAudio() {
    if (!audioEl) {
        audioEl          = new Audio();
        audioEl.crossOrigin = 'anonymous';
        audioEl.volume   = S.vol / 100;

        audioEl.addEventListener('ended', () => {
            if (_playLock) return;
            if (S.repeat) { audioEl.currentTime = 0; audioEl.play().catch(() => {}); }
            else           { nextT(); }
        });
        audioEl.addEventListener('timeupdate', () => {
            if (audioEl.duration && !isNaN(audioEl.duration) && audioEl.duration > 0) {
                S.prog = (audioEl.currentTime / audioEl.duration) * 100;
                renderProg();
            }
        });
        audioEl.addEventListener('loadedmetadata', () => renderProg());
        audioEl.addEventListener('error', (e) => {
            console.warn('[JRCO] Audio error:', audioEl.error);
        });
    }
    return audioEl;
}

// ─── Persistence ──────────────────────────────────────────────────────────────
function savePlaylist() {
    try {
        localStorage.setItem('jrco_playlist',       JSON.stringify(tracks));
        localStorage.setItem('jrco_playlist_owned', '1');
    } catch(e) {}
}

function loadPlaylist() {
    try {
        const saved = localStorage.getItem('jrco_playlist');
        if (saved) {
            const p = JSON.parse(saved);
            if (Array.isArray(p) && p.length > 0) {
                _playlistUserOwned = !!localStorage.getItem('jrco_playlist_owned');
                return p;
            }
        }
    } catch(e) {}
    return DEFAULT_TRACKS.map(t => Object.assign({}, t));
}

function loadStationsOnce(stations) {
    if (!stations || !stations.length) return;
    if (_playlistUserOwned) return;
    tracks = stations.map(s => ({
        name: s.name || 'Unknown', artist: s.artist || '',
        dur:  s.dur  || 0,         url:    s.url    || '',
    }));
    S.cur = 0;
    try { localStorage.setItem('jrco_playlist', JSON.stringify(tracks)); } catch(e) {}
    buildPL(); render();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(s) {
    s = Math.floor(s || 0);
    return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
}
function safeTrack() {
    if (!tracks.length) return null;
    if (S.cur < 0 || S.cur >= tracks.length) S.cur = 0;
    return tracks[S.cur];
}

// ─── Stop everything cleanly ──────────────────────────────────────────────────
function stopAll() {
    _playLock = true;
    clearInterval(S.ticker);
    clearInterval(ytProgTimer);
    if (audioEl) { audioEl.pause(); audioEl.src = ''; }
    if (ytPlayer && ytReady) { try { ytPlayer.stopVideo(); } catch(e) {} }
    setTimeout(() => { _playLock = false; }, 80);
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderProg() {
    const t = safeTrack();
    if (!t) return;
    let cur = S.prog / 100 * (t.dur || 0), total = t.dur || 0;
    if (audioEl && audioEl.duration && !isNaN(audioEl.duration) && audioEl.duration > 0) {
        cur = audioEl.currentTime; total = audioEl.duration;
        S.prog = (cur / total) * 100;
    }
    document.getElementById('pf').style.width = S.prog + '%';
    document.getElementById('tc').textContent = fmt(cur);
    document.getElementById('tt').textContent = fmt(total);
}

function render() {
    const t = safeTrack();
    if (!t) return;
    document.getElementById('tN').textContent = t.name;
    document.getElementById('tA').textContent = t.artist;
    renderProg();
    document.querySelectorAll('.pli').forEach((el, i) => {
        el.classList.toggle('active', i === S.cur);
        const n = el.querySelector('.pnum');
        if (n) n.innerHTML = (i === S.cur && S.playing)
            ? '<div class="eq"><span></span><span></span><span></span></div>'
            : (i + 1);
    });
}

// ─── Fake ticker (demo tracks with no URL) ────────────────────────────────────
function startTick() {
    clearInterval(S.ticker);
    const t = safeTrack();
    if (!t) return;
    S.ticker = setInterval(() => {
        if (!S.playing) return;
        S.prog += 100 / ((t.dur || 60) * 6.67);
        if (S.prog >= 100) { S.prog = 0; if (!S.repeat) { nextT(); return; } }
        renderProg();
    }, 150);
}

// ─── Play current track ───────────────────────────────────────────────────────
function playCurrentTrack() {
    if (_playLock) return;
    const t = safeTrack();
    if (!t) return;

    clearInterval(S.ticker);
    clearInterval(ytProgTimer);

    if (!t.url || t.url === '') {
        // Demo track — fake ticker
        if (audioEl) audioEl.src = '';
        startTick();
        return;
    }

    if (isYouTubeUrl(t.url)) {
        // ── YouTube playback ──
        if (audioEl) { audioEl.pause(); audioEl.src = ''; }
        const videoId = extractYouTubeId(t.url);
        if (!videoId) { console.warn('[JRCO] Could not extract YouTube video ID from:', t.url); return; }

        if (!ytReady || !ytPlayer) {
            ytPendingId = videoId;   // will auto-play when API is ready
        } else {
            ytPlayer.loadVideoById(videoId);
            // loadVideoById auto-plays; set volume
            ytPlayer.setVolume(S.muted ? 0 : S.vol);
        }
    } else {
        // ── Direct audio stream / MP3 ──
        if (ytPlayer && ytReady) { try { ytPlayer.stopVideo(); } catch(e) {} }
        const audio = getAudio();
        // Only change src if track actually changed
        if (!audio.src || !audio.src.endsWith(encodeURI(t.url).replace(/^.*\/\/[^/]+/, ''))) {
            audio.src = t.url;
        }
        audio.play().catch(err => {
            console.warn('[JRCO] Audio play failed:', err.message || err);
        });
    }
}

// ─── Toggle play/pause ────────────────────────────────────────────────────────
function togglePlay() {
    if (_playLock) return;
    S.playing = !S.playing;
    document.getElementById('pIc').innerHTML = S.playing
        ? '<i class="fa-solid fa-pause"></i>'
        : '<i class="fa-solid fa-play"></i>';

    if (S.playing) {
        // Resume: if YouTube was paused, resume it; else start track
        const t = safeTrack();
        if (t && t.url && isYouTubeUrl(t.url) && ytPlayer && ytReady) {
            ytPlayer.playVideo();
        } else {
            playCurrentTrack();
        }
    } else {
        // Pause: pause whichever engine is active
        if (audioEl && !audioEl.paused) audioEl.pause();
        if (ytPlayer && ytReady) { try { ytPlayer.pauseVideo(); } catch(e) {} }
        clearInterval(S.ticker);
        clearInterval(ytProgTimer);
    }
    render();
    nuiFetch(S.playing ? 'mediaPlay' : 'mediaPause', { url: (safeTrack() || {}).url || '' });
}

function pauseMedia() {
    if (!S.playing) return;
    S.playing = false;
    if (audioEl && !audioEl.paused) audioEl.pause();
    if (ytPlayer && ytReady) { try { ytPlayer.pauseVideo(); } catch(e) {} }
    clearInterval(S.ticker);
    clearInterval(ytProgTimer);
    document.getElementById('pIc').innerHTML = '<i class="fa-solid fa-play"></i>';
    render();
}

// ─── Prev / Next / Select ─────────────────────────────────────────────────────
function prevT() {
    if (!tracks.length) return;
    stopAll();
    S.cur  = (S.cur - 1 + tracks.length) % tracks.length;
    S.prog = 0;
    if (S.playing) setTimeout(() => playCurrentTrack(), 90);
    render();
}

function nextT() {
    if (!tracks.length) return;
    stopAll();
    S.cur = S.shuffle
        ? Math.floor(Math.random() * tracks.length)
        : (S.cur + 1) % tracks.length;
    S.prog = 0;
    if (S.playing) setTimeout(() => playCurrentTrack(), 90);
    render();
}

function selectT(i) {
    if (i < 0 || i >= tracks.length) return;
    const wasPlaying = S.playing;
    stopAll();
    S.cur = i; S.prog = 0;
    if (wasPlaying) { S.playing = true; setTimeout(() => playCurrentTrack(), 90); }
    render();
}

// ─── Volume / Mute ────────────────────────────────────────────────────────────
function toggleMute() {
    S.muted = !S.muted;
    document.getElementById('mIc').innerHTML = S.muted
        ? '<i class="fa-solid fa-volume-xmark"></i>'
        : '<i class="fa-solid fa-volume-high"></i>';
    document.getElementById('mBtn').style.borderColor = S.muted ? '#8b1a1a' : '';
    if (audioEl) audioEl.volume = S.muted ? 0 : S.vol / 100;
    if (ytPlayer && ytReady) ytPlayer.setVolume(S.muted ? 0 : S.vol);
    nuiFetch('mediaSetVolume', { volume: S.muted ? 0 : S.vol });
}

function toggleShuffle() {
    S.shuffle = !S.shuffle;
    document.getElementById('shBtn').classList.toggle('act', S.shuffle);
}

function toggleRepeat() {
    S.repeat = !S.repeat;
    document.getElementById('rpBtn').classList.toggle('act', S.repeat);
}

function setV(v) {
    S.vol = parseInt(v);
    document.getElementById('vv').textContent = v;
    if (audioEl && !S.muted)          audioEl.volume  = S.vol / 100;
    if (ytPlayer && ytReady && !S.muted) ytPlayer.setVolume(S.vol);
    nuiFetch('mediaSetVolume', { volume: S.vol });
}

// ─── Progress bar click ───────────────────────────────────────────────────────
document.getElementById('pw').addEventListener('click', e => {
    const r = e.currentTarget.getBoundingClientRect();
    S.prog  = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100));
    const t = safeTrack();
    if (audioEl && audioEl.duration && !isNaN(audioEl.duration)) {
        audioEl.currentTime = (S.prog / 100) * audioEl.duration;
    }
    if (t && t.url && isYouTubeUrl(t.url) && ytPlayer && ytReady) {
        const dur = ytPlayer.getDuration();
        if (dur > 0) ytPlayer.seekTo((S.prog / 100) * dur, true);
    }
    renderProg();
});

// ─── Playlist toggle ──────────────────────────────────────────────────────────
function togglePL() {
    S.plOpen = !S.plOpen;
    document.getElementById('pl').style.display = S.plOpen ? '' : 'none';
    const ic = document.getElementById('plch');
    ic.className = S.plOpen ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-right';
    ic.style.marginLeft = 'auto'; ic.style.fontSize = '10px';
}

// ─── Delete ───────────────────────────────────────────────────────────────────
function deleteTrack(i, e) {
    e.stopPropagation();
    const wasPlaying = S.playing;
    stopAll();
    tracks.splice(i, 1);
    if (S.cur >= tracks.length) S.cur = Math.max(0, tracks.length - 1);
    _playlistUserOwned = true;
    savePlaylist();
    buildPL();
    if (tracks.length === 0) {
        S.playing = false;
        document.getElementById('pIc').innerHTML = '<i class="fa-solid fa-play"></i>';
    } else if (wasPlaying) {
        S.playing = true; S.prog = 0;
        setTimeout(() => playCurrentTrack(), 90);
    }
    render();
    nuiFetch('mediaDeleteStation', { index: i });
}

// ─── Rename ───────────────────────────────────────────────────────────────────
function renameTrack(i, e) {
    e.stopPropagation();
    const item = document.querySelector(`.pli[data-idx="${i}"]`);
    if (!item) return;

    // Prevent double inline-edits
    if (item.querySelector('.prename-input')) return;

    const titleEl  = item.querySelector('.ptitle');
    const artistEl = item.querySelector('.psub');
    const oldName   = tracks[i].name;
    const oldArtist = tracks[i].artist;

    // Build inline edit row
    const wrap = document.createElement('div');
    wrap.className = 'prename-wrap';
    wrap.innerHTML = `
        <input class="prename-input" id="prn-title"  value="${oldName.replace(/"/g,'&quot;')}"   placeholder="Track name">
        <input class="prename-input" id="prn-artist" value="${oldArtist.replace(/"/g,'&quot;')}" placeholder="Artist">
        <div class="prename-actions">
            <span class="prename-ok"  id="prn-ok"><i class="fa-solid fa-check"></i></span>
            <span class="prename-cancel" id="prn-cancel"><i class="fa-solid fa-xmark"></i></span>
        </div>`;

    // Hide title/artist text while editing
    titleEl.style.display  = 'none';
    artistEl.style.display = 'none';

    const pinfo = item.querySelector('.pinfo');
    pinfo.appendChild(wrap);

    const inp = wrap.querySelector('#prn-title');
    inp.focus();
    inp.select();

    function applyRename() {
        const newName   = wrap.querySelector('#prn-title').value.trim()  || oldName;
        const newArtist = wrap.querySelector('#prn-artist').value.trim() || oldArtist;
        tracks[i].name   = newName;
        tracks[i].artist = newArtist;
        _playlistUserOwned = true;
        savePlaylist();
        buildPL();
        render();
    }

    function cancelRename() {
        titleEl.style.display  = '';
        artistEl.style.display = '';
        wrap.remove();
    }

    wrap.querySelector('#prn-ok').addEventListener('click', (ev) => { ev.stopPropagation(); applyRename(); });
    wrap.querySelector('#prn-cancel').addEventListener('click', (ev) => { ev.stopPropagation(); cancelRename(); });

    inp.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter')  { ev.preventDefault(); applyRename(); }
        if (ev.key === 'Escape') { ev.preventDefault(); cancelRename(); }
    });
    wrap.querySelector('#prn-artist').addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter')  { ev.preventDefault(); applyRename(); }
        if (ev.key === 'Escape') { ev.preventDefault(); cancelRename(); }
    });
}

// ─── Build playlist DOM ───────────────────────────────────────────────────────
function buildPL() {
    const c = document.getElementById('pl');
    c.innerHTML = '';
    tracks.forEach((t, i) => {
        const d = document.createElement('div');
        d.className = 'pli' + (i === S.cur ? ' active' : '');
        d.dataset.idx = i;
        d.onclick   = () => selectT(i);
        // Show YT badge or duration
        const badge = t.url && isYouTubeUrl(t.url)
            ? '<span class="yt-badge"><i class="fa-brands fa-youtube"></i></span>'
            : `<div class="pdur">${t.dur ? fmt(t.dur) : '∞'}</div>`;
        d.innerHTML = `
            <div class="pnum">${i + 1}</div>
            <div class="pinfo">
                <div class="ptitle">${t.name}</div>
                <div class="psub">${t.artist}</div>
            </div>
            ${badge}
            <div class="prename-btn pdel" onclick="renameTrack(${i}, event)" title="Rename">
                <i class="fa-solid fa-pencil"></i>
            </div>
            <div class="pdel" onclick="deleteTrack(${i}, event)" title="Remove">
                <i class="fa-solid fa-xmark"></i>
            </div>`;
        c.appendChild(d);
    });
    document.getElementById('plc').textContent = tracks.length;
}

// ─── Add track ────────────────────────────────────────────────────────────────
function addTrack() {
    const u = document.getElementById('urlIn').value.trim();
    if (!u) return;
    let name, artist;
    if (isYouTubeUrl(u)) {
        name   = 'YouTube: ' + (extractYouTubeId(u) || u.slice(0, 20));
        artist = 'YouTube';
    } else {
        name   = 'Stream: ' + u.slice(0, 28);
        artist = 'Live';
    }
    tracks.push({ name, artist, dur: 0, url: u });
    _playlistUserOwned = true;
    savePlaylist();
    nuiFetch('mediaAddStation', { url: u });
    buildPL();
    render();
    document.getElementById('urlIn').value = '';
}

// ─── Init ─────────────────────────────────────────────────────────────────────
buildPL();
render();