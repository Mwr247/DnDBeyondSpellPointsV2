# DnDBeyond Spell Points V2
A [better](https://github.com/Mwr247/DnDBeyondSpellPoints) spell point tracker userscript for [DnDBeyond](https://www.dndbeyond.com)

![Spells Tab View](https://user-images.githubusercontent.com/613020/121749639-02e1d280-cad9-11eb-85f6-2479ec8c1baf.png)

Ever wanted to use the [Spell Point Variant Rule](https://www.dndbeyond.com/sources/dmg/dungeon-masters-workshop#VariantSpellPoints) (DMG 288-289), but lamented that the feature [still hasn't been implemented](https://dndbeyond.zendesk.com/hc/en-us/community/posts/360023004153-Spell-Points)?

This is a [userscript](https://en.wikipedia.org/wiki/Userscript) that implements a persistent spell point tracker right into your character sheet, allowing you to manage your spell points from within DnDBeyond, stored on your sheet itself.

## Features
* Your total points are automatically calculated based on your spell slots.
  * Remaining and total points are displayed at the top of the spells tab.
  * Clicking the points will show a popup to set your remaining points manually, or you can add/subtract with the "+"/"-" buttons.
* "Cast" button functionality is overridden to deduct the appropriate points when you click them, and not use spell slots.
  * In the case of spells of 6-9th level, it will still expend the slot (since these are limited in number by the spell points rules).
  * Works when casting from both the Spells tab and the spell description sidebar (when opened from both the Actions and Spells tab), and only when the spell belongs to a supported class. Changing the spell level here uses the correct points.
  * Alerts you when you try to cast without sufficient spell points.
* The spell point cost is added next to the spell level category in your spell list.
* Long resting resets your spell point maximum to full again.
* Your remaining spell points are saved in your character sheet automatically.
* Works on a per-character basis, toggleable in the character creator optional settings.
  * Includes a toggleable popular homebrew variant option to merge your sorcery point pool with your spell points. Totals points from both the Sorcerer class and Metamagic Adept.
* V2 features:
  * Everything is saved to the sheet itself in a hidden way, so points will be accurate regardless of what computer you use, so long as the userscript is active.
  * Uses DnDBeyond's API to accurately determine spell slots and caster levels, so works correctly for any class/multiclass.

## How To Use

1. Install a userscript extension of your choice. I've tested [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) in Mozilla FireFox and [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) in Google Chrome, and both worked fine as far as I could tell.
2. Install the userscript from [DnDBeyondSpellPointsV2.js](https://raw.githubusercontent.com/Mwr247/DnDBeyondSpellPointsV2/main/DnDBeyondSpellPointsV2.js)
3. Go to your character on [DnDBeyond](https://www.dndbeyond.com/my-characters), then to the character builder/editor, then to the first tab (where you set your character name). Under the "Optional Features" section, you should now see two new options at the bottom. Enable "Use Spell Points" to use the Spell Point system, and "Combine Spell Points with Sorcery Points" if you want to also merge your spell and sorcery points into one pool.

![Enable Spell Point Variant Rule](https://user-images.githubusercontent.com/613020/121753588-ab476500-cae0-11eb-9e75-2f4e6a91244f.png)

4. You are now good to go. As mentioned above, casting in most situations will automatically adjust your spell point totals, and you can manually override on the Spells tab by hitting the "+"/"-" buttons, or by clicking the points to set the value directly. Please read the known issues below.

## Bonus Picture (Spell Description Sidebar)

As mentioned before, upcasting a spell will adjust the cost accordingly, which is also reflected in the number above the casting button, and the "Spell Slot" is changed to "Spell Points".

![Spell Description Sidebar](https://user-images.githubusercontent.com/613020/121754393-86ec8800-cae2-11eb-8a58-fb6ab1e5c416.png)

## Notes / Known Issues

* Some things can temporarily break the casting overrides. Known examples are:
  * Collapsing and expanding the sidebar using its dedicated button will reset it to default display.
  * Spells added from the Manage Spells button don't work right away.
  * Opening and closing the spell filter button will break the override.
* Warlock class/multiclass should be considered unsupported. Some things work okay, but DnDBeyond handles pact magic casting weirdly with buttons.
* Casting spells (except for 6-9th level) won't show the usual info popup at the bottom, since the default casting is overridden.
  * Spell slots are still shown and toggleable manually, since hiding them could cause issues if they accidentally get toggled automatically.
* If you have multiple spells of 6/7th level, it will let you cast them both.
  * This is to allow homebrew flexibility, and because limiting it automatically adds complexity. Just keep track yourself if necessary.
* Long rests are the only rests that automatically reset spell points. Clicking the button resets regardless of whether or not you confirm after.
* If you use the included optional feature that combines your sorcery points into your spell points, you'll still see the default sorcery point tracker.
* Spell(/sorcery) points gained/lost by means other than casting/resting have to be accounted for manually.
* Spell points and settings are stored in a Custom Action called "Spell Points" on your character sheet, and is created by the userscript.
* This was originally designed for personal use, specifically for tracking for sorcerers only and merging sorcerery points into the same pool.
  * While I expanded the scope and converted the sorcery point merged pool into a variant option, this hasn't been tested for every possible configuration.
  * While V1 used local storage and parsed the page for data, V2 reads the DnDBeyond API calls to get data directly. So changes they make could break this.
  * Things may break for you that I may or may not fix. If it's simple enough or affects me specifically, I'll probably attempt to make it work.
  * Feel free to open up [issue reports](https://github.com/Mwr247/DnDBeyondSpellPointsV2/issues) here. I'll try to look through them if/when I can.
  * Otherwise, if you feel so inclined, feel free to attempt a fix yourself and [Pull Request](https://github.com/Mwr247/DnDBeyondSpellPointsV2/pulls) it back here. I apologize for the horrible code, but again, was intended for specific personal use.

