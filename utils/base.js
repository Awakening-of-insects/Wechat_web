import {
  Config
} from 'config.js';
import {
  Token
} from 'token.js';
class Base {
  constructor() {
    this.baseRequestUrl = Config.restUrl;
  }
  request(params, noRefetch) {
    var that = this;
    var url = this.baseRequestUrl + params.url;

    if (!params.type) {
      params.type = 'GET';
    }
    wx.request({
      url: url,
      data: params.data,
      method: params.type,
      header: {
        'content_type': 'application/json',
        'token': wx.getStorageSync('token')
      },
      success: function(res) {
        // if (params.sCallback) {
        //   params.sCallback(res.data);
        // }
        var code = res.statusCode.toString();
        var startChar = code.charAt(0);
        if (startChar == '2') {
          params.sCallback && params.sCallback(res.data);
        } else {
          if (code == '401') {
            if (!noRefetch) {
              that._refetch(params);
            }
          }
          if (noRefetch) {
            params.eCallback && params.eCallback(res.data);
          }
        }

      },
      fail: function(err) {
        console.log(err);
      }
    })
  }
  _refetch(params) {
    var token = new Token();
    token.getTokenFromServer((token) => {
      this.request(params, true);
    });
  }

  getDataSet(event, key) {
    return event.currentTarget.dataset[key];
  };
}

export {
  Base
};