import Head from 'next/head'
import { GetStaticProps } from 'next'
import Link from 'next/link'
import Prismic from '@prismicio/client'
import { FiCalendar, FiUser } from 'react-icons/fi'
import { format } from 'date-fns'

import { getPrismicClient } from '../services/prismic'

import commonStyles from '../styles/common.module.scss'
import styles from './home.module.scss'

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

export default function Home({ postsPagination }: HomeProps) {
  return (
    <>
      <Head>
        <title>Posts | spacetraveling</title>
      </Head>

      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {postsPagination.results.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div>
                  <time><FiCalendar size={22} /> {post.first_publication_date}</time>
                  <span><FiUser size={22} /> {post.data.author}</span>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </main>

      {postsPagination.next_page && (
        <a className={styles.more}> Carregar mais posts</a>
      )}
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient()
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author']
  })

  const results: Post[] = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: format(new Date(post.first_publication_date), 'dd MMM yyyy'),
    data: {
      title: post.data.title ?? '',
      subtitle: post.data.subtitle ?? '',
      author: post.data.author ?? '',
    }
  }))

  const postsPagination: PostPagination = {
    next_page: postsResponse.next_page,
    results
  }

  return {
    props: {
      postsPagination
    },
    revalidate: 60 * 30 //30min
  }
}
