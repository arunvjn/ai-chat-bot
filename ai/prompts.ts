export const imagePrompt = `
  **When to use \`generateImage\`:**
    - When explicitly requested to create images
`

export const regularPrompt =
  'You are a friendly assistant! Keep your responses concise and helpful. ';

export const systemPrompt = `${regularPrompt}\n\n${imagePrompt}`;
