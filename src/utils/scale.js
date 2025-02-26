class DevicePixelRatio {
  constructor() {
    // 存储原始的devicePixelRatio以便对比
    this.originalPixelRatio = window.devicePixelRatio;
  }

  //获取系统类型
  _getSystem() {
    const agent = navigator.userAgent.toLowerCase();
    //现只针对windows处理，其它系统暂无该情况
    if (agent.indexOf('windows') >= 0) {
      return true;
    }
    return false;
  }

  //监听方法兼容写法
  _addHandler(element, type, handler) {
    if (element.addEventListener) {
      element.addEventListener(type, handler, false);
    } else if (element.attachEvent) {
      element.attachEvent('on' + type, handler);
    } else {
      element['on' + type] = handler;
    }
  }

  //校正浏览器缩放比例
  _correct() {
    const scale = 1 / window.devicePixelRatio;

    // 使用transform替代zoom
    document.body.style.transform = `scale(${scale})`;
    document.body.style.transformOrigin = '0 0';

    // 计算宽高
    const widthScale = (100 * window.devicePixelRatio) + '%';
    document.body.style.width = widthScale;
    document.body.style.height = widthScale;

    // 添加一些必要的样式以防止出现滚动条
    document.body.style.position = 'relative';
    document.body.style.overflow = 'hidden';
  }

  //监听页面缩放
  _watch() {
    let lastPixelRatio = window.devicePixelRatio;

    const handler = () => {
      // 只有当devicePixelRatio发生变化时才执行
      if (lastPixelRatio !== window.devicePixelRatio) {
        lastPixelRatio = window.devicePixelRatio;
        this._correct();
      }
    };

    // 使用防抖来优化resize事件
    let timer;
    this._addHandler(window, 'resize', () => {
      clearTimeout(timer);
      timer = setTimeout(handler, 100);
    });
  }

  // 清理方法
  destroy() {
    // 恢复原始状态
    document.body.style.transform = '';
    document.body.style.transformOrigin = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.position = '';
    document.body.style.overflow = '';
  }

  //初始化
  init() {
    if (this._getSystem()) {
      this._correct();
      this._watch();
      return true;
    }
    return false;
  }
}

export default DevicePixelRatio;
