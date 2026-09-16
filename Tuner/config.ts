export const config = {
  i: "Tuner",
  title: { en: "Tuner", ja: "チューナー", zh: "调音器" },
  refreshAgeMinutes: 0,
  info: [{
    title: { en: "About", ja: "概要", zh: "说明" },
    items: [{
      key: { en: "Microphone", ja: "マイク", zh: "麦克风" },
      value: {
        en: "Listens only while started, and nothing is recorded or sent. Browsers allow the microphone on HTTPS pages and on localhost only.",
        ja: "開始している間だけマイクを使い、録音や送信はしません。ブラウザがマイクを許可するのは HTTPS か localhost のページだけです。",
        zh: "仅在开始后使用麦克风，不会录音或上传。浏览器只允许 HTTPS 或 localhost 页面使用麦克风。",
      },
    }, {
      key: { en: "Modes", ja: "モード", zh: "模式" },
      value: {
        en: "Chromatic names the nearest note; Guitar measures against the nearest open string of standard tuning, and each string button plays its reference pitch. Within ±5 cents counts as in tune. The A4 reference can be set from 415 to 466 Hz.",
        ja: "クロマチックは最も近い音名、ギターは標準チューニングで最も近い開放弦に対するずれを表示し、弦のボタンで基準音が鳴ります。±5 セント以内で合っていると判定。基準 A4 は 415–466 Hz で設定できます。",
        zh: "半音阶模式显示最近的音名；吉他模式以标准调弦中最近的空弦为准，点击琴弦按钮可试听基准音。误差在 ±5 音分以内视为音准正确。A4 基准可设为 415–466 Hz。",
      },
    }],
  }],
  x: 0, y: 0, w: 16, h: 22, minW: 12, minH: 18,
  comp: { mode: "chromatic", a4: 440 },
};
