/* eslint-disable no-unneeded-ternary */
/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import commonStyles from '../../styles/common.module.scss';
import Header from '../../components/Header';
// eslint-disable-next-line import/extensions
import Comments from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  preview: boolean;
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      };
    };
    nextPost: {
      uid: string;
      data: {
        title: string;
      };
    };
  };
}

export default function Post({
  post,
  preview,
  navigation,
}: PostProps): JSX.Element {
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

  const shouldHidePrevPost = navigation.prevPost.uid ? false : true;
  const shouldHideNextPost = navigation.nextPost.uid ? false : true;

  const wasPostEdited =
    post.first_publication_date !== post.last_publication_date;

  let editedPostLabel = '';

  if (wasPostEdited) {
    editedPostLabel = format(
      new Date(post.last_publication_date),
      "'* editado em' dd MMM yyyy', às' H':'m",
      {
        locale: ptBR,
      }
    );
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
          <span className={styles.editedLabel}>{editedPostLabel}</span>
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
        <hr />
        <section className={styles.navigation}>
          <div className={shouldHidePrevPost ? styles.hidden : ''}>
            <h4>{navigation.prevPost.data.title}</h4>
            <Link href={`${navigation.prevPost.uid}`}>
              <a className={styles.prevPostAnchor}>Post anterior</a>
            </Link>
          </div>
          <div className={shouldHideNextPost ? styles.hidden : ''}>
            <h4>{navigation.nextPost.data.title}</h4>
            <Link href={`${navigation.nextPost.uid}`}>
              <a>Próximo post</a>
            </Link>
          </div>
        </section>
        <Comments />
        {preview && (
          <aside className={commonStyles.previewButtonContainer}>
            <Link href="/api/exit-preview">
              <a className={commonStyles.previewButton}>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const prevPostResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPostResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date desc]',
    }
  );

  const prevPost = {
    uid: prevPostResponse.results[0]?.uid ?? null,
    data: {
      title: prevPostResponse.results[0]?.data.title ?? null,
    },
  };

  const nextPost = {
    uid: nextPostResponse.results[0]?.uid ?? null,
    data: {
      title: nextPostResponse.results[0]?.data.title ?? null,
    },
  };

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner?.url,
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
      preview,
      navigation: {
        prevPost,
        nextPost,
      },
    },
  };
};
