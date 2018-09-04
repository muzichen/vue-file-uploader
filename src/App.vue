<template>
  <div id="app">
    <file-tpl :options="fileOptions" @uploadSuccess="uploadSuccess" @uploadFailed="uploadFailed">
      <!-- <template slot-scope="scope">
        <button @click="scope.triggerFileInput">sdgdas</button>
      </template> -->
    </file-tpl>
  </div>
</template>

<script>

export default {
  name: 'App',
  data() {
    return {
      fileOptions: {
        multiple: true,
        processFiles: false,
        extraData: {
          fff: 123,
          eee:222
        },
        headers: {
          'authorization': 123
        }
      }
    }
  },
  components: {

  },
  methods: {
    uploadSuccess(res) {
      console.log(res)
    },
    uploadFailed(err) {
      console.log(err)
    }
  }
}
</script>

<style>

</style>
