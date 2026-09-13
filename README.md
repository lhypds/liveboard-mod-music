
liveboard-mod-music
===================


Music [Liveboard](https://github.com/lhypds/liveboard) modules.


Modules
-------

`Chord`  
Pick a root and a chord type, or type a symbol such as `C`, `Am`, `F#7` or `B♭maj7`, and see how to play it on piano and on guitar at the same time.  
Major, minor, 7, maj7, m7, sus2, sus4 and dim, with `#` / `♭` roots and the usual aliases (`M7`, `Δ`, `min`, `°`).  
Piano: the chord in root position within C4–B5, root key in dark green, the other chord tones in gold, right-hand finger numbers on the keys (1 thumb … 5 little).  
Guitar: standard E A D G B E tuning, no capo. The familiar open shape comes first, then the movable A- and E-shape forms; `‹` `›` step through them.  
The diagram reads low E to high E, left to right. Numbered dots are left-hand fingers (1 index … 4 little), a bar is a barre, `○` open string, `×` do not play, fret numbers on the left.  
A valid symbol previews as it is typed; Enter or leaving the field saves it, and a pick from the dropdowns saves at once. An unparsable entry shows a hint and keeps the saved chord on screen.  
The chord and the chosen voicing live in `comp`, so every Chord card on a board can show a different chord.  
Slash chords, extended (9 / 11 / 13) chords and alternate tunings are out of scope.  
Chord diagram conventions follow [Fender's guide to reading chord charts](https://www.fender.com/articles/chords/how-to-read-a-chord-chart).  


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

`pnpm test` runs the chord tables through Node's test runner (Node 22.6+).  
Every guitar voicing must contain all and only the chord tones with the root in the bass, span at most three frets, and mark every barre; piano fingering must give every note a finger in rising order.  
