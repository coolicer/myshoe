require('dotenv').config()
const path = require('path');
const Koa = require('koa');
const Router = require('koa-router');
const app = new Koa();
const router = new Router();
const payjs = require('./pay');
const nunjucks = require('nunjucks');
const views = require('koa-views');
const serve = require('koa-static');
app.use(serve('./static'));
const PORT = 3000;
const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(path.join(__dirname, 'views'))
);

env.addFilter('shorten', (str, count) => {
  return str.slice(0, count || 10)
});
app.use(
  views(path.join(__dirname, 'views'), {
    options: {
      nunjucksEnv: env
    },
    map: {html: 'nunjucks'}
  })
);

router.get('/', (ctx, next) => {
  return ctx.render('demo', {
    message: 'this is a long message'
  })
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`server start at http://127.0.0.1:${PORT}`);
});