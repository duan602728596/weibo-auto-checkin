const request = require('request');

/* 配置账号密码 */
const USERNAME = '';
const PASSWORD = '';

/* 登录 */
function login(username, password){
  return new Promise((resolve, reject)=>{
    request({
      uri: 'https://passport.weibo.cn/sso/login',
      method: 'POST',
      headers: {
        Referer: 'https://passport.weibo.cn/signin/login?entry=mweibo&r=http%3A%2F%2Fm.weibo.cn',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `username=${ username }&password=${ password }`
    }, (err, res, body)=>{
      if(err){
        reject(err);
      }else{
        resolve(res.headers['set-cookie']);
      }
    });
  }).catch((err)=>{
    console.error(err);
  });
}

/* 读取超话列表 */
function getChaohuaList(cookie, sinceId){
  let uri = 'https://m.weibo.cn/api/container/getIndex?containerid=100803_-_page_my_follow_super';
  if(sinceId){
    uri += `&since_id=${ sinceId }`;
  }
  return new Promise((resolve, reject)=>{
    request({
      uri,
      method: 'GET',
      headers: {
        Cookie: cookie
      }
    }, (err, res, body)=>{
      if(err){
        reject(err);
      }else{
        resolve(JSON.parse(body));
      }
    });
  }).catch((err)=>{
    console.error(err);
  });
}

/* 解析超话数据 */
function chaohuaListData(rawArray){
  const list = [];
  rawArray.forEach((value, index, arr)=>{
    if(value.card_type === 8){
      const s = value.scheme.match(/containerid=[a-zA-Z0-9]+/)[0];
      const containerid = s.split('=')[1];
      const { title_sub } = value;
      list.push({
        title_sub: value.title_sub,
        containerid
      });
    }
  });
  return list;
}

/* 签到 */
function checkIn(cookie, item){
  return new Promise((resolve, reject)=>{
    request({
      uri: `https://weibo.com/p/aj/general/button?api=http://i.huati.weibo.com/aj/super/checkin&id=${ item.containerid }`,
      method: 'GET',
      headers: {
        Cookie: cookie
      }
    }, (err, res, body)=>{
      if(err){
        reject(err);
      }else{
        const result = JSON.parse(body);
        // 签到成功
        if(result.code === '100000'){
          console.log(`${ item.title_sub }：${ result.data.alert_title }`);
        }else{
          console.log(`${ item.title_sub }：${ result.msg }`);
        }
        resolve();
      }
    });
  }).catch((err)=>{
    console.error(err);
  });
}

async function run(){
  try{
    // 获取cookie
    const cookie = await login(USERNAME, PASSWORD);
    const cookieStr = cookie.join('; ') + ';';
    // 获取超话列表
    let list = [];
    let sinceId = null;
    let isBreak = true;
    while(isBreak){
      const rl = await getChaohuaList(cookieStr, sinceId);
      const { cardlistInfo } = rl.data;
      const { card_group } = rl.data.cards[0];
      list = list.concat(chaohuaListData(card_group)); // 循环card_group，提取数据
      if('since_id' in cardlistInfo){
        sinceId = cardlistInfo.since_id;
      }else{
        isBreak = false;
      }
    }
    // 签到
    for(let i = 0, j = list.length; i < j; i++){
      await checkIn(cookie, list[i]);
    }
  }catch(err){
    console.error(err);
  }
}

run();