<template>
    <div class="file-app">   
        <input type="file" ref="fileEle" @change="handleFileChange" :multiple="opts.multiple" class="file-ele">
        <slot :triggerFileInput="triggerFileInput">
            <div class="file-app-preview">
                <div class="file-app-preview__item" v-for="(file, key) in files" :key="key">
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
            <button @click.prevent="triggerFileInput">{{ opts.fileInputText }}</button>
            <button @click.prevent="handleFileUpload">{{ opts.fileUploadText }}</button>
        </slot>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    props: {
        options: {
            type: Object,
            default() {
                return {}
            }
        }
    },
    data() {
        return {
            // 存放选择的文件
            files: [],
            // 存放上传相关的文件数据与其它数据
            formData: null,
            // 文件上传进度
            uploadPercent: 0,
            // 默认选项
            defaultOptions: {
                // 文件上传url
                url: '/api/v1/files',
                // 选择文件的按钮文字
                fileInputText: '选择文件',
                // 文件上传按钮文字
                fileUploadText: '开始上传',
                // 是否多文件上传
                multiple: false,
                // 是否直接触发文件上传
                processFiles: true,
                // 上传文件的nama值(后端获取文件所用的key值)
                fileName: 'file',
                // 需要同文件一起上传的其它数据
                extraData: {},
                // 文件类型验证
                types: ['png']
            }
        }
    },
    computed: {
        // 通过computed属性来动态的更改opts
        opts() {
            let opts = {}
            Object.assign(opts, this.defaultOptions, this.options)
            return opts
        }
    },
    methods: {
        // 处理文件控件change事件，并获取选择的文件
        handleFileChange(e) {
            let target = e.target
            let files = target.files
            // 每次触发文件控件的change事件的时候情况this.files
            this.files = []
            for(let i = 0; i < files.length; i++) {
                this.files.push({
                    file: files[i],
                    index: i,
                    uploadPercent: 0,
                    msg: ''
                })
            }
            this.processFiles()
        },
        // 点击该按钮触发文件控件
        triggerFileInput() {
            // console.log(this.$refs)
            this.$refs.fileEle.click()
        },
        // 处理文件上传
        processFiles() {

            // 验证文件类型
            for (let i = 0; i < this.files.length; i++) {
                console.log(this.files[i]['file'])
            }

            return

            // 是否选择文件之后直接上传或者由其它按钮触发文件上传行为
            if (this.opts.processFiles) {
                this.handleFileUpload()
            }
            
        },
        // 移除文件
        removeFile(key) {
           this.files.splice(key, 1)
        },
        // 文件上传
        handleFileUpload() {

            for (let i = 0; i < this.files.length; i++) {
                // 每上传一个文件都重新初始化一个formData
                this.formData = new FormData()  

                // 如果有其它数据需要上传则遍历this.opts.extraData
                if (Object.keys(this.opts.extraData).length) {
                    for (let key in this.opts.extraData) {
                        this.formData.append(key, this.opts.extraData[key])
                    }
                }

                this.formData.append(this.opts.fileName, this.files[i]['file'])

                axios.post(this.opts.url, this.formData, { 
                    ...this.opts.headers,
                    onUploadProgress: (e) => {
                        // 根据索引去动态更新每个文件对应的进度条
                        this.files[i]['uploadPercent'] = parseInt(Math.round(e.loaded / e.total * 100))
                    }
                })
                    .then((response) => {
                        this.$emit('uploadSuccess', response)
                        // this.files = []
                    })
                    .catch((err) => {
                        this.$emit('uploadFailed', err.response)
                        console.log(err)
                    })
            }
        }
    }
}
</script>

<style scoped>
    .file-app {
        width: 1100px;
        margin: 0 auto;
    }
    .file-app-preview {
        display: flex;
        background-color: #ccc;
    }
    .file-app-preview__item {
        flex: 1;
        margin: 10px;
        position: relative;
    }
    .item_remove {
        position: absolute;
        top: 5px;
        right: 10px;
    }
    .file-ele {
        display: none;
    }
</style>
