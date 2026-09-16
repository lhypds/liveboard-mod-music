export const config = {
  i: "Progression",
  title: { en: "Progression", ja: "コード進行", zh: "和弦进行" },
  refreshAgeMinutes: 0,
  info: [{
    title: { en: "About", ja: "概要", zh: "说明" },
    items: [{
      key: { en: "Chart", ja: "コード譜", zh: "和弦谱" },
      value: {
        en: "Chords separated by spaces are a bar each; | C G | Am F | puts several chords in one bar, sharing its beats. Any chord the Chord card reads works here, and ♭ / ♯ transpose the whole chart.",
        ja: "スペース区切りで1コード1小節。| C G | Am F | のように書くと1小節に複数のコードが入り、拍を分け合います。コードカードで読めるコードはすべて使え、♭ / ♯ で全体を移調します。",
        zh: "和弦之间用空格分隔，每个和弦占一小节；写成 | C G | Am F | 可把多个和弦放进同一小节并平分拍数。和弦卡片能识别的和弦都可使用，♭ / ♯ 可整体移调。",
      },
    }, {
      key: { en: "Playback", ja: "再生", zh: "播放" },
      value: {
        en: "Loops the chart on piano or guitar at the set tempo, with an optional click on every beat. Click a chord to hear it, or, while playing, to jump to it.",
        ja: "設定テンポでピアノかギターでループ再生し、拍ごとのクリックも付けられます。コードをクリックするとそのコードが鳴り、再生中はそこへ移動します。",
        zh: "以设定速度用钢琴或吉他循环播放，可选每拍节拍声。点击和弦试听；播放中点击则跳到该和弦。",
      },
    }],
  }],
  x: 0, y: 0, w: 25, h: 30, minW: 16, minH: 24,
  comp: { chart: "C G Am F", bpm: 90, beatsPerBar: 4, instrument: "piano", click: true },
};
