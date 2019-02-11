import React from 'react'
import Link from 'next/link'
import Head from '../components/head'
import Nav from '../components/nav'
import Login from './login.js'

const Index = () => (
  <div>
    {/*<Link href="/about">
      <a>About Page</a>
    </Link>*/}
    <Head />
    <Login />
  </div>
)

export default Index
