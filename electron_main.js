const { app, BrowserWindow } = require('electron');
const { exec } = require('child_process');
const fetch = require('node-fetch');
const express = require('express');
const port = 3000;
let mainWindow;
const expressApp = express();
let verified = false;
let expectedPin = "12345678";

expressApp.get('/verify', (req, res) => {
    if (req.query.pin === expectedPin) {
        verified = true;
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

expressApp.get('/startScan', (req, res) => {
    if (!verified) return res.status(403).send("Yetkisiz");
    res.send("Taraniyor...");
    exec('tasklist', (err, stdout) => {
        let found = [];
        if (stdout.toLowerCase().includes('cheatengine')) found.push('CheatEngine');
        if (stdout.toLowerCase().includes('nexor')) found.push('Nexor');
        if (found.length > 0) {
            fetch('https://discord.com/api/webhooks/SENIN_WEBHOOK_ID', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: `HILE: ${found.join(',')}` })
            }).catch(e => console.log(e));
        } else {
            fetch('https://discord.com/api/webhooks/SENIN_WEBHOOK_ID', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: 'TEMIZ sistem' })
            }).catch(e => console.log(e));
        }
    });
});

expressApp.listen(port, () => console.log(`Server ${port} portunda calisiyor`));

function createWindow() {
    mainWindow = new BrowserWindow({ 
        width: 400, 
        height: 300, 
        webPreferences: { 
            nodeIntegration: true, 
            contextIsolation: false 
        } 
    });
    mainWindow.loadURL(`data:text/html,
    <html>
    <body style="background:#000;color:#0f0;text-align:center;font-family:monospace;">
        <h2 style="color:red;">REXGUN</h2>
        <p>PIN:</p>
        <input id="pin" />
        <br/><br/>
        <button onclick="fetch('http://localhost:3000/verify?pin='+document.getElementById('pin').value).then(r=>r.json()).then(d=>{if(d.success){alert('Dogru, taranıyor'); fetch('http://localhost:3000/startScan');}else{alert('Hatali PIN');}});">TARA</button>
    </body>
    </html>`);
}

app.whenReady().then(createWindow);
