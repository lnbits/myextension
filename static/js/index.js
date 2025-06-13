window.app = Vue.createApp({
  el: '#vue',
  mixins: [windowMixin],
  delimiters: ['${', '}'],
  data() {
    return {
      allowances: [],
      allowanceTable: {
        columns: [
          {name: 'name', align: 'left', label: 'Name', field: 'name'},
          {name: 'lightning_address', align: 'left', label: 'Recipient', field: 'lightning_address'},
          {name: 'amount', align: 'right', label: 'Amount', field: 'amount'},
          {name: 'frequency_type', align: 'left', label: 'Frequency', field: 'frequency_type'},
          {name: 'next_payment_date', align: 'left', label: 'Next Payment', field: 'next_payment_date'}
        ],
        pagination: {
          rowsPerPage: 10
        }
      },
      formDialog: {
        show: false,
        data: {
          name: '',
          wallet: '',
          lightning_address: '',
          amount: 1000,
          currency: 'sats',
          frequency_type: 'weekly',
          memo: ''
        }
      }
    }
  },

  computed: {
    isFormValid() {
      const data = this.formDialog.data
      return data.name && 
             data.wallet && 
             data.lightning_address && 
             data.amount > 0 && 
             data.frequency_type
    }
  },

  methods: {
    closeFormDialog() {
      this.formDialog.show = false
      this.formDialog.data = {
        name: '',
        wallet: '',
        lightning_address: '',
        amount: 1000,
        currency: 'sats',
        frequency_type: 'weekly',
        memo: ''
      }
    },

    getAllowances() {
      var self = this
      if (!this.g || !this.g.user || !this.g.user.wallets || !this.g.user.wallets.length) {
        return
      }
      LNbits.api
        .request(
          'GET',
          '/allowance/api/v1/allowance',
          this.g.user.wallets[0].inkey
        )
        .then(function (response) {
          self.allowances = response.data
        })
        .catch(function (error) {
          LNbits.utils.notifyApiError(error)
        })
    },

    createAllowance() {
      const data = {
        name: this.formDialog.data.name,
        wallet: this.formDialog.data.wallet,
        lightning_address: this.formDialog.data.lightning_address,
        amount: this.formDialog.data.amount,
        currency: this.formDialog.data.currency,
        frequency_type: this.formDialog.data.frequency_type,
        memo: this.formDialog.data.memo || '',
        start_date: new Date().toISOString(),
        next_payment_date: new Date().toISOString()
      }

      if (!this.g || !this.g.user || !this.g.user.wallets) {
        this.$q.notify({
          type: 'negative',
          message: 'User data not available'
        })
        return
      }
      
      const wallet = _.findWhere(this.g.user.wallets, {
        id: this.formDialog.data.wallet
      })
      if (!wallet) {
        this.$q.notify({
          type: 'negative',
          message: 'Please select a wallet'
        })
        return
      }

      LNbits.api
        .request('POST', '/allowance/api/v1/allowance', wallet.adminkey, data)
        .then(response => {
          this.allowances.push(response.data)
          this.closeFormDialog()
          this.$q.notify({
            type: 'positive',
            message: 'Allowance created successfully!'
          })
        })
        .catch(error => {
          LNbits.utils.notifyApiError(error)
        })
    },

    deleteAllowance(allowanceId) {
      var self = this
      if (!this.g || !this.g.user || !this.g.user.wallets) {
        this.$q.notify({
          type: 'negative',
          message: 'User data not available'
        })
        return
      }
      
      var allowance = _.findWhere(this.allowances, {id: allowanceId})

      LNbits.utils
        .confirmDialog('Are you sure you want to delete this allowance?')
        .onOk(function () {
          LNbits.api
            .request(
              'DELETE',
              '/allowance/api/v1/allowance/' + allowanceId,
              _.findWhere(self.g.user.wallets, {id: allowance.wallet}).adminkey
            )
            .then(function (response) {
              self.allowances = _.reject(self.allowances, function (obj) {
                return obj.id == allowanceId
              })
              self.$q.notify({
                type: 'positive',
                message: 'Allowance deleted successfully!'
              })
            })
            .catch(function (error) {
              LNbits.utils.notifyApiError(error)
            })
        })
    }
  },

  created() {
    if (this.g && this.g.user && this.g.user.wallets && this.g.user.wallets.length) {
      this.getAllowances()
    }
  }
})