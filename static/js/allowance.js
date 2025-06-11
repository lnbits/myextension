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
      console.log('Getting allowances...')
      // TODO: Implement actual API call
      this.allowanceTable.loading = false
    },
    closeFormDialog() {
      this.formDialog.show = false
      this.formDialog.data = {}
    },
    openCreateDialog() {
      this.formDialog.data = {
        wallet: this.g.user.wallets[0].id,
        currency: 'sats',
        active: true
      }
      this.formDialog.show = true
    },
    saveAllowance() {
      console.log('Save allowance:', this.formDialog.data)
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
      console.log('Delete allowance:', id)
    },
    exportCSV() {
      console.log('Export CSV')
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