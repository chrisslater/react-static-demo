import React from 'react'
import { SiteData, withSiteData } from 'react-static'

import logoImg from '../logo.png'

export default () => (
  <SiteData render={({ title }) => (
    <div>
      <h1 style={{ textAlign: 'center' }}>Welcome to {title}</h1>
      <img src={logoImg} alt="" style={{ display: 'block', margin: '0 auto' }} />
    </div>
  )} />

)
