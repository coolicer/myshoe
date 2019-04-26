require('dotenv').config()
const path = require('path');
const fs = require('fs');
const Koa = require('koa');
const Router = require('koa-router');
const app = new Koa();
const router = new Router();
const payjs = require('./pay');
const nunjucks = require('nunjucks');
const views = require('koa-views');
const serve = require('koa-static');
const bodyParser = require('koa-bodyparser');
const PORT = 3000;

const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(path.join(__dirname, './views'))
);

env.addFilter('shorten', (str, count) => {
  return str.slice(0, count || 10)
});

app.use(serve('./static'));
app.use(bodyParser());
app.use(
  views(path.join(__dirname, './views'), {
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

router.get('/pay', async (ctx) => {
  return payjs.native({
    total_fee: 1,
    out_trade_no: Date.now(),
    mchid: process.env.MCHID,
    notify_url: 'http://wx.coolicer.com/wxcallback'
  }).then( res => {
    if (res.return_code === 1) {
      return ctx.render('demo', {
        url: res.qrcode
      })
    } else {
      // fail
      console.log(res)
    }
  });
})

router.post('/wxcallback', (ctx) => {
  const body = ctx.request.body
  const params = {
    total_fee: body.total_fee,
    out_trade_no: body.out_trade_no,
    sign: body.sign,
    mchid: body.mchid,
    notify_url: 'http://wx.coolicer.com/wxcallback'
  }
  const Paid = payjs.notifyCheck(params);
  
  if (!Paid) {
    ctx.set('Content-Type', 'application/json');
    return ctx.body = 'fail';
  }
  if (body.return_code === 1) {
    fs.writeFileSync('./log', JSON.stringify(params), {flag: 'a'});
    ctx.set('Content-Type', 'application/json');
    return ctx.body = 'success'
  }
})

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`server start at http://127.0.0.1:${PORT}`);
});
