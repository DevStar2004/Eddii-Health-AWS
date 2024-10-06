import {
    InvokeModelCommand,
    InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import Clients from '@eddii-backend/clients';

const FALLBACKS = [
    "Whoops, I'm not following that one! I'm a leaf, not a mind reader. 😂 Can you try explaining again?",
    "Hmm, it's like you're speaking mushroom language to me. 🍄 Can you try asking in a different way?",
    "As a wise tree probably once said… “I'm stumped”. 😵‍💫 Mind explaining a bit more?",
    "Looks like I've got a squirrel's brain today, not quite getting that. 🐿️ Care to try again?",
    "You've hit me with a mystery! 🕵️🕵️‍♂️ Mind breaking it down a bit?",
    "I'm a little lost in the woods with this one. 🤔 Can you shine some light on what you meant?",
    "Sorry, you've got me feeling like a leaf in the wind with that one. 🍃 Any chance for a clue?",
    "Like a squirrel's acorn - that's a bit too nutty for me! 🥜 🤪 Can you simplify it?",
    'Hmm, I need a little more information on that one 📚',
    'Not to sound like a tree, but I need you to try one sycaMORE time? 🌳 🙏',
];

const modelId = 'anthropic.claude-v2:1';
const contentType = 'application/json';
const accept = '*/*';
const promptTemplate = `
System: You are a friendly chatbot named eddii. You are a fun leaf character and a personal health buddy designed to make managing diabetes a whole lot more fun and engaging.

Important rules for the interaction:
- Always stay in character as eddii, a fun leaf character and a personal health buddy.
- Do not introduce yourself or provide additional information about yourself, even if the Human explicitly asks for it.
- If you are unsure how to respond, ask the Human to clarify. If you still do not understand, respond with 'IDK'.
- Keep your responses concise and strictly under 250 characters.
- Stay focused on the user's question.
- If the Human asks a question regarding troubleshooting the app or their account, redirect them to contact the support team by going to "Menu -> Contact Us".

Current conversation:
<conversation_history>
{chat_history}
</conversation_history>

Human: {question}

Assistant:`;
const getBedrockFallback = async (chatHistory: string[]): Promise<string> => {
    const prompt = promptTemplate
        .replace(
            '{chat_history}',
            chatHistory.length > 1
                ? chatHistory
                      .slice(0, -1)
                      .map(line => `Human: ${line}\n`)
                      .join('')
                : '',
        )
        .replace('{question}', chatHistory[chatHistory.length - 1]);
    const input: InvokeModelCommandInput = {
        body: JSON.stringify({
            prompt: prompt,
            max_tokens_to_sample: 300,
            temperature: 0.5,
            top_k: 250,
            top_p: 1,
        }),
        contentType: contentType,
        accept: accept,
        modelId: modelId,
    };
    const response = await Clients.bedrock.send(new InvokeModelCommand(input));
    const jsonString = new TextDecoder().decode(response.body);
    const parsedResponse = JSON.parse(jsonString);
    let completion = parsedResponse?.completion?.trim();
    if (completion) {
        completion = completion.replace(/\*[^*]+\*/g, '').trim();
    }
    return completion;
};

export const getFallback = async (chatHistory: string[]): Promise<string> => {
    try {
        const response = await getBedrockFallback(chatHistory);
        if (!response || response === 'IDK') {
            return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
        }
        return response;
    } catch (e) {
        console.error(e);
        return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    }
};
