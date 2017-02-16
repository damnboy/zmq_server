# Cloud Device Controller(CDC)

Cloud device controller, 远程设备控制器，可控制安卓及iOS设备(未完成)。此代码参照openstf编写。

注意: 

此文档描述的内容仅限于macOS及CentOS。macOS使用MacPorts作为包管理工具。

# 项目结构

代码分为app及web两部分，其中：

- app为控制器的后台
- web为前端
- submodules中包含openstf的源代码，用于参考

# 工具及框架依赖

控制器的前后端均使用node.js编写。其中前端使用AngularJS编写，后端使用zeroMQ作为网络异步框架。

## 安装zeroMQ

    port install zmq3

## 安装node, npm, zmq, webpack, http-server及bower

    port install node6
    port install npm4

    npm install -g bower            # 前端依赖工具
    npm install -g zmq              # 安装zeroMQ
    npm install -g http-server      # 执行后端Web服务
    npm install -g webpack          # 用来打包前端文件

若提示权限不足，请使用sudo。

## 安装后端依赖

进入app目录，执行：

    npm install

## 安装前端依赖

进入web目录，执行：

    bower install

# CentOS环境准备注意事项

## zeromq安装

向/etc/yum.repos.d添加zeromq.repo文件，文件内容如下

    [home_fengshuo_zeromq]
    name=The latest stable of zeromq builds (CentOS_CentOS-6)
    type=rpm-md
    baseurl=http://download.opensuse.org/repositories/home:/fengshuo:/zeromq/CentOS_CentOS-6/
    gpgcheck=1
    gpgkey=http://download.opensuse.org/repositories/home:/fengshuo:/zeromq/CentOS_CentOS-6/repodata/repomd.xml.key
    enabled=1

然后更新yum缓存

    yum clean & yum upgrade

## 安装zeromq-dev

由于node4.0升级了v8引擎,编译时需要gcc4.8以上版本。CentOS release 6.5 (Final) 自带的gcc为gcc-4.4.7,不支持编译所需的C++11标准,所以只好升级gcc(devtoolsset-3 -> gcc-4.9)（直接升级到最新）。手工下载gcc4.9以上版本，ln -s 到原g++目录下编译即可

## 安装protocolbuf-dev

    wget https://forensics.cert.org/cert-forensics-tools-release-el6.rpm
    rpm -Uvh cert-forensics-tools-release*rpm
    yum --enablerepo=forensics install protobuf-devel

成功之后查看程序安装路径 

    rpm -ql `rpm -qa httpd`

# 运行

目前后端中使用到了openstf中的procutil.js，所以需要在submodules中添加stf添加，方便app中的index.js引用。使用git submodule功能添加openstf代码：

    git submodule add https://github.com/openstf/stf.git ./submodules/stf
    cd submodules/stf
    git submodule init
    git submodule update

openstf代码非常大，若网络慢可工在github上下载解压至stf文件夹中。注意，openstf项目也是使用node.js编写的，下载回来后记得在源代码目录中执行

    npm install

安装所需要的依赖。

## 启动后端服务

现在可以启动后端，进入项目根目录执行命令：

    node ./app

成功执行后可以看到正在监听端口的日志：

    INF/util:procutil 11750 [*] Forking "./cli triproxy  --description TRIPROXY FOR DEVICES --bind-pub tcp://127.0.0.1:7114 --bind-pull tcp://127.0.0.1:7116 --bind-dealer tcp://127.0.0.1:7115"
    INF/util:procutil 11750 [*] Forking "./cli triproxy  --description TRIPROXY FOR APP --bind-pub tcp://127.0.0.1:7111 --bind-pull tcp://127.0.0.1:7113 --bind-dealer tcp://127.0.0.1:7112"
    INF/util:procutil 11750 [*] Forking "./cli servicemanager  --connect-dev-dealer tcp://127.0.0.1:7115 --connect-app-dealer tcp://127.0.0.1:7112"
    INF/util:procutil 11750 [*] Forking "./cli websocketserver --port 7110 --connect-push tcp://127.0.0.1:7113 --connect-sub tcp://127.0.0.1:7111"
    INF/util:procutil 11750 [*] Forking "./cli devicemanager devicemanager --interface en0 --connect-push tcp://127.0.0.1:7116 --connect-sub tcp://127.0.0.1:7114"
    INF/[TRIPROXY FOR APP] 11752 [TRIPROXY FOR APP] PUB socket bound on tcp://127.0.0.1:7111
    INF/[TRIPROXY FOR APP] 11752 [TRIPROXY FOR APP] DEALER socket bound on tcp://127.0.0.1:7112
    INF/[TRIPROXY FOR APP] 11752 [TRIPROXY FOR APP] PULL socket bound on tcp://127.0.0.1:7113
    INF/[TRIPROXY FOR DEVICES] 11751 [TRIPROXY FOR DEVICES] PUB socket bound on tcp://127.0.0.1:7114
    INF/[TRIPROXY FOR DEVICES] 11751 [TRIPROXY FOR DEVICES] DEALER socket bound on tcp://127.0.0.1:7115
    INF/[TRIPROXY FOR DEVICES] 11751 [TRIPROXY FOR DEVICES] PULL socket bound on tcp://127.0.0.1:7116
    INF/[devicemanager] 11755 [*] Pushing output to "tcp://127.0.0.1:7116"
    INF/[devicemanager] 11755 [*] Subscribing input from "tcp://127.0.0.1:7114"
    INF/[devicemanager] 11755 [*] Avaliable port range: 7400~7700
    INF/[devicemanager] 11755 [*] Try Detecting inet address on en0
    INF/[devicemanager] 11755 [*] start tracking devices tcp://10.0.0.140:10000
    INF/[SERVICE MANAGER] 11753 [*] App dealer connected to "tcp://127.0.0.1:7112"
    INF/[SERVICE MANAGER] 11753 [*] Device dealer connected to "tcp://127.0.0.1:7115"
    INF/[WEBSOCKET SERVER] 11754 [*] Pushing output to "tcp://127.0.0.1:7113"
    INF/[WEBSOCKET SERVER] 11754 [*] Subscribing input from "tcp://127.0.0.1:7111"
    INF/[WEBSOCKET SERVER] 11754 [*] Starting Websocket Server Port: 7110

## 启动前端服务

现在要使用之前安装的webpack来打包前端代码，webpack时需要注意是否存在oboe错误。如果报错，将./web/bower_components/oboe/index.js文件中的`var oboe = require('./dist/oboe-node');`替换为`var oboe = require('./dist/oboe-browser');`

现在需要安装后端所需要的依赖，进入到web目录，并用webpack打包：

    npm install
    bower install
    webpack

执行bower的时候会涉及到安装angular.js，此过程可能较长，请耐心等待。然后执行

    http-server . -p 1080

即可启动前端服务。