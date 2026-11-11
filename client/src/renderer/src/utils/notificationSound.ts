// نغمة تنبيه الإجازات — Web Audio API بدون أي ملفات صوت خارجية.
// أي فشل (مثل سياسة التشغيل التلقائي قبل أول تفاعل) يتم تجاهله بصمت.

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    }
    return ctx
  } catch {
    return null
  }
}

export async function playAlertSound(): Promise<void> {
  try {
    const audio = getContext()
    if (!audio) return
    if (audio.state === 'suspended') {
      await audio.resume()
    }
    const now = audio.currentTime
    // 3 صفارات ثنائية النغمة (تنبيه عسكري)
    const tones: Array<[number, number]> = [
      [660, 0],
      [880, 0.22],
      [660, 0.44],
      [880, 0.66],
      [660, 0.88],
      [990, 1.1]
    ]
    for (const [freq, offset] of tones) {
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      osc.type = 'square'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now + offset)
      gain.gain.exponentialRampToValueAtTime(0.22, now + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.2)
      osc.connect(gain)
      gain.connect(audio.destination)
      osc.start(now + offset)
      osc.stop(now + offset + 0.22)
    }
  } catch {
    // الصوت تحسين اختياري — تجاهل أي خطأ
  }
}
