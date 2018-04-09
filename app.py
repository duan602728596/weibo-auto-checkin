import urllib.request
import urllib.parse
import http.cookiejar
import json
from chList import chList

# 微博自动签到
class WeiboAutoCheckin:
  def __init__(self, username, password):
    self.username = username   # 用户名
    self.password = password   # 密码
    self.loginUrl = 'https://passport.weibo.cn/sso/login'                                                        # 登录地址【POST】
    self.checkinUrl = 'https://weibo.com/p/aj/general/button?api=http://i.huati.weibo.com/aj/super/checkin&id='  # 签到地址【GET】
    self.cookieJar = http.cookiejar.CookieJar()                                                                  # cookieJar

  # 登录账号，获取cookie
  def login(self):
    data = urllib.parse.urlencode({
      'username': self.username,
      'password': self.password,
    })
    headers = {
      'Referer': 'https://passport.weibo.cn/signin/login?entry=mweibo&r=http%3A%2F%2Fm.weibo.cn',
    }
    req = urllib.request.Request(self.loginUrl, data=data.encode('utf-8'), headers=headers)
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookieJar))
    opener.open(req)

  # 循环签到
  def checkIn(self):
    # 获取cookie
    cookie = ''
    for item in self.cookieJar:
      cookie += item.name + '=' + item.value + ';'
    # 签到
    for item2 in chList:
      req = urllib.request.Request(self.checkinUrl + item2[1], headers={
        'Cookie': cookie,
      })
      res = urllib.request.urlopen(req)
      result = json.loads(res.read().decode('utf-8'))
      # 未签到
      if result['code'] == '100000':
        print('#' + item2[0] + '#   ' + result['data']['alert_title'])
      # 已签到
      if result['code'] == 382004:
        print('#' + item2[0] + '#   ' + result['msg'])


# 初始化需要配置用户名和密码
wb = WeiboAutoCheckin('用户名', '密码')
wb.login()
wb.checkIn()