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
    async closeFormDialog() {
      this.formDialog.show = false
      this.formDialog.data = {}
    },
    async getMyExtensions() {
      await LNbits.api
        .request(
          'GET',
          '/myextension/api/v1/myex',
          this.g.user.wallets[0].inkey
        )
        .then(response => {
          console.log(response.data)
          this.myex = response.data
        })
        .catch(error => {
          console.error('Error fetching data:', error)
        })
    }
  },
  async sendMyExtensionData() {
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
      data.total = this.formDialog.data.total
      await this.updateMyExtension(wallet, data)
    } else {
      await this.createMyExtension(wallet, data)
    }
  },
  async updateMyExtensionForm(tempId) {
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
  async createMyExtension(wallet, data) {
    await LNbits.api
      .request('POST', '/myextension/api/v1/myex', wallet.adminkey, data)
      .then(response => {
        this.myex.push(response.data)
        this.closeFormDialog()
      })
      .catch(error => {
        LNbits.utils.notifyApiError(error)
      })
  },
  async updateMyExtension(wallet, data) {
    await LNbits.api
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
        this.myex.push(response.data)
        this.closeFormDialog()
      })
      .catch(error => {
        LNbits.utils.notifyApiError(error)
      })
  },
  async deleteMyExtension(tempId) {
    var myextension = _.findWhere(this.myex, {id: tempId})
    await LNbits.utils
      .confirmDialog('Are you sure you want to delete this MyExtension?')
      .onOk(function () {
        LNbits.api
          .request(
            'DELETE',
            '/myextension/api/v1/myex/' + tempId,
            _.findWhere(this.g.user.wallets, {id: myextension.wallet}).adminkey
          )
          .then(() => {
            this.myex = _.reject(this.myex, function (obj) {
              return obj.id == tempId
            })
          })
          .catch(error => {
            LNbits.utils.notifyApiError(error)
          })
      })
  },
  async exportCSV() {
    await LNbits.utils.exportCSV(this.myexTable.columns, this.myex)
  },
  async itemsArray(tempId) {
    const myextension = _.findWhere(this.myex, {id: tempId})
    return [...myextension.itemsMap.values()]
  },
  async openformDialog(id) {
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
  async closeformDialog() {
    this.formDialog.show = false
    this.formDialog.data = {}
  },
  async openUrlDialog(id) {
    this.urlDialog.data = _.findWhere(this.myex, {id})
    this.qrValue = this.urlDialog.data.lnurlpay
    await this.connectWebocket(this.urlDialog.data.id)
    this.urlDialog.show = true
  },
  async createInvoice(walletId, myextensionId) {
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
    await LNbits.api
      .request('POST', `/api/v1/payments`, wallet.inkey, dataToSend)
      .then(response => {
        this.qrValue = response.data.payment_request
      })
      .catch(error => {
        LNbits.utils.notifyApiError(error)
      })
  },
  async makeItRain() {
    document.getElementById('vue').disabled = true
    var end = Date.now() + 2 * 1000
    var colors = ['#FFD700', '#ffffff']
    async function frame() {
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
    await frame()
  },
  async connectWebocket(wallet_id) {
    //////////////////////////////////////////////////
    ///wait for pay action to happen and do a thing////
    ///////////////////////////////////////////////////
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
    this.connection.onmessage = async function (e) {
      await this.makeItRain()
    }
  },

  ///////////////////////////////////////////////////
  //////LIFECYCLE FUNCTIONS RUNNING ON PAGE LOAD/////
  ///////////////////////////////////////////////////
  async created() {
    await this.getMyExtensions()
  }
})
