/**
 * 模块依赖
 */

var net = require('net');

/**
 * 共享状态的并发：
 * 追踪连接数
 * 用户昵称
 */
var count = 0,
	users = {};

/**
 * 异步创建服务器
 * 回调函数接收的conn对象是一个Stream实例，是net.Stream，可读也可写
 * 每当新建一个客户端连接，回调函数就会接收代表这个客户端的conn对象。通过conn.write可以在该客户端上展示数据
 */
var server = net.createServer(function(conn){ 

	/**
	 * 抽象出向（除自己之外的其他）所有客户端广播的功能函数
	 */
	function broadcast(msg, exceptMyself){ //第二个参数指明是否需要除自己之外
		for(var i in users){
			if(!exceptMyself || i != nickname){
				users[i].write(msg);
			}
		}
	}


	// handle connection
	console.log('\033[90m 	new connection!\033[39m');
	conn.write(
		'\n > welcome to \033[92mnode-chat\033[39m!'
	  + '\n > ' + count + ' other people are connected at this time.'
	  + '\n > please write your name and press enter: '
	);
	count++;

	var nickname;

	/**
	 * 接收并处理客户端发送的数据。net.Stream也是一个Event Emitter
	 */
	conn.on('data', function(data){
		//删除回车符
		data = data.replace('\r\n', '');

		if(!nickname){ //如果是接收到的第一份数据，应当是用户输入的昵称
			if(users[data]){
				conn.write('\033[93m> nickname already in use. Try again: \033[39m ');
				return;
			}else{ //如果昵称没有被占用，则通知其所有客户端当前用户已经连接进来了
				nickname = data;
				users[nickname] = conn;

				broadcast('\033[90m > ' + nickname + ' joined the room\033[39m\n');
			}
		}else{  //如果不是该客户端第一次发数据，则认为是聊天数据，发送给除自己以外的其他客户端
			broadcast('\033[96m > ' + nickname + ':\033[39m ' + data + '\n', true);
		}

		console.log(data);
	});

	/**
	 * 关于end事件和close事件：
	 * 当客户端关闭TCP连接时触发end事件，会发送一个名为“FIN”的包给服务器；
	 * 当连接发生错误时，触发error事件，不会发送“FIN”包，end事件不会触发。
	 * 在上述两种情况下，都会触发close事件，所以这里选择绑定close事件
	 */
	conn.on('close', function(){
		count--;
		delete users[nickname];
		broadcast('\033[90m > ' + nickname + ' left the room\033[39m\n');
	});

	conn.setEncoding('utf8'); //如果不设置编码格式utf8，服务器会接收到字节形式的Buffer对象
});

/**
 * 异步监听3000端口
 */
server.listen(3000, function(){
	console.log('\033[96m 	server listening on *: 3000\033[39m');
});