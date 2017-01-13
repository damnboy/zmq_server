# ZMQ Server

An android remote controller. 

Note: The deployment description is based on CentOS!!!

# 后端服务

- zeromq安装

向/etc/yum.repos.d添加zeromq.repo文件，文件内容如下

    [home_fengshuo_zeromq]
    name=The latest stable of zeromq builds (CentOS_CentOS-6)
    type=rpm-md
    baseurl=http://download.opensuse.org/repositories/home:/fengshuo:/zeromq/CentOS_CentOS-6/
    gpgcheck=1
    gpgkey=http://download.opensuse.org/repositories/home:/fengshuo:/zeromq/CentOS_CentOS-6/repodata/repomd.xml.key
    enabled=1

- 更新yum缓存


    yum clean & yum upgrade


- 安装zeromq-dev

注意：由于node4.0升级了v8引擎,编译时需要gcc4.8以上版本。CentOS release 6.5 (Final) 自带的gcc为gcc-4.4.7,不支持编译所需的C++11标准,所以只好升级gcc(devtoolsset-3 -> gcc-4.9)（直接升级到最新）。手工下载gcc4.9以上版本，ln -s 到原g++目录下编译即可


- 安装protocolbuf-dev


    wget https://forensics.cert.org/cert-forensics-tools-release-el6.rpm
    rpm -Uvh cert-forensics-tools-release*rpm
    yum --enablerepo=forensics install protobuf-devel


成功之后查看程序安装路径 

    rpm -ql `rpm -qa httpd`
    
- 启动


    node ./app


# 前端服务

- 基础依赖安装

    # 用来安装前端依赖
    npm install bower -g   
    # 用来打包前端文件
    npm install webpack -g
    # 用来启动web服务    
    npm install http-server -g

- 安装前端依赖

    bower install

- webpack

webpack时需要注意是否存在oboe错误，如果报错，将./web/bower_components/oboe/index.js文件中的

    var oboe = require('./dist/oboe-node');

替换为

    var oboe = require('./dist/oboe-browser');

httpserver ./web -p 1080

