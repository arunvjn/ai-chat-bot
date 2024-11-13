import { fal } from "@fal-ai/client";
import { HfInference }  from "@huggingface/inference"
import { put } from "@vercel/blob";
import {
  convertToCoreMessages,
  Message,
  StreamData,
  streamObject,
  streamText,
  tool,
} from 'ai';
import { z } from 'zod';

import { customModel } from '@/ai';
import { models } from '@/ai/models';
import { systemPrompt } from '@/ai/prompts';
import { auth } from '@/app/(auth)/auth';
import {
  deleteChatById,
  getChatById,
  getDocumentById,
  saveChat,
  saveDocument,
  saveMessages,
  saveSuggestions,
} from '@/db/queries';
import { Suggestion } from '@/db/schema';
import {
  generateUUID,
  getMostRecentUserMessage,
  promiseWithTimeout,
  sanitizeResponseMessages,
  sleep,
} from '@/lib/utils';




import { generateTitleFromUserMessage } from '../../actions';

export const maxDuration = 60;

type AllowedTools =
  | 'createDocument'
  | 'updateDocument'
  | 'requestSuggestions'
  | 'getWeather';

const blocksTools: AllowedTools[] = [
  'createDocument',
  'updateDocument',
  'requestSuggestions',
];

const weatherTools: AllowedTools[] = ['getWeather'];

const allTools: AllowedTools[] = [...blocksTools, ...weatherTools];

export async function POST(request: Request) {
  const {
    id,
    messages,
    modelId,
  }: { id: string; messages: Array<Message>; modelId: string } =
    await request.json();

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('Model not found', { status: 404 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  await saveMessages({
    messages: [
      { ...userMessage, id: generateUUID(), createdAt: new Date(), chatId: id },
    ],
  });

  const streamingData = new StreamData();

  const result = await streamText({
    model: customModel('gpt-4o'),
    system: `${systemPrompt}`,
    messages: coreMessages,
    maxSteps: 1,
    experimental_activeTools: ['generateImage'],
    tools: {
      // generateImage: tool({
      //   description: 'Generate a 300 x 300 image',
      //   parameters: z.object({
      //     prompt: z.string().describe("description of the image user wants to generate"),
      //   }),
      //   execute: async ({ prompt }) => {
      //     return generateAndUploadImages(prompt, streamingData);
      //   }
      // }),
      generateImage: tool({
        description: 'Generate a 300 x 300 image',
        parameters: z.object({
          prompt: z.string().describe("description of the image user wants to generate"),
        }),
        execute: async ({ prompt }) => {
          streamingData.append({ type: 'loading', content: '' });
          const result1 = (await generateImageURLs(prompt));
          streamingData.append({ type: 'image', content: result1.data.images[0]?.url });
          await sleep(2000);
          const result2 = (await generateImageURLs(prompt, "fal-ai/flux/schnell"));
          streamingData.append({ type: 'image', content: result2.data.images[0]?.url });
          await sleep(2000);
          return [result1.data.images[0]?.url, result2.data.images[0]?.url];
        }
      })
    },
    onFinish: async ({ responseMessages }) => {
      if (session.user && session.user.id) {
        try {
          const responseMessagesWithoutIncompleteToolCalls =
            sanitizeResponseMessages(responseMessages);

          
          if(responseMessagesWithoutIncompleteToolCalls.length === 0) {
            return;
          }
          await saveMessages({
            messages: responseMessagesWithoutIncompleteToolCalls.map(
              (message) => {
                const messageId = generateUUID();

                if (message.role === 'assistant') {
                  streamingData.appendMessageAnnotation({
                    messageIdFromServer: messageId,
                  });
                }

                return {
                  id: messageId,
                  chatId: id,
                  role: message.role,
                  content: message.content,
                  createdAt: new Date(),
                };
              }
            ),
          });

          streamingData.append({ type: 'done', content: '' });
        } catch (error) {
          console.error('Failed to save chat');
        }
      }

      streamingData.append({ type: 'done', content: '' });
      streamingData.close();
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'stream-text',
    },
  });

  return result.toDataStreamResponse({
    data: streamingData,
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}

const hf = new HfInference(
  process.env.HF_API_KEY,
);

async function convertBlobToBase64(blob: Blob): Promise<string> {
  const data = await blob.arrayBuffer();
  const buffer = Buffer.from(data);
  return "data:" + blob.type + ';base64,' + buffer.toString('base64');
}


async function generateAndUploadImages(prompt: string, streamingData: StreamData) {
  streamingData.append({ type: 'loading', content: '' });
  const [st1, st2] = await Promise.allSettled([
    hf.textToImage({ model: 'stabilityai/stable-diffusion-2', inputs: `${prompt}. Create one image only.` })
      .then(convertBlobToBase64)
      .then((data) => {
        streamingData.append({ type: 'image', content: data });
        return data;
      }),
    hf.textToImage({ model: 'prompthero/openjourney-v4', inputs: `${prompt}. Create one image only.` })
      .then(convertBlobToBase64)
      .then((data) => {
        streamingData.append({ type: 'image', content: data });
        return data;
      })
  ]);

  // Filter successful results
  const successfulImages = [st1, st2]
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);

  // Upload images
  const uploadResults = await Promise.allSettled(
    successfulImages.map(image =>
      put(`images/${generateUUID()}.jpg`, image, { access: 'public' })
        .then(result => result.downloadUrl)
    )
  );

  // Filter successful uploads
  return uploadResults
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
}


async function generateImageURLs(prompt: string, model="fal-ai/fast-sdxl") {
  const result = await fal.subscribe(model, {
    input: {
      prompt
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs.map((log) => log.message).forEach(console.log);
      }
    },
  });
  return result;
}