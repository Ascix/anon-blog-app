const http = require('http')
const express = require('express')
const es6Renderer = require('express-es6-template-engine')
const pgPromise = require('pg-promise')()
const bodyParser = require('body-parser')

const port = 3000
const hostname = 'localhost'
const config = {
    host: 'localhost',
    port: 5432,
    database: 'bloganon',
    user: 'postgres',
}

const app = express()
const server = http.createServer(app)
const db = pgPromise(config)

app.engine('html', es6Renderer)
app.set('views', 'templates')
app.set('view engine', 'html')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.render('layout', {
      partials: {
        body: 'partials/home'
      },
      locals: {
        title: 'Anonymous Blog App'
      }
    })
  })

app.get('/blogs', (req, res) => {
  db.query('SELECT * FROM posts;')
    .then((results) => {
      res.render('layout', {
        partials: {
          body: 'partials/blog-list'
        },
        locals: {
          title: 'Blog Posts',
          posts: results
        }
      })
    })
})

app.get('/blogs/:id', (req, res) => {
  const id = req.params.id
  db.oneOrNone('SELECT * FROM posts WHERE id = $1', [id])
    .then(post => {
      if (!post) {
        res.status(404).json({ error: 'post not found' })
        return
      }
      res.render('layout', {
        partials: {
          body: 'partials/blog-post'
        },
        locals: {
          title: post.title,
          post
        }
      })
    })
    .catch((e) => {
      console.log(e)
      res.status(400).json({ error: 'invalid id' })
    })
})

app.get('/posts/new', (req, res) => {
  res.render('layout', {
    partials: {
      body: 'partials/blog-form'
    },
    locals: {
      title: 'Add new post'
    }
  })
})

app.post('/posts/new', (req, res) => {
  const title = req.body.title
  const text = req.body.text
  const date = new Date().toISOString().slice(0, 10)
  db.query('INSERT INTO posts VALUES (DEFAULT, $1, $2, $3)', [title, text, date])
    .then(() => {
      res.send('post created')
    })
    .catch((e) => {
      console.log(e)
      res.send('nope!')
    })
})



app.get('*', (req, res) => {
  res.status(404).send('404 Not Found')
})



server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}`)
})