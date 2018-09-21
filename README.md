# spiderCode
1. spiderOnePiece.js
     
     usage:
      - 安装node，启动node环境
      - 下载 spiderOnePiece.js 到本地指定目录
      - 打开 http://manhua.fzdm.com/ ，选择感兴趣的漫画，点击进入如海贼王第一卷：http://manhua.fzdm.com/2/Vol_001/ ，复制路径 " /2/Vol_001/ " 
      - node spiderOnePiece.js begin=/2/Vol_001/ mounts=100
      
      ***注意：begin和mounts均为可选输入项，当都不输入时，默认爬海贼王第一卷开始到最后，当输入begin和mounts时，爬取制定漫画和指定爬取多少张漫画***

2. proxy-change-serve.js

    desc：这是一个可以在前端项目中切换接口（数据源）的代理node服务器，可以使用本地mock数据，可以使用线上数据，具体用法已在代码中标注，如有不懂请留言询问

      
      
      
# 注意！！！
  
  请勿将本爬虫用于商业行为，请遵纪守法
