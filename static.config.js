const fs = require('fs')
const klaw = require('klaw')
const path = require('path')
const matter = require('gray-matter')

// Paths Aliases defined through tsconfig.json
const typescriptWebpackPaths = require('./webpack.config.js')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

function getPosts() {
  const items = []
  // Walk ("klaw") through posts directory and push file paths into items array //
  const getFiles = () =>
    new Promise(resolve => {
      // Check if posts directory exists //
      if (fs.existsSync('./src/posts')) {
        klaw('./src/posts')
          .on('data', item => {
            // Filter function to retrieve .md files //
            if (path.extname(item.path) === '.md') {
              // If markdown file, read contents //
              const data = fs.readFileSync(item.path, 'utf8')
              // Convert to frontmatter object and markdown content //
              const dataObj = matter(data)
              // Create slug for URL //
              dataObj.data.slug = dataObj.data.title
                .toLowerCase()
                .replace(/ /g, '-')
                .replace(/[^\w-]+/g, '')
              // Remove unused key //
              delete dataObj.orig
              // Push object into items array //
              items.push(dataObj)
            }
          })
          .on('error', e => {
            console.log(e)
          })
          .on('end', () => {
            // Resolve promise for async getRoutes request //
            // posts = items for below routes //
            resolve(items)
          })
      } else {
        // If src/posts directory doesn't exist, return items as empty array //
        resolve(items)
      }
    })
  return getFiles()
}

export default {
  entry: path.join(__dirname, 'src/index.tsx'),
  getSiteData: () => ({
    title: 'React Static with Netlify CMS',
  }),
  getRoutes: async () => {
    const posts = await getPosts()
    return [
      {
        path: '/',
        component: 'src/pages/Home',
      },
      {
        path: '/about',
        component: 'src/pages/About',
      },
      {
        path: '/blog',
        getData: () => ({
          posts,
        }),
        children: posts.map(post => ({
          path: `/post/${post.data.slug}`,
          component: 'src/pages/Post',
          getData: () => ({
            post,
          }),
        })),
      },
      {
        is404: true,
        component: 'src/pages/404',
      },
    ]
  },

  webpack: (config, { defaultLoaders }) => {
    // Add .ts and .tsx extension to resolver
    config.resolve.extensions.push('.ts', '.tsx')

    // Add TypeScript Path Mappings (from tsconfig via webpack.config.js)
    // to react-statics alias resolution
    config.resolve.alias = typescriptWebpackPaths.resolve.alias

    config.plugins.push(new ExtractTextPlugin("styles.css"))

    // We replace the existing JS rule with one, that allows us to use
    // both TypeScript and JavaScript interchangeably
    config.module.rules = [
      {
        oneOf: [
          {
            test: /\.(js|jsx|ts|tsx)$/,
            exclude: defaultLoaders.jsLoader.exclude, // as std jsLoader exclude
            use: [
              {
                loader: 'babel-loader',
              },
              {
                loader: require.resolve('ts-loader'),
                options: {
                  compilerOptions: {
                    "allowJs": true,
                    jsx: 'preserve',
                    noEmit: false,
                  },
                  transpileOnly: true,
                },
              },
            ],
          },
          defaultLoaders.cssLoader,
          defaultLoaders.fileLoader,
        ],
      },
    ]
    console.log('webpack', config)
    return config
  },
}
