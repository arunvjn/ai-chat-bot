import { cx } from 'class-variance-authority';
import { motion } from 'framer-motion';
import GlowingTextLoader from './glowing-text';
import { LoadingSpinner } from './spinner';
import { ImageStream } from './chat';
import { Dispatch, SetStateAction, useEffect } from 'react';
import Image from 'next/image';
import ShimmerImage from './shimmer-image';
import { SparklesIcon } from './icons';

export function ImageLoader({
  images,
  setImages,
}: {
  images: ImageStream;
  setImages: Dispatch<SetStateAction<ImageStream>>;
}) {
  const role = 'assistant';

  useEffect(() => {
    return () => {
      setImages({
        status: 'idle',
        content: {
          images: [],
        },
      });
    };
  }, []);

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 0, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          }
        )}
      >
        <div className="flex flex-col gap-2 items-start w-full">
          <GlowingTextLoader text="Generating image..." />
          <div className="flex flex-row gap-2">
            {images.content.images.map((image, index) => (
              <ShimmerImage
                height={300}
                width={300}
                key={index}
                src={image}
                alt=""
                className="rounded-md object-cover"
              />
            ))}
            {images.content.images.length < 2 && (
              <div className="flex items-center rounded justify-center h-[300px] w-[300px] border border-gray-200 dark:border-gray-700">
                <LoadingSpinner />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
