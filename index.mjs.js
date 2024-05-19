{
  "type":"module"
}
import express, { Servestatic, json, urlencoded } from 'express'
import { generate } from 'shortid'
import { BadRequest, NotFound } from 'http-errors'
import { connect } from 'mongoose'
import { join } from 'path'
import ShortUrl, { findOne } from './models/url.model'

const app = express()
app.use(Servestatic(join(__dirname, 'public')))
app.use(json())
app.use(urlencoded({ extended: false }))

connect('mongodb://localhost:27017', {
    dbName: 'url-shortner',
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log('mongoose connected 💾'))
  .catch((error) => console.log('Error connecting..'))

app.set('view engine', 'ejs')

app.get('/', async (req, res, next) => {
  res.render('index')
})

app.post('/', async (req, res, next) => {
  try {
    const { url } = req.body
    if (!url) {
      throw BadRequest('Provide a valid url')
    }
    const urlExists = await findOne({ url })
    if (urlExists) {
      res.render('index', {
        // short_url: `${req.hostname}/${urlExists.shortId}`,
        short_url: `${req.headers.host}/${urlExists.shortId}`,
      })
      return
    }
    const shortUrl = new ShortUrl({ url: url, shortId: generate() })
    const result = await shortUrl.save()
    res.render('index', {
      // short_url: `${req.hostname}/${urlExists.shortId}`,
      short_url: `${req.headers.host}/${result.shortId}`,
    })
  } catch (error) {
    next(error)
  }
})

app.get('/:shortId', async (req, res, next) => {
  try {
    const { shortId } = req.params
    const result = await findOne({ shortId })
    if (!result) {
      throw NotFound('Short url does not exist')
    }
    res.redirect(result.url)
  } catch (error) {
    next(error)
  }
})

app.use((req, res, next) => {
  next(NotFound())
})

app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.render('index', { error: err.message })
})

app.listen(3000, () => console.log('🌏 on port 3000...'))