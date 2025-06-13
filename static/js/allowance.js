/* globals Quasar, Vue, _, windowMixin, LNbits, LOCALE */

window.app = Vue.createApp({
  el: '#vue',
  mixins: [window.windowMixin],
  data() {
    return {
      allowances: [],
      allowanceTable: {
        columns: [
          {name: 'id', align: 'left', label: 'ID', field: 'id'},
          {name: 'name', align: 'left', label: 'Description', field: 'name'},
          {name: 'amount', align: 'right', label: 'Amount', field: 'amount'},
          {name: 'lightning_address', align: 'left', label: 'Recipient', field: 'lightning_address'},
          {name: 'frequency_type', align: 'left', label: 'Frequency', field: 'frequency_type'},
          {name: 'status', align: 'center', label: 'Status', field: 'active'}
        ],
        pagination: {
          rowsPerPage: 10
        },
        loading: false
      },
      formDialog: {
        show: false,
        loading: false,
        data: {}
      },
      qrCodeDialog: {
        show: false,
        data: {}
      },
      frequencyOptions: [
        {label: 'Daily', value: 'daily'},
        {label: 'Weekly', value: 'weekly'},
        {label: 'Monthly', value: 'monthly'}
      ]
    }
  },
  methods: {
    getAllowances() {
      if (!this.g?.user?.wallets?.length) {
        console.log('No user wallets available')
        return
      }
      this.allowanceTable.loading = true
      LNbits.api
        .request(
          'GET',
          '/allowance/api/v1/allowance',
          this.g.user.wallets[0].inkey
        )
        .then(response => {
          this.allowances = response.data
        })
        .catch(err => {
          LNbits.utils.notifyApiError(err)
        })
        .finally(() => {
          this.allowanceTable.loading = false
        })
    },
    closeFormDialog() {
      this.formDialog.show = false
      this.formDialog.data = {}
    },
    openCreateDialog() {
      const today = new Date().toISOString().split('T')[0]
      this.formDialog.data = {
        wallet: this.g.user.wallets[0].id,
        currency: 'sats',
        active: true,
        start_date: today
      }
      this.formDialog.show = true
      console.log('📅 Form opened with default start date:', today)
      console.log('🔘 Active state set to:', this.formDialog.data.active)
    },
    saveAllowance() {
      console.log('🔥 saveAllowance called')
      console.log('📊 Form data:', this.formDialog.data)
      
      // Check Quasar form validation first
      if (this.$refs.allowanceForm) {
        const isValid = this.$refs.allowanceForm.validate()
        console.log('📋 Quasar form validation result:', isValid)
        if (!isValid) {
          console.log('❌ Quasar validation failed')
          return
        }
      }
      
      // Validate required fields
      const errors = []
      if (!this.formDialog.data.name) errors.push('Description is required')
      if (!this.formDialog.data.wallet) errors.push('Wallet is required') 
      if (!this.formDialog.data.lightning_address) errors.push('Lightning address is required')
      if (!this.formDialog.data.amount || this.formDialog.data.amount <= 0) errors.push('Amount must be greater than 0')
      if (!this.formDialog.data.frequency_type) errors.push('Frequency is required')
      if (!this.formDialog.data.start_date) errors.push('Start date is required')
      
      if (errors.length > 0) {
        console.log('❌ Validation errors:', errors)
        LNbits.utils.notifyApiError('Form validation failed: ' + errors.join(', '))
        return
      }
      
      const wallet = _.findWhere(this.g.user.wallets, {
        id: this.formDialog.data.wallet
      })
      console.log('💰 Selected wallet:', wallet)
      
      if (!wallet) {
        console.log('❌ No wallet found')
        LNbits.utils.notifyApiError('No wallet selected')
        return
      }
      
      const data = _.clone(this.formDialog.data)
      
      // Set start_date to current date if not specified
      if (!data.start_date) {
        data.start_date = new Date().toISOString().split('T')[0]
        console.log('📅 Set start_date to:', data.start_date)
      }
      
      console.log('📤 Final data to send:', data)
      
      if (data.id) {
        console.log('🔄 Updating existing allowance')
        this.updateAllowance(wallet, data)
      } else {
        console.log('➕ Creating new allowance')
        this.createAllowance(wallet, data)
      }
    },
    createAllowance(wallet, data) {
      this.formDialog.loading = true
      LNbits.api
        .request('POST', '/allowance/api/v1/allowance', wallet.adminkey, data)
        .then(response => {
          this.getAllowances()
          this.formDialog.show = false
          this.resetFormData()
          LNbits.utils.notifyApiSuccess('Allowance created successfully')
        })
        .catch(err => {
          LNbits.utils.notifyApiError(err)
        })
        .finally(() => {
          this.formDialog.loading = false
        })
    },
    updateAllowance(wallet, data) {
      this.formDialog.loading = true
      LNbits.api
        .request('PUT', '/allowance/api/v1/allowance/' + data.id, wallet.adminkey, data)
        .then(response => {
          this.getAllowances()
          this.formDialog.show = false
          this.resetFormData()
          LNbits.utils.notifyApiSuccess('Allowance updated successfully')
        })
        .catch(err => {
          LNbits.utils.notifyApiError(err)
        })
        .finally(() => {
          this.formDialog.loading = false
        })
    },
    resetFormData() {
      this.formDialog = {
        show: false,
        loading: false,
        data: {}
      }
    },
    openUpdateDialog(row) {
      this.formDialog.data = {...row}
      this.formDialog.show = true
    },
    openQrCodeDialog(row) {
      this.qrCodeDialog.data = row
      this.qrCodeDialog.show = true
    },
    deleteAllowance(id) {
      const allowance = _.findWhere(this.allowances, {id: id})
      if (!allowance) return
      
      LNbits.utils
        .confirmDialog('Are you sure you want to delete this allowance?')
        .onOk(() => {
          const wallet = _.findWhere(this.g.user.wallets, {id: allowance.wallet})
          if (!wallet) return
          
          LNbits.api
            .request(
              'DELETE',
              '/allowance/api/v1/allowance/' + id,
              wallet.adminkey
            )
            .then(() => {
              this.allowances = _.reject(this.allowances, obj => obj.id == id)
              this.$q.notify({
                type: 'positive',
                message: 'Allowance deleted successfully!'
              })
            })
            .catch(err => {
              LNbits.utils.notifyApiError(err)
            })
        })
    },
    exportCSV() {
      LNbits.utils.exportCSV(this.allowanceTable.columns, this.allowances, 'allowances')
    },
    copyText(text) {
      navigator.clipboard.writeText(text)
      this.$q.notify({message: 'Copied to clipboard', type: 'positive'})
    }
  },
  created() {
    if (this.g?.user?.wallets?.length) {
      this.getAllowances()
    }
  }
})