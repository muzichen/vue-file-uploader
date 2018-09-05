<template>
    <div class="file-app">   
        <input type="file" ref="fileEle" @change="handleFileChange" :multiple="opts.multiple" class="file-ele">
        <slot :triggerFileInput="triggerFileInput" :handleFileUpload="handleFileUpload" :files="files" :opts="opts">
            <div class="file-app-preview">
                <div class="file-app-preview__item" v-for="(file, key) in files" :key="key">
                    <div class="file-app-preview__item_thumb">
                        <img  :ref="'image' + parseInt(key)" alt="">
                    </div>
                    <progress max="100" :value="file.uploadPercent" class="file-app-preview__progress" v-if="file.uploadPercent > 0 && file.uploadPercent < 100"></progress>
                    <span class="file-app-preview__item_error" v-if="!file.error.typeValid || !file.error.sizeValid">{{ file.msg }}</span>
                    <span class="file-app-preview__item_name">{{ file.name }}</span>
                    <div class="file-app-preview__mask">
                        <a href="#" class="item_remove" @click="removeFile(key)">X</a>
                    </div>    
                </div>
            </div>
            <button @click.prevent="triggerFileInput">{{ opts.fileInputText }}</button>
            <button @click.prevent="handleFileUpload">{{ opts.fileUploadText }}</button>
        </slot>
    </div>
</template>

<script>
import axios from 'axios'
import md5 from 'crypto-js/md5'

export default {
    props: {
        options: {
            type: Object,
            default() {
                return {}
            }
        }
    },
    created() {        
        this.getAliOptions()
            .then((res) => {
                if (res.status == 200) {
                    let result = res.data
                    if (result.status == 200) {
                        this.opts.maxSize = result.custom_limit.content_length_range.max // 允许上传文件的最大值
                        this.opts.types = result.custom_limit.type // 允许上传的文件类型
                        this.opts.url = result.host // 文件上传的路径
                        this.aliOptions.policy = result.policy
                        this.aliOptions.OSSAccessKeyId = result.accessid
                        this.aliOptions.callback = result.callback
                        this.aliOptions.signature = result.signature
                        this.aliOptions['x-oss-security-token'] = result.security_token
                    }
                }
            })
            .catch((err) => {
                console.log(err.response)
            })
    },
    data() {
        return {
            // 阿里云上传需要的参数
            aliOptions: {
                policy: '',
                OSSAccessKeyId: '',
                success_action_status: 200,
                callback: '',
                signature: '',
                'x-oss-security-token': ''
            },
            // 存放选择的文件
            files: [],
            // 存放上传相关的文件数据与其它数据
            formData: null,
            // 文件上传进度
            uploadPercent: 0,
            // 默认选项
            defaultOptions: {
                // 用于阿里云上传需要的参数,这四个参数是需要暴露给业务端的
                parameters: {
                    authkey: '',
                    product_line: '',
                    space: '',
                    subject: '',
                },
                // 文件上传url
                url: '/api/v1/files',
                // 选择文件的按钮文字
                fileInputText: '选择文件',
                // 文件上传按钮文字
                fileUploadText: '开始上传',
                // 是否多文件上传
                multiple: true,
                // 是否直接触发文件上传
                processFiles: false,
                // 上传文件的nama值(后端获取文件所用的key值)
                fileName: 'file',
                // 需要同文件一起上传的其它数据
                extraData: {},
                // 文件类型验证
                types: ['png', 'gif'],
                // 文件大小验证,单位字节
                maxSize: 0,
            }
        }
    },
    computed: {
        // 通过computed属性来动态的更改opts
        opts() {
            let opts = {}
            Object.assign(opts, this.defaultOptions, this.options)
            return opts
        },
        extensionReg() {
            return new RegExp(this.opts.types.join('|'), 'i')
        }
    },
    methods: {
        // 获取阿里云上传需要的参数
        getAliOptions() {
            axios.defaults.headers.common['Authorization'] = `Bearer ${this.opts.parameters.authkey}`
            axios.defaults.headers.common['k-product-line'] = this.opts.parameters.processFiles
            return axios.get('/kdfs/sts/js', {
                params: {
                    space: this.opts.parameters.space, // bucket
                    subject: this.opts.parameters.subject, // 项目
                    action: 'post',
                    back: 1
                }
            });
        }, 
        // 处理文件控件change事件，并获取选择的文件
        handleFileChange(e) {
            let target = e.target
            let files = target.files
            // 每次触发文件控件的change事件的时候情况this.files
            this.files = []
            for(let i = 0; i < files.length; i++) {
                this.files.push({
                    file: files[i],
                    name: files[i].name,
                    size: files[i].size,
                    index: i,
                    uploadPercent: 0,
                    msg: '',
                    error: {
                        typeValid: false,
                        sizeValid: false
                    },
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
            this.validateFileType()

            // 验证文件大小
            this.validateFileSize()

            // 生成文件缩略图
            this.renderImagePreview()


            // 是否选择文件之后直接上传或者由其它按钮触发文件上传行为
            if (this.opts.processFiles) {
                this.handleFileUpload()
            }
            
        },
        // 移除文件
        removeFile(key) {
           this.files.splice(key, 1)
           // 删除文件后重新渲染图片缩略图
           this.renderImagePreview()
        },
        // 文件上传
        handleFileUpload() {

            for (let i = 0; i < this.files.length; i++) {

                let file = this.files[i]
                let fileTail = file.name.split('.')[1] // 文件扩展
                let fileMd5 = md5(file.name + file.size).toString() // 文件名MD5
                let key = `${this.opts.parameters.subject}/${fileMd5.substr(0, 2)}/${fileMd5.substr(2, 2)}/${fileMd5 + '.' + fileTail}`

                // 每上传一个文件都重新初始化一个formData
                this.formData = new FormData() 

                // 如果有其它数据需要上传则遍历this.opts.extraData
                if (Object.keys(this.opts.extraData).length) {
                    for (let key in this.opts.extraData) {
                        this.formData.append(key, this.opts.extraData[key])
                    }
                }

                // 添加阿里云上传需要的参数
                this.formData.append('key', key) 
                this.formData.append('x:source_name', file.name) 
                this.formData.append('x:product_line', this.opts.parameters.product_line) // 需要传
                this.formData.append('x:dir_id', 0) // 写死为0
                this.formData.append('x:auth', this.opts.parameters.authkey) // 需要传
                for (let k in this.aliOptions) {
                    this.formData.append(k, this.aliOptions[k])
                }
                

                this.formData.append(this.opts.fileName, file['file'])

                // 根据canupload属性判断文件是否可以上传，忽略无法上传的文件
                if (file['error']['typeValid'] || file['error']['sizeValid']) {
                    this.doFileupload(this.formData, file)
                }

            }
        },
        // 验证文件类型
        validateFileType() {

            for (let i = 0; i < this.files.length; i++) {

                let extension = this.files[i].name.substr(this.files[i].name.lastIndexOf('.') + 1)
                console.log(extension, this.extensionReg, this.extensionReg.test(extension))

                if (!this.extensionReg.test(extension)) {

                    this.files[i]['msg'] = '该文件类型不受支持'
                    this.files[i]['error']['typeValid'] = false

                } else {

                    this.files[i]['error']['typeValid'] = true

                }

                
            }

        },
        // 验证文件大小
        validateFileSize() {

            for (let i = 0; i < this.files.length; i++) {

                let size = this.files[i].size

                if (this.opts.maxSize < size) {
                    
                    this.files[i]['msg'] = '文件大小超过限制'
                    this.files[i]['error']['sizeValid'] = false

                } else {

                    this.files[i]['error']['sizeValid'] = true

                }

            }

        },
        // 生成图片缩略图
        renderImagePreview() {

            for (let i = 0; i < this.files.length; i++) {

                if (/\.(jpe?g|png|gif)$/i.test( this.files[i].name )) {

                    let reader = new FileReader()

                    // 将选择的图片统一裁切为一样的尺寸
                    //TODO: 限制预览图尺寸
                    // resizeImage(reader.result)

                    reader.addEventListener('load', () => {
                        this.$refs['image' + parseInt(i)][0].src = reader.result

                    })

                    reader.readAsDataURL(this.files[i].file)

                }

            }

        },
        // 裁切图片
        resizeImage(dataUrl) {
            const MAX_WIDTH = 150
            const MAX_HEIGHT = 200
            let image = new Image()
            let canvas = document.createElement('canvas')
            let ctx = canvas.getContext('2d')
            image.src = dataUrl

        },
        // 执行文件上传操作
        doFileupload(formData, file) {

            // 这里的上传路径不暴露给用户

            axios.post(this.opts.url, this.formData, { 
                ...this.opts.headers,
                onUploadProgress: (e) => {
                    // 根据索引去动态更新每个文件对应的进度条
                    file['uploadPercent'] = parseInt(Math.round(e.loaded / e.total * 100))
                }
            })
                .then((response) => {
                    this.$emit('uploadSuccess', response)
                })
                .catch((err) => {
                    this.$emit('uploadFailed', err.response)
                })
        },
    }
}
</script>

<style scoped>
    .file-app {
        width: 100%;
        margin: 20px;
    }
    .file-app-preview {
        width: 1100px;
        margin: 0 auto;
        overflow: hidden;
    }
    .file-app-preview__item {
       float: left;
       margin: 15px;
       position: relative;
       width: 200px;
       background-color: #ccc;
    }
    .file-app-preview__item:hover .file-app-preview__mask {
        display: block;
    }
    .file-app-preview__mask {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0, .4);
        display: none;
    }
    .file-app-preview__item_thumb {
        height: 200px;
    }
    .file-app-preview__item_thumb > img {
        max-width: 150px;
        height: inherit;
    }
    .file-app-preview__progress {
        position: absolute;
        left:0; 
        top: 0;
        width: 100%;
    }
    .file-app-preview__item_name {
        display: block;
        text-align: center;
        position: absolute;
        top: 20px;
        word-wrap: break-word;
        color: #fff;
        width: 100%;
    }
    .file-app-preview__item_error {
        position: absolute;
        left: 0;
        bottom: 0;
        text-align: center;
        width: 100%;
        height: 20px;
        background-color: red;
        color: #fff;
    }
    .item_remove {
        position: absolute;
        top: 5px;
        right: 10px;
        color: white;
        text-decoration: none;
    }
    .file-ele {
        display: none;
    }
</style>
