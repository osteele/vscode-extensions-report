const modifierSymbols: Record<string, string> = {
    "alt": "⌥",
    "cmd": "⌘",
    "ctrl": "^",
    "shift": "⇧",
};
const keySymbols: Record<string, string> = {
    "left": "←",
    "right": "→",
    "up": "↑",
    "down": "↓",
    "page up": "⇞",
    "page down": "⇟",
    "backspace": "⌫",
    "enter": "↩",
    "escape": "⎋",
    "home": "↖",
    "end": "↘",
    "return": "↩",
    "space": "␣",
    "tab": "⇥",
};

export function keybindingToHtml(binding: string): Array<string> {
    if (binding.indexOf(' ') >= 0) {
        return binding.split(' ').flatMap(keybindingToHtml);
    }
    const modifiers = [];
    let key = binding;
    while (true) {
        let m = key.match(/^(alt|cmd|ctrl|shift)\+(.+)/i);
        if (!m)
            break;
        modifiers.push(modifierSymbols[m[1].toLowerCase()]);
        key = m[2];
    }

    return [modifiers.join('') + (keySymbols[key] || key.toUpperCase())];
}
