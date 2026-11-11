import { app, shell, BrowserWindow, ipcMain, dialog, Notification } from 'electron'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC: تنبيه نظام (Toast) بإعلان الإجازات — يظهر فوق أي شاشة
  ipcMain.handle(
    'vacation-alert',
    async (event, { title, body }: { title: string; body: string }) => {
      try {
        const senderWindow = BrowserWindow.fromWebContents(event.sender) || mainWindow
        const toast = new Notification({ title, body })
        toast.on('click', () => {
          const win =
            senderWindow && !senderWindow.isDestroyed() ? senderWindow : mainWindow
          if (win && !win.isDestroyed()) {
            if (win.isMinimized()) win.restore()
            win.focus()
            win.webContents.send('vacation-alert-clicked')
          }
        })
        toast.show()
        return { success: true }
      } catch (err) {
        console.error('Vacation alert error:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err)
        }
      }
    }
  )

  // IPC: Print HTML to PDF using native Chromium rendering (proper Arabic text support)
  ipcMain.handle(
    'print-to-pdf',
    async (_event, { html, fileName }: { html: string; fileName: string }) => {
      // Ask the user where to save the PDF
      const result = await dialog.showSaveDialog({
        title: 'حفظ ملف PDF',
        defaultPath: fileName,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      })

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true }
      }

      // Create a hidden BrowserWindow for rendering
      const pdfWindow = new BrowserWindow({
        width: 794, // A4 width in pixels at 96dpi
        height: 1123, // A4 height in pixels at 96dpi
        show: false,
        webPreferences: {
          sandbox: false
        }
      })

      try {
        // Load the HTML content
        await pdfWindow.loadURL(
          `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
        )

        // Wait for fonts to load and content to render
        await pdfWindow.webContents.executeJavaScript(
          `document.fonts.ready.then(() => new Promise(r => setTimeout(r, 1500)))`
        )

        // Generate PDF using Chromium's native renderer
        const pdfBuffer = await pdfWindow.webContents.printToPDF({
          printBackground: true,
          pageSize: 'A4',
          margins: {
            marginType: 'custom',
            top: 0.15,
            bottom: 0.15,
            left: 0.15,
            right: 0.15
          }
        })

        // Save the PDF file
        await writeFile(result.filePath, pdfBuffer)

        return { success: true, filePath: result.filePath }
      } catch (err) {
        console.error('PDF generation error:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err)
        }
      } finally {
        pdfWindow.destroy()
      }
    }
  )

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
