export const config = {
  i: "Chord",
  title: { en: "Chord", ja: "コード", zh: "和弦" },
  refreshAgeMinutes: 0,
  info: [{
    title: { en: "About", ja: "概要", zh: "说明" },
    items: [{
      key: { en: "Chords", ja: "コード", zh: "和弦" },
      value: {
        en: "Major, minor, 7, maj7, m7, sus2, sus4 and dim. Enter C, Am, F#7 or B♭maj7. Piano shows root-position notes; guitar uses standard E A D G B E tuning, without a capo.",
        ja: "メジャー、マイナー、7、maj7、m7、sus2、sus4、dim。C、Am、F#7、B♭maj7 などを入力。ピアノは基本形、ギターは標準 E A D G B E チューニング・カポなし。",
        zh: "支持大三、小三、7、maj7、m7、sus2、sus4、dim，例如 C、Am、F#7、B♭maj7。钢琴显示原位和弦按键；吉他使用标准 E A D G B E 调弦，无变调夹。",
      },
    }],
  }],
  x: 0, y: 0, w: 25, h: 32, minW: 16, minH: 25,
  comp: { chord: "C", voicing: 0 },
};
