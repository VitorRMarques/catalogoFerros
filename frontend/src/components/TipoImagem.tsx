'use client';

import { useState } from 'react'

export default function TipoImagem( { slug, alt }: { slug: string, alt: string}) {
    const [falhou, setFalhou ] = useState(false);
    if (!falhou){
        return (
            <div className='flex h-full w-full items-center justify-center bg-gray-200 text-5xl font-bold text-gray-400'>
                {alt.charAt(0)}
            </div>
        )
    }

    return (
        <img
            src={`/tipos/${slug}.jpg`}
            alt={alt}
            onError={() => setFalhou(true)}
            className='h-full w-full object-cover'
        />
    )
}