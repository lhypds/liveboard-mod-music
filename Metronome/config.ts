export const config = {
  i: "Metronome",
  title: { en: "Metronome", ja: "メトロノーム", zh: "节拍器" },
  refreshAgeMinutes: 0,
  info: [{
    title: { en: "About", ja: "概要", zh: "说明" },
    items: [{
      key: { en: "Tempo", ja: "テンポ", zh: "速度" },
      value: {
        en: "30–300 BPM, with tap tempo. In x/4 the BPM counts quarter notes, and each beat can be split into eighths, triplets or sixteenths; in x/8 it counts eighth notes, accented in groups (7/8 as 2+2+3).",
        ja: "30–300 BPM、タップテンポ対応。x/4 は4分音符で数え、8分・3連・16分に分割できます。x/8 は8分音符で数え、アクセントでグループ分けします（7/8 は 2+2+3）。",
        zh: "30–300 BPM，支持敲击测速。x/4 拍号以四分音符计速，每拍可细分为八分音符、三连音或十六分音符；x/8 拍号以八分音符计速，按重音分组（7/8 为 2+2+3）。",
      },
    }, {
      key: { en: "Timing", ja: "タイミング", zh: "计时" },
      value: {
        en: "Clicks are booked ahead on the audio clock, so they stay steady while the page is busy or the tab is in the background.",
        ja: "クリックはオーディオクロック上で先に予約するため、ページが重いときやタブがバックグラウンドのときも安定します。",
        zh: "节拍在音频时钟上提前排定，页面繁忙或标签页在后台时依然稳定。",
      },
    }],
  }],
  x: 0, y: 0, w: 16, h: 18, minW: 12, minH: 16,
  comp: { bpm: 100, signature: "4/4", subdivision: 1 },
};
