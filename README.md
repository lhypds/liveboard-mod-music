
liveboard-mod-music
===================


Music [Liveboard](https://github.com/lhypds/liveboard) modules.  
Every sound is synthesized in the browser with the Web Audio API (an additive struck-string tone for the piano, a Karplus-Strong string for the guitar, a short tick for the click), so nothing is downloaded.  


Modules
-------

`Chord`  
Pick a root and a chord type, or type a symbol such as `C`, `Am`, `F#7` or `B♭maj7`, and see how to play it on piano and on guitar at the same time.  
Major, minor, 7, maj7, m7, sus2, sus4, dim, aug, m7♭5 and dim7, with `#` / `♭` roots and the usual aliases (`M7`, `Δ`, `min`, `°`, `+`, `ø`, `°7`).  
Piano: the chord in root position within C4–B5, root key in dark green, the other chord tones in gold, right-hand finger numbers on the keys (1 thumb … 5 little).  
Guitar: standard E A D G B E tuning, no capo. The familiar open shape comes first, then the movable A- and E-shape forms; `‹` `›` step through them.  
The diagram reads low E to high E, left to right. Numbered dots are left-hand fingers (1 index … 4 little), a bar is a barre, `○` open string, `×` do not play, fret numbers on the left.  
A valid symbol previews as it is typed; Enter or leaving the field saves it, and a pick from the dropdowns saves at once. An unparsable entry shows a hint and keeps the saved chord on screen.  
`▶` next to each instrument plays the chord: the piano as a block chord, the guitar strummed as fingered.  
The chord and the chosen voicing live in `comp`, so every Chord card on a board can show a different chord.  
Slash chords, extended (9 / 11 / 13), 6 and add9 chords, capo and alternate tunings are out of scope.  
Chord diagram conventions follow [Fender's guide to reading chord charts](https://www.fender.com/articles/chords/how-to-read-a-chord-chart).  

`Scale`  
Pick a key and a scale to see its notes, degrees and steps, where they fall on the piano and across the first twelve frets of the guitar, and the chords built on each note.  
Major and its six other modes, harmonic and melodic minor (ascending form), major and minor pentatonic, and blues.  
Each note is spelled on its own letter (F♯ major has E♯, not F), with its degree against the major scale (`1 2 ♭3 4 …`).  
`▶` plays the scale up and down; a piano key or a fretboard dot plays that note. The fretboard reads like tab, high e on top.  
Seven-note scales list their chords as triads or sevenths, with Roman numerals cased by quality (`ii`, `V7`, `viiø7`); clicking one plays it.  
Key, scale and the triads / sevenths choice live in `comp`.  

`Progression`  
Type a chord chart, or pick a preset, and loop it on piano or guitar.  
Chords separated by spaces are a bar each; `| C G | Am F |` puts several chords in one bar, sharing its beats, with the earlier chords taking any beat left over. Any symbol the Chord module reads works.  
Presets: I–V–vi–IV, I–vi–IV–V, ii–V–I, minor ii–V–i, Pachelbel's Canon, the Andalusian cadence and a 12-bar blues.  
40–240 BPM, 2, 3, 4 or 6 beats per bar, and a click that accents each bar's first beat. `♭` / `♯` transpose the whole chart a semitone, spelling roots the way the key is usually written (D♭ major, C♯ minor).  
The chord under the playhead is drawn for the chosen instrument: root position on the piano, the first voicing on the guitar. Click a chord to hear it, or, while playing, to jump to it.  
Tempo, sound and click change on the next beat without restarting the loop. The chart saves on Enter or on leaving the field; an unreadable chart shows a hint and the saved one keeps playing.  
The chart and its settings live in `comp`.  

`Metronome`  
30–300 BPM from a slider, `−` / `+`, or tap tempo (the mean of the last four taps; a pause over two seconds starts over).  
2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8 and 12/8. In x/4 the BPM counts quarter notes, which can be split into eighths, triplets or sixteenths; in x/8 it counts eighth notes, accented in groups of three (7/8 as 2+2+3).  
Clicks are booked ahead on the audio clock rather than timed by page timers, so they stay steady while the page is busy or the tab is in the background.  
Tempo, time signature and subdivision live in `comp`.  

`Tuner`  
Listens through the microphone and shows the nearest note, how many cents off it is, and a needle; within ±5 cents counts as in tune.  
Chromatic mode names any note. Guitar mode measures against the nearest open string of standard tuning, and each string button plays that string's reference pitch. The A4 reference can be set from 415 to 466 Hz.  
Pitch is found with the McLeod Pitch Method, which keeps a string's strong overtones from reading an octave high.  
The microphone is only open while listening, and nothing is recorded or sent. Browsers allow it on HTTPS pages and on localhost only, so a board served over plain HTTP shows a message instead.  
`allowMultipleInstances` is off, since two Tuners would share one microphone.  
Mode and reference live in `comp`.  


Code layout
-----------

`common/` holds what the modules share: chord parsing and voicings (`chords.ts`), sound (`audio.ts`), the audio-clock scheduler (`pulse.ts`), and the piano, chord-chart and play-button components with their stylesheet.  
Each module folder keeps its own pure logic in a `.ts` file beside the component, so it can be tested without a browser.  


Setup
-----

`board.config.json`  
Setup the repo URL.  

`modules.config.json`  
Modules config file, enable or disable modules, etc.  


modules.config.json
-------------------

Modules config file.  
Keys under `comp_set.mods` are the `ModuleName`, same as folder name; the flat `{ "ModuleName": { ... } }` form is accepted too.  


config.ts
---------

`config.ts` is in each module folder,  
It controls module default config template.  

Field `comp` is settings only used for that module.  
Fields other than `comp` are common configs.  


Test
----

`pnpm test` runs the pure logic through Node's test runner (Node 22.6+).  
Chords: every guitar voicing must contain all and only the chord tones with the root in the bass, span at most three frets, and mark every barre; piano fingering must give every note a finger in rising order.  
Scales: every scale in every key stays on the keyboard, each note's name spells its pitch, and every chord in the key has a name.  
Progressions: bars share their beats as described, transposing up and back returns the same chart, and every preset is playable.  
Metronome: bar accents, tap tempo and tempo markings.  
Tuner: pitch within 3 cents on pure tones and within 5 on overtone-rich ones across the guitar's range, and nothing for silence or noise.  
Pulse: steps are booked on the clock, follow a tempo change from the next step, and skip a stall rather than bursting.  
