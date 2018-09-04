import FileTpl from './components/fileTemplate.vue'

const kmfFile = {
    install (Vue, options) {      
        Vue.mixin(
            {
                components: {
                    FileTpl
                }
            }
        )

    }
}

export default kmfFile