/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  function calculateReadingTime(): number {
    const words = post.data.content.map(item => {
      return {
        headingWords: item.heading.split(' '),
        bodyWords: item.body.map(body => {
          return body.text.split(' ');
        }),
      };
    });

    let headingWordsCount = 0;
    let bodyWordsCount = 0;
    words.forEach(wordsObject => {
      wordsObject.bodyWords.forEach(array => {
        bodyWordsCount += array.length;
      });
      headingWordsCount += wordsObject.headingWords.length;
    });

    return Math.ceil((headingWordsCount + bodyWordsCount) / 200);
  }

  return (
    <>
      <Head>
        <title>{post.data.title} - Spacetraveling</title>
      </Head>

      <Header />

      <div className={styles.imgContainer}>
        <img
          src={post.data.banner.url}
          alt={post.data.title}
          className={styles.postImg}
        />
      </div>
      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.postInfo}>
            <FiCalendar />
            <span>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </span>
            <FiUser />
            <span>{post.data.author}</span>
            <FiClock />
            <span>{`${calculateReadingTime()} min`}</span>
          </div>
          {post.data.content.map(({ heading, body }) => (
            <div key={heading}>
              <h3 className={styles.contentHeading}>{heading}</h3>
              <div
                className={styles.postContent}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(body),
                }}
              />
            </div>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts')
  );

  const slugs = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });
  return {
    paths: slugs,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(item => {
        return {
          heading: item.heading,
          body: [...item.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  };
};
