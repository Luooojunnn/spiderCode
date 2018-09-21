let http = require('http');
let colors = require('colors');
let fs = require('fs');
let cheerio = require('cheerio');

const INIT = {
    pagePath: '/02/Vol_001/index_0.html',
    mounts: 100000
}

if(process.argv.length !== 2) {
    let begin, mounts;
    process.argv.forEach(item => {
        if (item.includes('begin')) {
            begin = item.split('=')[1]
        }
        if (item.includes('mounts')) {
            mounts = item.split('=')[1]
        }
    })
    INIT.pagePath = begin ? String(begin) :  INIT.pagePath;
    INIT.mounts = mounts ? Number(mounts) :  INIT.mounts;
}

// 初始页信息
let pageInfo = {
    hostname: 'manhua.fzdm.com',
    path: INIT.pagePath
}

// 初始图片信息
let imgInfo = {
    hostname: 'p0.xiaoshidi.net',
    path: ``
}

/**
 * 请求当前页面信息
 * @param {Object} pageInfo - 初始页信息
 * @param {string} pageInfo.hostname - 页域名地址
 * @param {string} pageInfo.path - 路径
*/
let getPageInfo = (address) => {
    let client = http.request({
        hostname: address.hostname,
        path: address.path
    }, (res) => {
        let contents = '';
        res.on('data', (callbackData) => {
            console.log('=======响应开始'.red);
            contents += callbackData;
        })
        res.on('end', () => {
            let $ = cheerio.load(contents);
            let sContentsInfo = (/<script type="text\/javascript">(.+?Title.+?)<\/script>/).exec(contents)[1];
            // 获取当页图片的地址
            let mhurl = (/mhurl="(.+?)\.jpg\"/).exec(sContentsInfo);
            imgInfo.path = '/' + mhurl[1] + '.jpg'; console.log(imgInfo.path)
            lineDetail(imgInfo.path)

            // 获取下一页地址
            let nextPage = $('.navigation').children().last().prop('href');
            pageInfo.path = `/${(/Clid="(.+?)\"/).exec(sContentsInfo)[1]}\/${(/Url="(.+?)\"/).exec(sContentsInfo)[1]}/${nextPage}`; console.log(pageInfo.path)

            // 图片名字生成
            let imgName = mhurl[1].replace(/\//g,'_').replace(/\d+\_/,'').replace(/[a-zA-Z]+/,'');
            console.log(imgName.cyan);

            // 保存图片
            downloadImg(imgInfo, imgName)
            console.log('=======响应结束'.red);
        })
    })
    client.end();
    client.on('error', (err) => {
        console.log(err);
    })
}

/**
 * @description 图片质量线路检测切换（from source code）
 * @param {string} mhurl - 图片地址
 * @param {string} mhurl - 线路
 * @returns {string} 返回优质图片地址
*/
function lineDetail(mhurl, mhss = 'p1.xiaoshidi.net') {
    let mhpicurl = '';
    if (mhurl.indexOf("2015") != -1 || mhurl.indexOf("2016") != -1 || mhurl.indexOf("2017") != -1 || mhurl.indexOf("2018") != -1) {

    } else {
        mhss = mhss.replace(/p1/, "p0").replace(/p2/, "p0").replace(/p07/, "p17")
    }
    mhpicurl = mhss + "" + mhurl;
    if (mhurl.indexOf("http") != -1) { 
        fs.writeFile(`./one-piece/${mhurl.split('://')[1]}.text`, `${mhurl}下的图片无法抓取，请手动查看吧~`, (err) => {
            console.log(err);
        })
        mhpicurl = 'p17.xiaoshidi.net/2/Vol_001/001aa.jpg'
    }
    return mhpicurl;
}

/**
 *  @desc  下载图片并保存 
 *  @param { any } info  图片地址信息
 *  @param { string } name  图片保存的名字
*/
function downloadImg(info, name) {
    let client = http.request({
        hostname: info.hostname,
        path: info.path
    },(res) => {
        res.setEncoding('binary');
        let contents = '';

        res.on('data', (backData) => {
            contents += backData;
        })

        res.on('end', () => {
            // 没有 one-piece 文件夹则新建一个
            fs.access('./one-piece', (err) => {
                if(err) fs.mkdirSync('./one-piece');

                fs.writeFile(`./one-piece/${name}.jpg`, contents, 'binary', (err) => {
                    if(err) throw err;
                    console.log('图片已保存'.green);
                })
            })
            
        })
    })
    client.end();
    client.on('error', (e) => {
        console.log(e)
    })
}

// 执行爬虫
let i = 1;
let t = setInterval(() => {
    if (i >= INIT.mounts) clearInterval(t);
    getPageInfo(pageInfo);
    i++;
},1300)