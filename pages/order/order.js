import {
  Cart
} from '../cart/cart-model.js';
import {
  Order
} from '../order/order-model.js';
import {
  Address
} from '../../utils/address.js';
var cart = new Cart();
var order = new Order();
var address = new Address();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: -1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var productsArr;
    this.data.account = options.account;
    //订单的信息
    productsArr = cart.getCartDataFromLocal(true);
    this.setData({
      productsArr: productsArr,
      account: options.account,
      orderStatus: 0
    });

    /*显示收货地址*/
    address.getAddress((res) => {
      this._bindAddressInfo(res);
    });
  },
  editAddress: function(event) {
    var that = this;
    //原生 
    wx.chooseAddress({
      success: function(res) {
        console.log(res);
        var addressInfo = {
          //单独显示，所以保存
          name: res.userName,
          mobile: res.telNumber,
          totalDetail: address.setAddressInfo(res)
        }
        that._bindAddressInfo(addressInfo);
        address.submitAddress(res, (flag) => {
          if (!flag) {
            that.showTips('操作提示', '地址信息更新失败！');
          }
        });
      }
    })
  },
  /*
   * 提示窗口
   * params:
   * title - {string}标题
   * content - {string}内容
   * flag - {bool}是否跳转到 "我的页面"
   */
  showTips: function(title, content, flag) {
    wx.showModal({
      title: title,
      content: content,
      showCancel: false,
      success: function(res) {
        if (flag) {
          wx.switchTab({
            url: '/pages/my/my'
          });
        }
      }
    });
  },
  _bindAddressInfo: function(addressInfo) {
    this.setData({
      addressInfo: addressInfo
    });
  },
  //支付下单接口
  pay: function() {
    if (!this.data.addressInfo) {
      this.showTips('下单提示', '没有地址我怎么给你发货嘛');
      return;
    }
    if (this.data.orderStatus == 0) {
      this._firstTimePay();
    } else {
      this._oneMoresTimePay();
    }
  },
  /*第一次支付*/
  _firstTimePay: function() {
    var orderInfo = [],
      procuctInfo = this.data.productsArr,
      order = new Order();
    for (let i = 0; i < procuctInfo.length; i++) {
      orderInfo.push({
        product_id: procuctInfo[i].id,
        count: procuctInfo[i].counts
      });
    }

    var that = this;
    //支付分两步，第一步是生成订单号，然后根据订单号支付
    order.doOrder(orderInfo, (data) => {
      //订单生成成功
      if (data.pass) {
        //更新订单状态
        var id = data.order_id;
        that.data.id = id;
        //that.data.fromCartFlag = false;

        //开始支付
        that._execPay(id);
      } else {
        that._orderFail(data); // 下单失败
      }
    });
  },
  /*
   *下单失败
   * params:
   * data - {obj} 订单结果信息
   * */
  _orderFail: function(data) {
    var nameArr = [],
      name = '',
      str = '',
      pArr = data.pStatusArray;
    for (let i = 0; i < pArr.length; i++) {
      if (!pArr[i].haveStock) {
        name = pArr[i].name;
        if (name.length > 15) {
          name = name.substr(0, 12) + '...';
        }
        nameArr.push(name);
        if (nameArr.length >= 2) {
          break;
        }
      }
    }
    str += nameArr.join('、');
    if (nameArr.length > 2) {
      str += ' 等';
    }
    str += ' 缺货';
    wx.showModal({
      title: '下单失败',
      content: str,
      showCancel: false,
      success: function(res) {

      }
    });
  },
  /*
   *开始支付
   * params:
   * id - {int}订单id
   */
  _execPay: function(id) {
    // if (!order.onPay) {
    //   this.showTips('支付提示', '本产品仅用于演示，支付系统已屏蔽', true); //屏蔽支付，提示
    //   this.deleteProducts(); //将已经下单的商品从购物车删除
    //   return;
    // }
    var that = this;
    order.execPay(id, (statusCode) => {
      if (statusCode != 0) {
        that.deleteProducts(); //将已经下单的商品从购物车删除   当状态为0时，表示

        var flag = statusCode == 2;
        wx.navigateTo({
          url: '../pay-result/pay-result?id=' + id + '&flag=' + flag + '&from=order'
        });
      }
    });
  },
  //将已经下单的商品从购物车删除
  deleteProducts: function() {
    var ids = [],
      arr = this.data.productsArr;
    for (let i = 0; i < arr.length; i++) {
      ids.push(arr[i].id);
    }
    cart.delete(ids);
  },
})