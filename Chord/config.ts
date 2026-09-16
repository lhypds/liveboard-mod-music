export const config = {
  i: "Chord",
  title: { en: "Chord", ja: "コード", zh: "和弦" },
  refreshAgeMinutes: 0,
  info: [{
    title: { en: "About", ja: "概要", zh: "说明" },
    items: [{
      key: { en: "Chords", ja: "コード", zh: "和弦" },
      value: {
        en: "Major, minor, 7, maj7, m7, sus2, sus4, dim, aug, m7♭5 and dim7. Enter C, Am, F#7 or B♭maj7. Piano shows root-position notes; guitar uses standard E A D G B E tuning, without a capo.",
        ja: "メジャー、マイナー、7、maj7、m7、sus2、sus4、dim、aug、m7♭5、dim7。C、Am、F#7、B♭maj7 などを入力。ピアノは基本形、ギターは標準 E A D G B E チューニング・カポなし。",
        zh: "支持大三、小三、7、maj7、m7、sus2、sus4、dim、aug、m7♭5、dim7，例如 C、Am、F#7、B♭maj7。钢琴显示原位和弦按键；吉他使用标准 E A D G B E 调弦，无变调夹。",
      },
    }, {
      key: { en: "Sound", ja: "音", zh: "声音" },
      value: {
        en: "▶ plays the chord: the piano as a block chord, the guitar strummed exactly as fingered. Synthesized in the browser, nothing to download.",
        ja: "▶ でコードを再生。ピアノは和音、ギターは表示中の押さえ方どおりにストローク。ブラウザ内で合成するのでダウンロードはありません。",
        zh: "▶ 播放和弦：钢琴为柱式和弦，吉他按当前指型扫弦。在浏览器内合成，无需下载音源。",
      },
    }],
  }],
  x: 0, y: 0, w: 25, h: 32, minW: 16, minH: 25,
  comp: { chord: "C", voicing: 0 },
};
