# ❓ FAQ

### 💾 Where are my tasks stored?

In your browser's `localStorage`, on your device only, tasks and projects together. There is no account and no server, and the app never talks to another site: even the language flags come from the app itself. See [Security](./security.md#️-data-on-the-device).

After your first change the app asks the browser to keep this data even when the disk runs low. Chrome and Edge decide on their own, Firefox may ask you once, and an installed app is usually allowed.

> [!WARNING]
> Clearing the site data in your browser deletes your tasks. Use **⋯ → Export tasks** to keep a backup.

### 🧭 Can Safari delete my tasks on its own?

Yes, in one case: Safari removes what a site saved in the browser after **seven days of using Safari without opening that site**. To avoid it, install the app (**Share → Add to Home Screen** on an iPhone or iPad, **File → Add to Dock** on a Mac): an installed app counts only the days you use it. Otherwise open the app at least once a week or keep an export.

### 📲 How do I move my tasks to another device or browser?

Open **⋯ → Export tasks** on the old device and **⋯ → Import tasks** on the new one. The file contains your tasks and projects. Importing only adds what is not there yet, so it is safe to import the same file twice.

> [!TIP]
> Tabs of the same browser stay in sync on their own; export and import are only needed between browsers or devices.

### 📁 What is the difference between projects and tags?

A task belongs to **one project** at most, such as Work, 🏠 Home or Trip to Lviv, and each project has its own page, colour and icon in the sidebar. **Tags** are `#words` in the title: a task can have many, and clicking one searches every list for it. Use projects for areas of your life and tags for themes that cut across them, like `#calls` or `#urgent`.

### 🗑️ What happens to the tasks when I delete a project?

They are deleted with it, and the dialog tells you how many before you confirm. If you change your mind, press **Undo** in the notification or <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>Z</kbd>: the project comes back with every task. To keep the tasks, move them to another project first, for example by dragging them onto it in the sidebar.

### 🧯 The app shows “Something went wrong”. Are my tasks gone?

No. The error screen sits on top of your data: **Download a backup** saves the stored tasks and projects as a JSON file, **Reset view settings** clears only your preferences (the selected list, sort order, theme and language) and **Reload the app** starts over. If the problem persists, please [open an issue](https://github.com/sacrificed666/tasks/issues/new/choose).

### 🐢 The app feels slow on my computer. What can I do?

Open **Settings → Effects** and choose **Reduced**. It keeps the look but swaps the blurred glass for a denser tint and stops the moving background, the refraction and the pointer light, which are what slows down computers without a strong graphics chip. **Auto** already does this everywhere except Macs, iPhones and iPads. The **Plain** background is the lightest of all. Long lists are not a problem: the app stays responsive with thousands of tasks. See [Design system](./design.md#-effects-and-performance).

### 🖼️ How do I change the colours or the background?

Open **Settings** with the sliders button. Pick one of ten **accents**, one of six **backgrounds** (Aurora, Spectrum, Sunset, Ocean, Nebula or Plain) and the **glass** style. **Tinted** glass is denser and easier to read on bright backgrounds. The command palette can switch all of them too: type `background`, `accent` or `glass`.

### 🔮 Why do the glass edges bend the background only in some browsers?

The refraction uses an SVG filter inside `backdrop-filter`, which only Chromium-based browsers render, and only with **Full** effects. Safari and Firefox get the same frosted glass without the lens effect. See [Design system](./design.md#-refraction).

### 🖱️ Is there a right-click menu?

Yes. Right-click a task, press and hold it on a phone or press <kbd>⇧</kbd>+<kbd>F10</kbd> to schedule it with one tap, pick a date in the calendar, star or complete it, move it to a project, rename, duplicate or delete it. See [Features](./features.md#️-context-menu).

### ⚡ Which words does quick add understand?

Dates like `tomorrow`, `next friday`, `in 3 days`, `20.10` and their equivalents in all ten languages (`morgen`, `mañana`, `demain`, `domani`, `jutro`, `zítra`, `amanhã`…), repeats like `every monday` or `щотижня`, `!` for important at the end of the title and `@project` anywhere in it. The full list is in [Features](./features.md#-quick-add).

### 🔁 How do repeating tasks work?

Open a task's details and pick **Repeat**, or end its title with a phrase like `every friday` or `щотижня`. When you complete it, the finished occurrence moves to **Completed** and the next one appears right away with its new date. Monthly tasks remember their day: rent due on the 31st is due on 28 February and back on 31 March. See [Features](./features.md#-repeating-tasks).

### ⬅️ Why does the Back button close windows instead of leaving the app?

On phones and in the installed app, the settings, the Lists sheet, task details and the palette behave like screens: **Back** closes the one that is open, and only then leaves the app. This is how native apps on Android work.

### ⌨️ Is there a list of keyboard shortcuts?

Yes, in the **⋯** menu, in the command palette (<kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>K</kbd>) and in [Features](./features.md#️-keyboard-shortcuts).

### 🌍 Can I use the app in another language?

Ten are built in: English, Ukrainian, Czech, German, Spanish, French, Italian, Dutch, Polish and Portuguese. Adding another one takes a message file and a few lines, see [Localization](./i18n.md#-adding-a-language).

### ♿ Can I use the app with a screen reader or only the keyboard?

Yes. Every control works with the keyboard, lists and buttons announce their counters, notifications are read out, and Windows high contrast, increased contrast, reduced motion and reduced transparency are supported. Automated accessibility checks run on every change, see [Accessibility](./accessibility.md).

### 🔄 How do I get updates?

The app checks for updates in the background. When one is ready, a notification offers **Reload**; nothing changes until you choose it.

### 🗑️ How do I delete everything?

Clear the site data in your browser settings. Inside the app, deleting a project removes its tasks, and **Complete all** followed by **Clear completed** removes the rest.

> [!CAUTION]
> This cannot be undone once the page is closed. Export a backup first if you might need the tasks again.

### 🐳 Can I run it in Docker?

Yes. `docker compose -f compose.yaml -f docker/development.yaml up --watch` starts the dev server in a container, and `docker/staging.yaml` and `docker/production.yaml` serve the production build with nginx at the root, just like GitHub Pages. See [Deployment](./deployment.md#-docker).
