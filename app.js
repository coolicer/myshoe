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
const bodyParser = require('koa-bodyparser');
app.use(serve('./static'));
const PORT = 3000;
const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(path.join(__dirname, './views'))
);

env.addFilter('shorten', (str, count) => {
  return str.slice(0, count || 10)
});
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
    attach: "自定义数据",
    body: "订单标题",
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

  // var res = { 
  //   code_url: 'weixin://wxpay/bizpayurl?pr=K97Iklq',
  //   out_trade_no: 1555935780086,
  //   payjs_order_id: '2019042220230000352034219',
  //   qrcode: 'https://payjs.cn/qrcode/d2VpeGluOi8vd3hwYXkvYml6cGF5dXJsP3ByPUs5N0lrbHE=',
  //   return_code: 1,
  //   return_msg: 'SUCCESS',
  //   total_fee: 1,
  //   sign: '080CC02DC83044E81EF9CB5B22C17CF9' 
  // };
})

router.post('/wxcallback', (ctx) => {
  const body = ctx.request.body
  if (body.return_code === 1) {
    return ctx.body = 'success'
  }
})

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`server start at http://127.0.0.1:${PORT}`);
});