export const config = {
  i: "Scale",
  title: { en: "Scale", ja: "スケール", zh: "音阶" },
  refreshAgeMinutes: 0,
  info: [{
    title: { en: "About", ja: "概要", zh: "说明" },
    items: [{
      key: { en: "Scales", ja: "スケール", zh: "音阶" },
      value: {
        en: "Major and its six other modes, harmonic and melodic minor (ascending form), major and minor pentatonic, and blues, in any key. Each note is spelled on its own letter, with its degree against the major scale.",
        ja: "メジャーと他の6つのモード、ハーモニック／メロディックマイナー（上行形）、メジャー／マイナーペンタトニック、ブルースを全キーで表示。音名は同じ幹音が重ならないように表記し、メジャースケールに対する度数を併記します。",
        zh: "支持大调及其余六种调式、和声小调与旋律小调（上行形式）、大调与小调五声音阶、布鲁斯音阶，任意调。每个音按字母依次拼写，并标出相对大调音阶的级数。",
      },
    }, {
      key: { en: "Sound", ja: "音", zh: "声音" },
      value: {
        en: "▶ plays the scale up and down. Click a piano key or a fretboard dot to hear that note, and a chord in the key to hear the chord.",
        ja: "▶ でスケールを上行・下行で再生。鍵盤や指板の丸をクリックするとその音、ダイアトニックコードをクリックするとそのコードが鳴ります。",
        zh: "▶ 上行再下行播放音阶。点击琴键或指板上的圆点试听单音，点击调内和弦试听和弦。",
      },
    }],
  }],
  x: 0, y: 0, w: 30, h: 40, minW: 20, minH: 28,
  comp: { key: "C", scale: "major", sevenths: false },
};
