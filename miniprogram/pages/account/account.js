var app = getApp();

Page({
  data: {
    version: "1.0.0",
    userInfo: {
      nickName: "点击登录",
      avatarUrl: "/images/avatar_1.jpg"
    }
  },
  onLoad: function(a) {
    this.setData({ version: app.globalData.version });

    wx.getSetting({
      success: setting => {
        if (setting.authSetting['scope.userInfo']) {
          wx.getUserInfo({ success: this.settingAccount });
        }
      }
    });

    // 监听数据 同步全局
    Object.defineProperty(this.data, 'userInfo', {
      set: data => {
        app.globalData.userInfo = data;
      }
    });
  },
  PageErrorNot: function() {
    this.setData({
      toast: {
        text: "此页面正在开发中...",
        icon: "error",
        hideTime: 2e3
      }
    });
  },
  printVersion: function() {
    this.setData({
      toast: {
        text: "VERSION " + this.data.version,
        icon: "loading",
        hideTime: 4e3
      }
    });
  },
  settingAccount: function(res) {
    // 兼容事件处理
    res.detail && (res = res.detail);

    // 检测授权
    if (res.userInfo) {

      // 如果本地已存储数据且没过期则用本地的
      let storage = wx.getStorageSync('userInfo');
      if (storage && storage.endTime > new Date() / 1000) return this.setData({ userInfo: storage });

      // 获取openid
      wx.cloud.callFunction({
        name: 'getOpenId',
        complete: data => {
          res.userInfo.id = data.result;

          /////bate openid
          res.userInfo.id.openId = "test";
          // 拉取主系统数据
          let getLoginData = this.login(data.result.openId, login => {

            res.userInfo.login = login;

            // 用户是否注册
            if (login) {

              // 获取账号数据
              this.getAccountData(res.userInfo, info => {
                res.userInfo.info = info;
                res.userInfo.endTime = res.userInfo.login.token.split('-')[2] || (new Date()).valueOf() + 259200;
                this.setData({ userInfo: res.userInfo });
                wx.setStorage({
                  key: 'userInfo',
                  data: res.userInfo,
                });
              });
            } else {

              // 注册账号
              this.register(data.result.openId, getLoginData);
            }
          });

        }
      });
    } else {
      this.setData({
        toast: {
          text: "获取授权失败!请允许授权...",
          icon: "error",
          hideTime: 2000
        }
      });
    }
  },
  /**
   * 登录函数
   * @openId string 小程序ID
   * @callback object 回调函数
   * @return 数据
   */
  login: function(openId, callback) {
    wx.request({
      url: `http://${app.globalData.ip}/api/login/${openId}`,
      success: res => callback && !res.data.error ? callback(res.data) : callback(false)
    });
  },
  /**
   * 注册函数
   * @openId string 小程序ID
   * @callback object 回调函数
   * @return 主系统ID
   */
  register: function(openId, callback) {
    wx.request({
      url: `http://${app.globalData.ip}/api/register/${openId}`,
      success: res => callback && !res.data.error ? callback(res.data) : callback(false)
    });
  },
  /**
   * 注册函数
   * @openId string 小程序ID
   * @callback object 回调函数
   * @return 主系统ID
   */
  getAccountData: function (userInfo, callback) {
    wx.request({
      url: `http://${app.globalData.ip}/api/getUserDetail/${userInfo.login.xcxid}/?token=${userInfo.login.token}`,
      success: res => callback && !res.data.error ? callback(res.data) : callback(false)
    });
  }
});