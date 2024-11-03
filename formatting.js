// formatting.js

// Function to apply text formatting, such as bold, italics, headings, code blocks, and links
export function formatText(text) {
    let formattedText = text;

     const imageRegex = /(https?:\/\/(?:firebasestorage\.googleapis\.com\/\S+alt=media\S*|\S+\.(?:jpg|jpeg|png|gif)))/gi;
    formattedText = formattedText.replace(imageRegex, (url) => `<img src="${url}" alt="Image" style="max-width: 100%; height: auto;" />`);

    // Apply **bold** formatting
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Apply heading formatting (from # to ######)
    // Apply custom heading formatting with spans to avoid default heading styles
formattedText = formattedText.replace(/^###### (.*)$/gm, "<span class='heading h6'>$1</span>")
.replace(/^##### (.*)$/gm, "<span class='heading h5'>$1</span>")
.replace(/^#### (.*)$/gm, "<span class='heading h4'>$1</span>")
.replace(/^### (.*)$/gm, "<span class='heading h3'>$1</span>")
.replace(/^## (.*)$/gm, "<span class='heading h2'>$1</span>")
.replace(/^# (.*)$/gm, "<span class='heading h1'>$1</span>");


    // Detect and format code blocks using ``` (triple backticks) as a delimiter, without syntax highlighting
    formattedText = formattedText.replace(/```(\w*)\n([\s\S]*?)```/g, (match, language, code) => {
        const codeType = language.toUpperCase() || "CODE";
        const escapedCode = escapeHTML(code); // Escape HTML, but no syntax highlighting
        return `
            <div class="code-block">
                <div class="code-header">
                    <span class="code-type">${codeType}</span>
                    <button class="copy-button" onclick="copyToClipboard(this)">Copy</button>
                </div>
                <pre class="terminal-style"><code>${escapedCode}</code></pre>
            </div>`;
    });

    // Detect Markdown-style links [text](url)
    formattedText = formattedText.replace(/\[(.*?)\]\((https?:\/\/[^\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Detect plain URLs and make them clickable, avoiding duplicates
    formattedText = formattedText.replace(/(^|[^"'>])((https?:\/\/[^\s]+))/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
    
    return formattedText;
}

// Escape HTML characters to prevent rendering as HTML
function escapeHTML(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
}

// Function to copy code to clipboard
window.copyToClipboard = function(button) {
    const codeElement = button.parentElement.nextElementSibling.querySelector("code");
    const codeText = codeElement.innerText;

    navigator.clipboard.writeText(codeText).then(() => {
        button.textContent = "Copied!";
        setTimeout(() => (button.textContent = "Copy"), 2000);
    }).catch(err => {
        console.error("Failed to copy code: ", err);
    });
}

// Queue MathJax typesetting
export function queueMathJaxTypeset() {
    if (window.MathJax) {
        window.MathJax.typesetPromise().catch((err) => console.error("MathJax typeset failed: ", err));
    }
}
