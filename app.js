const {
	Wechaty,
	MediaMessage,
	Room
} = require('wechaty')
const Webot = Wechaty.instance()
const request = require('request');

const WEBOT_CONFIG = require('./webot.config')
const FT_PUSH_CONFIG = WEBOT_CONFIG.ft_config
const FT_PUSH_API = 'https://sc.ftqq.com/' + FT_PUSH_CONFIG.token + '.send'
const GOOGLE_CONFIG = WEBOT_CONFIG.google_config
const GOOGLE_API = GOOGLE_CONFIG.url

let FT_PUSH = (text, desp) => {
	request
		.get(FT_PUSH_API + '?text=' + text + '&desp=' + desp)
		.on('response', function(response) {
			console.log(response.statusCode) // 200
		})
}

// 判断关键字是否在当前string中
let isIndexOf = (element, index, array, string) => {
	return (string.indexOf(key) > -1);
}

let isMatchedKey = (keys, string) => {
	return keys.every(function(item) {
		if (string.indexOf(item) > -1) {
			return true
		}
	})
}



Webot.on('login', user => {
		console.log(`User ${user} logined`)
	})
	.on('logout', user => {
		log.info('Bot', `${user.name()} logouted`)
		FT_PUSH(encodeURIComponent('[WEBOT]下线'), 'Webot下线了,请检查')
	})
	.on('scan', (url, code) => {
		// 登录逻辑
		console.log(`Scan QR Code to login: ${code}\n${url}`);
		let loginUrl = url.replace(/\/qrcode\//, '/l/')
		require('qrcode-terminal').generate(loginUrl)
		FT_PUSH(encodeURIComponent('[WEBOT]登录'), '![](' + url + ')')
	})
	.on('message', async (message) => {
		const contact = message.from()
		const content = message.content()
		const room = message.room()
		if (message.self()) {
			return
		}
		if (room) {
			console.log(`Room: ${room.topic()} Contact: ${contact.name()} Content: ${content}`)
		} else {
			console.log(`Contact: ${contact.name()} Content: ${content}`)
		}
		if (/罗磊帮我找找/.test(content)) {
			let originalSearchKey = content.split('罗磊帮我找找')[1];
			if (originalSearchKey.length == 0) {
				message.say('你不告诉我找什么,那我找什么？');
				return;
			}
			let searchKey = encodeURIComponent(content.split('罗磊帮我找找')[1]);
			request(GOOGLE_API + searchKey, function(error, response, body) {
				if (error) {
					message.say('抱歉,我好像没写过你说的 ' + originalSearchKey + ',要不你换一个其他关键字再试试?')
					return;
				}
				console.log(body);

				let gResult = JSON.parse(body);
				let resultNum = gResult.queries.request[0].totalResults;

				if (resultNum == 0) {
					message.say('抱歉,我好像没写过你说的 ' + originalSearchKey + ',要不你换一个其他关键字再试试?')
					return;
				}
				let resultItems = [];
				let replyMsg = '你好,' + contact.name() + '\n我是罗磊的AI助理罗小磊[奸笑]\n';
				replyMsg += '我找到有关「' + originalSearchKey + '」的' + resultNum + '条记录\n'
				replyMsg += '希望下面的文章对你有帮助:\n'
				Object.keys(gResult.items).forEach(function(i) {
					let item = gResult.items[i];
					let num = parseFloat(i) + 1;
					replyMsg += (num + '. ' + item.title + '\n' + item.link + '\n')
				})
				message.say(replyMsg)
			});
		}

		if (isMatchedKey(['罗磊', '笑话'], content)) {
			request('http://v.juhe.cn/joke/randJoke.php?key=7542e2d37dd6110704d21acae916afa8', function(error, response, body) {
				body = JSON.parse(body);
				message.say(body.result[0].content)
			});
		}
		if (isMatchedKey(['罗磊', '喜欢', '谁'], content) || isMatchedKey(['罗磊', '爱', '谁'], content)) {
			message.say('当然是@杨杨左左 呀😊')
		}
		if (isMatchedKey(['罗磊', '出来'], content) || isMatchedKey(['罗磊', '在吗'], content)) {
			message.say('嗯？找我有什么事吗?')
		}
		if (content === '加群') {
			let keyroom = await Room.find({
				topic: '左罗·旅行·摄影·交流'
			})
			if (keyroom) {
				await keyroom.add(contact)
				if (!room) {
					message.say('【入群须知】\n左罗交流群已经建立快一年，群内一直以来稳定和持续的交流氛围，依靠的是大家对规则的尊重。\n我没有那么严格的规定，只要不涉及敏感词和低俗，基本上我都不会阻拦。重新说明下简单规则 \n1.不许发红包（除了我） \n2.不许发广告（包含各种形式红包、返利、邀请等） \n3.鼓励原创分享（文章、图片、视频）\n4.分享外链尽量是摄影、旅行主题（毕竟我们群名在这里） 😊')
				}
			}
		}
	})
	.on('friend', async (contact, request) => {
		if (request) {
			if (/微博|左罗|ZUOLUOTV/i.test(request.hello)) {
				logMsg = 'accepted because verify messsage is "ZUOLUOTV"'
				request.accept();
				// request.send('你好,我是罗磊的AI助理罗小磊\n 很高兴认识你,直接回复我关键字「加群」,我会自动拉你进入我们的左罗粉丝群\n')
			} else {
				logMsg = 'not auto accepted, because verify message is: ' + request.hello
			}

		} else {
			logMsg = 'friend ship confirmed with ' + contact.get('name')
		}
	})
	.start()