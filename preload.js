// Ponte entre a janela (mascote-pet.js) e o processo principal (main.js).
const { contextBridge, ipcRenderer } = require('electron');

function ouvir(canal, fn) {
  const ouvinte = (_ev, ...args) => fn(...args);
  ipcRenderer.on(canal, ouvinte);
  return () => ipcRenderer.removeListener(canal, ouvinte);
}

contextBridge.exposeInMainWorld('mascoteDesktop', {
  info: () => ipcRenderer.invoke('info'),
  esconderijos: () => ipcRenderer.invoke('esconderijos'),
  letras: () => ipcRenderer.invoke('letras'),
  aoMoverCursor: (fn) => ouvir('cursor', (p) => fn(p.x, p.y)),
  aoComando: (fn) => ouvir('comando', fn),
  aoConfig: (fn) => ouvir('config', fn),
  moverCursor: (x, y) => ipcRenderer.send('mover-cursor', x, y),
  clicavel: (sim) => ipcRenderer.send('clicavel', sim),
});
