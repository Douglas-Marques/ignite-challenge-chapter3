import { GetStaticPaths, GetStaticProps } from 'next'
import Head from "next/head"
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import Prismic from '@prismicio/client'
import { RichText } from 'prismic-dom'
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'
import { useRouter } from 'next/router'

import { getPrismicClient } from '../../services/prismic'

import commonStyles from '../../styles/common.module.scss'
import styles from './post.module.scss'

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

export default function Post({ post }: PostProps) {

  const router = useRouter();
  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const readingTime = post.data.content.reduce((acc, content) => {
    const textBody = RichText.asText(content.body);
    const numberWords = textBody.trim().split(/\s+/).length;

    const result = Math.ceil(numberWords / 200);
    return acc + result;
  }, 0);

  function countWords(str: String) {
    return str;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>

      <img className={styles.banner} src={post.data.banner.url} alt="banner" />
      <main className={commonStyles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>

          <div className={styles.info}>
            <time><FiCalendar size={22} />&nbsp;{format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR })}</time>
            <span><FiUser size={22} />&nbsp;{post.data.author}</span>
            <span><FiClock size={22} />&nbsp;{readingTime ?? 1} min</span>
          </div>

          {post.data.content.map(content => (
            <div key={content.heading}>
              <h3>{content.heading}</h3>
              {content.body.map(body => (
                <div key={body.text} className={styles.postContent} dangerouslySetInnerHTML={{ __html: body.text }}></div>
              ))}
            </div>
          ))}
        </article>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient()
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ])

  const slugs = posts.results.map(post => ({
    params: {
      slug: post.uid
    }
  }))

  return {
    paths: [...slugs],
    fallback: true
  }
}

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params

  const prismic = getPrismicClient()

  const response = await prismic.getByUID('posts', String(slug), {})
  if (!response) {
    return {
      notFound: true,
    };
  }

  const post = {
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post
    }
  }
}
