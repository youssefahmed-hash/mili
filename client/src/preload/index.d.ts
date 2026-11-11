import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      printToPDF: (data: {
        html: string
        fileName: string
      }) => Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }>
      notifyVacation: (data: {
        title: string
        body: string
      }) => Promise<{ success: boolean; error?: string }>
      onVacationAlertClicked: (cb: () => void) => () => void
    }
    serverConfig?: {
      apiBaseUrl: string | null
    }
  }
}
