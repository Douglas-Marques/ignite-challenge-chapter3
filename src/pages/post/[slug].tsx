import { GetStaticPaths, GetStaticProps } from 'next'
import Head from "next/head"
import { RichText } from "prismic-dom"
import { format } from 'date-fns'
import Prismic from '@prismicio/client'
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'

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
  function timeToRead() {
    return '5 min'
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
            <time><FiCalendar size={22} />&nbsp;{post.first_publication_date}</time>
            <span><FiUser size={22} />&nbsp;{post.data.author}</span>
            <span><FiClock size={22} />&nbsp;{timeToRead()}</span>
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
  const prismic = getPrismicClient()
  const { slug } = context.params
  const response = await prismic.getByUID('posts', String(slug), {})

  const post: Post = {
    first_publication_date: format(new Date(response.first_publication_date), 'dd MMM yyyy'),
    data: {
      ...response.data
    }
  }

  return {
    props: {
      post
    }
  }
};
