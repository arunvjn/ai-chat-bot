'use client';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { ImageStream } from './chat';
import { JSONValue } from 'ai';


export type ImageStreamHandlerProps = { 
  streamingData?: JSONValue[]; 
  setImages: Dispatch<SetStateAction<ImageStream>>;
}

export function ImageStreamHandler({ streamingData, setImages }: ImageStreamHandlerProps) {

  useEffect(() => {
    const mostRecentDelta = (streamingData as { type: 'image' | 'done' | 'loading', content: string }[])?.at(-1);
    if (!mostRecentDelta) return;

    const delta = mostRecentDelta;

    setImages((draftImages) => {
      switch (delta.type) {
        case 'image':
          return {
            ...draftImages,
            status: 'streaming',
            content: {
              images: [...draftImages.content.images, delta.content as string],
            },
          };

        case 'done':
          return {
            ...draftImages,
            status: 'idle',
          };

        default:
          return draftImages;
      }
    });

  }, [streamingData, setImages]);

  return null;

}
