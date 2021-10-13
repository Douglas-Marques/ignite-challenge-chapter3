import Head from 'next/head'
import { GetStaticProps } from 'next'
import Link from 'next/link'
import Prismic from '@prismicio/client'
import { FiCalendar, FiUser } from 'react-icons/fi'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'

import { getPrismicClient } from '../services/prismic'

import commonStyles from '../styles/common.module.scss'
import styles from './home.module.scss'
import { useEffect, useState } from 'react'

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

  const [posts, setPosts] = useState(postsPagination)

  useEffect(() => {
    setPosts(postsPagination)
  }, [postsPagination])

  async function handleFetchMorePosts() {
    fetch(posts.next_page).then(async response => {
      const morePosts: any = await response.json()

      const { next_page } = morePosts
      const results: Post[] = morePosts.results.map(post => ({
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title ?? '',
          subtitle: post.data.subtitle ?? '',
          author: post.data.author ?? '',
        }
      }))

      const newPostsPagination: PostPagination = {
        next_page,
        results: [...posts.results, ...results]
      }

      setPosts(newPostsPagination)
    })
  }

  return (
    <>
      <Head>
        <title>Posts | spacetraveling</title>
      </Head>

      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {posts.results.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div>
                  <time><FiCalendar size={22} /> {format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR })}</time>
                  <span><FiUser size={22} /> {post.data.author}</span>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </main>

      {posts.next_page && (
        <a className={styles.more} onClick={handleFetchMorePosts}> Carregar mais posts</a>
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
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
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
