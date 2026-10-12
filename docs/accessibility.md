# ♿ Accessibility

The app aims at **WCAG 2.2 AA** in all ten languages, in both appearances, on phones and with every effects level. Accessibility is part of the definition of done: automated checks run on every pull request, see [How it is checked](#-how-it-is-checked).

## 🗺️ Structure

- 🧭 Landmarks match the layout: the sidebar is the page's banner with a search landmark and three navigations (lists, projects and tags), the task list is the main region, the inspector is complementary and the footer with the version and the source code closes the page.
- 🏷️ Every dialog, sheet and the task details have a heading, and the page has exactly one `h1`: the name of the open list or project.
- 🪪 The browser tab is named after what is open (**Today · Tasks**, **Search · Tasks**, a project's name) in the interface language, so tabs, history and screen readers always say where you are.
- 🌍 `<html lang>` follows the interface language, and every language name in the settings carries its own `lang`.

## ⌨️ Keyboard

- ⏭️ A **Skip to tasks** link appears at the top left on the first <kbd>Tab</kbd>.
- 🎯 Every control is reachable and operable with the keyboard, with a visible 2 px focus ring. Text fields that are the only control of their surface, such as the palette and search inputs, a subtask or the project name, show one ring on the surface itself instead of a second one around the text.
- 👆 Every gesture has a button: page swipes on phones repeat the tab bar and the **Lists** sheet, row swipes repeat the checkbox and the context menu (WCAG 2.5.1 Pointer Gestures).
- 😀 The project emoji grid is a labelled group of toggle buttons: the arrow keys, <kbd>Home</kbd> and <kbd>End</kbd> move through it, and it opens on the current choice.
- 🔁 Focus moves to a sensible place after completing, deleting, editing or restoring a task, and dialogs and menus return focus to the place they were opened from.
- ⌨️ Lists, tasks, the calendar, the context menu and the palette have full keyboard support; the shortcuts are listed in [Features](./features.md#️-keyboard-shortcuts).

## 🗣️ Screen readers

- 🔢 List, project and tag buttons announce their counters, for example _Today (3)_, the current one is marked with `aria-current` and toggles expose `aria-pressed`.
- 🏷️ Every accessible name contains the visible label (WCAG 2.5.3 Label in Name), so voice control works with what is on screen: the phone tab bar is named after its short labels (_Planned_, _Starred_), counters are separated from labels by a space, and the **⌘K** button is called _Command palette (⌘K)_.
- 🧩 The palette follows the ARIA combobox pattern, the context menu the menu pattern with `menuitem` and `menuitemradio` roles.
- 🎛️ Every group of choices in the settings (appearance, accent, background, glass, effects and language) is a set of native radio buttons inside a `fieldset` with a `legend`, so screen readers announce the group with each option; the glass and effects hints are linked with `aria-describedby`.
- 🔊 Notifications, search and palette result counts and drag and drop steps, including drops on the sidebar, are announced through live regions.
- 📴 The offline badge sits in an `output` that stays on the page while the app is online, so going offline is announced: a live region that appears together with its message is often never read.
- 📊 Project progress in the overview is read as the project name with its count, followed by a description such as _1 of 2 done_.

## 🎨 Colour and contrast

- 🔤 Text on the glass panels reaches **4.5:1** in both appearances, including small captions, placeholders and the red **Overdue** heading (4.9:1 in light mode).
- 🎨 Every accent is tuned separately for light and dark, and secondary and tertiary text are tuned to pass on the most see-through glass.
- 🚦 Colour never carries meaning alone: overdue tasks also say _Overdue_, important tasks have a star and completed tasks are struck through.

## 🌗 Preferences

| Preference                                | Adaptation                                                                                                                                                                                                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🐢 `prefers-reduced-motion: reduce`       | Durations drop to 1 ms, the orbs stop, completion and deletion are instant                                                                                                                                                                                                   |
| 🌫️ `prefers-reduced-transparency: reduce` | Surfaces become opaque, blur and refraction are disabled, even with Tinted glass                                                                                                                                                                                             |
| 🌗 `prefers-contrast: more`               | Stronger text, separators and rims, denser glass                                                                                                                                                                                                                             |
| 🖍️ `forced-colors: active`                | Glass gains a real border, checkboxes use system colours, every selected item (current list, pressed toggle, checked option, chosen colour or day) gets a `Highlight` ring, swatches and background previews keep their colours, and only completed tasks are struck through |

> [!NOTE]
> In forced colours mode browsers replace author colours with the visitor's system palette, which erases anything shown only by a background, such as the sliding indicator of a segmented control. The `Highlight` ring in `src/shared/styles/global.scss` keeps the selection visible instead.

## 📱 Touch, zoom and small screens

- 👆 Row actions have 40 px hit targets on touch screens, menus open with a long press instead of hover, and rows show no text selection callout.
- 🔍 The layout reflows down to **320 px**, the width of a 1280 px window zoomed to 400 %, without horizontal scrolling (WCAG 1.4.10), even with the long Dutch and German labels.

## ✅ How it is checked

- 🤖 **axe-core** runs in the end-to-end tests on the task list and Today in light and dark, the empty state, the settings dialog, the command palette with results, the task details, the Ukrainian interface and the full effects of Apple devices in both appearances, on desktop and phone screens, with no violations. Two rules that axe leaves off by default are switched on: `label-content-name-mismatch` and `target-size`, which asks for 24 × 24 px targets or enough room around smaller ones (WCAG 2.2, 2.5.8).
- ⌨️ A keyboard test checks that the first <kbd>Tab</kbd> reaches the skip link and that it moves focus to the task list.
- 🖍️ A forced colours test checks that the chosen option of a segmented control keeps a visible highlight.
- 📏 Three views in Dutch are checked for sideways scrolling at 320 px.
- 🚦 **Lighthouse** must score 1 for accessibility, and every accessibility audit must pass, including the ones without weight.
- 🧪 Component tests find elements by role and accessible name, so a missing label fails a test.
- ⌨️ The pull request checklist asks for a pass with the keyboard only, in both appearances, in forced colours mode and on a phone-sized screen.

> [!TIP]
> To check a change by hand, use the keyboard only, then open Chrome DevTools, choose **Rendering** and emulate `forced-colors: active`, `prefers-contrast: more`, `prefers-reduced-transparency: reduce` and a vision deficiency such as deuteranopia.
