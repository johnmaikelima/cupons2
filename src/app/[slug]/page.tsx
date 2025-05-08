'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';

interface PageData {
  title: string;
  content: string;
}

export default function DynamicPage({ params }: { params: { slug: string } }) {
  const [page, setPage] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPage() {
      try {
        const response = await fetch(`/api/pages/${params.slug}`);
        if (!response.ok) {
          throw new Error('Página não encontrada');
        }
        const data = await response.json();
        setPage(data);
      } catch (error) {
        notFound();
      } finally {
        setIsLoading(false);
      }
    }

    loadPage();
  }, [params.slug]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  if (!page) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <article className="page-content max-w-4xl mx-auto">
        <h1>{page.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: page.content }} />
      </article>
    </div>
  );
}
