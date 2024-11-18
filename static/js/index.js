///////////////////////////////////////////////////
//////////an object we can update with data////////
///////////////////////////////////////////////////
const mapMyExtension = obj => {
  obj.date = Quasar.utils.date.formatDate(
    new Date(obj.time * 1000),
    'YYYY-MM-DD HH:mm'
  )
  obj.myextension = ['/myextension/', obj.id].join('')
  return obj
}
window.app = Vue.createApp({
  el: '#vue',
  mixins: [windowMixin],
  delimiters: ['${', '}'],
  data: function () {
    return {
      invoiceAmount: 10,
      qrValue: 'lnurlpay',
      myex: [],
      myexTable: {
        columns: [
          {name: 'id', align: 'left', label: 'ID', field: 'id'},
          {name: 'name', align: 'left', label: 'Name', field: 'name'},
          {
            name: 'wallet',
            align: 'left',
            label: 'Wallet',
            field: 'wallet'
          },
          {
            name: 'total',
            align: 'left',
            label: 'Total sent/received',
            field: 'total'
          }
        ],
        pagination: {
          rowsPerPage: 10
        }
      },
      formDialog: {
        show: false,
        data: {},
        advanced: {}
      },
      urlDialog: {
        show: false,
        data: {}
      }
    }
  },

  ///////////////////////////////////////////////////
  ////////////////METHODS FUNCTIONS//////////////////
  ///////////////////////////////////////////////////

  methods: {
    closeFormDialog() {
      this.formDialog.show = false
      this.formDialog.data = {}
    },
    getMyExtensions: function () {
      var self = this

      LNbits.api
        .request(
          'GET',
          '/myextension/api/v1/myex?all_wallets=true',
          this.g.user.wallets[0].inkey
        )
        .then(function (response) {
          self.myex = response.data.map(function (obj) {
            return mapMyExtension(obj)
          })
        })
    },
    sendMyExtensionData() {
      const data = {
        name: this.formDialog.data.name,
        lnurlwithdrawamount: this.formDialog.data.lnurlwithdrawamount,
        lnurlpayamount: this.formDialog.data.lnurlpayamount
      }
      const wallet = _.findWhere(this.g.user.wallets, {
        id: this.formDialog.data.wallet
      })
      if (this.formDialog.data.id) {
        data.id = this.formDialog.data.id
        data.wallet = wallet.id
        data.total = this.formDialog.data.total
        this.updateMyExtension(wallet, data)
      } else {
        this.createMyExtension(wallet, data)
      }
    },
    updateMyExtensionForm(tempId) {
      const myextension = _.findWhere(this.myex, {id: tempId})
      this.formDialog.data = {
        ...myextension
      }
      if (this.formDialog.data.tip_wallet != '') {
        this.formDialog.advanced.tips = true
      }
      if (this.formDialog.data.withdrawlimit >= 1) {
        this.formDialog.advanced.otc = true
      }
      this.formDialog.show = true
    },
    createMyExtension(wallet, data) {
      LNbits.api
        .request('POST', '/myextension/api/v1/myex', wallet.adminkey, data)
        .then(response => {
          this.myex.push(mapMyExtension(response.data))
          this.closeFormDialog()
        })
        .catch(error => {
          LNbits.utils.notifyApiError(error)
        })
    },
    updateMyExtension(wallet, data) {
      LNbits.api
        .request(
          'PUT',
          `/myextension/api/v1/myex/${data.id}`,
          wallet.adminkey,
          data
        )
        .then(response => {
          this.myex = _.reject(this.myex, obj => {
            return obj.id == data.id
          })
          this.myex.push(mapMyExtension(response.data))
          this.closeFormDialog()
        })
        .catch(error => {
          LNbits.utils.notifyApiError(error)
        })
    },
    deleteMyExtension: function (tempId) {
      var self = this
      var myextension = _.findWhere(this.myex, {id: tempId})

      LNbits.utils
        .confirmDialog('Are you sure you want to delete this MyExtension?')
        .onOk(function () {
          LNbits.api
            .request(
              'DELETE',
              '/myextension/api/v1/myex/' + tempId,
              _.findWhere(self.g.user.wallets, {id: myextension.wallet})
                .adminkey
            )
            .then(function (response) {
              self.myex = _.reject(self.myex, function (obj) {
                return obj.id == tempId
              })
            })
            .catch(function (error) {
              LNbits.utils.notifyApiError(error)
            })
        })
    },
    exportCSV: function () {
      LNbits.utils.exportCSV(this.myexTable.columns, this.myex)
    },
    itemsArray(tempId) {
      const myextension = _.findWhere(this.myex, {id: tempId})
      return [...myextension.itemsMap.values()]
    },
    openformDialog(id) {
      const [tempId, itemId] = id.split(':')
      const myextension = _.findWhere(this.myex, {id: tempId})
      if (itemId) {
        const item = myextension.itemsMap.get(id)
        this.formDialog.data = {
          ...item,
          myextension: tempId
        }
      } else {
        this.formDialog.data.myextension = tempId
      }
      this.formDialog.data.currency = myextension.currency
      this.formDialog.show = true
    },
    closeformDialog() {
      this.formDialog.show = false
      this.formDialog.data = {}
    },
    openUrlDialog(id) {
      this.urlDialog.data = _.findWhere(this.myex, {id})
      this.qrValue = this.urlDialog.data.lnurlpay
      console.log(this.urlDialog.data.id)
      this.connectWebocket(this.urlDialog.data.id)
      this.urlDialog.show = true
    },
    createInvoice(walletId, myextensionId) {
      ///////////////////////////////////////////////////
      ///Simple call to the api to create an invoice/////
      ///////////////////////////////////////////////////
      console.log(walletId)
      const wallet = _.findWhere(this.g.user.wallets, {
        id: walletId
      })
      const dataToSend = {
        out: false,
        amount: this.invoiceAmount,
        memo: 'Invoice created by MyExtension',
        extra: {
          tag: 'MyExtension',
          myextensionId: myextensionId
        }
      }
      LNbits.api
        .request('POST', `/api/v1/payments`, wallet.inkey, dataToSend)
        .then(response => {
          this.qrValue = response.data.payment_request
        })
        .catch(error => {
          LNbits.utils.notifyApiError(error)
        })
    },
    makeItRain() {
      document.getElementById('vue').disabled = true
      var end = Date.now() + 2 * 1000
      var colors = ['#FFD700', '#ffffff']
      function frame() {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: {x: 0},
          colors: colors,
          zIndex: 999999
        })
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: {x: 1},
          colors: colors,
          zIndex: 999999
        })
        if (Date.now() < end) {
          requestAnimationFrame(frame)
        } else {
          document.getElementById('vue').disabled = false
        }
      }
      frame()
    },
    connectWebocket(wallet_id) {
      //////////////////////////////////////////////////
      ///wait for pay action to happen and do a thing////
      ///////////////////////////////////////////////////
      self = this
      if (location.protocol !== 'http:') {
        localUrl =
          'wss://' +
          document.domain +
          ':' +
          location.port +
          '/api/v1/ws/' +
          wallet_id
      } else {
        localUrl =
          'ws://' +
          document.domain +
          ':' +
          location.port +
          '/api/v1/ws/' +
          wallet_id
      }
      this.connection = new WebSocket(localUrl)
      this.connection.onmessage = function (e) {
        self.makeItRain()
      }
    }
  },

  ///////////////////////////////////////////////////
  //////LIFECYCLE FUNCTIONS RUNNING ON PAGE LOAD/////
  ///////////////////////////////////////////////////
  created: function () {
    if (this.g.user.wallets.length) {
      this.getMyExtensions()
    }
  }
})
