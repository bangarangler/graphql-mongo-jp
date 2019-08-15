require('dotenv').config()

const path = require('path')
const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const graphqlhttp = require('express-graphql')

const schema = require('./graphql/schema')
const resolver = require('./graphql/resolvers')
const auth = require('./middleware/auth.js')

const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const url = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PW}@gql-mongo-jp-qqihx.mongodb.net/test`


const app = express()

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
)

app.use(helmet())
app.use(compression())
app.use(morgan('combined', { stream: accessLogStream }))

app.use(bodyParser.json())

app.use((req, res, next) => {
  res.setHeader(`Access-Control-Allow-Origin`, `*`)
  res.setHeader(
    `Access-Control-Allow-Methods`,
    `OPTIONS, GET, POST, PUT, PATCH, DELETE`
  )
  res.setHeader(`Access-Control-Allow-Headers`, `Content-Type, Authorization`)
  if (req.method === `OPTION`) {
    return res.sendStatus(200)
  }
  next()
})

app.use(auth);

app.use(
  '/graphql',
  graphqlhttp({
    schema,
    rootValue: resolver,
    graphiql: true,
    customFormatErrorFn(err) {
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const message = err.message || 'An error occured.';
      const code = err.originalError.code || 500;
      return {
        message: message,
        status: code,
        data: data
      }
    }
  })
)

app.use((error, req, res, next) => {
  console.log('error: ', error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data })
})

mongoose.connect(url, { useNewUrlParser: true }).then(result => {
  app.listen(process.env.PORT || 8080)
}).catch(err => console.log('err: ', err))
