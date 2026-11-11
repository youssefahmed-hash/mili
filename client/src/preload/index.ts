import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import fs from 'fs'
import path from 'path'

// Custom APIs for renderer
const api = {
  printToPDF: (data: { html: string; fileName: string }) =>
    ipcRenderer.invoke('print-to-pdf', data),
  notifyVacation: (data: { title: string; body: string }) =>
    ipcRenderer.invoke('vacation-alert', data),
  onVacationAlertClicked: (cb: () => void) => {
    const handler = (): void => cb()
    ipcRenderer.on('vacation-alert-clicked', handler)
    return () => ipcRenderer.removeListener('vacation-alert-clicked', handler)
  }
}

// عنوان سيرفر الـAPI للأجهزة الأخرى على الشبكة.
// يُقرأ من server.config.json بجانب ملف الـ exe. مثال: { "serverIp": "192.168.1.100" }
// غياب الملف أو فساده = null (سلوك اليوم: localhost على نفس الجهاز).
interface ServerConfig {
  apiBaseUrl: string | null
}

function loadServerConfig(): ServerConfig {
  const candidates: string[] = []
  try {
    // نسخة portable
    if (process.env.PORTABLE_EXECUTABLE_DIR) {
      candidates.push(path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'server.config.json'))
    }
  } catch {
    // ignore
  }
  try {
    // النسخة المثبتة: مجلد الـ exe = 4 مستويات فوق out/preload (app.asar/out/preload)
    // في التطوير المسار وهمي ولا يوجد فيه ملف → يُتجاهل تلقائيًا
    if (typeof __dirname === 'string' && __dirname) {
      candidates.push(path.resolve(__dirname, '..', '..', '..', '..', 'server.config.json'))
    }
  } catch {
    // ignore
  }

  for (const file of candidates) {
    try {
      if (!file || !fs.existsSync(file)) continue
      const raw = JSON.parse(fs.readFileSync(file, 'utf-8')) as unknown
      if (raw && typeof raw === 'object') {
        const cfg = raw as { apiBaseUrl?: unknown; serverIp?: unknown; port?: unknown }
        if (typeof cfg.apiBaseUrl === 'string' && cfg.apiBaseUrl) {
          return { apiBaseUrl: cfg.apiBaseUrl.replace(/\/$/, '') }
        }
        if (typeof cfg.serverIp === 'string' && cfg.serverIp) {
          const port = typeof cfg.port === 'number' ? cfg.port : 5000
          return { apiBaseUrl: `http://${cfg.serverIp}:${port}/api` }
        }
      }
    } catch {
      // ملف فاسد → جرّب التالي، وفي النهاية null
    }
  }
  return { apiBaseUrl: null }
}

const serverConfig = loadServerConfig()

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('serverConfig', serverConfig)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.serverConfig = serverConfig
}
