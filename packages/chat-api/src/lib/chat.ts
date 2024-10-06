import { Request, Response } from 'lambda-api';
import { Chat, listChatsLogs, saveChatLog } from '@eddii-backend/dal';
import { validArbitraryString, validBase64String } from '@eddii-backend/utils';
import {
    Message,
    RecognizeTextCommand,
    RecognizeTextCommandInput,
} from '@aws-sdk/client-lex-runtime-v2';
import Clients from '@eddii-backend/clients';

const sendTextCommand = async (
    email: string,
    message: string,
): Promise<Message[]> => {
    const request: RecognizeTextCommandInput = {
        botId: process.env['EDDII_CHAT_BOT_LEX_BOT_ID'],
        botAliasId: process.env['EDDII_CHAT_BOT_LEX_BOT_ALIAS_ID'],
        localeId: 'en_US',
        sessionId: email.replace(/[^0-9a-zA-Z._:-]+/g, '-'),
        text: message,
    };

    try {
        const response = await Clients.lex.send(
            new RecognizeTextCommand(request),
        );
        return response.messages;
    } catch (error) {
        console.error('Error sending text command:', error);
        throw error;
    }
};

const getContentToSave = (messages: Message[]) => {
    if (messages.length === 0) {
        return '';
    }
    if (messages[0].content) {
        return messages[0].content;
    }
    if (messages[0].imageResponseCard?.title) {
        return messages[0].imageResponseCard.title;
    }
    return '';
};

export const chat = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const { prompt, dontSave } = request.body;
    if (!prompt) {
        response.status(400).json({ error: 'Missing prompt' });
        return;
    }
    if (!validArbitraryString(prompt)) {
        response.status(400).json({ error: 'Invalid prompt' });
        return;
    }
    try {
        const messages = await sendTextCommand(email, prompt);
        const content = getContentToSave(messages);
        const currentDateForUser = new Date();
        const chat: Chat = {
            email,
            entryAt: currentDateForUser.toISOString(),
            prompt: prompt,
            response: content,
        };
        if (!dontSave) {
            await saveChatLog(chat);
        }
        response.status(200).json(messages);
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal Server Error' });
    }
};

export const listChats = async (
    request: Request,
    response: Response,
): Promise<void> => {
    try {
        const email = request.userEmail;
        const { page } = request.query;
        if (page && !validBase64String(page)) {
            response.status(400).json({ error: 'Invalid page' });
            return;
        }
        const [chatHistory, pageToken] = await listChatsLogs(email, page);
        response
            .status(200)
            .json({ chatEntries: chatHistory, page: pageToken });
        return;
    } catch (error) {
        console.error('Error:', error);
        response.status(500).json({ error: 'Internal Server Error' });
    }
};
