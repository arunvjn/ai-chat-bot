'use client';

import { cx } from 'class-variance-authority';
import Image from 'next/image';

export function ImageContainer({ result }: { result: string[] }) {
  return (
    <div
      className="w-full mx-auto max-w-3xl px-4 group/message "
      data-role={'assistant'}
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
          <div className="text-[13px] text-foreground font-normal">
            {result.length === 1 ? 'Here is the generated image' : 'Here are the generated images'}
          </div>
          <div className="flex flex-row gap-2">
            {result?.map((url, i) => (
              <Image
                height={300}
                width={300}
                key={i}
                src={url}
                alt=""
                className="rounded-md object-cover"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
