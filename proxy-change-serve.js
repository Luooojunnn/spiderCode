/**
 * @author luojun <https://github.com/Luooojunnn>
 * @desc 本中间服务器可以切换数据源，如需二次改造，请github上提问
*/
const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs')
const colors = require('colors')

/**
 * 环境判断
*/
const ENV = process.argv[2] && process.argv[2].split('=')[1]

http.createServer((req, res) => {
  try {
    /**
     * 将读取api文件写在服务程序内，实现动态更新
     * 遇到一个坑，就是node跑在gw根目录导致这里读取文件采用相对路径就会读不到东西
    */
    let apiFile = JSON.parse(fs.readFileSync(`${path.join(__dirname, '../../data/apiManage.json')}`))
    if (url.parse(req.url).pathname !== '/favicon.ico') {
      // 判断请求方式，请求参数
      let reqMethod = req.method === 'GET' ? 'GET' : (req.method === 'POST' ? 'POST' : req.method)

      // 寻址回值
      if (apiFile[url.parse(req.url, true).pathname.substring(1)]) {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Allow', '*')
        res.setHeader('Access-Control-Allow-Headers', '*')

        if (reqMethod === 'OPTIONS') {
          res.end('')
        }
        // 根据环境变量选择接口
        let apiAdress = apiFile[url.parse(req.url, true).pathname.substring(1)][ENV]
        // TODO 根据环境判断是够需要一个代理转发
        if (ENV === 'dev') {
          console.log('在dev环境'.red)
          // 保存请求参数，用于转发
          let paramsData = ''
          if (reqMethod === 'GET') {
            paramsData = url.parse(req.url, true).search
          } else if (reqMethod === 'POST') {
            let res = ''
            req.on('data', (reqData) => {
              res += reqData
            })
            req.on('end', (reqData) => {
              paramsData = res
              console.log(paramsData)
            })
          }
          console.log(`接口名 ${url.parse(req.url, true).pathname}，采用 ${reqMethod} 请求方式，传递的参数是 ${paramsData}`)

          let finalAddress = path.join(__dirname, '../../data/', apiAdress)
          // dev环境 - 读取接口，输出json
          let apiData = fs.readFileSync(finalAddress)
          res.end(apiData.toString('utf8'))
        } else {
          console.log('在测试环境'.red)
          // online环境 - 代理转发 PS: hostname 不含协议
          let hn = url.parse(apiAdress).hostname
          let pt = url.parse(apiAdress).path
          req.headers.host = hn //url.parse(apiAdress).host
          let sRes = res
          if (reqMethod === 'GET') {
            if (url.parse(req.url, true).search) {
              pt = '' + pt + url.parse(req.url, true).search
            }
            console.log(`接口名 ${url.parse(req.url, true).pathname}，采用 ${reqMethod} 请求方式，传递的参数是 ${url.parse(req.url, true).search}`)
            HCLIENTFC({
              hostname: hn + '',
              path: pt + '',
              method: reqMethod + '',
              headers: req.headers
            }, (data, statusCode, header) => {
              sRes.writeHead(Number(statusCode), header)
              sRes.end(data)
            }, '')
          } else if (reqMethod === 'POST') {
            let res = ''
            req.on('data', (reqData) => {
              res += reqData
            })
            req.on('end', (reqData) => {
              console.log(`接口名 ${url.parse(req.url, true).pathname}，采用 ${reqMethod} 请求方式，传递的参数是 ${res}`)
              /**
               * 将 host 头部信息改成online的域名信息，否则host会指向代码里的请求的localhost:9000
               * !!! 为什么一定要用 header ，因为可以在做爬虫的时候，冒充浏览器端，越过有些代码的机器人识别
               * */
              HCLIENTFC({
                hostname: hn + '',
                path: pt + '',
                method: reqMethod + '',
                headers: req.headers
              }, (data, statusCode, header) => {
                sRes.writeHead(Number(statusCode), header)
                sRes.end(data)
              }, res)
            })
          }
        }
      } else {
        res.writeHead(404)
        res.end('')
      }
    }
  } catch (e) {
    res.end('接口解析出现了一些错误...')
    throw new Error(e)
  }
}).listen(9000, 'localhost', () => {
  console.log('接口服务启动在localhost:9000')
})

/**
 * online服务器
 * @param {Object} obj - 需要参入的配置参数
 * @param {string} obj.hostname - 目标地址ip或域名
 * @param {string} obj.path - 请求路径 （这里忘写导致出问题）
 * @param {string} obj.method - 请求方法
 * @param {Object} obj.headers - 请求头
 * @param {function} callback - 回调
 * @param {string} params - 转发参数
*/
function HCLIENTFC ({ hostname, path = '/', method = 'GET', headers }, callback = () => { }, v = '') {
  let resData = ''
  console.log('接口的信息参数：========1'.blue)
  console.log('hostname:' + hostname)
  console.log('path:' + path)
  console.log('method:' + method)
  console.log(headers)
  console.log('post发送的数据v:' + v)
  console.log('接口的信息参数：--------2'.blue)
  /**
   * 由于发送了header，其accept接受的数据类型可能和返回的数据类型不一致，所以可能导致接口超时，必要时，可去掉发送header
  */
  const HCLIENT = http.request({
    hostname,
    path,
    method,
    headers
  }, (res) => {
    res.setEncoding('utf8')
    res.on('data', (chunk) => {
      resData += chunk
    })
    res.on('end', () => {
      console.log('接口返回结果是：', resData.toString())
      console.log('测试环境返回状态码：', res.statusCode)
      console.log('测试环境返回响应头：', res.headers)
      callback(resData, res.statusCode, res.headers)
    })
  })
  HCLIENT.on('error', (e) => {
    console.log('出现错误，错误信息为：' + e)
    return resData
  })
  HCLIENT.write(v)
  HCLIENT.end()
}
