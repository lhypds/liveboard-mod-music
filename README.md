# liveboard-mod-music

Liveboard 的 Music（音乐）组件集。独立 Git 仓库位于主项目的 `src/modules/music`。

## Chord

通过根音 / 类型选择，或直接输入 `C`、`Am`、`F#7`、`B♭maj7`，同时查看钢琴和吉他的按法。

- 支持大三、小三、属七、大七、小七、挂二、挂四和减三和弦；支持升降号、`M7`、`min` 等常用别名。
- 钢琴显示 C4–B5 范围内的原位和弦，标出具体按键和音名；深色为根音，浅金色为其他和弦音。
- 吉他使用标准 E A D G B E 调弦，无变调夹。优先展示常见开放指型，并可切换到其他把位。
- 指板从左到右是六弦到一弦；圆点数字为左手手指（1–4），横线为横按，○ 为空弦，× 为不弹，左侧数字为实际品位。
- 有效输入即时预览，Enter 或失焦保存；选择操作即时保存。通过 Liveboard 的 `config._save` 保存每张卡片的和弦和指型，支持多个独立实例。
- 跟随 Liveboard 的中、英、日语言设置。无网络请求、无额外运行依赖。

首版不支持斜杠和弦、扩展九 / 十一 / 十三和弦、替代调弦和钢琴手指编号。无法识别的输入会显示提示，不显示误导性的指法。

吉他指板标记约定参考 [Fender 的和弦图阅读说明](https://www.fender.com/articles/chords/how-to-read-a-chord-chart)。指型由开放和弦与可移动 A / E 指型构成，测试逐一验证组成音、低音、品位跨度和横按。

## 接入

1. 将本仓库放到 Liveboard 的 `src/modules/music`。
2. 执行 `bash src/modules/music/setup.sh` 生成本地 `modules.config.json`。
3. Liveboard 会自动读取 `index.ts`，在添加组件菜单里显示 Chord（和弦）。

`modules.config.json` 的 `comp_set.mods.Chord` 控制启用状态和多实例。主项目的 pnpm workspace 会自动纳入模块。

远程仓库名称为 `liveboard-mod-music`。发布远程仓库后，将其 URL 加入 Liveboard 的 `board.config.json` → `componentsGitUrl`；`pull.sh` 用该列表管理模块目录。

## 验证

在 Liveboard 根目录执行：

```sh
node_modules/.bin/tsc -p src/modules/music
node_modules/.bin/eslint src/modules/music
node --experimental-strip-types --test src/modules/music/Chord/chords.test.mjs
```

在模块目录也可执行 `pnpm test` / `pnpm typecheck`。需要 Node 22.6+。
