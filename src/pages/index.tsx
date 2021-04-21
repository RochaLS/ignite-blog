import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);

  async function handleLoadMorePosts(): Promise<void> {
    try {
      const response = await fetch(postsPagination.next_page);
      const { results, next_page } = await response.json();
      const newPosts = results.map(post => {
        return {
          uid: post.uid,
          first_publication_date: new Date(
            post.first_publication_date
          ).toLocaleDateString('en-CA', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }),
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
        };
      });
      console.log(next_page);
      setPosts([...posts, ...newPosts]);
      setNextPage(next_page);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <>
      <Head>
        <title>Posts - Spacetraveling</title>
      </Head>
      <Header />
      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`posts/${post.uid}`}>
              <a key={post.uid}>
                <strong>{post.data.title}</strong>
                <p className={styles.subtitle}>{post.data.subtitle}</p>
                <div className={styles.postInfo}>
                  <FiCalendar />
                  <time>
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </time>
                  <FiUser />
                  <p>{post.data.author}</p>
                </div>
              </a>
            </Link>
          ))}
        </div>
        {nextPage && (
          <button
            type="button"
            onClick={handleLoadMorePosts}
            className={styles.loadPostsButton}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author', 'posts.content'],
      pageSize: 20,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page,
      },
    },
  };
};
