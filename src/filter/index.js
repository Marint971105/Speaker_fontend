import dayjs from 'dayjs'

let install = (Vue, options) => {
  Vue.filter('moneyToCents', (value) => {
    if (!value) return 0
    return parseFloat((value / 100)).toFixed(2)
  })
  Vue.filter('datetimeFormat', (value) => {
    if (!value) {
      return ''
    }
    return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
  })
  Vue.filter('messageCountFilter', function (value) {
    if (value > 99) {
      return 99 + '+'
    } else if (value < 0) {
      return 0
    }
    return value
  })
}

export default install
