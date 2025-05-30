'use client';

import './styles.css';

import { useEffect, useState } from 'react';
import { dynamicOffers } from '@/lib/dynamicOffers';
import { notFound } from 'next/navigation';

interface PageData {
  title: string;
  content: string;
}

export default function DynamicPage({ params }: { params: { slug: string } }) {
  const [page, setPage] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchPage() {
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

  useEffect(() => {
    fetchPage();
  }, []);

  useEffect(() => {
    if (page) {
      dynamicOffers.renderOffers();
    }
  }, [page]);

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
    <div>
      <article className="page-content">
        <h1>{page.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: page.content }} />
      </article>
    </div>
  );
}
