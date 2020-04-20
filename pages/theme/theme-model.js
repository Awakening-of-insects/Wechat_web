import {
  Base
} from '../../utils/base.js';
class Theme extends Base {
  constructor() {
    super();
  }

  //获取主题下的商品列表
  //对应主题的id
  getProductsData(id, callback) {
    var params = {
      url: 'theme/' + id,
      sCallback: function(data) {
        callback && callback(data);
      }
    }
    this.request(params);
  }
}

export {
  Theme
};