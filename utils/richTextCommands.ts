export type RichTextCommand = 'bold' | 'italic' | 'insertUnorderedList' | 'insertOrderedList';

const getCurrentRange = (): Range | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    return selection.getRangeAt(0);
};

const moveCaretToEnd = (node: Node) => {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
};

const wrapSelectionWithTag = (tag: 'b' | 'i') => {
    const range = getCurrentRange();
    if (!range) return;

    const wrapper = document.createElement(tag);

    if (range.collapsed) {
        const text = document.createTextNode('\u200b');
        wrapper.appendChild(text);
        range.insertNode(wrapper);
        const nextRange = document.createRange();
        nextRange.setStart(text, 1);
        nextRange.collapse(true);
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(nextRange);
        }
        return;
    }

    try {
        range.surroundContents(wrapper);
    } catch {
        const fragment = range.extractContents();
        wrapper.appendChild(fragment);
        range.insertNode(wrapper);
    }

    moveCaretToEnd(wrapper);
};

const insertListFromSelection = (ordered: boolean) => {
    const range = getCurrentRange();
    if (!range) return;

    const list = document.createElement(ordered ? 'ol' : 'ul');
    const selectedText = range.toString().trim();
    const lines = selectedText.length > 0 ? selectedText.split(/\n+/) : [''];

    for (const raw of lines) {
        const li = document.createElement('li');
        const line = raw.trim();
        li.textContent = line.length > 0 ? line : '\u00a0';
        list.appendChild(li);
    }

    range.deleteContents();
    range.insertNode(list);
    moveCaretToEnd(list);
};

export const applyRichTextCommand = (command: RichTextCommand) => {
    if (command === 'bold') {
        wrapSelectionWithTag('b');
        return;
    }
    if (command === 'italic') {
        wrapSelectionWithTag('i');
        return;
    }
    if (command === 'insertOrderedList') {
        insertListFromSelection(true);
        return;
    }
    insertListFromSelection(false);
};
