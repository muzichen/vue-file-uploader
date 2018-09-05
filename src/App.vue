<template>
  <div id="app">
    <file-tpl :options="fileOptions" @uploadSuccess="uploadSuccess" @uploadFailed="uploadFailed">
      <!-- <template slot-scope="props">
          <div class="file-app-preview">
                <div class="file-app-preview__item" v-for="(file, key) in props.files" :key="key">
                    <a href="#" class="item_remove" @click="removeFile(key)">X</a>
                    <div class="file-app-preview__item_thumb">
                        <img src="" alt="">
                    </div>
                    <progress max="100" :value="file.uploadPercent"></progress>
                    <br>
                    <span class="file-app-preview__item_name">{{ file.name }}</span>
                    <span class="file-app-preview__item_error" v-if="file.msg">{{ file.msg }}</span>
                </div>
            </div>
            <button @click.prevent="triggerFileInput">{{ props.opts.fileInputText }}</button>
            <button @click.prevent="handleFileUpload">{{ props.opts.fileUploadText }}</button>
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
        parameters: {
          authkey: '6ce8d373059a26f373d055b6f66b7e3c',
          product_line: 'pan-web',
          space: 'kmf-video',
          subject: 'fffff'
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
